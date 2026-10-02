import { fold } from './catalog.js';

export function filterRecipes(recipes, { query = '', category = '', quick = false } = {}) {
  const words = fold(query).trim().split(/\s+/).filter(Boolean);
  return recipes.filter(
    (recipe) =>
      (!category || recipe.category_id === category) &&
      (!quick || (Number(recipe.prep_time) > 0 && Number(recipe.prep_time) <= 30)) &&
      words.every((word) => fold(`${recipe.name} ${recipe.category?.name || ''}`).includes(word))
  );
}

export function recipeSuggestions(recipes, limit = 4) {
  return [...recipes]
    .sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        (Number(a.prep_time) || Infinity) - (Number(b.prep_time) || Infinity) ||
        a.name.localeCompare(b.name, 'pt-BR')
    )
    .slice(0, limit);
}
