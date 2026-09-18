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

export interface Quantity {
  amount: number;
  unit: Unit;
}

export interface PantryItem {
  ingredientId: string;
  quantity?: Quantity;
  note?: string;
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

export type AmountDisplay = 'recipe' | 'grams';
export type NutritionTargetKey = 'off' | 'adult_male' | 'adult_female';

export const NUTRIENT_KEYS = [
  'energy',
  'protein',
  'fat',
  'carbs',
  'fiber',
  'salt',
  'calcium',
  'iron',
  'potassium',
  'vitaminA',
  'vitaminB1',
  'vitaminB2',
  'vitaminC',
  'vitaminD',
] as const;
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutritionTotals = Record<NutrientKey, number>;

export interface CookEntry {
  id: string;
  recipeId: string;
  recipeName: LocalizedText;
  servings: number;
  cookedOn: string;
  nutrition?: NutritionTotals;
}

export const CURRENT_SCHEMA_VERSION = 2;

export interface PersistedState {
  schemaVersion: number;
  language: Lang;
  servings: number;
  almostThreshold: number;
  trackExpiry: boolean;
  amountDisplay: AmountDisplay;
  nutritionTarget: NutritionTargetKey;
  customIngredients: Ingredient[];
  pantry: PantryItem[];
  customRecipes: Recipe[];
  shoppingList: ShoppingItem[];
  cookingLog: CookEntry[];
}
