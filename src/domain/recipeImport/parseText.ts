import { searchIngredients } from '../search';
import type { Ingredient, Unit } from '../types';
import { toAsciiDigits, unitFromAlias } from '../unitAliases';
import type { ParsedIngredientLine, ParsedRecipe } from './types';

const NO_AMOUNT = ['適量', '少々', 'お好みで', '少量', 'to taste'];
const BULLET = /^[\s・*\-–—•‣●○◦\u3000]*(?:\d+[.)]\s*)?/;
/** Japanese spoon and cup measures put the unit before the number. */
const PREFIX_UNIT = /^(.*?)(大さじ|大匙|小さじ|小匙|カップ)\s*(\d+(?:\.\d+)?(?:\/\d+)?)$/;
const TRAILING = /^(.*?)[\s:：]*(\d+(?:\.\d+)?(?:\/\d+)?)\s*([^\s\d]*)$/;
const LEADING = /^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([^\s\d]*)\s+(.+)$/;

function parseNumber(text: string): number | null {
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) {
    const value = Number(fraction[1]) / Number(fraction[2]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

interface SplitLine {
  name: string;
  amount?: number;
  unit?: Unit;
}

/** Pulls an amount out of one line, leaving the ingredient name. */
function splitLine(line: string): SplitLine {
  const cleaned = toAsciiDigits(line.replace(BULLET, ''))
    .replace(/[\t\u3000]+/g, ' ')
    .trim();

  if (NO_AMOUNT.some((word) => cleaned.includes(word))) {
    let name = cleaned;
    for (const word of NO_AMOUNT) name = name.replace(word, '');
    return { name: name.trim() };
  }

  const prefixed = PREFIX_UNIT.exec(cleaned);
  if (prefixed) {
    const amount = parseNumber(prefixed[3]);
    const unit = unitFromAlias(prefixed[2]);
    if (amount !== null && unit) return { name: prefixed[1].trim(), amount, unit };
  }

  const trailing = TRAILING.exec(cleaned);
  if (trailing && trailing[1].trim()) {
    const amount = parseNumber(trailing[2]);
    if (amount !== null) {
      const unit = trailing[3] ? unitFromAlias(trailing[3]) : 'pcs';
      return { name: trailing[1].trim(), amount, unit: unit ?? 'pcs' };
    }
  }

  const leading = LEADING.exec(cleaned);
  if (leading) {
    const amount = parseNumber(leading[1]);
    if (amount !== null) {
      const unit = leading[2] ? unitFromAlias(leading[2]) : 'pcs';
      return { name: leading[3].trim(), amount, unit: unit ?? 'pcs' };
    }
  }

  return { name: cleaned };
}

function resolve(name: string, catalog: Ingredient[]): string | undefined {
  if (!name) return undefined;
  const hits = searchIngredients(catalog, name, 1);
  return hits.length > 0 ? hits[0].id : undefined;
}

/**
 * One line per ingredient. Lines that resolve to nothing and carry no amount are
 * dropped, which removes headings and stray page furniture.
 */
export function parseIngredientLines(text: string, catalog: Ingredient[]): ParsedIngredientLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const { name, amount, unit } = splitLine(line);
      return {
        raw: line,
        name,
        ingredientId: resolve(name, catalog),
        ...(amount !== undefined ? { amount } : {}),
        ...(unit ? { unit } : {}),
      };
    })
    .filter((row) => row.name.length > 0 && (row.ingredientId !== undefined || row.amount !== undefined));
}

/** Whole-page text: every line is treated as a possible ingredient, steps stay empty. */
export function parseRecipeText(text: string, catalog: Ingredient[]): ParsedRecipe {
  return { ingredients: parseIngredientLines(text, catalog), steps: [] };
}
