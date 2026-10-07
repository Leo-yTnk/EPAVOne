import { beforeEach, describe, expect, it, vi } from 'vitest';
const { client } = vi.hoisted(() => ({ client: { from: vi.fn() } }));
vi.mock('../src/shared/services/accountService.js', () => ({ authenticatedClient: client }));
import {
  fetchAllPages,
  fetchAdminCatalogStructure,
  fetchPublicCatalogStructure
} from '../src/products/insights/creation/repositories/creationRepository.js';

const rows = Array.from({ length: 1201 }, (_, i) => ({ section_id: `s-${i}`, recipe_id: `r-${i}`, product_id: `p-${i}` }));
let queries;
let failTable;
beforeEach(() => {
  queries = [];
  failTable = '';
  client.from.mockImplementation((table) => {
    const query = { table, filters: [], order: [], ranges: [] };
    queries.push(query);
    const builder = {
      select: () => builder,
      eq: (column, value) => {
        query.filters.push([column, value]);
        return builder;
      },
      order: (column) => {
        query.order.push(column);
        return builder;
      },
      range: (from, to) => {
        query.ranges.push([from, to]);
        if (table === failTable && from > 0) return Promise.resolve({ error: { code: '42501', message: 'denied' } });
        const data = table.startsWith('catalog_section_') ? rows : [{ id: table, active: true }];
        // Simulate an API limit lower than the requested 500-row page.
        return Promise.resolve({ data: data.slice(from, Math.min(to + 1, from + 200)) });
      }
    };
    return builder;
  });
});
describe('Complete catalog section membership', () => {
  it('reads every admin membership beyond 1000 rows even with a lower server cap', async () => {
    const response = await fetchAdminCatalogStructure();
    expect(response.error).toBeNull();
    expect(response.data.recipes).toEqual(rows);
    expect(response.data.products).toEqual(rows);
    const recipes = queries.filter((q) => q.table === 'catalog_section_recipes');
    expect(recipes.map((q) => q.ranges[0][0])).toEqual([0, 200, 400, 600, 800, 1000, 1200, 1201]);
    expect(recipes[0].order).toEqual(['sort_order', 'section_id', 'recipe_id']);
    expect(queries.every((q) => !q.filters.length)).toBe(true);
  });
  it('paginates public membership and retains active-only page and section filters', async () => {
    const response = await fetchPublicCatalogStructure();
    expect(response.data.recipes).toEqual(rows);
    expect(response.data.products).toEqual(rows);
    expect(
      queries
        .filter((q) => ['catalog_pages', 'catalog_sections'].includes(q.table))
        .every((q) => q.filters.some(([column, value]) => column === 'active' && value === true))
    ).toBe(true);
  });
  it('rejects a partial structure when a subsequent page fails', async () => {
    failTable = 'catalog_section_recipes';
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await fetchAdminCatalogStructure();
      expect(response.data).toBeNull();
      expect(response.error.code).toBe('42501');
    } finally {
      log.mockRestore();
    }
  });
  it('rejects malformed lists instead of presenting a partial or empty library', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 'a' }] })
      .mockResolvedValueOnce({ data: { id: 'b' } });
    const response = await fetchAllPages(query, 'library');
    expect(response.data).toBeUndefined();
    expect(response.error.code).toBe('INVALID_RESPONSE');
  });
});
