import { personalRecipesRepository } from '../repositories/personalRecipesRepository.js';

export const personalRecipesService = {
  recipes: (ownerId, options) => personalRecipesRepository.recipes(ownerId, options),
  ingredients: (recipe, options) => personalRecipesRepository.ingredients(recipe, options)
};
