import { expect, it, vi } from 'vitest';
import { createCatalogPriceSync } from '../src/products/insights/creation/services/catalogPriceSync.js';
const product = (id) => ({ id, name: `Produto ${id}`, active: true, swift_product_url: `https://www.swift.com.br/${id}/p` });
it('processes individual requests, aggregates partial failures and skips inactive products', async () => {
  const refresh = vi
    .fn()
    .mockResolvedValueOnce({ data: { products_updated: 1, products_failed: 0 } })
    .mockResolvedValueOnce({
      error: { metrics: { products_failed: 1 }, failures: [{ product_name: 'Produto 2', code: 'price_not_found' }] }
    });
  const job = createCatalogPriceSync({
    loadProducts: async () => [
      product('1'),
      product('2'),
      { ...product('3'), active: false },
      { id: '4', active: true, name: 'Sem página' }
    ],
    refresh
  });
  const changes = [];
  job.subscribe((state) => changes.push(state.processed));
  await job.start();
  expect(refresh.mock.calls).toEqual([['1'], ['2']]);
  expect(job.snapshot()).toMatchObject({ phase: 'completed', total: 3, processed: 3, updated: 1, failed: 2 });
  expect(changes).toContain(1);
  expect(job.snapshot().failures).toHaveLength(2);
});
it('automatically polls the pending product and serializes repeated start actions', async () => {
  let resolve;
  const first = new Promise((done) => {
    resolve = done;
  });
  const refresh = vi
    .fn()
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce({ data: { products_failed: 0, products_unchanged: 1 } });
  const delay = vi.fn(async () => {});
  const job = createCatalogPriceSync({ loadProducts: async () => [product('1')], refresh, delay });
  const running = job.start();
  expect(job.start()).toBe(running);
  resolve({ data: { pending: true, run_id: 19 } });
  await running;
  expect(refresh.mock.calls).toEqual([['1'], ['1']]);
  expect(delay).toHaveBeenCalledWith(2500);
  expect(job.snapshot()).toMatchObject({ phase: 'completed', processed: 1, unchanged: 1 });
});
it('pauses on configuration errors and resumes without redoing completed products', async () => {
  const refresh = vi
    .fn()
    .mockResolvedValueOnce({ data: { products_failed: 0, products_updated: 1 } })
    .mockResolvedValueOnce({ error: { code: 'service_misconfigured', message: 'CEP ausente' } })
    .mockResolvedValueOnce({ data: { products_failed: 0, products_unchanged: 1 } });
  const job = createCatalogPriceSync({ loadProducts: async () => [product('1'), product('2')], refresh });
  await job.start();
  expect(job.snapshot()).toMatchObject({ phase: 'paused', processed: 1, error: 'CEP ausente' });
  await job.start();
  expect(refresh.mock.calls).toEqual([['1'], ['2'], ['2']]);
  expect(job.snapshot()).toMatchObject({ phase: 'completed', processed: 2 });
});
it('waits for a conflicting run before starting the requested product', async () => {
  const refresh = vi
    .fn()
    .mockResolvedValueOnce({ error: { code: 'sync_other_run_completed' } })
    .mockResolvedValueOnce({ data: { products_failed: 0, products_updated: 1 } });
  const job = createCatalogPriceSync({ loadProducts: async () => [product('1')], refresh, delay: async () => {} });
  await job.start();
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(job.snapshot().updated).toBe(1);
});

it('handles 1002 products in 167 serial batches and estimates time from confirmed throughput', async () => {
  let clock = 0;
  let inFlight = 0;
  const refreshBatch = vi.fn(async (ids) => {
    expect(inFlight++).toBe(0);
    clock += 6000;
    await Promise.resolve();
    inFlight--;
    return { data: { products_updated: ids.length, products_failed: 0 } };
  });
  const job = createCatalogPriceSync({
    loadProducts: async () => Array.from({ length: 1002 }, (_, i) => product(String(i))),
    refreshBatch,
    now: () => clock
  });
  const snapshots = [];
  job.subscribe((state) => snapshots.push(state));
  await job.start();
  expect(refreshBatch).toHaveBeenCalledTimes(167);
  expect(refreshBatch.mock.calls.flatMap(([ids]) => ids)).toHaveLength(1002);
  expect(new Set(refreshBatch.mock.calls.flatMap(([ids]) => ids)).size).toBe(1002);
  expect(snapshots.find((state) => state.processed === 6)).toMatchObject({ remainingMs: 996000 });
  expect(job.snapshot()).toMatchObject({ phase: 'completed', processed: 1002, updated: 1002, remainingMs: 0 });
});

it('retries the same pending batch and resumes without repeating confirmed batches or counting pauses in ETA', async () => {
  let clock = 0;
  const refreshBatch = vi
    .fn()
    .mockImplementationOnce(async () => {
      clock += 6000;
      return { data: { products_updated: 5, products_failed: 1, failures: [{ product_id: '2', code: 'swift_unavailable' }] } };
    })
    .mockResolvedValueOnce({ error: { code: 'service_misconfigured', message: 'Configuração ausente' } })
    .mockResolvedValueOnce({ data: { pending: true, run_id: 91 } })
    .mockImplementationOnce(async () => {
      clock += 2000;
      return { data: { products_unchanged: 2, products_failed: 0 } };
    });
  const job = createCatalogPriceSync({
    loadProducts: async () => Array.from({ length: 8 }, (_, i) => product(String(i))),
    refreshBatch,
    now: () => clock,
    delay: async () => {}
  });
  await job.start();
  expect(job.snapshot()).toMatchObject({ phase: 'paused', processed: 6, failed: 1, remainingMs: null });
  clock += 3600000;
  await job.start();
  expect(refreshBatch.mock.calls.slice(1).map(([ids]) => ids)).toEqual([
    ['6', '7'],
    ['6', '7'],
    ['6', '7']
  ]);
  expect(job.snapshot()).toMatchObject({ phase: 'completed', processed: 8, updated: 5, unchanged: 2, failed: 1 });
});

it('pauses without counting incomplete batch metrics from an older backend', async () => {
  const job = createCatalogPriceSync({
    loadProducts: async () => [product('1'), product('2')],
    refreshBatch: async () => ({ data: { products_updated: 1, products_failed: 0 } })
  });
  await job.start();
  expect(job.snapshot()).toMatchObject({ phase: 'paused', processed: 0, remainingMs: null });
  expect(job.snapshot().error).toContain('Publique a versão atual');
});

it('does not use missing URLs to inflate observed throughput', async () => {
  let clock = 0;
  const job = createCatalogPriceSync({
    loadProducts: async () => [product('1'), { id: 'missing', active: true }, product('2')],
    refreshBatch: async (ids) => {
      clock += 3000;
      return { data: { products_updated: ids.length, products_failed: 0 } };
    },
    now: () => clock
  });
  const snapshots = [];
  job.subscribe((state) => snapshots.push(state));
  await job.start();
  expect(snapshots.find((state) => state.processed === 2).remainingMs).toBe(3000);
  expect(job.snapshot()).toMatchObject({ processed: 3, updated: 2, failed: 1 });
});
