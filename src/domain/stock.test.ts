import { describe, expect, it } from 'vitest';
import { addStock, convertAmount } from './stock';

describe('convertAmount', () => {
  it('converts within mass and volume', () => {
    expect(convertAmount(1.5, 'kg', 'g')).toBe(1500);
    expect(convertAmount(250, 'ml', 'l')).toBe(0.25);
    expect(convertAmount(2, 'tbsp', 'ml')).toBe(30);
  });
  it('refuses to cross dimensions or countable units', () => {
    expect(convertAmount(100, 'g', 'ml')).toBeNull();
    expect(convertAmount(2, 'pcs', 'g')).toBeNull();
    expect(convertAmount(1, 'pack', 'can')).toBeNull();
  });
  it('keeps countable units that match', () => {
    expect(convertAmount(3, 'pcs', 'pcs')).toBe(3);
  });
});

describe('addStock', () => {
  it('uses the bought amount when nothing is on hand', () => {
    expect(addStock(undefined, { amount: 200, unit: 'g' })).toEqual({
      amount: 200,
      unit: 'g',
    });
  });
  it('adds the bought amount to what is on hand', () => {
    expect(addStock({ amount: 3, unit: 'pcs' }, { amount: 6, unit: 'pcs' })).toEqual({ amount: 9, unit: 'pcs' });
  });
  it('keeps the unit already on hand', () => {
    expect(addStock({ amount: 300, unit: 'g' }, { amount: 1, unit: 'kg' })).toEqual({ amount: 1300, unit: 'g' });
    expect(addStock({ amount: 0.5, unit: 'l' }, { amount: 200, unit: 'ml' })).toEqual({ amount: 0.7, unit: 'l' });
  });
  it('rounds away float noise', () => {
    expect(addStock({ amount: 0.1, unit: 'kg' }, { amount: 0.2, unit: 'kg' })).toEqual({ amount: 0.3, unit: 'kg' });
  });
  it('returns null for units that cannot be added', () => {
    expect(addStock({ amount: 2, unit: 'pcs' }, { amount: 100, unit: 'g' })).toBeNull();
  });
});
