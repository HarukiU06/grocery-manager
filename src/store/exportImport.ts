import type { PersistedState } from '../domain/types';
import { clamp, migrate } from './migrations';

const LANGS = ['ja', 'en'];
const ARRAY_KEYS = ['customIngredients', 'pantry', 'customRecipes', 'shoppingList'] as const;

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
  for (const item of cookingLog as unknown[]) {
    assert(
      isRecord(item) && typeof item.id === 'string' && typeof item.recipeId === 'string' && isRecord(item.recipeName),
      'invalid-cook-entry',
    );
  }
  for (const item of raw.pantry as unknown[]) {
    assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-pantry-item');
  }
  for (const item of raw.shoppingList as unknown[]) {
    assert(isRecord(item) && typeof item.ingredientId === 'string', 'invalid-shopping-item');
  }
  for (const item of raw.customIngredients as unknown[]) {
    assert(
      isRecord(item) && typeof item.id === 'string' && isRecord(item.name) && typeof item.category === 'string',
      'invalid-ingredient',
    );
  }
  for (const item of raw.customRecipes as unknown[]) {
    assert(
      isRecord(item) && typeof item.id === 'string' && isRecord(item.name) && Array.isArray(item.ingredients),
      'invalid-recipe',
    );
  }
  const migrated = migrate(raw, version);
  return {
    ...migrated,
    servings: clamp(numberOr(migrated.servings, 2), 1, 12),
    almostThreshold: clamp(numberOr(migrated.almostThreshold, 2), 1, 5),
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
