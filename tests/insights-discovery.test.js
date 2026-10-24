import { expect, it } from 'vitest';
import { discoverySections } from '../src/products/insights/models/discovery.js';
import { browseCatalogGroups } from '../src/products/insights/models/sections.js';
const recipes = [
  { id: 'slow', name: 'Assado', prep_time: 60, category_id: 'beef', category: { name: 'Bovinas' } },
  { id: 'quick', name: 'Frango', prep_time: 20, category_id: 'poultry', category: { name: 'Aves' } }
];
const products = [
  {
    id: 'p',
    name: 'Frango Swift',
    category_id: 'poultry',
    category: { name: 'Aves' },
    regular_price_cents: 2000,
    promo_price_cents: 1800,
    promo_min_quantity: 2
  }
];
it('builds shelves from actual preparation times, prices and categories', () => {
  const groups = discoverySections({ recipes, products });
  expect(groups.find((group) => group.id === 'quick-recipes').items.map((item) => item.id)).toEqual(['quick']);
  expect(groups.find((group) => group.id === 'quantity-prices').items[0].id).toBe('p');
  expect(groups.some((group) => group.name === 'Bovinas')).toBe(true);
  expect(
    new Set(
      groups.map((group) =>
        group.items
          .map((item) => `${item.catalogKind}:${item.id}`)
          .sort()
          .join('|')
      )
    ).size
  ).toBe(groups.length);
});
it('preserves mixed configured Home sections and filters only the current search', () => {
  const structure = {
    pages: [{ id: 'home', key: 'home' }],
    sections: [{ id: 'custom', page_id: 'home', name: 'Escolhas da turma', sort_order: 1 }],
    recipes: [{ section_id: 'custom', recipe_id: 'slow', sort_order: 1 }],
    products: [{ section_id: 'custom', product_id: 'p', sort_order: 1 }]
  };
  expect(discoverySections({ recipes, products, structure })[0].items.map((item) => item.catalogKind)).toEqual(['recipes', 'products']);
  expect(discoverySections({ recipes, products, structure, query: 'frango' }).map((group) => group.items.map((item) => item.id))).toEqual([
    ['quick'],
    ['p']
  ]);
  expect(discoverySections({ recipes, products, query: 'inexistente' })).toEqual([]);
});
it('keeps every unassigned item accessible under its actual category', () => {
  const groups = browseCatalogGroups([...recipes, { id: 'unknown', name: 'Sem categoria' }], null, 'recipes', 'recipes');
  expect(groups.map((group) => group.name)).toEqual(['Bovinas', 'Aves', 'Mais receitas']);
  expect(groups.flatMap((group) => group.items).map((item) => item.id)).toEqual(['slow', 'quick', 'unknown']);
});
