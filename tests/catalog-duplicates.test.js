import { expect, it } from 'vitest';
import { findCatalogDuplicates, importReplacementChoices } from '../src/products/insights/creation/admin/catalogDuplicates.js';
it('groups connected product identities once and distinguishes category types and section pages', () => {
  const groups = findCatalogDuplicates({
    products: [
      { id: 'a', name: 'Filé', swift_product_url: 'https://www.swift.com.br/detail/file' },
      { id: 'b', name: 'FILE', swift_sku: '77' },
      { id: 'c', name: 'Outra apresentação', swift_sku: '77' }
    ],
    categories: [
      { id: 'd', name: 'Familia', type: 'receita' },
      { id: 'e', name: 'Família', type: 'proteina' }
    ],
    structure: {
      sections: [
        { id: 's', name: 'Destaques', page_id: 'home' },
        { id: 't', name: 'Destaques', page_id: 'products' }
      ]
    }
  });
  expect(groups).toHaveLength(1);
  expect(groups[0].items.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  expect(groups[0].reasons).toEqual(['Nome normalizado', 'SKU Swift']);
});
it('requires a unique duplicate for an explicit replacement and defaults to no replacements', () => {
  const review = { groups: { products: [{ status: 'ignored', existing: { id: 'a', version: 3 } }] } };
  expect(importReplacementChoices(review, {})).toEqual([]);
  expect(importReplacementChoices(review, { 'products:0': 'imported' })).toEqual([{ entity: 'products', index: 0, id: 'a', version: 3 }]);
  expect(() => importReplacementChoices({ groups: { products: [{ status: 'conflict' }] } }, { 'products:0': 'imported' })).toThrow();
});
