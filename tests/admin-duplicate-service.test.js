import { expect, it, vi } from 'vitest';
const { api, client } = vi.hoisted(() => ({
  api: { adminAddPublicCatalog: vi.fn(async () => ({ data: {} })), adminImportReviewedCatalog: vi.fn(async () => ({ data: {} })) },
  client: { auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'admin' } } } })) }, from: vi.fn() }
}));
vi.mock('../src/shared/services/accountService.js', () => ({ authenticatedClient: client }));
vi.mock('../src/products/insights/creation/repositories/creationRepository.js', () => api);
import { adminService } from '../src/products/insights/creation/services/adminService.js';
import { prepareSwiftBundle } from '../src/products/insights/creation/admin/swiftBundleService.js';
import { addModes } from '../src/products/insights/creation/admin/importReview.js';
it('does not replace the preview version with a freshly fetched version when revalidating', async () => {
  const builder = { select: () => builder, eq: () => builder, single: async () => ({ data: { role: 'admin' } }) };
  client.from.mockReturnValue(builder);
  const payload = prepareSwiftBundle({});
  const existing = { ...payload.products[0], id: 'existing', version: 4 };
  adminService.context = async () => ({ products: [existing], categories: [], recipes: [], structure: { pages: [], sections: [] } });
  const choice = { entity: 'products', index: 0, id: 'existing', version: 3 };
  await expect(adminService.importCatalog(addModes, payload, [choice])).rejects.toThrow('mudou desde a comparação');
  expect(api.adminImportReviewedCatalog).not.toHaveBeenCalled();
  await adminService.importCatalog(addModes, payload, [{ ...choice, version: 4 }]);
  expect(api.adminImportReviewedCatalog).toHaveBeenCalledWith(payload, [{ ...choice, version: 4 }]);
  await adminService.importCatalog(addModes, payload);
  expect(api.adminAddPublicCatalog).toHaveBeenCalledWith(payload);
});
