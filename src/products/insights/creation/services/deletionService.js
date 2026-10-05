import * as api from '../repositories/creationRepository.js';
import { creationService, result } from './creationService.js';
export async function deletionContext(type, item) {
  const impact = await creationService.impact(type, item.id);
  if (type === 'recipes') return { impact, groups: {}, vocabulary: { categories: [], products: [] } };
  const vocabulary = await creationService.vocabulary(item.scope || 'personal');
  const groups =
    type === 'products'
      ? { ingredients: await result(api.fetchIngredientRowsForProduct(item.id)) }
      : Object.fromEntries(
          await Promise.all(
            [
              ['products', 'fetchProductRowsForCategory'],
              ['recipes', 'fetchRecipeRowsForCategory'],
              ['sections', 'fetchSectionRowsForCategory'],
              ['product_sections', 'fetchProductSectionRowsForCategory']
            ].map(async ([key, method]) => [key, await result(api[method](item.id))])
          )
        );
  return { impact, groups, vocabulary };
}
export function deleteResolution(type, groups, choices) {
  const output = {};
  for (const [group, rows] of Object.entries(groups))
    output[group] = rows.map((row, index) => {
      const target = choices[`${group}:${index}`];
      if (!target) throw new Error('Resolva todas as referências antes de excluir.');
      const id =
        group === 'sections'
          ? { recipe_id: row.recipe_id }
          : group === 'product_sections'
            ? { product_id: row.product_id }
            : { id: row.id };
      const optional = ['ingredients', 'sections', 'product_sections'].includes(group);
      if (target === 'remove' && optional) return { ...id, action: 'remove' };
      if (target === 'remove') throw new Error('Escolha uma categoria substituta.');
      return {
        ...id,
        ...(optional ? { action: 'replace' } : {}),
        [type === 'products' ? 'replacement_product_id' : 'replacement_category_id']: target
      };
    });
  return output;
}
