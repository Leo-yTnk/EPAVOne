import { createSwiftWorkbookFixture } from './fixtures/swiftWorkbook.js';
import { expect, it } from 'vitest';
import { parseCatalogWorkbook } from '../src/products/insights/creation/admin/importParser.js';
import { readCatalogFile } from '../src/products/insights/creation/admin/workbookService.js';
import { reviewCatalogImport, swiftIdentity } from '../src/products/insights/creation/admin/importReview.js';
import { prepareSwiftBundle } from '../src/products/insights/creation/admin/swiftBundleService.js';
it('accepts the synthetic official eleven-product workbook and header-only sheets', async () => {
  const bytes = await createSwiftWorkbookFixture();
  const workbook = await readCatalogFile({
    name: 'Produtos_Swift_Adicionar_Yourcipe.xlsx',
    size: bytes.length,
    arrayBuffer: async () => bytes
  });
  const payload = parseCatalogWorkbook(workbook);
  expect(payload.errors).toEqual([]);
  expect(payload.products).toHaveLength(11);
  expect(payload.categories).toHaveLength(4);
  for (const key of ['recipes', 'sections', 'recipeSections', 'productSections']) expect(payload[key]).toEqual([]);
  for (const row of payload.products) expect(new URL(row.image_url).hostname).toBe('swiftbr.vteximg.com.br');
  const review = reviewCatalogImport(payload, {
    products: payload.products.map((item, i) => ({ ...item, id: i, active: false })),
    categories: payload.categories.map((item) => ({ ...item, active: false }))
  });
  expect(review.totals).toEqual({ new: 0, ignored: 15, conflict: 0 });
});
it('stops same-name different URLs and split identity matches including inactive records', () => {
  const payload = prepareSwiftBundle({});
  const product = payload.products[0];
  const context = {
    products: [
      { ...product, id: 'one', active: false, swift_product_url: 'https://www.swift.com.br/different' },
      { ...product, id: 'two', name: 'Different name' }
    ]
  };
  const review = reviewCatalogImport(payload, context);
  expect(review.groups.products[0].status).toBe('conflict');
  expect(review.errors[0]).toMatch(/Produtos, linha 2/);
});
it('treats tracking and legacy URL variants as one identity and preserves editorial differences', () => {
  const payload = prepareSwiftBundle({});
  const row = payload.products[0];
  const item = {
    ...row,
    swift_product_url: row.swift_product_url.replace('/detail/', '/') + '/p?utm_source=test',
    image_url: 'https://example.com/editorial.jpg'
  };
  const review = reviewCatalogImport(payload, { products: [item] });
  expect(review.groups.products[0].status).toBe('ignored');
  expect(review.groups.products[0].differences).toContain('image_url');
  expect(swiftIdentity(item.swift_product_url)).toBe(swiftIdentity(row.swift_product_url));
});
