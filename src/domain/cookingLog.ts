import { addDays } from './dates';
import { emptyTotals } from './nutrition';
import { NUTRIENT_KEYS, type CookEntry, type NutritionTotals } from './types';

export interface LogWeek {
  weekStart: string;
  entries: CookEntry[];
  recordedDays: number;
  withoutNutrition: number;
  total: NutritionTotals;
  averagePerRecordedDay: NutritionTotals;
}

/** The Monday on or before the given date. */
export function weekStart(iso: string): string {
  const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const backToMonday = day === 0 ? 6 : day - 1;
  return addDays(iso, -backToMonday);
}

/**
 * Newest week first, newest entry first. The average divides by days that carry an
 * entry rather than by seven, so a week with two cooked days reads honestly.
 */
export function groupByWeek(entries: CookEntry[]): LogWeek[] {
  const byWeek = new Map<string, CookEntry[]>();
  for (const entry of entries) {
    const key = weekStart(entry.cookedOn);
    byWeek.set(key, [...(byWeek.get(key) ?? []), entry]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([start, weekEntries]) => {
      const sorted = [...weekEntries].sort((a, b) => b.cookedOn.localeCompare(a.cookedOn));
      const total = emptyTotals();
      let withoutNutrition = 0;
      for (const entry of sorted) {
        if (!entry.nutrition) {
          withoutNutrition += 1;
          continue;
        }
        for (const key of NUTRIENT_KEYS) total[key] += entry.nutrition[key];
      }
      const recordedDays = new Set(sorted.map((e) => e.cookedOn)).size;
      const average = emptyTotals();
      for (const key of NUTRIENT_KEYS) {
        const value = total[key] / Math.max(1, recordedDays);
        average[key] = key === 'energy' ? Math.round(value) : Math.round(value * 10) / 10;
        total[key] = key === 'energy' ? Math.round(total[key]) : Math.round(total[key] * 10) / 10;
      }
      return {
        weekStart: start,
        entries: sorted,
        recordedDays,
        withoutNutrition,
        total,
        averagePerRecordedDay: average,
      };
    });
}
