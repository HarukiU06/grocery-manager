import { describe, expect, it } from 'vitest';
import { INGREDIENT_CATEGORIES } from '../domain/types';
import { PRESET_INGREDIENTS } from './ingredients';
import { COMMON_STAPLE_IDS } from './staples';

describe('preset ingredients', () => {
  it('has unique kebab-case ids', () => {
    const ids = PRESET_INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('has both names, a valid category and isPreset', () => {
    for (const ing of PRESET_INGREDIENTS) {
      expect(ing.name.ja, ing.id).toBeTruthy();
      expect(ing.name.en, ing.id).toBeTruthy();
      expect(INGREDIENT_CATEGORIES).toContain(ing.category);
      expect(ing.isPreset).toBe(true);
    }
  });
  it('has at least 150 entries and covers every category', () => {
    expect(PRESET_INGREDIENTS.length).toBeGreaterThanOrEqual(150);
    const used = new Set(PRESET_INGREDIENTS.map((i) => i.category));
    for (const category of INGREDIENT_CATEGORIES) expect(used.has(category), category).toBe(true);
  });
  it('staples reference existing ingredients and are unique', () => {
    const ids = new Set(PRESET_INGREDIENTS.map((i) => i.id));
    expect(new Set(COMMON_STAPLE_IDS).size).toBe(COMMON_STAPLE_IDS.length);
    for (const id of COMMON_STAPLE_IDS) expect(ids.has(id), id).toBe(true);
  });
});
