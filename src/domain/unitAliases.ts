import type { Quantity, Unit } from './types';

/** Full-width digits and period to ASCII, so pasted text parses like typed text. */
export function toAsciiDigits(text: string): string {
  return text
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/．/g, '.');
}

const UNIT_ALIASES: ReadonlyArray<readonly [Unit, readonly string[]]> = [
  ['g', ['g', 'グラム', 'ｇ']],
  ['kg', ['kg', 'キロ', 'キログラム']],
  ['ml', ['ml', 'cc', 'ミリリットル']],
  ['l', ['l', 'リットル']],
  ['pcs', ['個', 'こ', 'コ', 'pcs', 'piece', 'pieces']],
  ['tbsp', ['大さじ', '大匙', 'tbsp']],
  ['tsp', ['小さじ', '小匙', 'tsp']],
  ['cup', ['カップ', 'cup']],
  ['clove', ['片', 'かけ', 'clove']],
  ['slice', ['枚', 'まい', 'slice', 'slices']],
  ['bunch', ['束', 'たば', 'bunch']],
  ['sheet', ['sheet']],
  ['can', ['缶', 'かん', 'can']],
  ['pack', ['パック', '袋', 'pack']],
  ['stalk', ['本', 'ほん', 'stalk']],
  ['pinch', ['つまみ', 'ひとつまみ', 'pinch']],
];

const ALIAS_TO_UNIT = new Map<string, Unit>(
  UNIT_ALIASES.flatMap(([unit, aliases]) => aliases.map((alias) => [alias.toLowerCase(), unit] as const)),
);

export function unitFromAlias(text: string): Unit | null {
  return ALIAS_TO_UNIT.get(text.trim().toLowerCase()) ?? null;
}

/** Japanese writes spoon and cup measures unit first, as in 大さじ2. */
const PREFIX_UNITS = /^(大さじ|大匙|小さじ|小匙|カップ)\s*(\d+(?:\.\d+)?)$/;

/** "300g", "2 個" and "大さじ2" become a Quantity; a bare number means pieces; anything else is null. */
export function parseQuantityText(text: string): Quantity | null {
  const normalized = toAsciiDigits(text).trim();
  const prefixed = PREFIX_UNITS.exec(normalized);
  if (prefixed) {
    const amount = Number(prefixed[2]);
    const unit = unitFromAlias(prefixed[1]);
    if (unit && Number.isFinite(amount) && amount > 0) return { amount, unit };
    return null;
  }
  const match = /^(\d+(?:\.\d+)?)\s*(.*)$/.exec(normalized);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const unitText = match[2].trim();
  if (!unitText) return { amount, unit: 'pcs' };
  const unit = unitFromAlias(unitText);
  return unit ? { amount, unit } : null;
}
