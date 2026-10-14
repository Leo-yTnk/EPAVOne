-- Operational configuration, not a schema migration. Run in the SQL Editor.
-- Reuses an existing Swift job and its authentication without reading secrets.
-- No price writes and no immediate HTTP call. See docs/daily-price-schedule.md.
BEGIN;
DO $configure$
DECLARE
  existing_id bigint;
  matching_count integer;
  scheduler_timezone text := coalesce(current_setting('cron.timezone', true), 'GMT');
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('epavone-swift-price-schedule'));
  IF to_regclass('cron.job') IS NULL THEN
    RAISE EXCEPTION 'Enable Supabase Cron (pg_cron) before configuring the schedule';
  END IF;
  IF scheduler_timezone NOT IN ('GMT', 'UTC', 'Etc/UTC') THEN
    RAISE EXCEPTION 'Cron timezone must be UTC/GMT; inspect cron.timezone before applying';
  END IF;
  -- Refuse ambiguous ownership instead of introducing another scheduler.
  SELECT count(*), min(jobid) INTO matching_count, existing_id
  FROM cron.job
  WHERE command ILIKE '%swift-price-sync%'
     OR jobname = 'epavone-swift-prices-daily';
  IF matching_count > 1 THEN
    RAISE EXCEPTION 'Multiple Swift jobs exist; reconcile them in Cron before applying';
  ELSIF matching_count = 1 THEN
    PERFORM cron.alter_job(existing_id, schedule := '0 10,12,17 * * *', active := true);
  ELSE
    IF to_regclass('vault.decrypted_secrets') IS NULL
       OR to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL THEN
      RAISE EXCEPTION 'Enable Vault and pg_net before creating the Swift job';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM vault.decrypted_secrets
      WHERE name = 'SWIFT_PRICE_CRON_SECRET' AND length(decrypted_secret) > 0
    ) THEN
      RAISE EXCEPTION 'Store the existing Edge Function SWIFT_PRICE_CRON_SECRET in Vault with the same name';
    END IF;
    PERFORM cron.schedule('epavone-swift-prices-daily', '0 10,12,17 * * *', $job$
      SELECT net.http_post(
        url := 'https://ytvztfvypiwgnslisxep.supabase.co/functions/v1/swift-price-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SWIFT_PRICE_CRON_SECRET')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 180000
      );
    $job$);
  END IF;
END;
$configure$;
COMMIT;

-- Metadata only: command/headers can contain credentials and are not displayed.
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE command ILIKE '%swift-price-sync%'
   OR jobname = 'epavone-swift-prices-daily';
