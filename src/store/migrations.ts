import { CURRENT_SCHEMA_VERSION, type Lang, type PersistedState } from '../domain/types';

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
    customIngredients: [],
    pantry: [],
    customRecipes: [],
    shoppingList: [],
  };
}

/**
 * Upgrade a persisted blob from `fromVersion` to the current schema.
 * Version 1 is current: fill any missing keys with defaults.
 * Future versions add a step per version and fall through.
 */
export function migrate(raw: unknown, fromVersion: number): PersistedState {
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(`Unsupported schema version ${fromVersion}`);
  }
  const partial = (raw && typeof raw === 'object' ? raw : {}) as Partial<PersistedState>;
  return { ...defaultPersistedState(partial.language), ...partial, schemaVersion: CURRENT_SCHEMA_VERSION };
}
