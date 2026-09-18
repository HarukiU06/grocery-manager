import { describe, expect, it } from 'vitest';
import { toGrams } from './units';

describe('toGrams', () => {
  it('handles mass units', () => {
    expect(toGrams(300, 'g', 'flour')).toBe(300);
    expect(toGrams(1.5, 'kg', 'flour')).toBe(1500);
  });
  it('handles volume with a default density', () => {
    expect(toGrams(200, 'ml', 'milk')).toBeCloseTo(206, 0);
    expect(toGrams(1, 'cup', 'water-like')).toBeCloseTo(200, 1);
  });
  it('uses per-ingredient spoon weights', () => {
    expect(toGrams(1, 'tbsp', 'soy-sauce')).toBeCloseTo(18, 1);
    expect(toGrams(1, 'tsp', 'soy-sauce')).toBeCloseTo(6, 1);
    expect(toGrams(1, 'tbsp', 'sugar')).toBeCloseTo(9, 1);
  });
  it('falls back to volume for spoons with no listed weight', () => {
    expect(toGrams(1, 'tbsp', 'unlisted-ingredient')).toBeCloseTo(15, 1);
    expect(toGrams(3, 'tsp', 'unlisted-ingredient')).toBeCloseTo(15, 1);
  });
  it('uses per-ingredient piece weights', () => {
    expect(toGrams(1, 'pcs', 'egg')).toBeCloseTo(60, 1);
    expect(toGrams(2, 'pcs', 'onion')).toBeCloseTo(400, 1);
    expect(toGrams(1, 'clove', 'garlic')).toBeCloseTo(5, 1);
  });
  it('returns null when a countable unit has no weight for that ingredient', () => {
    expect(toGrams(1, 'pcs', 'soy-sauce')).toBeNull();
    expect(toGrams(1, 'slice', 'egg')).toBeNull();
    expect(toGrams(1, 'can', 'unlisted-ingredient')).toBeNull();
  });
  it('treats a pinch as one gram', () => {
    expect(toGrams(2, 'pinch', 'salt')).toBe(2);
  });
});
