-- Read-only. Run after 049 if an import still fails.
-- Does not return catalog contents, SQL query texts, credentials or user IDs.
select p.proname, p.proconfig
from pg_catalog.pg_proc p
where p.oid in (
  to_regprocedure('public.admin_add_public_catalog(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)'),
  to_regprocedure('public.admin_import_reviewed_catalog(jsonb,jsonb)')
);

-- SQL Editor SHOW statement_timeout describes that session, not the API role.
select r.rolname, setting
from pg_catalog.pg_roles r
cross join lateral unnest(r.rolconfig) setting
where r.rolname in ('authenticator','authenticated')
  and (setting like 'statement_timeout=%' or setting like 'lock_timeout=%');

-- Run while a second tab attempts the import, so transient blockers are visible.
-- No cancellations or terminations are issued by this script.
select pid, state, wait_event_type, wait_event,
  clock_timestamp()-query_start as elapsed,
  pg_blocking_pids(pid) as blocking_pids
from pg_catalog.pg_stat_activity
where datname=current_database() and pid<>pg_backend_pid()
  and cardinality(pg_blocking_pids(pid))>0
order by query_start;
