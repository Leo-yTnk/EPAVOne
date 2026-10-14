// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
let db;
const sql = readFileSync(new URL('../supabase/configure_swift_price_schedule.sql', import.meta.url), 'utf8');
const apply = () => db.exec(sql);
const jobs = async () => (await db.query('select * from cron.job order by jobid')).rows;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema cron; create schema vault; create schema net;
    create table cron.job(jobid bigserial primary key, jobname text unique, schedule text, active boolean default true, command text);
    create table vault.decrypted_secrets(name text unique, decrypted_secret text);
    create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
      headers jsonb default '{}'::jsonb, timeout_milliseconds integer default 1000) returns bigint
      language plpgsql as $$ begin raise exception 'No HTTP should execute during configuration'; end $$;
    create function cron.alter_job(job_id bigint, schedule text default null, active boolean default null) returns void
      language sql as $$ update cron.job set schedule=coalesce($2,cron.job.schedule), active=coalesce($3,cron.job.active) where jobid=$1 $$;
    create function cron.schedule(jobname text, schedule text, command text) returns bigint
      language sql as $$ insert into cron.job(jobname,schedule,command) values($1,$2,$3)
      on conflict(jobname) do update set schedule=$2,command=$3 returning jobid $$;
  `);
}, 60000);
beforeEach(async () => {
  await db.exec("truncate cron.job restart identity; truncate vault.decrypted_secrets; set cron.timezone = 'GMT'");
});
afterAll(async () => db?.close());
it('reuses the existing job and authentication, runs daily at Brasília 7/9/14 and is repeatable', async () => {
  await db.exec(`insert into cron.job(jobname,schedule,command,active) values
    ('legacy-swift','*/30 * * * *','select existing_swift_call(''swift-price-sync'')',false),
    ('unrelated','0 0 * * *','select 1',true)`);
  await apply();
  await apply();
  const result = await jobs();
  expect(result).toHaveLength(2);
  expect(result[0]).toMatchObject({
    jobname: 'legacy-swift',
    schedule: '0 10,12,17 * * *',
    active: true,
    command: "select existing_swift_call('swift-price-sync')"
  });
  expect(result[1].schedule).toBe('0 0 * * *');
});
it('creates exactly one job with a Vault reference and never calls HTTP while configuring', async () => {
  await db.exec(`insert into vault.decrypted_secrets values ('SWIFT_PRICE_CRON_SECRET','test-secret')`);
  await apply();
  await apply();
  const result = await jobs();
  expect(result).toHaveLength(1);
  expect(result[0].schedule).toBe('0 10,12,17 * * *');
  expect(result[0].command).toContain('vault.decrypted_secrets');
  expect(result[0].command).toContain('x-cron-secret');
  expect(result[0].command).not.toContain('test-secret');
});
it('refuses multiple schedulers without changing any job', async () => {
  await db.exec(`insert into cron.job(jobname,schedule,command) values
    ('swift-a','* * * * *','swift-price-sync'),('swift-b','0 * * * *','swift-price-sync')`);
  await expect(apply()).rejects.toThrow('Multiple Swift jobs');
  await db.exec('rollback');
  expect((await jobs()).map((job) => job.schedule)).toEqual(['* * * * *', '0 * * * *']);
});
it('does not create an unauthenticated job when Vault secret is missing', async () => {
  await expect(apply()).rejects.toThrow('Store the existing Edge Function');
  await db.exec('rollback');
  expect(await jobs()).toHaveLength(0);
});
it('refuses an incompatible scheduler timezone', async () => {
  await db.exec("set cron.timezone = 'America/Sao_Paulo'");
  await expect(apply()).rejects.toThrow('Cron timezone must be UTC/GMT');
  await db.exec('rollback');
  expect(await jobs()).toHaveLength(0);
});
