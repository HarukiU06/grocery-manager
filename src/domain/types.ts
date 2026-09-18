export type Lang = 'ja' | 'en';

/** Text that may exist in one or both languages. Presets always provide both. */
export interface LocalizedText {
  ja?: string;
  en?: string;
}

export type IngredientCategory =
  | 'vegetable'
  | 'fruit'
  | 'mushroom'
  | 'meat'
  | 'seafood'
  | 'egg_dairy'
  | 'tofu_soy'
  | 'grain_noodle_bread'
  | 'seasoning'
  | 'oil_fat'
  | 'canned_dry'
  | 'frozen'
  | 'other';

export const INGREDIENT_CATEGORIES: readonly IngredientCategory[] = [
  'vegetable',
  'fruit',
  'mushroom',
  'meat',
  'seafood',
  'egg_dairy',
  'tofu_soy',
  'grain_noodle_bread',
  'seasoning',
  'oil_fat',
  'canned_dry',
  'frozen',
  'other',
];

export interface Ingredient {
  id: string;
  name: LocalizedText;
  category: IngredientCategory;
  aliases?: string[];
  isPreset: boolean;
}

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';
export const STORAGE_LOCATIONS: readonly StorageLocation[] = ['fridge', 'freezer', 'pantry'];

export interface PantryItem {
  ingredientId: string;
  quantity?: string;
  expiresOn?: string;
  location?: StorageLocation;
  addedOn: string;
}

export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'pcs'
  | 'tbsp'
  | 'tsp'
  | 'cup'
  | 'clove'
  | 'slice'
  | 'bunch'
  | 'sheet'
  | 'can'
  | 'pack'
  | 'stalk'
  | 'pinch';

export const UNITS: readonly Unit[] = [
  'g',
  'kg',
  'ml',
  'l',
  'pcs',
  'tbsp',
  'tsp',
  'cup',
  'clove',
  'slice',
  'bunch',
  'sheet',
  'can',
  'pack',
  'stalk',
  'pinch',
];

export interface RecipeIngredient {
  ingredientId: string;
  amount?: number;
  unit?: Unit;
  note?: LocalizedText;
  optional?: boolean;
}

export type Cuisine = 'japanese' | 'western' | 'chinese' | 'other';
export const CUISINES: readonly Cuisine[] = ['japanese', 'western', 'chinese', 'other'];

export type RecipeCategory = 'main' | 'side' | 'soup' | 'rice' | 'noodle' | 'salad' | 'dessert';
export const RECIPE_CATEGORIES: readonly RecipeCategory[] = [
  'main',
  'side',
  'soup',
  'rice',
  'noodle',
  'salad',
  'dessert',
];

export interface RecipeSteps {
  ja?: string[];
  en?: string[];
}

export interface Recipe {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  cuisine: Cuisine;
  category: RecipeCategory;
  baseServings: number;
  timeMinutes?: number;
  ingredients: RecipeIngredient[];
  steps: RecipeSteps;
  isPreset: boolean;
}

export interface ShoppingItem {
  ingredientId: string;
  addedOn: string;
}

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  language: Lang;
  servings: number;
  almostThreshold: number;
  customIngredients: Ingredient[];
  pantry: PantryItem[];
  customRecipes: Recipe[];
  shoppingList: ShoppingItem[];
}
