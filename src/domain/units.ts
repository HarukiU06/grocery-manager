import { CONVERSIONS } from '../data/conversions';
import type { Unit } from './types';

export const DEFAULT_DENSITY = 1;
export const TBSP_ML = 15;
export const TSP_ML = 5;
export const CUP_ML = 200;
export const PINCH_G = 1;

const COUNTABLE: ReadonlySet<Unit> = new Set<Unit>([
  'pcs',
  'clove',
  'slice',
  'bunch',
  'sheet',
  'can',
  'pack',
  'stalk',
]);

/**
 * Grams for one amount of one unit of one ingredient, or null when it cannot be known.
 * Callers report null rather than guessing, so an estimate never invents a number.
 */
export function toGrams(amount: number, unit: Unit, ingredientId: string): number | null {
  const conversion = CONVERSIONS[ingredientId];
  const density = conversion?.densityGPerMl ?? DEFAULT_DENSITY;
  const tbsp = conversion?.gramsPerTbsp ?? TBSP_ML * density;
  switch (unit) {
    case 'g':
      return amount;
    case 'kg':
      return amount * 1000;
    case 'ml':
      return amount * density;
    case 'l':
      return amount * 1000 * density;
    case 'tbsp':
      return amount * tbsp;
    case 'tsp':
      return amount * tbsp * (TSP_ML / TBSP_ML);
    case 'cup':
      return amount * CUP_ML * density;
    case 'pinch':
      return amount * PINCH_G;
    default:
      break;
  }
  if (COUNTABLE.has(unit)) {
    return conversion?.pieceUnit === unit && conversion.gramsPerPiece !== undefined
      ? amount * conversion.gramsPerPiece
      : null;
  }
  return null;
}
