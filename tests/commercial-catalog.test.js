import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { commercialCatalog } from '../src/shared/services/commercialCatalog.js';
import { catalogService } from '../src/products/insights/services/catalogService.js';
import { catalogRepository } from '../src/shared/repositories/catalogRepository.js';
import { invalidatePublicCatalog, readSharedPublicResource } from '../src/products/insights/services/publicResourceCache.js';
import { supabaseClient } from '../src/shared/services/supabaseClient.js';
beforeEach(() => invalidatePublicCatalog());
afterEach(() => vi.restoreAllMocks());
function sources() {
  vi.spyOn(catalogRepository, 'categories').mockResolvedValue([]);
  vi.spyOn(catalogRepository, 'recipes').mockResolvedValue([]);
  vi.spyOn(catalogRepository, 'ingredientLinks').mockResolvedValue([]);
  return vi.spyOn(catalogRepository, 'products').mockResolvedValue([{ id: 'p', name: 'Frango' }]);
}
it('reuses Insights loader identity and invalidates the same public cache after catalog writes', async () => {
  const products = sources();
  expect(catalogService.loadCatalog).toBe(commercialCatalog.loadCatalog);
  const [first, shared] = await Promise.all([
    readSharedPublicResource(catalogService.loadCatalog, 'public'),
    commercialCatalog.intelligence()
  ]);
  expect(first.products).toEqual(shared.products);
  expect(products).toHaveBeenCalledTimes(1);
  products.mockResolvedValue([{ id: 'other', name: 'Bovino' }]);
  invalidatePublicCatalog();
  expect((await commercialCatalog.intelligence()).products[0].id).toBe('other');
  expect(products).toHaveBeenCalledTimes(2);
});
it('keeps products when ingredient loading fails and marks recipes incomplete', async () => {
  sources();
  catalogRepository.ingredientLinks.mockRejectedValue(new Error('offline'));
  const result = await commercialCatalog.intelligence();
  expect(result).toMatchObject({ products: [{ id: 'p', name: 'Frango' }], links: [], incompleteRecipes: true });
});
it('reads all ingredient links in batches and enforces the public published recipe scope', async () => {
  const read = vi.spyOn(supabaseClient, 'readRows').mockImplementation(async (_table, params) => ({
    rows: Array.from({ length: Number(params.offset) ? 1 : 200 }, (_, id) => ({ recipe_id: 'r', product_id: String(id) })),
    total: 201
  }));
  expect(await catalogRepository.ingredientLinks()).toHaveLength(201);
  expect(read).toHaveBeenCalledTimes(2);
  expect(read.mock.calls[0][1]).toMatchObject({ 'recipe.scope': 'eq.site', 'recipe.status': 'eq.published', limit: '200', offset: '0' });
  expect(read.mock.calls[1][1].offset).toBe('200');
});
