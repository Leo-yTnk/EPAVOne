-- Additive EPAVOne workspace. Do not replay historical migrations.
begin;
create table public.epav_planner_workspaces (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  state jsonb not null,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.epav_planner_workspaces enable row level security;
create policy planner_read_own on public.epav_planner_workspaces for select to authenticated using (owner_id = auth.uid());
-- Writes only through the RPC: state + confirmed sales commit together.
revoke all on public.epav_planner_workspaces from public, anon, authenticated;
grant select on public.epav_planner_workspaces to authenticated;
create or replace function public.save_epav_planner_workspace(p_state jsonb, p_expected_revision integer)
returns public.epav_planner_workspaces
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  current_row public.epav_planner_workspaces;
  previous jsonb;
  item jsonb;
  old_item jsonb;
  sale public.sales;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_state->>'version' is distinct from '1' then
    raise exception 'Invalid planner state';
  end if;
  foreach previous in array array[p_state->'customers', p_state->'interactions', p_state->'commitments', p_state->'weeks', p_state->'offers'] loop
    if jsonb_typeof(previous) is distinct from 'array' then raise exception 'Invalid planner collections'; end if;
  end loop;
  -- Serialize first save too; optimistic revision detects concurrent editors.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select * into current_row from public.epav_planner_workspaces where owner_id = uid for update;
  if current_row.revision = p_expected_revision + 1 and current_row.state = p_state - 'sales' then return current_row; end if;
  if coalesce(current_row.revision, 0) <> p_expected_revision then
    raise exception 'Planner conflict: reload before saving' using errcode = '40001';
  end if;
  previous := coalesce(current_row.state->'interactions', '[]'::jsonb);
  -- Confirmed interactions are immutable; history cannot silently disappear.
  for old_item in select value from jsonb_array_elements(previous) loop
    if not exists (select 1 from jsonb_array_elements(p_state->'interactions') x where x = old_item) then
      raise exception 'Existing interactions must be preserved';
    end if;
  end loop;
  if (select count(*) from jsonb_array_elements(p_state->'interactions')) <>
     (select count(distinct value->>'id') from jsonb_array_elements(p_state->'interactions')) then
    raise exception 'Duplicate interaction';
  end if;
  for item in select value from jsonb_array_elements(p_state->'interactions') loop
    if not exists (select 1 from jsonb_array_elements(previous) x where x->>'id' = item->>'id') and item->>'outcome' = 'bought' then
      if (item->>'amountCents')::numeric <= 0 or (item->>'amountCents')::numeric <> trunc((item->>'amountCents')::numeric)
        or (item->>'units')::integer <= 0 or item->>'amountCents' is null or item->>'units' is null
        or item->>'id' is null or item->>'date' is null then raise exception 'Invalid confirmed sale'; end if;
      -- Stable UUID permits safe retry after a lost response. UUIDs and old sales remain intact.
      insert into public.sales(id, owner_id, sale_date, value, ipc)
        values ((item->>'id')::uuid, uid, (item->>'date')::date, (item->>'amountCents')::numeric / 100, (item->>'units')::integer)
        on conflict(id) do nothing;
      select * into sale from public.sales where id = (item->>'id')::uuid;
      if sale.owner_id is distinct from uid or sale.value is distinct from (item->>'amountCents')::numeric / 100
        or sale.sale_date is distinct from (item->>'date')::date or sale.ipc is distinct from (item->>'units')::integer then
        raise exception 'Sale identifier conflict' using errcode = '42501';
      end if;
    end if;
  end loop;
  insert into public.epav_planner_workspaces(owner_id, state, revision, updated_at)
    values (uid, p_state - 'sales', p_expected_revision + 1, now())
    on conflict(owner_id) do update set state = excluded.state, revision = excluded.revision, updated_at = excluded.updated_at
    returning * into current_row;
  return current_row;
end;
$$;
revoke all on function public.save_epav_planner_workspace(jsonb, integer) from public, anon;
grant execute on function public.save_epav_planner_workspace(jsonb, integer) to authenticated;
commit;
