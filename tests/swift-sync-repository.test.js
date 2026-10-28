import { expect, it, vi } from 'vitest';
const { client } = vi.hoisted(() => ({
  client: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'fixture' } } })) },
    functions: { invoke: vi.fn() }
  }
}));
vi.mock('../src/shared/services/accountService.js', () => ({ authenticatedClient: client }));
import { refreshAllProductPrices } from '../src/products/insights/creation/repositories/creationRepository.js';
it('retains a pending run and polls its status without starting another sync', async () => {
  client.functions.invoke.mockResolvedValueOnce({ data: { pending: true, run_id: 7 } });
  expect((await refreshAllProductPrices()).data.pending).toBe(true);
  const original = client.functions.invoke.mock.calls[0][1].body;
  client.functions.invoke.mockResolvedValueOnce({ data: { products_failed: 0, products_updated: 2 } });
  expect((await refreshAllProductPrices()).data.products_updated).toBe(2);
  expect(client.functions.invoke.mock.calls[1][1].body).toEqual({ ...original, runId: 7, statusOnly: true });
  client.functions.invoke.mockResolvedValueOnce({ data: { products_failed: 0 } });
  await refreshAllProductPrices();
  const next = client.functions.invoke.mock.calls[2][1].body;
  expect(next.statusOnly).toBeUndefined();
  expect(next.requestId).not.toBe(original.requestId);
});
it('clears an expired run before allowing a new explicit request', async () => {
  client.functions.invoke.mockClear();
  client.functions.invoke.mockResolvedValueOnce({ data: { pending: true, run_id: 9 } });
  await refreshAllProductPrices();
  client.functions.invoke.mockResolvedValueOnce({
    error: {
      message: 'Conflict',
      context: new Response(JSON.stringify({ code: 'sync_request_expired', run_id: 9 }), { status: 409 })
    }
  });
  expect((await refreshAllProductPrices()).error.code).toBe('sync_request_expired');
  client.functions.invoke.mockResolvedValueOnce({ data: { products_failed: 0 } });
  await refreshAllProductPrices();
  expect(client.functions.invoke.mock.calls[2][1].body.statusOnly).toBeUndefined();
});

it('never attributes a different concurrent run result to the requested sync', async () => {
  client.functions.invoke.mockClear();
  client.functions.invoke.mockResolvedValueOnce({ data: { pending: true, conflicting: true, run_id: 11 } });
  await refreshAllProductPrices();
  client.functions.invoke.mockResolvedValueOnce({ data: { products_failed: 0, products_updated: 1 } });
  const finished = await refreshAllProductPrices();
  expect(finished.data).toBeNull();
  expect(finished.error.code).toBe('sync_other_run_completed');
});

it('keeps selection identity across a pending batch and polls without repeating writes', async () => {
  const { refreshProductPriceBatch } = await import('../src/products/insights/creation/repositories/creationRepository.js');
  client.functions.invoke.mockClear();
  client.functions.invoke.mockResolvedValueOnce({ data: { pending: true, run_id: 92 } });
  await refreshProductPriceBatch(['a', 'b']);
  const original = client.functions.invoke.mock.calls[0][1].body;
  expect(original).toMatchObject({ productIds: ['a', 'b'], productId: 'a' });
  client.functions.invoke.mockResolvedValueOnce({ data: { products_failed: 0, products_updated: 2 } });
  await refreshProductPriceBatch(['a', 'b']);
  expect(client.functions.invoke.mock.calls[1][1].body).toEqual({ ...original, statusOnly: true, runId: 92 });
});
