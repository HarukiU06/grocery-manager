import type { Ingredient } from './types';

/** NFKC folds full-width forms; katakana (U+30A1–U+30F6) shifts to hiragana. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

function searchTerms(ingredient: Ingredient): string[] {
  return [ingredient.name.ja, ingredient.name.en, ...(ingredient.aliases ?? [])]
    .filter((term): term is string => Boolean(term))
    .map(normalizeForSearch);
}

export function searchIngredients(all: Ingredient[], query: string, limit = 20): Ingredient[] {
  const q = normalizeForSearch(query);
  if (!q) return [];
  const scored: Array<{ ingredient: Ingredient; score: number }> = [];
  for (const ingredient of all) {
    const terms = searchTerms(ingredient);
    if (terms.some((term) => term === q)) scored.push({ ingredient, score: 0 });
    else if (terms.some((term) => term.startsWith(q))) scored.push({ ingredient, score: 1 });
    else if (terms.some((term) => term.includes(q))) scored.push({ ingredient, score: 2 });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((entry) => entry.ingredient);
}

export function hasExactMatch(all: Ingredient[], query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return false;
  return all.some((ingredient) => searchTerms(ingredient).includes(q));
}
