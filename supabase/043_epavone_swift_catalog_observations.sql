-- 043: keep source metadata separate from editorial fields. No scheduler/deploy changes.
create table public.swift_catalog_observations (
  product_id uuid primary key references public.products(id) on delete cascade,
  observed_name text not null,
  image_url text,
  presentation text,
  availability text check (availability in ('available','unavailable','unknown')),
  reference_zip_code text not null check (reference_zip_code ~ '^[0-9]{8}$'),
  region_confirmed boolean not null default false,
  checked_at timestamptz not null,
  canonical_url text not null
);
alter table public.swift_catalog_observations enable row level security;
create policy admin_read_swift_observation on public.swift_catalog_observations for select to authenticated
  using (public.is_admin());
revoke all on public.swift_catalog_observations from public, anon, authenticated;
grant select on public.swift_catalog_observations to authenticated;

create or replace function public.apply_swift_catalog_observation(p_product_id uuid, p_observation jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare changed boolean;
begin
  changed := public.apply_swift_price_observation(p_product_id,p_observation);
  insert into public.swift_catalog_observations(product_id,observed_name,image_url,presentation,availability,
    reference_zip_code,region_confirmed,checked_at,canonical_url)
  values(p_product_id,p_observation->>'observed_name',p_observation->>'observed_image_url',
    p_observation->>'presentation',coalesce(p_observation->>'availability','unknown'),
    p_observation->>'reference_zip_code',coalesce((p_observation->>'region_confirmed')::boolean,false),
    (p_observation->>'checked_at')::timestamptz,p_observation->>'swift_product_url')
  on conflict(product_id) do update set observed_name=excluded.observed_name,image_url=excluded.image_url,
    presentation=excluded.presentation,availability=excluded.availability,reference_zip_code=excluded.reference_zip_code,
    region_confirmed=excluded.region_confirmed,checked_at=excluded.checked_at,canonical_url=excluded.canonical_url;
  return changed;
end $$;
revoke all on function public.apply_swift_catalog_observation(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.apply_swift_catalog_observation(uuid,jsonb) to service_role;

create or replace function public.admin_accept_swift_metadata(
  p_product_id uuid, p_checked_at timestamptz, p_version integer, p_name boolean, p_image boolean
) returns void language plpgsql security definer set search_path='' as $$
declare p public.products; o public.swift_catalog_observations;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'not_authorized' using errcode='42501'; end if;
  select * into p from public.products where id=p_product_id and scope='site' and owner_id is null for update;
  if not found then raise exception 'product_not_found'; end if;
  if p.version is distinct from p_version then raise exception 'version_conflict'; end if;
  select * into o from public.swift_catalog_observations where product_id=p.id for update;
  if not found or o.checked_at is distinct from p_checked_at then raise exception 'observation_conflict'; end if;
  if public.swift_catalog_identity(p.swift_product_url) is distinct from public.swift_catalog_identity(o.canonical_url) then raise exception 'swift_identity_conflict'; end if;
  if p_image and (o.image_url is null or o.image_url !~ '^https://(swiftbr\.vteximg\.com\.br|www\.swift\.com\.br|swift\.com\.br)/') then raise exception 'invalid_official_image'; end if;
  if p_name and btrim(o.observed_name)='' then raise exception 'invalid_name'; end if;
  update public.products set name=case when p_name then o.observed_name else name end,
    image_url=case when p_image then o.image_url else image_url end,
    updated_at=now(),updated_by=auth.uid() where id=p.id;
end $$;
revoke all on function public.admin_accept_swift_metadata(uuid,timestamptz,integer,boolean,boolean) from public,anon;
grant execute on function public.admin_accept_swift_metadata(uuid,timestamptz,integer,boolean,boolean) to authenticated;
