import type { TranslationKey } from '../i18n/en';
import { localize } from './localize';
import type { Lang, RecipeIngredient, Unit } from './types';

type UnitTranslator = (key: TranslationKey) => string;

const JA_PREFIX_UNITS: ReadonlySet<Unit> = new Set<Unit>(['tbsp', 'tsp', 'cup']);

export function scaleAmount(amount: number, baseServings: number, targetServings: number): number {
  if (baseServings <= 0) return amount;
  return Math.round(((amount * targetServings) / baseServings) * 10) / 10;
}

export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatQuantity(amount: number, unit: Unit | undefined, lang: Lang, t: UnitTranslator): string {
  const n = formatNumber(amount);
  if (!unit) return n;
  const label = t(`unit.${unit}`);
  if (lang === 'ja') return JA_PREFIX_UNITS.has(unit) ? `${label}${n}` : `${n}${label}`;
  return `${n} ${label}`;
}

export function formatIngredientAmount(
  ri: RecipeIngredient,
  baseServings: number,
  servings: number,
  lang: Lang,
  t: UnitTranslator,
): string {
  if (ri.amount === undefined) return localize(ri.note, lang) || t('recipe.toTaste');
  return formatQuantity(scaleAmount(ri.amount, baseServings, servings), ri.unit, lang, t);
}
