import { browseCatalogGroups, catalogGroups } from './sections.js';
import { filterRecipes, recipeSuggestions } from './recipes.js';
import { filterProducts, productPricing } from './catalog.js';

const tagged = (items, catalogKind) => items.map((item) => ({ ...item, catalogKind }));
export function discoverySections({ recipes = [], products = [], structure, query = '' }) {
  const foundRecipes = filterRecipes(recipes, { query });
  const foundProducts = filterProducts(products, { query });
  if (query.trim())
    return [
      { id: 'search-recipes', name: 'Receitas encontradas', items: tagged(foundRecipes, 'recipes') },
      { id: 'search-products', name: 'Produtos encontrados', items: tagged(foundProducts, 'products') }
    ].filter((group) => group.items.length);

  const configured = new Map();
  for (const [kind, records] of [
    ['recipes', recipes],
    ['products', products]
  ]) {
    for (const group of catalogGroups(records, structure, 'home', kind)) {
      if (group.id === 'other') continue;
      const existing = configured.get(group.id);
      configured.set(group.id, { ...group, items: [...(existing?.items || []), ...tagged(group.items, kind)] });
    }
  }
  const sections = structure?.sections || [];
  const configuredGroups = [...configured.values()].sort(
    (a, b) => sections.findIndex((item) => item.id === a.id) - sections.findIndex((item) => item.id === b.id)
  );
  const shelves = [
    ...configuredGroups,
    { id: 'inspiration', name: 'Ideias para hoje', items: tagged(recipeSuggestions(recipes, 8), 'recipes') },
    { id: 'quick-recipes', name: 'Prontas em até 30 minutos', items: tagged(filterRecipes(recipes, { quick: true }), 'recipes') },
    {
      id: 'quantity-prices',
      name: 'Preço por quantidade',
      items: tagged(
        products.filter((item) => productPricing(item).promo),
        'products'
      )
    },
    ...browseCatalogGroups(products, structure, 'products', 'products')
      .slice(0, 3)
      .map((group) => ({ ...group, id: `home-${group.id}`, items: tagged(group.items, 'products') })),
    ...browseCatalogGroups(recipes, structure, 'recipes', 'recipes')
      .slice(0, 3)
      .map((group) => ({ ...group, id: `home-${group.id}`, items: tagged(group.items, 'recipes') }))
  ];
  // Don't repeat an identical shelf under a second heading.
  const seen = new Set();
  return shelves.filter((group) => {
    if (!group.items.length) return false;
    const signature = group.items
      .map((item) => `${item.catalogKind}:${item.id}`)
      .sort()
      .join('|');
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}
