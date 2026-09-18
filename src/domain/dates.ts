export const EXPIRING_SOON_DAYS = 3;
const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function isValidIsoDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const ms = parseIso(iso);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === iso;
}

export function addDays(iso: string, days: number): string {
  return new Date(parseIso(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntil(target: string, today: string): number {
  return Math.round((parseIso(target) - parseIso(today)) / DAY_MS);
}

export type ExpiryStatus = 'ok' | 'soon' | 'expired';

export function expiryStatus(expiresOn: string | undefined, today: string): ExpiryStatus {
  if (!expiresOn || !isValidIsoDate(expiresOn)) return 'ok';
  const days = daysUntil(expiresOn, today);
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'soon';
  return 'ok';
}
