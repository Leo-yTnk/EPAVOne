-- Read-only: inspect before 044; contains no user content or tokens.
select id, started_at, heartbeat_at, lease_expires_at, finished_at, outcome,
  internal_error_code, recovered_at, recovered_by_run_id,
  case when finished_at is not null then 'finished'
       when coalesce(lease_expires_at,started_at + interval '5 minutes') <= now() then 'expired'
       else 'active' end as lifecycle,
  products_synced, products_updated, products_unchanged, products_failed
from public.swift_price_sync_runs
order by started_at desc limit 20;
select pg_get_functiondef('public.begin_swift_price_sync(text,integer)'::regprocedure);
