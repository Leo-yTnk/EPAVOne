-- Read-only metadata. Run after enabling Cron; never print job command/headers.
SELECT coalesce(current_setting('cron.timezone', true), 'GMT') AS scheduler_timezone;
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE command ILIKE '%swift-price-sync%'
   OR jobname = 'epavone-swift-prices-daily';
SELECT r.jobid, r.status, r.start_time, r.end_time
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.command ILIKE '%swift-price-sync%'
   OR j.jobname = 'epavone-swift-prices-daily'
ORDER BY r.start_time DESC LIMIT 15;
-- A successful cron run only queues HTTP. Check sync run metrics separately.
SELECT id, started_at, finished_at, outcome, products_updated, products_unchanged, products_failed
FROM public.swift_price_sync_runs
ORDER BY started_at DESC LIMIT 15;
