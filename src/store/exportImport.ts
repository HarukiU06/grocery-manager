import { isValidIsoDate, todayIso } from '../domain/dates';
import {
  CUISINES,
  INGREDIENT_CATEGORIES,
  NUTRIENT_KEYS,
  RECIPE_CATEGORIES,
  STORAGE_LOCATIONS,
  UNITS,
  type CookEntry,
  type Ingredient,
  type LocalizedText,
  type NutritionTotals,
  type PantryItem,
  type PersistedState,
  type Quantity,
  type Recipe,
  type RecipeIngredient,
  type RecipeSteps,
  type ShoppingItem,
} from '../domain/types';
import { clamp, defaultPersistedState, migrate } from './migrations';

const LANGS = ['ja', 'en'];
const ARRAY_KEYS = ['customIngredients', 'pantry', 'customRecipes', 'shoppingList'] as const;
const AMOUNT_DISPLAYS = ['recipe', 'grams'] as const;
const NUTRITION_TARGETS = ['off', 'adult_male', 'adult_female'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return list.find((item) => item === value);
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isoDate(value: unknown): string | undefined {
  return typeof value === 'string' && isValidIsoDate(value) ? value : undefined;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

/** Keeps only string `ja` / `en` entries; undefined when neither is present. */
function localized(value: unknown): LocalizedText | undefined {
  if (!isRecord(value)) return undefined;
  const ja = text(value.ja);
  const en = text(value.en);
  if (ja === undefined && en === undefined) return undefined;
  return { ...(ja !== undefined ? { ja } : {}), ...(en !== undefined ? { en } : {}) };
}

/**
 * Optional fields are added only when present, so a clean backup round-trips unchanged.
 * Values of the wrong type are dropped rather than passed on to the UI.
 */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function sanitizeQuantity(value: unknown): Quantity | undefined {
  if (!isRecord(value)) return undefined;
  const amount = finite(value.amount);
  const unit = oneOf(UNITS, value.unit);
  return amount !== undefined && amount >= 0 && unit ? { amount, unit } : undefined;
}

function sanitizePantryItem(item: unknown): PantryItem {
  assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-pantry-item');
  return compact({
    ingredientId: item.ingredientId,
    quantity: sanitizeQuantity(item.quantity),
    note: text(item.note),
    expiresOn: isoDate(item.expiresOn),
    location: oneOf(STORAGE_LOCATIONS, item.location),
    addedOn: isoDate(item.addedOn) ?? todayIso(),
  });
}

function sanitizeShoppingItem(item: unknown): ShoppingItem {
  assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-shopping-item');
  return { ingredientId: item.ingredientId, addedOn: isoDate(item.addedOn) ?? todayIso() };
}

function sanitizeIngredient(item: unknown): Ingredient {
  assert(isRecord(item) && typeof item.id === 'string' && typeof item.category === 'string', 'invalid-ingredient');
  const name = localized(item.name);
  assert(name, 'invalid-ingredient');
  const aliases = strings(item.aliases);
  return compact({
    id: item.id,
    name,
    category: oneOf(INGREDIENT_CATEGORIES, item.category) ?? 'other',
    aliases: aliases.length > 0 ? aliases : undefined,
    isPreset: false,
  });
}

function sanitizeRecipeIngredient(item: unknown): RecipeIngredient {
  assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-recipe');
  const amount = finite(item.amount);
  return compact({
    ingredientId: item.ingredientId,
    amount: amount !== undefined && amount >= 0 ? amount : undefined,
    unit: oneOf(UNITS, item.unit),
    note: localized(item.note),
    optional: typeof item.optional === 'boolean' ? item.optional : undefined,
  });
}

function sanitizeSteps(value: unknown): RecipeSteps {
  if (!isRecord(value)) return {};
  return compact({
    ja: Array.isArray(value.ja) ? strings(value.ja) : undefined,
    en: Array.isArray(value.en) ? strings(value.en) : undefined,
  });
}

function sanitizeRecipe(item: unknown): Recipe {
  assert(isRecord(item) && typeof item.id === 'string' && Array.isArray(item.ingredients), 'invalid-recipe');
  const name = localized(item.name);
  assert(name, 'invalid-recipe');
  const baseServings = finite(item.baseServings);
  const timeMinutes = finite(item.timeMinutes);
  return compact({
    id: item.id,
    name,
    description: localized(item.description),
    cuisine: oneOf(CUISINES, item.cuisine) ?? 'other',
    category: oneOf(RECIPE_CATEGORIES, item.category) ?? 'main',
    baseServings: baseServings !== undefined && baseServings > 0 ? baseServings : 2,
    timeMinutes: timeMinutes !== undefined && timeMinutes >= 0 ? timeMinutes : undefined,
    ingredients: item.ingredients.map(sanitizeRecipeIngredient),
    steps: sanitizeSteps(item.steps),
    isPreset: false,
  });
}

function sanitizeNutrition(value: unknown): NutritionTotals | undefined {
  if (!isRecord(value)) return undefined;
  const out: Partial<NutritionTotals> = {};
  for (const key of NUTRIENT_KEYS) {
    const n = finite(value[key]);
    if (n === undefined) return undefined;
    out[key] = n;
  }
  return out as NutritionTotals;
}

function sanitizeCookEntry(item: unknown): CookEntry {
  assert(isRecord(item) && typeof item.id === 'string' && typeof item.recipeId === 'string', 'invalid-cook-entry');
  const recipeName = localized(item.recipeName);
  const cookedOn = isoDate(item.cookedOn);
  assert(recipeName && cookedOn, 'invalid-cook-entry');
  const servings = finite(item.servings);
  return compact({
    id: item.id,
    recipeId: item.recipeId,
    recipeName,
    servings: servings !== undefined && servings > 0 ? servings : 1,
    cookedOn,
    nutrition: sanitizeNutrition(item.nutrition),
  });
}

export function serializeState(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export function exportFilename(today: string): string {
  return `grocery-manager-${today}.json`;
}

export function parseImportedState(json: string): PersistedState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('invalid-json');
  }
  assert(isRecord(raw), 'invalid-shape');
  const version = raw.schemaVersion;
  assert(typeof version === 'number' && Number.isInteger(version) && version >= 1, 'invalid-version');
  assert(typeof raw.language === 'string' && LANGS.includes(raw.language), 'invalid-language');
  for (const key of ARRAY_KEYS) assert(Array.isArray(raw[key]), `invalid-${key}`);
  // Version 1 files have no cooking log; treat a missing one as empty.
  const cookingLog = raw.cookingLog ?? [];
  assert(Array.isArray(cookingLog), 'invalid-cookingLog');
  const migrated = migrate(raw, version);
  const defaults = defaultPersistedState(migrated.language);
  // Rebuild the state from known fields only. A backup is untrusted input: unknown keys
  // must not reach the store, and malformed nested values must not be persisted where
  // they would crash every later page load.
  return {
    schemaVersion: migrated.schemaVersion,
    language: migrated.language,
    servings: clamp(numberOr(migrated.servings, 2), 1, 12),
    almostThreshold: clamp(numberOr(migrated.almostThreshold, 2), 1, 5),
    trackExpiry: typeof migrated.trackExpiry === 'boolean' ? migrated.trackExpiry : defaults.trackExpiry,
    amountDisplay: oneOf(AMOUNT_DISPLAYS, migrated.amountDisplay) ?? defaults.amountDisplay,
    nutritionTarget: oneOf(NUTRITION_TARGETS, migrated.nutritionTarget) ?? defaults.nutritionTarget,
    customIngredients: migrated.customIngredients.map(sanitizeIngredient),
    pantry: migrated.pantry.map(sanitizePantryItem),
    customRecipes: migrated.customRecipes.map(sanitizeRecipe),
    shoppingList: migrated.shoppingList.map(sanitizeShoppingItem),
    cookingLog: (cookingLog as unknown[]).map(sanitizeCookEntry),
  };
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
