import { CURRENT_SCHEMA_VERSION, type Lang, type PantryItem, type PersistedState } from '../domain/types';
import { parseQuantityText } from '../domain/unitAliases';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function detectLanguage(navLang: string | undefined): Lang {
  return navLang?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function defaultPersistedState(language: Lang = 'en'): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    language,
    servings: 2,
    almostThreshold: 2,
    trackExpiry: true,
    amountDisplay: 'recipe',
    nutritionTarget: 'off',
    customIngredients: [],
    pantry: [],
    customRecipes: [],
    shoppingList: [],
    cookingLog: [],
  };
}

/** Version 1 stored the pantry quantity as free text; version 2 stores a number and a unit. */
function migratePantryV1toV2(pantry: unknown): PantryItem[] {
  if (!Array.isArray(pantry)) return [];
  return pantry.map((raw) => {
    const item = raw as Record<string, unknown>;
    if (typeof item.quantity !== 'string') return item as unknown as PantryItem;
    const { quantity: legacy, ...rest } = item;
    const text = legacy.trim();
    if (!text) return rest as unknown as PantryItem;
    const parsed = parseQuantityText(text);
    const migrated = parsed ? { ...rest, quantity: parsed } : { ...rest, note: text };
    return migrated as unknown as PantryItem;
  });
}

/**
 * Upgrade a persisted blob from `fromVersion` to the current schema.
 * Missing keys are filled with defaults; each version step runs in order.
 */
export function migrate(raw: unknown, fromVersion: number): PersistedState {
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version ${fromVersion}`);
  }
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<PersistedState>;
  const merged = { ...defaultPersistedState(partial.language), ...partial };
  const pantry = fromVersion < 2 ? migratePantryV1toV2(merged.pantry) : merged.pantry;
  return { ...merged, pantry, schemaVersion: CURRENT_SCHEMA_VERSION };
}
