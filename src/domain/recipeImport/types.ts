import type { Unit } from '../types';

export interface ParsedIngredientLine {
  /** The line exactly as it appeared, used as a stable key while the user reviews it. */
  raw: string;
  /** The ingredient name as written on the page. */
  name: string;
  ingredientId?: string;
  amount?: number;
  unit?: Unit;
}

export interface ParsedRecipe {
  name?: string;
  servings?: number;
  ingredients: ParsedIngredientLine[];
  steps: string[];
}
