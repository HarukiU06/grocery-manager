import type { Cuisine, LocalizedText, Recipe, RecipeCategory, RecipeIngredient, Unit } from '../../domain/types';
import type { RecipeInput } from '../../store/useAppStore';

export interface DraftIngredient {
  ingredientId: string;
  amount: string;
  unit: Unit | '';
  optional: boolean;
}

export interface RecipeDraft {
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
  cuisine: Cuisine;
  category: RecipeCategory;
  baseServings: string;
  timeMinutes: string;
  ingredients: DraftIngredient[];
  stepsJa: string;
  stepsEn: string;
}

export type RecipeDraftError = 'name' | 'ingredients' | 'steps' | 'servings';

export function emptyDraft(): RecipeDraft {
  return {
    nameJa: '',
    nameEn: '',
    descriptionJa: '',
    descriptionEn: '',
    cuisine: 'japanese',
    category: 'main',
    baseServings: '2',
    timeMinutes: '',
    ingredients: [],
    stepsJa: '',
    stepsEn: '',
  };
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    nameJa: recipe.name.ja ?? '',
    nameEn: recipe.name.en ?? '',
    descriptionJa: recipe.description?.ja ?? '',
    descriptionEn: recipe.description?.en ?? '',
    cuisine: recipe.cuisine,
    category: recipe.category,
    baseServings: String(recipe.baseServings),
    timeMinutes: recipe.timeMinutes === undefined ? '' : String(recipe.timeMinutes),
    ingredients: recipe.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      amount: ri.amount === undefined ? '' : String(ri.amount),
      unit: ri.unit ?? '',
      optional: ri.optional ?? false,
    })),
    stepsJa: (recipe.steps.ja ?? []).join('\n'),
    stepsEn: (recipe.steps.en ?? []).join('\n'),
  };
}

function localized(ja: string, en: string): LocalizedText | undefined {
  const j = ja.trim();
  const e = en.trim();
  if (!j && !e) return undefined;
  return { ...(j ? { ja: j } : {}), ...(e ? { en: e } : {}) };
}

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function recipeFromDraft(draft: RecipeDraft): { recipe: RecipeInput } | { errors: RecipeDraftError[] } {
  const errors: RecipeDraftError[] = [];
  const name = localized(draft.nameJa, draft.nameEn);
  if (!name) errors.push('name');
  if (draft.ingredients.length === 0) errors.push('ingredients');
  const stepsJa = lines(draft.stepsJa);
  const stepsEn = lines(draft.stepsEn);
  if (stepsJa.length === 0 && stepsEn.length === 0) errors.push('steps');
  const baseServings = Number(draft.baseServings);
  if (!Number.isFinite(baseServings) || baseServings < 1) errors.push('servings');
  if (errors.length > 0 || !name) return { errors };

  const timeMinutes = Number(draft.timeMinutes);
  const description = localized(draft.descriptionJa, draft.descriptionEn);
  const ingredients: RecipeIngredient[] = draft.ingredients.map((di) => {
    const amount = Number(di.amount);
    return {
      ingredientId: di.ingredientId,
      ...(di.amount.trim() && Number.isFinite(amount) && amount > 0 ? { amount } : {}),
      ...(di.unit ? { unit: di.unit } : {}),
      ...(di.optional ? { optional: true } : {}),
    };
  });
  return {
    recipe: {
      name,
      ...(description ? { description } : {}),
      cuisine: draft.cuisine,
      category: draft.category,
      baseServings: Math.round(baseServings),
      ...(draft.timeMinutes.trim() && Number.isFinite(timeMinutes) && timeMinutes > 0
        ? { timeMinutes: Math.round(timeMinutes) }
        : {}),
      ingredients,
      steps: { ...(stepsJa.length ? { ja: stepsJa } : {}), ...(stepsEn.length ? { en: stepsEn } : {}) },
    },
  };
}
