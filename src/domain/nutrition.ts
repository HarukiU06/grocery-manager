import { NUTRITION, type NutritionRow } from '../data/nutrition';
import { scaleAmount } from './scaling';
import { NUTRIENT_KEYS, type NutrientKey, type NutritionTotals, type Recipe } from './types';
import { toGrams } from './units';

export const NUTRIENT_DIRECTION: Record<NutrientKey, 'at_least' | 'at_most' | 'neutral'> = {
  energy: 'neutral',
  protein: 'at_least',
  fat: 'neutral',
  carbs: 'neutral',
  fiber: 'at_least',
  salt: 'at_most',
  calcium: 'at_least',
  iron: 'at_least',
  potassium: 'at_least',
  vitaminA: 'at_least',
  vitaminB1: 'at_least',
  vitaminB2: 'at_least',
  vitaminC: 'at_least',
  vitaminD: 'at_least',
};

export const NUTRIENT_DISPLAY_UNIT: Record<NutrientKey, string> = {
  energy: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
  fiber: 'g',
  salt: 'g',
  calcium: 'mg',
  iron: 'mg',
  potassium: 'mg',
  vitaminA: 'µg',
  vitaminB1: 'mg',
  vitaminB2: 'mg',
  vitaminC: 'mg',
  vitaminD: 'µg',
};

export function emptyTotals(): NutritionTotals {
  return Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, 0])) as NutritionTotals;
}

/** Adds one ingredient's contribution; the row is per 100 g. */
export function addScaled(target: NutritionTotals, row: NutritionRow, grams: number): void {
  const factor = grams / 100;
  NUTRIENT_KEYS.forEach((key, index) => {
    target[key] += row[index] * factor;
  });
}

function round(totals: NutritionTotals): NutritionTotals {
  const out = emptyTotals();
  for (const key of NUTRIENT_KEYS) {
    out[key] = key === 'energy' ? Math.round(totals[key]) : Math.round(totals[key] * 10) / 10;
  }
  return out;
}

export interface RecipeNutrition {
  total: NutritionTotals;
  perServing: NutritionTotals;
  countedIngredientIds: string[];
  unknownIngredientIds: string[];
}

/**
 * Required ingredients with a known amount, conversion and nutrition row are counted.
 * Everything else is reported so the screen can say how much was left out.
 */
export function computeRecipeNutrition(recipe: Recipe, servings: number): RecipeNutrition {
  const raw = emptyTotals();
  const counted: string[] = [];
  const unknown: string[] = [];
  for (const ri of recipe.ingredients) {
    const row = NUTRITION[ri.ingredientId];
    const grams =
      ri.optional || ri.amount === undefined || !ri.unit
        ? null
        : toGrams(scaleAmount(ri.amount, recipe.baseServings, servings), ri.unit, ri.ingredientId);
    if (grams === null || !row) {
      unknown.push(ri.ingredientId);
      continue;
    }
    addScaled(raw, row, grams);
    counted.push(ri.ingredientId);
  }
  const perServingRaw = emptyTotals();
  for (const key of NUTRIENT_KEYS) perServingRaw[key] = raw[key] / Math.max(1, servings);
  return {
    total: round(raw),
    perServing: round(perServingRaw),
    countedIngredientIds: counted,
    unknownIngredientIds: unknown,
  };
}
