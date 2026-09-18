import type { Lang, LocalizedText, RecipeSteps } from './types';

export function otherLang(lang: Lang): Lang {
  return lang === 'ja' ? 'en' : 'ja';
}

export function localize(text: LocalizedText | undefined, lang: Lang): string {
  if (!text) return '';
  return text[lang] || text[otherLang(lang)] || '';
}

export function localizeList(lists: RecipeSteps | undefined, lang: Lang): string[] {
  if (!lists) return [];
  const primary = lists[lang];
  if (primary && primary.length > 0) return primary;
  return lists[otherLang(lang)] ?? [];
}
