import { catalogRepository } from '../repositories/catalogRepository.js';

export const catalogService = {
  async loadCatalog(options) {
    const [products, categories] = await Promise.all([catalogRepository.products(options), catalogRepository.categories(options)]);
    return { products, categories };
  },
  recipes: (_id, options) => catalogRepository.recipes(options),
  async loadHome(_id, options) {
    const [catalog, recipes] = await Promise.all([catalogService.loadCatalog(options), catalogRepository.recipes(options)]);
    return { ...catalog, recipes };
  },
  relatedRecipes: (id, options) => catalogRepository.relatedRecipes(id, options),
  recipeIngredients: (id, options) => catalogRepository.recipeIngredients(id, options)
};
