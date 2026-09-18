import { describe, expect, it } from 'vitest';
import { emptyTotals } from './nutrition';
import { percentOfTarget, targetsFor } from './targets';

describe('targets', () => {
  it('returns null when targets are off', () => {
    expect(targetsFor('off')).toBeNull();
  });
  it('gives a lower energy target for the adult female profile', () => {
    expect(targetsFor('adult_female')!.energy).toBeLessThan(targetsFor('adult_male')!.energy);
  });
  it('computes percentages and clamps the display at 200', () => {
    const totals = { ...emptyTotals(), energy: 1325, salt: 100 };
    const pct = percentOfTarget(totals, 'adult_male');
    expect(pct.energy).toBeCloseTo(50, 0);
    expect(pct.salt).toBe(200);
  });
  it('returns an empty object when targets are off', () => {
    expect(percentOfTarget(emptyTotals(), 'off')).toEqual({});
  });
});
