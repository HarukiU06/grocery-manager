import { localize } from '../../domain/localize';
import {
  INGREDIENT_CATEGORIES,
  type Ingredient,
  type IngredientCategory,
  type Lang,
  type PantryItem,
} from '../../domain/types';

export interface PantryRow {
  item: PantryItem;
  ingredient: Ingredient | undefined;
}

export interface PantryGroupData {
  category: IngredientCategory;
  rows: PantryRow[];
}

export function groupPantryByCategory(
  pantry: PantryItem[],
  lookup: (id: string) => Ingredient | undefined,
  lang: Lang,
): PantryGroupData[] {
  const byCategory = new Map<IngredientCategory, PantryRow[]>();
  for (const item of pantry) {
    const ingredient = lookup(item.ingredientId);
    const category = ingredient?.category ?? 'other';
    const rows = byCategory.get(category) ?? [];
    rows.push({ item, ingredient });
    byCategory.set(category, rows);
  }
  const nameOf = (row: PantryRow) =>
    row.ingredient ? localize(row.ingredient.name, lang) : row.item.ingredientId;
  return INGREDIENT_CATEGORIES.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    rows: byCategory.get(category)!.sort((a, b) => nameOf(a).localeCompare(nameOf(b), lang)),
  }));
}
