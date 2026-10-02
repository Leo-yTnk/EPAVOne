import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogRepository, readCatalog } from '../src/products/insights/repositories/catalogRepository.js';
import { filterProducts, productPricing, safeImage, swiftLink } from '../src/products/insights/models/catalog.js';

const response = (rows, range) => ({ ok: true, json: async () => rows, headers: new Headers(range ? { 'content-range': range } : {}) });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('catalog repository and prices', () => {
  it('continues through server-capped pages and applies public-only filters with FK hints', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(response([{ id: '1' }], '0-0/2'))
      .mockResolvedValueOnce(response([{ id: '2' }], '1-1/2'));
    vi.stubGlobal('fetch', transport);
    expect(await catalogRepository.products()).toHaveLength(2);
    const urls = transport.mock.calls.map(([url]) => new URL(url));
    expect(urls[1].searchParams.get('offset')).toBe('1');
    expect(urls[0].searchParams.get('scope')).toBe('eq.site');
    expect(urls[0].searchParams.get('active')).toBe('eq.true');
    expect(urls[0].searchParams.get('select')).toContain('categories!products_category_id_fkey');
    expect(transport.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });
  it('continues until an empty page when total is unavailable', async () => {
    const transport = vi
      .fn()
      .mockResolvedValueOnce(response([{ id: '1' }]))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal('fetch', transport);
    expect(await catalogRepository.categories()).toHaveLength(1);
    expect(new URL(transport.mock.calls[0][0]).searchParams.get('type')).toBe('eq.proteina');
  });
  it('deduplicates related recipes and restricts them to published site content', async () => {
    const transport = vi.fn().mockResolvedValue(response([{ recipe: { id: 'r' } }, { recipe: { id: 'r' } }], '0-1/2'));
    vi.stubGlobal('fetch', transport);
    expect(await catalogRepository.relatedRecipes('p')).toEqual([{ id: 'r' }]);
    const params = new URL(transport.mock.calls[0][0]).searchParams;
    expect(params.get('recipe.scope')).toBe('eq.site');
    expect(params.get('recipe.status')).toBe('eq.published');
    expect(params.get('select')).toContain('!inner');
  });
  it('reports HTTP failures and stops timed-out requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(readCatalog('products', {})).rejects.toThrow('Não foi possível');
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
      )
    );
    const result = expect(readCatalog('products', {})).rejects.toThrow('demorou');
    await vi.advanceTimersByTimeAsync(15000);
    await result;
  });
  it('propagates caller cancellation without mislabeling it as timeout', async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
      )
    );
    const result = expect(readCatalog('products', {}, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await result;
  });
  it('uses regular prices separately from conditional promos and never turns missing prices into zero', () => {
    expect(productPricing({ regular_price_cents: 2000, price_cents: 1800, promo_price_cents: 1500, promo_min_quantity: 2 })).toMatchObject({
      regular: 2000,
      promo: 1500,
      minimum: 2
    });
    expect(productPricing({ price: 12.9, pricing_type: 'VARIABLE_WEIGHT', price_unit: 'KG' })).toMatchObject({ regular: 1290, unit: 'kg' });
    expect(productPricing({ price: null })).toMatchObject({ regular: null, promo: null });
    expect(productPricing({ price_cents: 2000, promo_price_cents: 2500, promo_min_quantity: 2 }).promo).toBeNull();
    expect(productPricing({ price_cents: 2000, promo_price_cents: 1500 }).promo).toBeNull();
    expect(productPricing({ price_cents: 2000, price_status: 'CURRENT', price_last_success_at: '2020-01-01' }).needsConfirmation).toBe(
      true
    );
  });
  it('normalizes search and rejects unsafe asset and product URLs', () => {
    const products = [{ name: 'Filé de Frango', product_code: '0014', category_id: 'a', category: { name: 'Aves' } }];
    expect(filterProducts(products, { query: 'file frango', category: 'a' })).toHaveLength(1);
    expect(filterProducts(products, { query: '0014' })).toHaveLength(1);
    expect(filterProducts(products, { query: 'file', category: 'b' })).toHaveLength(0);
    expect(safeImage('javascript:alert(1)')).toBeNull();
    expect(swiftLink('https://swift.com.br.evil.test/produto')).toBeNull();
    expect(swiftLink('https://www.swift.com.br/produto')).toBe('https://www.swift.com.br/produto');
  });
});
