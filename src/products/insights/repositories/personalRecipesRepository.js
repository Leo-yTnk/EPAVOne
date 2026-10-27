import { authenticatedClient } from '../../../shared/services/accountService.js';

const FIELDS =
  'id,owner_id,scope,name,category_id,prep_time,servings,difficulty,image_url,instructions,tips,extras,category:categories!recipes_category_id_fkey(id,name)';

async function readPages(buildQuery, { signal } = {}) {
  const rows = [];
  for (;;) {
    const { data, error } = await buildQuery()
      .range(rows.length, rows.length + 199)
      .abortSignal(signal);
    if (error) throw new Error('Não foi possível carregar suas receitas. Tente novamente.');
    if (!Array.isArray(data)) throw new Error('A consulta de receitas retornou uma resposta inválida.');
    if (!data.length) return rows;
    rows.push(...data);
  }
}

export const personalRecipesRepository = {
  recipes(ownerId, options) {
    if (!ownerId) return Promise.resolve([]);
    return readPages(
      () => authenticatedClient.from('recipes').select(FIELDS).eq('scope', 'personal').eq('owner_id', ownerId).order('name').order('id'),
      options
    );
  },
  ingredients(recipe, options) {
    if (!recipe?.owner_id || recipe.scope !== 'personal') return Promise.resolve([]);
    return readPages(
      () =>
        authenticatedClient
          .from('recipe_ingredients')
          .select(
            'id,quantity,recipe:recipes!recipe_ingredients_recipe_id_fkey!inner(owner_id,scope),product:products!recipe_ingredients_product_id_fkey(id,product_code,name,unit,image_url,scope)'
          )
          .eq('recipe_id', recipe.id)
          .eq('recipe.scope', 'personal')
          .eq('recipe.owner_id', recipe.owner_id)
          .order('sort_order')
          .order('id'),
      options
    );
  }
};
