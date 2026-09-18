import { describe, expect, it } from 'vitest';
import { defaultPersistedState, detectLanguage, migrate } from './migrations';

describe('migrations', () => {
  it('detects Japanese from the browser language', () => {
    expect(detectLanguage('ja-JP')).toBe('ja');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
  it('fills missing keys with defaults for version 1', () => {
    const migrated = migrate({ schemaVersion: 1, pantry: [{ ingredientId: 'egg', addedOn: '2026-01-01' }] }, 1);
    expect(migrated.pantry).toHaveLength(1);
    expect(migrated.customRecipes).toEqual([]);
    expect(migrated.servings).toBe(2);
    expect(migrated.schemaVersion).toBe(1);
  });
  it('rejects versions from the future', () => {
    expect(() => migrate({}, 99)).toThrow();
  });
  it('default state is complete', () => {
    expect(defaultPersistedState('ja')).toEqual({
      schemaVersion: 1,
      language: 'ja',
      servings: 2,
      almostThreshold: 2,
      customIngredients: [],
      pantry: [],
      customRecipes: [],
      shoppingList: [],
    });
  });
});
