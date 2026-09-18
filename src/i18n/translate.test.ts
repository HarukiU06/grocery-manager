import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ja } from './ja';
import { translate } from './translate';

describe('translate', () => {
  it('returns strings in each language', () => {
    expect(translate('en', 'nav.pantry')).toBe('Pantry');
    expect(translate('ja', 'nav.pantry')).toBe('在庫');
  });
  it('interpolates params', () => {
    expect(translate('en', 'servings.label', { count: 3 })).toBe('3 servings');
    expect(translate('ja', 'servings.label', { count: 3 })).toBe('3人分');
  });
  it('leaves unknown placeholders untouched', () => {
    expect(translate('en', 'servings.label', {})).toBe('{count} servings');
  });
  it('has every English key in Japanese', () => {
    for (const key of Object.keys(en)) {
      expect(ja[key as keyof typeof en], key).toBeTruthy();
    }
  });
});
