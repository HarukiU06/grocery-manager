import { describe, expect, it } from 'vitest';
import { defaultPersistedState, detectLanguage, migrate } from './migrations';

describe('migrations', () => {
  it('detects Japanese from the browser language', () => {
    expect(detectLanguage('ja-JP')).toBe('ja');
    expect(detectLanguage('en-US')).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
  it('default state carries the version 2 fields', () => {
    expect(defaultPersistedState('ja')).toEqual({
      schemaVersion: 2,
      language: 'ja',
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
    });
  });
  it('converts version 1 pantry quantities', () => {
    const migrated = migrate(
      {
        schemaVersion: 1,
        pantry: [
          { ingredientId: 'flour', quantity: '300g', addedOn: '2026-01-01' },
          { ingredientId: 'egg', quantity: '6', addedOn: '2026-01-01' },
          { ingredientId: 'miso', quantity: '大さじ2', addedOn: '2026-01-01' },
          { ingredientId: 'rice', quantity: 'たっぷり', addedOn: '2026-01-01' },
          { ingredientId: 'salt', addedOn: '2026-01-01' },
        ],
      },
      1,
    );
    expect(migrated.pantry[0]).toMatchObject({ quantity: { amount: 300, unit: 'g' } });
    expect(migrated.pantry[1]).toMatchObject({ quantity: { amount: 6, unit: 'pcs' } });
    expect(migrated.pantry[2]).toMatchObject({ quantity: { amount: 2, unit: 'tbsp' } });
    expect(migrated.pantry[3].quantity).toBeUndefined();
    expect(migrated.pantry[3].note).toBe('たっぷり');
    expect(migrated.pantry[4].quantity).toBeUndefined();
    expect(migrated.pantry[4].note).toBeUndefined();
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.cookingLog).toEqual([]);
    expect(migrated.trackExpiry).toBe(true);
  });
  it('leaves version 2 pantry items alone', () => {
    const migrated = migrate(
      {
        schemaVersion: 2,
        pantry: [{ ingredientId: 'flour', quantity: { amount: 1, unit: 'kg' }, addedOn: '2026-01-01' }],
      },
      2,
    );
    expect(migrated.pantry[0].quantity).toEqual({ amount: 1, unit: 'kg' });
  });
  it('rejects versions from the future', () => {
    expect(() => migrate({}, 99)).toThrow();
  });
});
