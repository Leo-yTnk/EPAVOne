import { commercialCatalog } from '../../../shared/services/commercialCatalog.js';
import { catalogRepository } from '../repositories/catalogRepository.js';

export const catalogService = {
  structure: (_id, options) => catalogRepository.structure(options),
  loadCatalog: commercialCatalog.loadCatalog,
  recipes: commercialCatalog.recipes,
  loadHome: commercialCatalog.loadHome,
  relatedRecipes: (id, options) => catalogRepository.relatedRecipes(id, options),
  recipeIngredients: (id, options) => catalogRepository.recipeIngredients(id, options)
};

// These four resources contain only anonymous public catalog data.
for (const name of ['structure', 'loadCatalog', 'recipes', 'loadHome']) catalogService[name].publicCatalog = true;
