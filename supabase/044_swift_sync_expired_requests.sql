-- Apply after 043. Fix expired duplicate requests without deleting audit rows.
create or replace function public.begin_swift_price_sync(
  p_request_key text default null, p_lease_seconds integer default 300)
returns table(id bigint, correlation_id uuid, disposition text, recovered_run_id bigint)
language plpgsql security definer set search_path = '' as $$
declare
  existing public.swift_price_sync_runs;
  recovered_id bigint;
  new_id bigint;
  new_correlation uuid;
  lease_seconds integer := greatest(60, least(coalesce(p_lease_seconds,300),3600));
begin
  -- Serializes inspection/recovery/insertion even when an expired row is present.
  perform pg_advisory_xact_lock(hashtext('public.swift_price_sync_runs'));
  if nullif(p_request_key,'') is not null then
    select * into existing from public.swift_price_sync_runs where request_key=nullif(p_request_key,'');
    if found then
      -- A repeated key must also reconcile an expired lease. Keep its identity
      -- and audit trail; never rerun a request whose effects may have persisted.
      if existing.finished_at is null and
        coalesce(existing.lease_expires_at,existing.started_at + interval '5 minutes') <= now() then
        update public.swift_price_sync_runs set finished_at=now(), outcome='abandoned',
          recovered_at=now(), internal_error_code='lease_expired_recovered',
          error_summary=coalesce(error_summary,'{}'::jsonb) || jsonb_build_object('lifecycle','lease_expired_recovered')
        where swift_price_sync_runs.id=existing.id;
        existing.finished_at:=now();
      end if;
      return query select existing.id, existing.correlation_id,
        case when existing.finished_at is null then 'duplicate_active' else 'duplicate_finished' end, null::bigint;
      return;
    end if;
  end if;
  select * into existing from public.swift_price_sync_runs
    where finished_at is null order by started_at desc limit 1 for update;
  if found and coalesce(existing.lease_expires_at, existing.started_at + interval '5 minutes') > now() then
    return query select existing.id, existing.correlation_id, 'active_conflict'::text, null::bigint;
    return;
  elsif found then
    recovered_id := existing.id;
    update public.swift_price_sync_runs set finished_at=now(), outcome='abandoned',
      recovered_at=now(), internal_error_code='lease_expired_recovered',
      error_summary=coalesce(error_summary,'{}'::jsonb) || jsonb_build_object('lifecycle','lease_expired_recovered')
    where swift_price_sync_runs.id=existing.id and finished_at is null;
  end if;
  insert into public.swift_price_sync_runs(request_key,heartbeat_at,lease_expires_at)
    values(nullif(p_request_key,''),now(),now()+make_interval(secs=>lease_seconds))
    returning swift_price_sync_runs.id, swift_price_sync_runs.correlation_id into new_id,new_correlation;
  if recovered_id is not null then
    update public.swift_price_sync_runs set recovered_by_run_id=new_id where swift_price_sync_runs.id=recovered_id;
  end if;
  return query select new_id,new_correlation,
    case when recovered_id is null then 'started' else 'recovered_and_started' end, recovered_id;
end $$;


revoke all on function public.begin_swift_price_sync(text,integer) from public;
grant execute on function public.begin_swift_price_sync(text,integer) to service_role;
