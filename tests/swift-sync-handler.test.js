// @vitest-environment node
import { readFileSync } from 'node:fs';
import { transform } from 'esbuild';
import { expect, it, vi } from 'vitest';
import { validSwiftSyncSelection } from '../supabase/functions/_shared/swift-sync-batch.js';
const source = readFileSync(new URL('../supabase/functions/swift-price-sync/index.ts', import.meta.url), 'utf8');
const { code } = await transform(source.replace(/import[\s\S]*?from '[^']+';/g, ''), { loader: 'ts' });
const ids = Array.from({ length: 6 }, (_, i) => `00000000-0000-0000-0000-00000000000${i}`);
async function setup({ heartbeat } = {}) {
  let handler;
  let active = 0;
  let peak = 0;
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    then: (resolve) => Promise.resolve({ data: ids.map((id) => ({ id, name: id })), error: null }).then(resolve)
  };
  const rpc = vi.fn(async (name) => {
    if (name === 'begin_swift_price_sync') return { data: [{ id: 1, disposition: 'started' }] };
    if (name === 'heartbeat_swift_price_sync') return heartbeat ? heartbeat() : { data: true };
    if (name === 'mark_swift_price_failure') {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
    }
    return { data: true };
  });
  const env = {
    SUPABASE_URL: 'fixture',
    SUPABASE_ANON_KEY: 'fixture',
    SUPABASE_SERVICE_ROLE_KEY: 'fixture',
    SWIFT_REFERENCE_ZIP_CODE: '01234567',
    SWIFT_PRICE_CRON_SECRET: 'fixture'
  };
  // Execute the real TypeScript handler with injected provider/database boundaries.
  new Function('Deno', 'createClient', 'validSwiftSyncSelection', 'console', code)(
    {
      env: { get: (key) => env[key] },
      serve: (fn) => {
        handler = fn;
      }
    },
    () => ({ rpc, from: () => query }),
    validSwiftSyncSelection,
    { log: () => {} }
  );
  const invoke = (body) =>
    handler(
      new Request('https://fixture.test', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cron-secret': 'fixture' },
        body: JSON.stringify(body)
      })
    );
  return { invoke, query, rpc, peak: () => peak };
}
it('selects only the explicit batch under one lease, uses bounded workers and finalizes confirmed metrics', async () => {
  const fixture = await setup();
  const response = await fixture.invoke({ productId: ids[0], productIds: ids, requestId: 'request' });
  expect(response.status).toBe(207);
  expect(await response.json()).toMatchObject({ products_failed: 6 });
  expect(fixture.query.in).toHaveBeenCalledWith('id', ids);
  expect(fixture.query.eq).not.toHaveBeenCalledWith('id', ids[0]);
  expect(fixture.peak()).toBe(3);
  expect(fixture.rpc.mock.calls.filter(([name]) => name === 'begin_swift_price_sync')).toHaveLength(1);
  expect(fixture.rpc.mock.calls.at(-1)).toMatchObject([
    'finish_swift_price_sync',
    { p_outcome: 'partial', p_metrics: { products_failed: 6 } }
  ]);
});
it('rejects oversized selections before claiming the global lease', async () => {
  const fixture = await setup();
  const response = await fixture.invoke({ productIds: [...ids, ids[0]] });
  expect(response.status).toBe(400);
  expect(fixture.rpc).not.toHaveBeenCalled();
});
it('waits for all workers before finalizing a run that lost its lease', async () => {
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const fixture = await setup({
    heartbeat: async () => {
      if (++calls === 1) return { data: false };
      await pending;
      return { data: false };
    }
  });
  const result = fixture.invoke({ productIds: ids });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(fixture.rpc.mock.calls.some(([name]) => name === 'finish_swift_price_sync')).toBe(false);
  release();
  expect((await result).status).toBe(500);
  expect(fixture.rpc.mock.calls.at(-1)).toMatchObject([
    'finish_swift_price_sync',
    { p_outcome: 'failed', p_internal_error_code: 'sync_lease_lost' }
  ]);
});
