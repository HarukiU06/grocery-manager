import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../test/factories';
import { computeRecipeNutrition, emptyTotals } from './nutrition';

describe('emptyTotals', () => {
  it('has every nutrient at zero', () => {
    expect(emptyTotals().energy).toBe(0);
    expect(Object.keys(emptyTotals())).toHaveLength(14);
  });
});

describe('computeRecipeNutrition', () => {
  it('sums required ingredients and scales with servings', () => {
    // 2 eggs at 60 g each, egg is about 142 kcal per 100 g.
    const recipe = makeRecipe({ baseServings: 2, ingredients: [{ ingredientId: 'egg', amount: 2, unit: 'pcs' }] });
    const two = computeRecipeNutrition(recipe, 2);
    expect(two.total.energy).toBeGreaterThan(150);
    expect(two.total.energy).toBeLessThan(190);
    expect(two.perServing.energy).toBeCloseTo(two.total.energy / 2, 0);
    // Energy rounds to whole numbers, so doubling the servings can differ by one.
    const four = computeRecipeNutrition(recipe, 4);
    expect(Math.abs(four.total.energy - two.total.energy * 2)).toBeLessThanOrEqual(1);
  });
  it('reports ingredients it cannot count', () => {
    const recipe = makeRecipe({
      ingredients: [
        { ingredientId: 'egg', amount: 1, unit: 'pcs' },
        { ingredientId: 'salt' },
        { ingredientId: 'sugar', amount: 1, unit: 'tbsp', optional: true },
        { ingredientId: 'made-up-thing', amount: 100, unit: 'g' },
      ],
    });
    const result = computeRecipeNutrition(recipe, 2);
    expect(result.countedIngredientIds).toEqual(['egg']);
    expect(result.unknownIngredientIds).toEqual(['salt', 'sugar', 'made-up-thing']);
  });
  it('counts salt from seasonings', () => {
    const recipe = makeRecipe({ ingredients: [{ ingredientId: 'soy-sauce', amount: 2, unit: 'tbsp' }] });
    expect(computeRecipeNutrition(recipe, 2).total.salt).toBeGreaterThan(4);
  });
});
