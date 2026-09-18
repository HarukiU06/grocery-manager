import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../test/factories';
import { recipeUsesAll } from './recipeFilter';

describe('recipeUsesAll', () => {
  const recipe = makeRecipe({
    ingredients: [{ ingredientId: 'egg' }, { ingredientId: 'rice' }, { ingredientId: 'nori', optional: true }],
  });
  it('passes everything when nothing is selected', () => {
    expect(recipeUsesAll(recipe, [])).toBe(true);
  });
  it('requires every selected ingredient', () => {
    expect(recipeUsesAll(recipe, ['egg'])).toBe(true);
    expect(recipeUsesAll(recipe, ['egg', 'rice'])).toBe(true);
    expect(recipeUsesAll(recipe, ['egg', 'milk'])).toBe(false);
  });
  it('counts optional ingredients as used', () => {
    expect(recipeUsesAll(recipe, ['nori'])).toBe(true);
  });
});
