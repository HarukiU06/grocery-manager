import { describe, expect, it } from 'vitest';
import { groupByWeek, weekStart } from './cookingLog';
import { emptyTotals } from './nutrition';
import type { CookEntry } from './types';

const entry = (id: string, cookedOn: string, energy?: number): CookEntry => ({
  id,
  recipeId: `r-${id}`,
  recipeName: { en: `Recipe ${id}` },
  servings: 2,
  cookedOn,
  ...(energy === undefined ? {} : { nutrition: { ...emptyTotals(), energy } }),
});

describe('weekStart', () => {
  it('returns the Monday of that week', () => {
    expect(weekStart('2026-09-19')).toBe('2026-09-14');
    expect(weekStart('2026-09-14')).toBe('2026-09-14');
    expect(weekStart('2026-09-20')).toBe('2026-09-14');
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
  });
  it('works across a year boundary', () => {
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('groupByWeek', () => {
  it('groups newest week first, newest entry first', () => {
    const weeks = groupByWeek([
      entry('a', '2026-09-14', 600),
      entry('b', '2026-09-16', 400),
      entry('c', '2026-09-23', 800),
    ]);
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-09-21', '2026-09-14']);
    expect(weeks[1].entries.map((e) => e.id)).toEqual(['b', 'a']);
  });
  it('totals nutrition and averages over recorded days', () => {
    const weeks = groupByWeek([
      entry('a', '2026-09-14', 600),
      entry('b', '2026-09-14', 400),
      entry('c', '2026-09-16', 500),
    ]);
    expect(weeks[0].recordedDays).toBe(2);
    expect(weeks[0].total.energy).toBe(1500);
    expect(weeks[0].averagePerRecordedDay.energy).toBe(750);
    expect(weeks[0].withoutNutrition).toBe(0);
  });
  it('counts entries with no nutrition snapshot', () => {
    const weeks = groupByWeek([entry('a', '2026-09-14'), entry('b', '2026-09-14', 500)]);
    expect(weeks[0].withoutNutrition).toBe(1);
    expect(weeks[0].total.energy).toBe(500);
  });
  it('returns an empty list for no entries', () => {
    expect(groupByWeek([])).toEqual([]);
  });
});
