import { describe, expect, it } from 'vitest';
import type { TranslationKey } from '../i18n/en';
import { translate } from '../i18n/translate';
import { formatIngredientAmount, formatQuantity, scaleAmount } from './scaling';

const tEn = (key: TranslationKey) => translate('en', key);
const tJa = (key: TranslationKey) => translate('ja', key);

describe('scaleAmount', () => {
  it('scales linearly and rounds to one decimal', () => {
    expect(scaleAmount(300, 2, 3)).toBe(450);
    expect(scaleAmount(1, 2, 3)).toBe(1.5);
    expect(scaleAmount(100, 3, 2)).toBe(66.7);
    expect(scaleAmount(2, 2, 2)).toBe(2);
  });
  it('returns the amount unchanged when base servings is invalid', () => {
    expect(scaleAmount(5, 0, 4)).toBe(5);
  });
});

describe('formatQuantity', () => {
  it('formats English with a space', () => {
    expect(formatQuantity(2, 'tbsp', 'en', tEn)).toBe('2 tbsp');
    expect(formatQuantity(200, 'g', 'en', tEn)).toBe('200 g');
    expect(formatQuantity(1.5, 'pcs', 'en', tEn)).toBe('1.5 pcs');
  });
  it('prefixes spoon and cup units in Japanese and suffixes the rest', () => {
    expect(formatQuantity(2, 'tbsp', 'ja', tJa)).toBe('大さじ2');
    expect(formatQuantity(1, 'tsp', 'ja', tJa)).toBe('小さじ1');
    expect(formatQuantity(1.5, 'cup', 'ja', tJa)).toBe('カップ1.5');
    expect(formatQuantity(200, 'g', 'ja', tJa)).toBe('200g');
    expect(formatQuantity(2, 'pcs', 'ja', tJa)).toBe('2個');
  });
  it('prints a bare number without unit', () => {
    expect(formatQuantity(3, undefined, 'en', tEn)).toBe('3');
  });
});

describe('formatIngredientAmount', () => {
  it('scales and formats', () => {
    expect(formatIngredientAmount({ ingredientId: 'x', amount: 300, unit: 'g' }, 2, 4, 'en', tEn)).toBe('600 g');
  });
  it('uses the note or "to taste" when no amount is given', () => {
    expect(formatIngredientAmount({ ingredientId: 'x' }, 2, 2, 'en', tEn)).toBe('to taste');
    expect(formatIngredientAmount({ ingredientId: 'x' }, 2, 2, 'ja', tJa)).toBe('適量');
    expect(formatIngredientAmount({ ingredientId: 'x', note: { ja: '少々', en: 'a little' } }, 2, 2, 'ja', tJa)).toBe('少々');
  });
});
