import { describe, expect, it } from 'vitest';
import { hasExactMatch, normalizeForSearch, searchIngredients } from './search';
import type { Ingredient } from './types';

const ing = (id: string, ja: string, en: string, aliases?: string[]): Ingredient => ({
  id,
  name: { ja, en },
  category: 'vegetable',
  aliases,
  isPreset: true,
});

const catalog = [
  ing('onion', '玉ねぎ', 'Onion', ['たまねぎ']),
  ing('green-onion', '長ねぎ', 'Green onion (negi)', ['ねぎ']),
  ing('carrot', 'にんじん', 'Carrot', ['人参']),
  ing('tomato', 'トマト', 'Tomato'),
];

describe('normalizeForSearch', () => {
  it('lowercases, trims, converts full-width and katakana to hiragana', () => {
    expect(normalizeForSearch('  Onion ')).toBe('onion');
    expect(normalizeForSearch('トマト')).toBe('とまと');
    expect(normalizeForSearch('ＴＯＭＡＴＯ')).toBe('tomato');
  });
});

describe('searchIngredients', () => {
  it('returns nothing for an empty query', () => {
    expect(searchIngredients(catalog, '   ')).toEqual([]);
  });
  it('matches English, Japanese and aliases case-insensitively', () => {
    expect(searchIngredients(catalog, 'CARR').map((i) => i.id)).toEqual(['carrot']);
    expect(searchIngredients(catalog, '人参').map((i) => i.id)).toEqual(['carrot']);
    expect(searchIngredients(catalog, 'たまねぎ').map((i) => i.id)).toEqual(['onion']);
  });
  it('treats katakana and hiragana as equivalent', () => {
    expect(searchIngredients(catalog, 'とまと').map((i) => i.id)).toEqual(['tomato']);
  });
  it('ranks exact, then prefix, then substring matches', () => {
    expect(searchIngredients(catalog, 'onion').map((i) => i.id)).toEqual(['onion', 'green-onion']);
    expect(searchIngredients(catalog, 'ねぎ').map((i) => i.id)).toEqual(['green-onion', 'onion']);
  });
  it('respects the limit', () => {
    expect(searchIngredients(catalog, 'n', 2)).toHaveLength(2);
  });
});

describe('hasExactMatch', () => {
  it('detects an exact name or alias match', () => {
    expect(hasExactMatch(catalog, 'onion')).toBe(true);
    expect(hasExactMatch(catalog, 'Onions')).toBe(false);
    expect(hasExactMatch(catalog, '')).toBe(false);
  });
});
