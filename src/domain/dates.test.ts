import { describe, expect, it } from 'vitest';
import { addDays, daysUntil, expiryStatus, isValidIsoDate, todayIso } from './dates';

describe('dates', () => {
  it('formats today as local ISO date', () => {
    expect(todayIso(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18');
  });
  it('adds days across month boundaries', () => {
    expect(addDays('2026-09-29', 3)).toBe('2026-10-02');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('computes days until a date', () => {
    expect(daysUntil('2026-09-21', '2026-09-18')).toBe(3);
    expect(daysUntil('2026-09-17', '2026-09-18')).toBe(-1);
  });
  it('validates ISO dates', () => {
    expect(isValidIsoDate('2026-09-18')).toBe(true);
    expect(isValidIsoDate('2026-13-40')).toBe(false);
    expect(isValidIsoDate('nope')).toBe(false);
  });
  it('classifies expiry status with a 3-day window', () => {
    const today = '2026-09-18';
    expect(expiryStatus(undefined, today)).toBe('ok');
    expect(expiryStatus('2026-09-22', today)).toBe('ok');
    expect(expiryStatus('2026-09-21', today)).toBe('soon');
    expect(expiryStatus('2026-09-18', today)).toBe('soon');
    expect(expiryStatus('2026-09-17', today)).toBe('expired');
    expect(expiryStatus('garbage', today)).toBe('ok');
  });
});
