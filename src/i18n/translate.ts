import type { Lang } from '../domain/types';
import { en, type TranslationKey } from './en';
import { ja } from './ja';

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, ja };

export type TranslateParams = Record<string, string | number>;
export type TFunction = (key: TranslationKey, params?: TranslateParams) => string;

export function translate(lang: Lang, key: TranslationKey, params?: TranslateParams): string {
  const template = dictionaries[lang][key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
