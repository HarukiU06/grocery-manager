import type { Quantity, Unit } from './types';
import { CUP_ML, TBSP_ML, TSP_ML } from './units';

/** Units that convert exactly within one dimension. Countable units only combine with themselves. */
const FACTORS: Partial<Record<Unit, { dimension: 'mass' | 'volume'; base: number }>> = {
  g: { dimension: 'mass', base: 1 },
  kg: { dimension: 'mass', base: 1000 },
  ml: { dimension: 'volume', base: 1 },
  l: { dimension: 'volume', base: 1000 },
  tbsp: { dimension: 'volume', base: TBSP_ML },
  tsp: { dimension: 'volume', base: TSP_ML },
  cup: { dimension: 'volume', base: CUP_ML },
};

/** Rounds away float noise such as 0.1 + 0.2. */
function tidy(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Converts an amount into another unit, or null when the units cannot be combined
 * without knowing the ingredient (mass vs volume, countable units).
 */
export function convertAmount(amount: number, from: Unit, to: Unit): number | null {
  if (from === to) return amount;
  const a = FACTORS[from];
  const b = FACTORS[to];
  if (!a || !b || a.dimension !== b.dimension) return null;
  return (amount * a.base) / b.base;
}

/**
 * Stock after a purchase: what is on hand plus what was bought, kept in the unit already on hand.
 * Returns null when the two quantities are in units that cannot be added together.
 */
export function addStock(existing: Quantity | undefined, bought: Quantity): Quantity | null {
  if (!existing) return { amount: tidy(bought.amount), unit: bought.unit };
  const converted = convertAmount(bought.amount, bought.unit, existing.unit);
  if (converted === null) return null;
  return { amount: tidy(existing.amount + converted), unit: existing.unit };
}
