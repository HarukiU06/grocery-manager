import { describe, expect, it } from 'vitest';
import { exportFilename, parseImportedState, serializeState } from './exportImport';
import { defaultPersistedState } from './migrations';

describe('export/import', () => {
  it('round-trips state', () => {
    const state = { ...defaultPersistedState('ja'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] };
    expect(parseImportedState(serializeState(state))).toEqual(state);
  });
  it('rejects invalid JSON and wrong shapes', () => {
    expect(() => parseImportedState('not json')).toThrow();
    expect(() => parseImportedState('[]')).toThrow();
    expect(() => parseImportedState(JSON.stringify({ schemaVersion: 1 }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), pantry: 'nope' }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), pantry: [{ nope: 1 }] }))).toThrow();
    expect(() => parseImportedState(JSON.stringify({ ...defaultPersistedState(), language: 'fr' }))).toThrow();
  });
  it('clamps servings and threshold', () => {
    const parsed = parseImportedState(JSON.stringify({ ...defaultPersistedState(), servings: 99, almostThreshold: 0 }));
    expect(parsed.servings).toBe(12);
    expect(parsed.almostThreshold).toBe(1);
    const parsedHigh = parseImportedState(JSON.stringify({ ...defaultPersistedState(), almostThreshold: 99 }));
    expect(parsedHigh.almostThreshold).toBe(5);
  });
  it('imports a version 1 file and migrates it', () => {
    const v1 = JSON.stringify({
      schemaVersion: 1,
      language: 'ja',
      servings: 2,
      almostThreshold: 2,
      customIngredients: [],
      pantry: [{ ingredientId: 'flour', quantity: '300g', addedOn: '2026-01-01' }],
      customRecipes: [],
      shoppingList: [],
    });
    const parsed = parseImportedState(v1);
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.pantry[0].quantity).toEqual({ amount: 300, unit: 'g' });
    expect(parsed.cookingLog).toEqual([]);
  });
  it('rejects a malformed cook entry', () => {
    const bad = JSON.stringify({ ...defaultPersistedState(), cookingLog: [{ nope: 1 }] });
    expect(() => parseImportedState(bad)).toThrow();
  });
  it('builds a dated filename', () => {
    expect(exportFilename('2026-09-18')).toBe('grocery-manager-2026-09-18.json');
  });
});
