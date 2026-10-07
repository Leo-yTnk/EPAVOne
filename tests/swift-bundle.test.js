import { describe, expect, it } from 'vitest';
import { prepareSwiftBundle } from '../src/products/insights/creation/admin/swiftBundleService.js';
import { swiftOfficialProducts } from '../src/products/insights/creation/admin/swiftOfficialProducts.js';
describe('official Swift additive import', () => {
  it('validates all products, requires official images, and leaves prices unconfirmed', () => {
    const payload = prepareSwiftBundle({});
    expect(payload.errors).toEqual([]);
    expect(payload.products).toHaveLength(11);
    for (const item of payload.products) {
      expect(new URL(item.image_url).hostname).toBe('swiftbr.vteximg.com.br');
      expect(item.swift_product_url).toMatch(/^https:\/\/www.swift.com.br\/detail\//);
      expect(item.price).toBeNull();
      expect(item.swift_sku).toBeNull();
    }
  });
  it('skips duplicates by official URL even when names differ or rows are inactive', () => {
    const products = swiftOfficialProducts.map((item) => ({
      name: 'Existing title',
      swift_product_url: item.swift_url.replace('/detail/', '/') + '/p',
      active: false
    }));
    expect(prepareSwiftBundle({ products }).products).toEqual([]);
    expect(prepareSwiftBundle({ products }).skipped).toBe(11);
  });
});
