// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { swiftSyncRunResponse } from '../supabase/functions/_shared/swift-sync-run-response.js';
let db;
const begin = async (key) => (await db.query('select * from begin_swift_price_sync($1,300)', [key])).rows[0];
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role service_role; create role anon;
    create table swift_price_sync_runs (
      id bigserial primary key, correlation_id uuid default gen_random_uuid(), request_key text unique,
      started_at timestamptz default now(), finished_at timestamptz, heartbeat_at timestamptz,
      lease_expires_at timestamptz, outcome text default 'running', recovered_at timestamptz,
      recovered_by_run_id bigint, internal_error_code text, error_summary jsonb);
    create unique index one_active on swift_price_sync_runs ((1)) where finished_at is null;`);
  await db.exec(readFileSync(new URL('../supabase/044_swift_sync_expired_requests.sql', import.meta.url), 'utf8'));
});
afterAll(async () => db?.close());
it('reconciles an expired identical request, preserves identity and allows a new explicit run', async () => {
  const run = await begin('batch:original');
  expect(run.disposition).toBe('started');
  expect((await begin('batch:original')).disposition).toBe('duplicate_active');
  expect((await begin('batch:other')).disposition).toBe('active_conflict');
  await db.exec(`update swift_price_sync_runs set lease_expires_at=now()-interval '1 second' where id=${run.id}`);
  const duplicate = await begin('batch:original');
  expect(duplicate.disposition).toBe('duplicate_finished');
  expect(duplicate.id).toBe(run.id);
  const audit = (await db.query('select * from swift_price_sync_runs where id=$1', [run.id])).rows[0];
  expect(audit.outcome).toBe('abandoned');
  expect(audit.internal_error_code).toBe('lease_expired_recovered');
  const next = await begin('batch:new');
  expect(next.disposition).toBe('started');
  expect((await db.query('select count(*)::int as count from swift_price_sync_runs')).rows[0].count).toBe(2);
  expect((await begin('batch:original')).disposition).toBe('duplicate_finished');
});
it('keeps the lease RPC inaccessible to anonymous callers', async () => {
  await db.exec('set role anon');
  await expect(begin('anonymous')).rejects.toThrow('permission denied');
  await db.exec('reset role');
});
it('distinguishes active, expired, failed and completed runs without repeating writes', () => {
  const run = { id: 3, correlation_id: 'ref', outcome: 'running', lease_expires_at: '2026-10-10T00:05:00Z' };
  const now = Date.parse('2026-10-10T00:00:00Z');
  expect(swiftSyncRunResponse(run, now)).toMatchObject({ status: 202, payload: { pending: true } });
  expect(swiftSyncRunResponse(run, now + 600000)).toMatchObject({ status: 409, payload: { code: 'sync_request_expired' } });
  expect(swiftSyncRunResponse({ ...run, finished_at: '2026-10-10', outcome: 'failed' }, now).status).toBe(500);
  const failures = [{ product_id: 'p', code: 'price_not_found' }];
  expect(
    swiftSyncRunResponse({ ...run, finished_at: '2026-10-10', outcome: 'partial', products_failed: 1, error_summary: failures }, now)
  ).toMatchObject({ status: 200, payload: { replayed: true, products_failed: 1, failures } });
});
