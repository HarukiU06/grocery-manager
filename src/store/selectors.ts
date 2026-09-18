import { useCallback, useMemo } from 'react';
import { PRESET_INGREDIENTS } from '../data/ingredients';
import { PRESET_RECIPES } from '../data/recipes';
import { localize } from '../domain/localize';
import type { Ingredient, Recipe } from '../domain/types';
import { useAppStore } from './useAppStore';

export function useAllIngredients(): Ingredient[] {
  const custom = useAppStore((s) => s.customIngredients);
  return useMemo(() => [...PRESET_INGREDIENTS, ...custom], [custom]);
}

export function useIngredientLookup(): (id: string) => Ingredient | undefined {
  const all = useAllIngredients();
  return useMemo(() => {
    const byId = new Map(all.map((ingredient) => [ingredient.id, ingredient]));
    return (id: string) => byId.get(id);
  }, [all]);
}

/** Localized ingredient name; unknown IDs render as "?" so a bad import never crashes the UI. */
export function useIngredientName(): (id: string) => string {
  const lookup = useIngredientLookup();
  const lang = useAppStore((s) => s.language);
  return useCallback(
    (id: string) => {
      const ingredient = lookup(id);
      return ingredient ? localize(ingredient.name, lang) : '?';
    },
    [lookup, lang],
  );
}

export function useAllRecipes(): Recipe[] {
  const custom = useAppStore((s) => s.customRecipes);
  return useMemo(() => [...PRESET_RECIPES, ...custom], [custom]);
}

export function useRecipe(id: string | undefined): Recipe | undefined {
  const all = useAllRecipes();
  return useMemo(() => (id ? all.find((recipe) => recipe.id === id) : undefined), [all, id]);
}

export function usePantryIds(): Set<string> {
  const pantry = useAppStore((s) => s.pantry);
  return useMemo(() => new Set(pantry.map((item) => item.ingredientId)), [pantry]);
}
