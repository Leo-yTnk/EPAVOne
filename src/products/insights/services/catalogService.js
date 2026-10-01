import { catalogRepository } from '../repositories/catalogRepository.js';

export const catalogService = {
  async loadCatalog(options) {
    const [products, categories] = await Promise.all([catalogRepository.products(options), catalogRepository.categories(options)]);
    return { products, categories };
  },
  relatedRecipes: (id, options) => catalogRepository.relatedRecipes(id, options),
  recipeIngredients: (id, options) => catalogRepository.recipeIngredients(id, options)
};
