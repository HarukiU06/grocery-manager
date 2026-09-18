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
  });
  it('builds a dated filename', () => {
    expect(exportFilename('2026-09-18')).toBe('grocery-manager-2026-09-18.json');
  });
});
