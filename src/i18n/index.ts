import { useCallback } from 'react';
import type { Lang } from '../domain/types';
import { useAppStore } from '../store/useAppStore';
import { translate, type TFunction, type TranslateParams } from './translate';

export { translate } from './translate';
export type { TFunction, TranslateParams } from './translate';
export type { TranslationKey } from './en';

export function useLang(): Lang {
  return useAppStore((s) => s.language);
}

export function useT(): TFunction {
  const lang = useLang();
  return useCallback((key, params?: TranslateParams) => translate(lang, key, params), [lang]);
}
