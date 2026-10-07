import { toAsciiDigits } from '../unitAliases';
import type { ParsedRecipe } from './types';

const LD_JSON_TYPE = /\stype\s*=\s*["']?application\/ld\+json/i;

/**
 * Yields the body of every `<script type="application/ld+json">` block. The page is
 * untrusted, so this scans with indexOf in one linear pass; a single regex over the
 * whole page backtracks quadratically on inputs such as many unclosed `<script` tags.
 */
function* ldJsonBlocks(html: string): Generator<string> {
  const lower = html.toLowerCase();
  let pos = 0;
  for (;;) {
    const start = lower.indexOf('<script', pos);
    if (start === -1) return;
    const tagEnd = lower.indexOf('>', start);
    if (tagEnd === -1) return;
    const close = lower.indexOf('</script', tagEnd);
    if (close === -1) return;
    pos = close + '</script'.length;
    if (LD_JSON_TYPE.test(html.slice(start + '<script'.length, tagEnd))) yield html.slice(tagEnd + 1, close);
  }
}

function isRecipe(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const type = (value as Record<string, unknown>)['@type'];
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function findRecipe(node: unknown): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findRecipe(child);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== 'object' || node === null) return null;
  if (isRecipe(node)) return node as Record<string, unknown>;
  for (const value of Object.values(node as Record<string, unknown>)) {
    const found = findRecipe(value);
    if (found) return found;
  }
  return null;
}

function toSteps(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((step) => {
      if (typeof step === 'string') return step.trim();
      if (typeof step === 'object' && step !== null) {
        const record = step as Record<string, unknown>;
        const text = record.text ?? record.name;
        return typeof text === 'string' ? text.trim() : '';
      }
      return '';
    })
    .filter(Boolean);
}

function toServings(value: unknown): number | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  if (typeof text === 'number') return text > 0 ? Math.round(text) : undefined;
  if (typeof text !== 'string') return undefined;
  const match = /(\d+)/.exec(toAsciiDigits(text));
  return match ? Number(match[1]) : undefined;
}

/** Reads the first schema.org Recipe in the page; a malformed block never stops the scan. */
export function parseJsonLdRecipe(html: string): ParsedRecipe | null {
  for (const block of ldJsonBlocks(html)) {
    let recipe: Record<string, unknown> | null;
    try {
      // findRecipe recurses, so pathologically deep JSON is skipped like malformed JSON.
      recipe = findRecipe(JSON.parse(block.trim()));
    } catch {
      continue;
    }
    if (!recipe) continue;
    const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [];
    return {
      name: typeof recipe.name === 'string' ? recipe.name : undefined,
      servings: toServings(recipe.recipeYield),
      ingredients: rawIngredients
        .filter((line): line is string => typeof line === 'string')
        .map((line) => ({ raw: line, name: line })),
      steps: toSteps(recipe.recipeInstructions),
    };
  }
  return null;
}
