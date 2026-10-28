import { readSharedPublicResource } from './publicResourceCache.js';
import { catalogRepository } from '../repositories/catalogRepository.js';

export const catalogService = {
  structure: (_id, options) => catalogRepository.structure(options),
  async loadCatalog(_id, options) {
    const [products, categories] = await Promise.all([catalogRepository.products(options), catalogRepository.categories(options)]);
    return { products, categories };
  },
  recipes: (_id, options) => catalogRepository.recipes(options),
  async loadHome() {
    const [catalog, recipes] = await Promise.all([
      readSharedPublicResource(catalogService.loadCatalog, 'public'),
      readSharedPublicResource(catalogService.recipes, 'published')
    ]);
    return { ...catalog, recipes };
  },
  relatedRecipes: (id, options) => catalogRepository.relatedRecipes(id, options),
  recipeIngredients: (id, options) => catalogRepository.recipeIngredients(id, options)
};

// These four resources contain only anonymous public catalog data.
for (const name of ['structure', 'loadCatalog', 'recipes', 'loadHome']) catalogService[name].publicCatalog = true;
