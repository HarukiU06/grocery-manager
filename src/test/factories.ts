import type { Ingredient, PantryItem, Recipe } from '../domain/types';

let seq = 0;

export function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  seq += 1;
  return {
    id: `ing-${seq}`,
    name: { ja: `食材${seq}`, en: `Ingredient ${seq}` },
    category: 'vegetable',
    isPreset: true,
    ...overrides,
  };
}

export function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  seq += 1;
  return {
    id: `recipe-${seq}`,
    name: { ja: `レシピ${seq}`, en: `Recipe ${seq}` },
    cuisine: 'japanese',
    category: 'main',
    baseServings: 2,
    timeMinutes: 20,
    ingredients: [],
    steps: { ja: ['手順1'], en: ['Step 1'] },
    isPreset: true,
    ...overrides,
  };
}

export function makePantryItem(ingredientId: string, overrides: Partial<PantryItem> = {}): PantryItem {
  return { ingredientId, addedOn: '2026-09-18', ...overrides };
}
