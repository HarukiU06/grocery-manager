import type { Recipe, RecipeIngredient, Unit } from '../../domain/types';

export function ing(
  ingredientId: string,
  amount?: number,
  unit?: Unit,
  extra: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return {
    ingredientId,
    ...(amount !== undefined ? { amount } : {}),
    ...(unit ? { unit } : {}),
    ...extra,
  };
}

export function opt(ingredientId: string, amount?: number, unit?: Unit): RecipeIngredient {
  return ing(ingredientId, amount, unit, { optional: true });
}

/** No amount: the UI prints the note or "to taste". */
export function toTaste(ingredientId: string, optional = false): RecipeIngredient {
  return optional ? { ingredientId, optional: true } : { ingredientId };
}

/** Oil used for deep-frying: no fixed amount, but a note instead of "to taste". */
export function fryingOil(): RecipeIngredient {
  return { ingredientId: 'cooking-oil', note: { ja: '揚げ油', en: 'for deep-frying' } };
}

type PresetRecipeDef = Omit<Recipe, 'isPreset' | 'baseServings'> & { baseServings?: number };

export function recipe(def: PresetRecipeDef): Recipe {
  return { baseServings: 2, ...def, isPreset: true };
}
