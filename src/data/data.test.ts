import { describe, expect, it } from 'vitest';
import { CUISINES, RECIPE_CATEGORIES, UNITS } from '../domain/types';
import { toGrams } from '../domain/units';
import { NUTRIENT_KEYS } from '../domain/types';
import { CONVERSIONS } from './conversions';
import { ALCOHOL_INGREDIENT_IDS, NUTRITION } from './nutrition';
import { DAILY_TARGETS } from './targets';
import { PRESET_INGREDIENT_IDS, PRESET_INGREDIENTS } from './ingredients';
import { PRESET_RECIPES } from './recipes';

describe('preset recipes', () => {
  it('has at least 60 recipes with unique ids', () => {
    expect(PRESET_RECIPES.length).toBeGreaterThanOrEqual(60);
    const ids = PRESET_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('covers each cuisine', () => {
    const cuisines = new Set(PRESET_RECIPES.map((r) => r.cuisine));
    for (const cuisine of CUISINES) expect(cuisines.has(cuisine), cuisine).toBe(true);
  });
  it('has complete bilingual content and valid fields', () => {
    for (const r of PRESET_RECIPES) {
      expect(r.isPreset, r.id).toBe(true);
      expect(r.baseServings, r.id).toBeGreaterThan(0);
      expect(r.name.ja, r.id).toBeTruthy();
      expect(r.name.en, r.id).toBeTruthy();
      if (r.description) {
        expect(r.description.ja, r.id).toBeTruthy();
        expect(r.description.en, r.id).toBeTruthy();
      }
      expect(CUISINES).toContain(r.cuisine);
      expect(RECIPE_CATEGORIES).toContain(r.category);
      expect(r.steps.ja?.length ?? 0, r.id).toBeGreaterThan(0);
      expect(r.steps.en?.length ?? 0, r.id).toBeGreaterThan(0);
      expect(r.steps.ja?.length, r.id).toBe(r.steps.en?.length);
      expect(r.ingredients.length, r.id).toBeGreaterThan(0);
      if (r.timeMinutes !== undefined) expect(r.timeMinutes, r.id).toBeGreaterThan(0);
    }
  });
  it('references only catalog ingredients, each at most once per recipe', () => {
    for (const r of PRESET_RECIPES) {
      const seen = new Set<string>();
      for (const ri of r.ingredients) {
        expect(PRESET_INGREDIENT_IDS.has(ri.ingredientId), `${r.id} -> ${ri.ingredientId}`).toBe(true);
        expect(seen.has(ri.ingredientId), `${r.id} repeats ${ri.ingredientId}`).toBe(false);
        seen.add(ri.ingredientId);
        if (ri.unit) expect(UNITS).toContain(ri.unit);
        if (ri.amount !== undefined) expect(ri.amount, `${r.id} -> ${ri.ingredientId}`).toBeGreaterThan(0);
        if (ri.note) {
          expect(ri.note.ja, r.id).toBeTruthy();
          expect(ri.note.en, r.id).toBeTruthy();
        }
      }
    }
  });
  it('never lists water as an ingredient', () => {
    for (const r of PRESET_RECIPES) {
      expect(r.ingredients.some((ri) => ri.ingredientId === 'water'), r.id).toBe(false);
    }
  });
});

describe('conversions', () => {
  it('only names real preset ingredients', () => {
    for (const id of Object.keys(CONVERSIONS)) {
      expect(PRESET_INGREDIENT_IDS.has(id), id).toBe(true);
    }
  });
  it('resolves every countable amount used by a preset recipe', () => {
    const countable = new Set(['pcs', 'clove', 'slice', 'bunch', 'sheet', 'can', 'pack', 'stalk']);
    for (const r of PRESET_RECIPES) {
      for (const ri of r.ingredients) {
        if (ri.amount === undefined || !ri.unit || !countable.has(ri.unit)) continue;
        expect(
          toGrams(ri.amount, ri.unit, ri.ingredientId),
          `${r.id} -> ${ri.ingredientId} ${ri.unit}`,
        ).not.toBeNull();
      }
    }
  });
  it('has positive, plausible weights', () => {
    for (const [id, c] of Object.entries(CONVERSIONS)) {
      if (c.gramsPerPiece !== undefined) {
        expect(c.pieceUnit, id).toBeTruthy();
        expect(c.gramsPerPiece, id).toBeGreaterThan(0);
        expect(c.gramsPerPiece, id).toBeLessThanOrEqual(2000);
      }
      if (c.gramsPerTbsp !== undefined) {
        expect(c.gramsPerTbsp, id).toBeGreaterThan(0);
        expect(c.gramsPerTbsp, id).toBeLessThanOrEqual(25);
      }
      if (c.densityGPerMl !== undefined) {
        expect(c.densityGPerMl, id).toBeGreaterThan(0);
        expect(c.densityGPerMl, id).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('nutrition data', () => {
  it('covers every preset ingredient exactly once', () => {
    for (const ing of PRESET_INGREDIENTS) {
      expect(NUTRITION[ing.id], `missing nutrition for ${ing.id}`).toBeDefined();
    }
    for (const id of Object.keys(NUTRITION)) {
      expect(PRESET_INGREDIENT_IDS.has(id), id).toBe(true);
    }
  });
  it('has 14 finite, non-negative values per row', () => {
    for (const [id, row] of Object.entries(NUTRITION)) {
      expect(row, id).toHaveLength(NUTRIENT_KEYS.length);
      for (const value of row) {
        expect(Number.isFinite(value), id).toBe(true);
        expect(value, id).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('keeps energy consistent with the macronutrients', () => {
    for (const [id, row] of Object.entries(NUTRITION)) {
      if (ALCOHOL_INGREDIENT_IDS.has(id)) continue;
      const [energy, protein, fat, carbs, fiber] = row;
      // Available carbohydrate yields 4 kcal per gram, fibre roughly 2.
      const available = Math.max(0, carbs - fiber);
      const estimate = protein * 4 + fat * 9 + available * 4 + fiber * 2;
      const tolerance = Math.max(30, estimate * 0.35);
      expect(Math.abs(energy - estimate), `${id}: ${energy} vs ${estimate.toFixed(1)}`).toBeLessThanOrEqual(tolerance);
    }
  });
  it('keeps every value inside a plausible range', () => {
    const max = [900, 100, 100, 100, 80, 100, 2500, 60, 7000, 15000, 5, 5, 500, 60];
    for (const [id, row] of Object.entries(NUTRITION)) {
      row.forEach((value, index) => {
        expect(value, `${id} index ${index}`).toBeLessThanOrEqual(max[index]);
      });
    }
  });
});

describe('daily targets', () => {
  it('define every nutrient with a positive value', () => {
    for (const [profile, totals] of Object.entries(DAILY_TARGETS)) {
      for (const key of NUTRIENT_KEYS) {
        expect(totals[key], `${profile}.${key}`).toBeGreaterThan(0);
      }
    }
  });
});
