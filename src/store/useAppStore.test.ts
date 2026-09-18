import { beforeEach, describe, expect, it } from 'vitest';
import { makeRecipe } from '../test/factories';
import { defaultPersistedState } from './migrations';
import { STORAGE_KEY, useAppStore, type RecipeInput } from './useAppStore';

beforeEach(() => {
  window.localStorage.clear();
  useAppStore.setState(defaultPersistedState('en'));
});

describe('pantry actions', () => {
  it('adds, updates, removes and dedupes pantry items', () => {
    const s = useAppStore.getState();
    s.addPantryItem('egg');
    s.addPantryItem('egg', { quantity: '6' });
    expect(useAppStore.getState().pantry).toHaveLength(1);
    expect(useAppStore.getState().pantry[0].quantity).toBe('6');
    s.updatePantryItem('egg', { expiresOn: '2026-09-20', location: 'fridge' });
    expect(useAppStore.getState().pantry[0]).toMatchObject({ expiresOn: '2026-09-20', location: 'fridge' });
    s.removePantryItem('egg');
    expect(useAppStore.getState().pantry).toHaveLength(0);
  });
  it('adds common staples once', () => {
    const s = useAppStore.getState();
    s.addPantryItem('salt');
    const added = s.addCommonStaples();
    expect(added).toBe(16);
    expect(useAppStore.getState().addCommonStaples()).toBe(0);
  });
  it('persists to localStorage', () => {
    useAppStore.getState().addPantryItem('egg');
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain('"egg"');
  });
});

describe('ingredients and recipes', () => {
  it('creates custom ingredients with generated ids', () => {
    const ing = useAppStore.getState().createIngredient({ name: { ja: 'ザーサイ' }, category: 'other' });
    expect(ing.id.startsWith('custom-')).toBe(true);
    expect(ing.isPreset).toBe(false);
    expect(useAppStore.getState().customIngredients).toEqual([ing]);
  });
  it('adds, updates and deletes custom recipes', () => {
    const s = useAppStore.getState();
    const input: RecipeInput = {
      name: { en: 'Mine' },
      cuisine: 'other',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'egg' }],
      steps: { en: ['Cook'] },
    };
    const created = s.addCustomRecipe(input);
    expect(created.isPreset).toBe(false);
    s.updateCustomRecipe(created.id, { ...input, name: { en: 'Renamed' } });
    expect(useAppStore.getState().customRecipes[0].name.en).toBe('Renamed');
    s.deleteCustomRecipe(created.id);
    expect(useAppStore.getState().customRecipes).toHaveLength(0);
  });
  it('duplicates a preset into an editable copy with a localized suffix', () => {
    const preset = makeRecipe({ id: 'nikujaga', name: { ja: '肉じゃが', en: 'Nikujaga' }, isPreset: true });
    const copy = useAppStore.getState().duplicateRecipe(preset);
    expect(copy.isPreset).toBe(false);
    expect(copy.id).not.toBe('nikujaga');
    expect(copy.name).toEqual({ ja: '肉じゃが（コピー）', en: 'Nikujaga (copy)' });
    expect(copy.ingredients).not.toBe(preset.ingredients);
  });
});

describe('shopping', () => {
  it('adds once, removes, and marks bought into the pantry', () => {
    const s = useAppStore.getState();
    s.addToShopping('milk');
    s.addToShopping('milk');
    s.addToShopping('egg');
    expect(useAppStore.getState().shoppingList.map((i) => i.ingredientId)).toEqual(['milk', 'egg']);
    s.removeFromShopping('egg');
    s.markBought('milk');
    expect(useAppStore.getState().shoppingList).toEqual([]);
    expect(useAppStore.getState().pantry.map((p) => p.ingredientId)).toEqual(['milk']);
  });
});

describe('settings and data', () => {
  it('clamps servings and threshold', () => {
    const s = useAppStore.getState();
    s.setServings(0);
    expect(useAppStore.getState().servings).toBe(1);
    s.setServings(50);
    expect(useAppStore.getState().servings).toBe(12);
    s.setAlmostThreshold(9);
    expect(useAppStore.getState().almostThreshold).toBe(3);
  });
  it('imports and resets while keeping the language', () => {
    const s = useAppStore.getState();
    s.setLanguage('ja');
    s.importState({ ...defaultPersistedState('ja'), pantry: [{ ingredientId: 'egg', addedOn: '2026-09-18' }] });
    expect(useAppStore.getState().pantry).toHaveLength(1);
    s.resetAll();
    expect(useAppStore.getState().pantry).toHaveLength(0);
    expect(useAppStore.getState().language).toBe('ja');
  });
});
