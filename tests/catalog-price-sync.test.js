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
