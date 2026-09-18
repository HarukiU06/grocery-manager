import { describe, expect, it } from 'vitest';
import { makeRecipe } from '../../test/factories';
import { draftFromRecipe, emptyDraft, recipeFromDraft } from './recipeDraft';

describe('recipeDraft', () => {
  it('round-trips a recipe through a draft', () => {
    const recipe = makeRecipe({
      name: { ja: '卵焼き', en: 'Tamagoyaki' },
      description: { ja: '甘い', en: 'Sweet' },
      timeMinutes: 10,
      ingredients: [{ ingredientId: 'egg', amount: 3, unit: 'pcs' }, { ingredientId: 'salt', optional: true }],
      steps: { ja: ['混ぜる', '焼く'], en: ['Mix', 'Cook'] },
    });
    const result = recipeFromDraft(draftFromRecipe(recipe));
    expect('recipe' in result && result.recipe).toEqual({
      name: { ja: '卵焼き', en: 'Tamagoyaki' },
      description: { ja: '甘い', en: 'Sweet' },
      cuisine: 'japanese',
      category: 'main',
      baseServings: 2,
      timeMinutes: 10,
      ingredients: [{ ingredientId: 'egg', amount: 3, unit: 'pcs' }, { ingredientId: 'salt', optional: true }],
      steps: { ja: ['混ぜる', '焼く'], en: ['Mix', 'Cook'] },
    });
  });
  it('reports every validation error', () => {
    const result = recipeFromDraft({ ...emptyDraft(), baseServings: '0' });
    expect('errors' in result && result.errors).toEqual(['name', 'ingredients', 'steps', 'servings']);
  });
  it('drops blank optional fields and blank step lines', () => {
    const draft = {
      ...emptyDraft(),
      nameEn: 'Toast',
      timeMinutes: '',
      ingredients: [{ ingredientId: 'bread', amount: '', unit: '' as const, optional: false }],
      stepsEn: 'Toast it\n\n  \nEat',
    };
    const result = recipeFromDraft(draft);
    expect('recipe' in result && result.recipe).toEqual({
      name: { en: 'Toast' },
      cuisine: 'japanese',
      category: 'main',
      baseServings: 2,
      ingredients: [{ ingredientId: 'bread' }],
      steps: { en: ['Toast it', 'Eat'] },
    });
  });
});
