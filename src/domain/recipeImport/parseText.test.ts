import { describe, expect, it } from 'vitest';
import { PRESET_INGREDIENTS } from '../../data/ingredients';
import { parseIngredientLines } from './parseText';

const parse = (text: string) => parseIngredientLines(text, PRESET_INGREDIENTS);

describe('parseIngredientLines', () => {
  it('parses Japanese lines and resolves the catalog id', () => {
    const rows = parse('玉ねぎ 1個\n・にんじん　1/2本\nしょうゆ 大さじ2');
    expect(rows[0]).toMatchObject({ ingredientId: 'onion', amount: 1, unit: 'pcs' });
    expect(rows[1]).toMatchObject({ ingredientId: 'carrot', amount: 0.5, unit: 'stalk' });
    expect(rows[2]).toMatchObject({ ingredientId: 'soy-sauce', amount: 2, unit: 'tbsp' });
  });
  it('parses English lines', () => {
    const rows = parse('Onion 1 pcs\n200 g carrot');
    expect(rows[0]).toMatchObject({ ingredientId: 'onion', amount: 1, unit: 'pcs' });
    expect(rows[1]).toMatchObject({ ingredientId: 'carrot', amount: 200, unit: 'g' });
  });
  it('treats 適量 and similar as no amount', () => {
    const rows = parse('塩 適量\nこしょう 少々\nsugar to taste');
    for (const row of rows) expect(row.amount).toBeUndefined();
    expect(rows[0].ingredientId).toBe('salt');
    expect(rows[1].ingredientId).toBe('black-pepper');
  });
  it('normalises full-width digits', () => {
    expect(parse('砂糖 大さじ２')[0]).toMatchObject({ ingredientId: 'sugar', amount: 2, unit: 'tbsp' });
  });
  it('keeps unmatched names with no id', () => {
    const rows = parse('ドラゴンフルーツ 1個');
    expect(rows[0].ingredientId).toBeUndefined();
    expect(rows[0].name).toBe('ドラゴンフルーツ');
  });
  it('skips blank and heading-only lines', () => {
    expect(parse('材料\n\n  \n塩 少々')).toHaveLength(1);
  });
});
