import { DAILY_TARGETS } from '../data/targets';
import { NUTRIENT_KEYS, type NutrientKey, type NutritionTargetKey, type NutritionTotals } from './types';

export const MAX_DISPLAY_PERCENT = 200;

export function targetsFor(key: NutritionTargetKey): NutritionTotals | null {
  return key === 'off' ? null : DAILY_TARGETS[key];
}

/** Percentage of the daily reference intake, clamped so one huge value cannot break the layout. */
export function percentOfTarget(
  totals: NutritionTotals,
  key: NutritionTargetKey,
): Partial<Record<NutrientKey, number>> {
  const target = targetsFor(key);
  if (!target) return {};
  const out: Partial<Record<NutrientKey, number>> = {};
  for (const nutrient of NUTRIENT_KEYS) {
    const goal = target[nutrient];
    if (goal > 0) {
      out[nutrient] = Math.min(MAX_DISPLAY_PERCENT, Math.round((totals[nutrient] / goal) * 1000) / 10);
    }
  }
  return out;
}
