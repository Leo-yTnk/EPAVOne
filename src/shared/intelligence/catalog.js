import { canonicalName } from '../services/sales.js';
import { validDate } from './priority.js';
// Deliberately conservative taxonomy aliases, not guesses from free-text notes.
const aliases = {
  aves: ['aves', 'frango', 'frangos'],
  bovinos: ['bovinos', 'carne bovina'],
  suínos: ['suinos', 'carne suina'],
  pescados: ['pescados', 'peixes', 'peixes e frutos do mar'],
  padaria: ['padaria', 'paes'],
  sobremesas: ['sobremesas', 'doces'],
  complementos: ['complementos', 'acompanhamentos', 'vegetais'],
  feijão: ['feijao']
};
export function commercialCategory(name) {
  const key = canonicalName(name);
  return Object.keys(aliases).find((id) => aliases[id].includes(key)) || null;
}
const collator = new Intl.Collator('pt-BR');
const stable = (a, b) => collator.compare(a.name, b.name) || collator.compare(String(a.id), String(b.id));
const evidenceKey = (name, code) => {
  const normalized = String(code ?? '')
    .trim()
    .replace(/^0+/, '');
  return normalized && !/^YPR[-_]/i.test(normalized) ? canonicalName(name) + '|' + normalized : null;
};
export function catalogIndex(catalog = {}, template, now) {
  const categories = new Map((catalog.categories || []).map((c) => [c.id, c.name]));
  const products = (catalog.products || [])
    .filter((p) => p.active !== false && p.scope !== 'personal' && p.available !== false && p.availability !== 'unavailable')
    .map((p) => ({ ...p, commercialCategory: commercialCategory(p.category?.name || categories.get(p.category_id)) }))
    .sort(stable);
  const byId = new Map(products.map((p) => [p.id, p]));
  const links = new Map();
  for (const link of catalog.links || []) {
    if (!links.has(link.recipe_id)) links.set(link.recipe_id, []);
    links.get(link.recipe_id).push(link.product_id);
  }
  const recipes = (catalog.recipes || []).filter((r) => r.scope !== 'personal' && (!r.status || r.status === 'published')).sort(stable);
  // Exact code + exact normalized presentation only. Approximate matches remain Writer's job.
  const current =
    template &&
    validDate(template.period?.start) &&
    validDate(template.period?.end) &&
    template.period.start <= now &&
    template.period.end >= now;
  const weekly = new Set(
    current
      ? template.products
          .filter((p) => Number.isFinite(p.price) && p.price > 0)
          .map((p) => evidenceKey(p.name, p.code))
          .filter(Boolean)
      : []
  );
  const suggestions = products
    .filter((p) => p.commercialCategory)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.commercialCategory,
      product: p,
      reason: `Preferência cadastrada: ${p.commercialCategory}.`,
      availability: weekly.has(evidenceKey(p.name, p.product_code))
        ? 'Consta no Excel vigente com preço válido · estoque a confirmar'
        : 'Disponibilidade desconhecida · conferir no Writer'
    }));
  const recipeCandidates = recipes.flatMap((recipe) => {
    const ids = links.get(recipe.id);
    if (!ids?.length) return [];
    const ingredients = ids.map((id) => byId.get(id));
    if (ingredients.some((p) => !p?.commercialCategory)) return [];
    return [{ recipe, ingredients, categories: [...new Set(ingredients.map((p) => p.commercialCategory))] }];
  });
  return {
    suggestions,
    recipeCandidates,
    products,
    byId,
    links,
    recipes,
    weekly,
    current: Boolean(current),
    filename: template?.filename,
    incompleteRecipes: catalog.incompleteRecipes
  };
}
export function matchCustomerCatalog(customer, index) {
  const preferences = new Set(customer.preferences || []),
    restrictions = new Set(customer.restrictions || []);
  const products = index.suggestions.filter((p) => !restrictions.has(p.category) && preferences.has(p.category));
  const recipes = [];
  for (const { recipe, ingredients, categories } of index.recipeCandidates) {
    if (categories.some((c) => restrictions.has(c)) || !categories.some((c) => preferences.has(c))) continue;
    if ((recipe.extras || []).length && restrictions.size) continue;
    recipes.push({
      id: recipe.id,
      name: recipe.name,
      recipe,
      products: ingredients,
      reason: `Ingrediente alinhado a ${categories.filter((c) => preferences.has(c)).join(', ')}. Categorias dos produtos vinculados conferidas.`,
      limitation: 'Compatibilidade comercial; confirme composição, extras, alergênicos e disponibilidade.'
    });
  }
  return { products, recipes, incompleteRecipes: index.incompleteRecipes };
}
function matchProfile(customer, index, profiles) {
  const key = JSON.stringify([[...(customer.preferences || [])].sort(), [...(customer.restrictions || [])].sort()]);
  if (!profiles.has(key)) profiles.set(key, matchCustomerCatalog(customer, index));
  return profiles.get(key);
}
export function matchAllCustomers(customers, index) {
  const profiles = new Map(),
    result = new Map();
  for (const c of customers) result.set(c.id, matchProfile(c, index, profiles));
  return result;
}
export async function matchCustomersInChunks(
  customers,
  index,
  { cancelled = () => false, yieldTask = () => new Promise((r) => setTimeout(r, 0)), clock = () => performance.now(), budgetMs = 6 } = {}
) {
  const profiles = new Map(),
    result = new Map();
  let start = clock();
  for (const customer of customers) {
    if (cancelled()) return null;
    result.set(customer.id, matchProfile(customer, index, profiles));
    if (clock() - start >= budgetMs) {
      await yieldTask();
      start = clock();
    }
  }
  return cancelled() ? null : result;
}
// A complement is eligible only through a real shared recipe, never just to increase IPC.
export function recipeComplements(matches, selectedIds) {
  const selected = new Set(selectedIds);
  if (!selected.size) return [];
  const seen = new Set(),
    results = [];
  for (const recipe of matches.recipes) {
    if (!recipe.products.some((p) => selected.has(p.id))) continue;
    for (const product of recipe.products) {
      if (selected.has(product.id) || seen.has(product.id)) continue;
      seen.add(product.id);
      results.push({
        product,
        recipe: recipe.recipe,
        reason: `Ingrediente de ${recipe.name}, que também usa um produto selecionado. Confira a receita antes de complementar.`
      });
    }
  }
  return results;
}
