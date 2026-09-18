import { describe, expect, it } from 'vitest';
import { makePantryItem, makeRecipe } from '../test/factories';
import { buildSuggestions, evaluateRecipe } from './matching';

const options = { almostThreshold: 2, today: '2026-09-18' };
const req = (ingredientId: string) => ({ ingredientId });
const opt = (ingredientId: string) => ({ ingredientId, optional: true });

describe('evaluateRecipe', () => {
  it('is ready when every required ingredient is present', () => {
    const recipe = makeRecipe({ ingredients: [req('egg'), req('rice'), opt('nori')] });
    const match = evaluateRecipe(recipe, [makePantryItem('egg'), makePantryItem('rice')], options);
    expect(match.status).toBe('ready');
    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual(['nori']);
  });
  it('is almost when missing up to the threshold', () => {
    const recipe = makeRecipe({ ingredients: [req('a'), req('b'), req('c')] });
    expect(evaluateRecipe(recipe, [makePantryItem('a')], options).status).toBe('almost');
    expect(evaluateRecipe(recipe, [makePantryItem('a')], { ...options, almostThreshold: 1 }).status).toBe('far');
  });
  it('is far when missing more than the threshold', () => {
    const recipe = makeRecipe({ ingredients: [req('a'), req('b'), req('c')] });
    const match = evaluateRecipe(recipe, [], options);
    expect(match.status).toBe('far');
    expect(match.missingRequired).toEqual(['a', 'b', 'c']);
  });
  it('lists pantry items expiring within 3 days that the recipe uses', () => {
    const recipe = makeRecipe({ ingredients: [req('milk'), req('egg'), req('flour')] });
    const pantry = [
      makePantryItem('milk', { expiresOn: '2026-09-19' }),
      makePantryItem('egg', { expiresOn: '2026-09-30' }),
      makePantryItem('flour'),
      makePantryItem('butter', { expiresOn: '2026-09-10' }),
    ];
    expect(evaluateRecipe(recipe, pantry, options).usesExpiring).toEqual(['milk']);
  });
});

describe('buildSuggestions', () => {
  it('partitions recipes and drops far ones', () => {
    const ready = makeRecipe({ id: 'ready', ingredients: [req('a')] });
    const almost = makeRecipe({ id: 'almost', ingredients: [req('a'), req('b')] });
    const far = makeRecipe({ id: 'far', ingredients: [req('x'), req('y'), req('z')] });
    const result = buildSuggestions([far, almost, ready], [makePantryItem('a')], options);
    expect(result.ready.map((m) => m.recipe.id)).toEqual(['ready']);
    expect(result.almost.map((m) => m.recipe.id)).toEqual(['almost']);
  });
  it('sorts ready recipes by expiring usage, then time, then name', () => {
    const slow = makeRecipe({ id: 'slow', name: { en: 'Slow', ja: 'S' }, timeMinutes: 60, ingredients: [req('a')] });
    const fast = makeRecipe({ id: 'fast', name: { en: 'Fast', ja: 'F' }, timeMinutes: 10, ingredients: [req('a')] });
    const usesExpiring = makeRecipe({ id: 'exp', name: { en: 'Zed', ja: 'Z' }, timeMinutes: 90, ingredients: [req('milk')] });
    const noTime = makeRecipe({ id: 'notime', name: { en: 'Alpha', ja: 'A' }, timeMinutes: undefined, ingredients: [req('a')] });
    const pantry = [makePantryItem('a'), makePantryItem('milk', { expiresOn: '2026-09-18' })];
    const result = buildSuggestions([slow, noTime, fast, usesExpiring], pantry, options);
    expect(result.ready.map((m) => m.recipe.id)).toEqual(['exp', 'fast', 'slow', 'notime']);
  });
  it('sorts almost recipes by fewest missing first', () => {
    const missOne = makeRecipe({ id: 'one', ingredients: [req('a'), req('b')] });
    const missTwo = makeRecipe({ id: 'two', ingredients: [req('a'), req('b'), req('c')] });
    const result = buildSuggestions([missTwo, missOne], [makePantryItem('a')], options);
    expect(result.almost.map((m) => m.recipe.id)).toEqual(['one', 'two']);
  });
  it('aggregates buy-to-unlock by ingredient with unlocks before helps', () => {
    const r1 = makeRecipe({ id: 'r1', ingredients: [req('a'), req('b')] });
    const r2 = makeRecipe({ id: 'r2', ingredients: [req('a'), req('b'), req('c')] });
    const r3 = makeRecipe({ id: 'r3', ingredients: [req('a'), req('c')] });
    const r4 = makeRecipe({ id: 'r4', ingredients: [req('a'), req('c')] });
    const result = buildSuggestions([r1, r2, r3, r4], [makePantryItem('a')], options);
    expect(result.buyToUnlock.map((b) => b.ingredientId)).toEqual(['c', 'b']);
    const c = result.buyToUnlock[0];
    expect(c.unlocks.map((r) => r.id)).toEqual(['r3', 'r4']);
    expect(c.helps.map((r) => r.id)).toEqual(['r2']);
    const b = result.buyToUnlock[1];
    expect(b.unlocks.map((r) => r.id)).toEqual(['r1']);
    expect(b.helps.map((r) => r.id)).toEqual(['r2']);
  });
  it('never lists ingredients missing only from far recipes', () => {
    const far = makeRecipe({ ingredients: [req('x'), req('y'), req('z')] });
    expect(buildSuggestions([far], [], options).buyToUnlock).toEqual([]);
  });
});
