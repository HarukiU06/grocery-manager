import type { Recipe } from './types';

/** A recipe passes the filter when it lists every selected ingredient, optional ones included. */
export function recipeUsesAll(recipe: Recipe, ids: string[]): boolean {
  if (ids.length === 0) return true;
  const used = new Set(recipe.ingredients.map((ri) => ri.ingredientId));
  return ids.every((id) => used.has(id));
}
