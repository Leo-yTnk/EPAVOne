import { catalogRepository } from '../repositories/catalogRepository.js';
import { readSharedPublicResource } from './publicResourceCache.js';
// One loader identity is shared with Insights: no duplicate product/category/recipe reads.
export const commercialCatalog = {
  async loadCatalog(_id, options) {
    const [products, categories] = await Promise.all([catalogRepository.products(options), catalogRepository.categories(options)]);
    return { products, categories };
  },
  recipes: (_id, options) => catalogRepository.recipes(options),
  ingredientLinks: (_id, options) => catalogRepository.ingredientLinks(options),
  async loadHome() {
    const [catalog, recipes] = await Promise.all([
      readSharedPublicResource(commercialCatalog.loadCatalog, 'public'),
      readSharedPublicResource(commercialCatalog.recipes, 'published')
    ]);
    return { ...catalog, recipes };
  },
  async intelligence() {
    // Failed ingredient reads must not discard usable products.
    const [home, links] = await Promise.allSettled([
      commercialCatalog.loadHome(),
      readSharedPublicResource(commercialCatalog.ingredientLinks, 'published')
    ]);
    if (home.status === 'rejected') throw home.reason;
    return { ...home.value, links: links.status === 'fulfilled' ? links.value : [], incompleteRecipes: links.status === 'rejected' };
  }
};
for (const name of ['loadCatalog', 'recipes', 'ingredientLinks', 'loadHome']) commercialCatalog[name].publicCatalog = true;
