import { expiryStatus } from './dates';
import type { PantryItem, Recipe } from './types';

export type RecipeStatus = 'ready' | 'almost' | 'far';

export interface RecipeMatch {
  recipe: Recipe;
  status: RecipeStatus;
  missingRequired: string[];
  missingOptional: string[];
  usesExpiring: string[];
}

export interface BuyToUnlock {
  ingredientId: string;
  unlocks: Recipe[];
  helps: Recipe[];
}

export interface SuggestionOptions {
  almostThreshold: number;
  today: string;
  /** When false, expiring pantry items never influence the result. */
  considerExpiry?: boolean;
}

export interface Suggestions {
  ready: RecipeMatch[];
  almost: RecipeMatch[];
  buyToUnlock: BuyToUnlock[];
}

export function indexPantry(pantry: PantryItem[]): Map<string, PantryItem> {
  return new Map(pantry.map((item) => [item.ingredientId, item]));
}

export function evaluateRecipe(
  recipe: Recipe,
  pantry: PantryItem[] | Map<string, PantryItem>,
  options: SuggestionOptions,
): RecipeMatch {
  const index = pantry instanceof Map ? pantry : indexPantry(pantry);
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const usesExpiring: string[] = [];
  for (const ri of recipe.ingredients) {
    const item = index.get(ri.ingredientId);
    if (!item) {
      (ri.optional ? missingOptional : missingRequired).push(ri.ingredientId);
      continue;
    }
    if (options.considerExpiry !== false && expiryStatus(item.expiresOn, options.today) !== 'ok') {
      usesExpiring.push(ri.ingredientId);
    }
  }
  const status: RecipeStatus =
    missingRequired.length === 0 ? 'ready' : missingRequired.length <= options.almostThreshold ? 'almost' : 'far';
  return { recipe, status, missingRequired, missingOptional, usesExpiring };
}

function nameKey(recipe: Recipe): string {
  return (recipe.name.en ?? recipe.name.ja ?? '').toLowerCase();
}

/** `Infinity - Infinity` is NaN (falsy), so two recipes without a time fall through to the name. */
function compareReady(a: RecipeMatch, b: RecipeMatch): number {
  return (
    b.usesExpiring.length - a.usesExpiring.length ||
    (a.recipe.timeMinutes ?? Infinity) - (b.recipe.timeMinutes ?? Infinity) ||
    nameKey(a.recipe).localeCompare(nameKey(b.recipe))
  );
}

function compareAlmost(a: RecipeMatch, b: RecipeMatch): number {
  return (
    a.missingRequired.length - b.missingRequired.length ||
    b.usesExpiring.length - a.usesExpiring.length ||
    nameKey(a.recipe).localeCompare(nameKey(b.recipe))
  );
}

export function buildSuggestions(recipes: Recipe[], pantry: PantryItem[], options: SuggestionOptions): Suggestions {
  const index = indexPantry(pantry);
  const ready: RecipeMatch[] = [];
  const almost: RecipeMatch[] = [];
  for (const recipe of recipes) {
    const match = evaluateRecipe(recipe, index, options);
    if (match.status === 'ready') ready.push(match);
    else if (match.status === 'almost') almost.push(match);
  }
  ready.sort(compareReady);
  almost.sort(compareAlmost);

  const byIngredient = new Map<string, BuyToUnlock>();
  for (const match of almost) {
    for (const ingredientId of match.missingRequired) {
      const entry = byIngredient.get(ingredientId) ?? { ingredientId, unlocks: [], helps: [] };
      (match.missingRequired.length === 1 ? entry.unlocks : entry.helps).push(match.recipe);
      byIngredient.set(ingredientId, entry);
    }
  }
  const buyToUnlock = [...byIngredient.values()].sort(
    (a, b) =>
      b.unlocks.length - a.unlocks.length ||
      b.helps.length - a.helps.length ||
      a.ingredientId.localeCompare(b.ingredientId),
  );
  return { ready, almost, buyToUnlock };
}
