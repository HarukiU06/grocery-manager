import { describe, expect, it } from 'vitest';
import { localize, localizeList, otherLang } from './localize';

describe('localize', () => {
  it('returns the requested language', () => {
    expect(localize({ ja: '玉ねぎ', en: 'Onion' }, 'ja')).toBe('玉ねぎ');
    expect(localize({ ja: '玉ねぎ', en: 'Onion' }, 'en')).toBe('Onion');
  });
  it('falls back to the other language', () => {
    expect(localize({ en: 'Onion' }, 'ja')).toBe('Onion');
    expect(localize({ ja: '玉ねぎ' }, 'en')).toBe('玉ねぎ');
  });
  it('returns empty string for missing text', () => {
    expect(localize(undefined, 'ja')).toBe('');
    expect(localize({}, 'en')).toBe('');
  });
  it('localizeList falls back when the list is missing or empty', () => {
    expect(localizeList({ ja: ['a'], en: ['b'] }, 'en')).toEqual(['b']);
    expect(localizeList({ ja: ['a'], en: [] }, 'en')).toEqual(['a']);
    expect(localizeList(undefined, 'en')).toEqual([]);
  });
  it('otherLang flips', () => {
    expect(otherLang('ja')).toBe('en');
    expect(otherLang('en')).toBe('ja');
  });
});
