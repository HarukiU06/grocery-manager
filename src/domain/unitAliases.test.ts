import { describe, expect, it } from 'vitest';
import { parseQuantityText, toAsciiDigits, unitFromAlias } from './unitAliases';

describe('toAsciiDigits', () => {
  it('converts full-width digits and period', () => {
    expect(toAsciiDigits('１２.５')).toBe('12.5');
    expect(toAsciiDigits('３．５')).toBe('3.5');
    expect(toAsciiDigits('12')).toBe('12');
  });
});

describe('unitFromAlias', () => {
  it('maps Japanese and English aliases', () => {
    expect(unitFromAlias('g')).toBe('g');
    expect(unitFromAlias('グラム')).toBe('g');
    expect(unitFromAlias('個')).toBe('pcs');
    expect(unitFromAlias('大さじ')).toBe('tbsp');
    expect(unitFromAlias('本')).toBe('stalk');
    expect(unitFromAlias('枚')).toBe('slice');
    expect(unitFromAlias('パック')).toBe('pack');
    expect(unitFromAlias('cc')).toBe('ml');
  });
  it('is case-insensitive and trims', () => {
    expect(unitFromAlias(' KG ')).toBe('kg');
  });
  it('returns null for anything else', () => {
    expect(unitFromAlias('ざる')).toBeNull();
    expect(unitFromAlias('')).toBeNull();
  });
});

describe('parseQuantityText', () => {
  it('parses a number with a unit', () => {
    expect(parseQuantityText('300g')).toEqual({ amount: 300, unit: 'g' });
    expect(parseQuantityText('2 個')).toEqual({ amount: 2, unit: 'pcs' });
    expect(parseQuantityText('1.5カップ')).toEqual({ amount: 1.5, unit: 'cup' });
    expect(parseQuantityText('１２枚')).toEqual({ amount: 12, unit: 'slice' });
  });
  it('parses Japanese spoon measures written unit first', () => {
    expect(parseQuantityText('大さじ2')).toEqual({ amount: 2, unit: 'tbsp' });
    expect(parseQuantityText('小さじ 1.5')).toEqual({ amount: 1.5, unit: 'tsp' });
    expect(parseQuantityText('カップ１')).toEqual({ amount: 1, unit: 'cup' });
  });
  it('defaults a bare number to pieces', () => {
    expect(parseQuantityText('2')).toEqual({ amount: 2, unit: 'pcs' });
  });
  it('returns null when there is no number or the unit is unknown', () => {
    expect(parseQuantityText('たくさん')).toBeNull();
    expect(parseQuantityText('2ざる')).toBeNull();
    expect(parseQuantityText('   ')).toBeNull();
  });
});
