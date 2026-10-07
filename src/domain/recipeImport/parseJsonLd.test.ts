import { describe, expect, it } from 'vitest';
import { parseJsonLdRecipe } from './parseJsonLd';

const page = (body: string) => `<html><head>${body}</head><body></body></html>`;

describe('parseJsonLdRecipe', () => {
  it('reads a plain Recipe block', () => {
    const html = page(
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'Recipe',
        name: '肉じゃが',
        recipeIngredient: ['じゃがいも 3個', '牛薄切り肉 200g'],
        recipeInstructions: ['切る', '煮る'],
        recipeYield: '2人分',
      })}</script>`,
    );
    const parsed = parseJsonLdRecipe(html);
    expect(parsed?.name).toBe('肉じゃが');
    expect(parsed?.ingredients.map((i) => i.raw)).toEqual(['じゃがいも 3個', '牛薄切り肉 200g']);
    expect(parsed?.steps).toEqual(['切る', '煮る']);
    expect(parsed?.servings).toBe(2);
  });
  it('finds a Recipe inside @graph and survives a malformed sibling', () => {
    const html = page(
      `<script type="application/ld+json">{not json}</script>` +
        `<script type="application/ld+json">${JSON.stringify({
          '@graph': [{ '@type': 'WebPage' }, { '@type': ['Recipe'], name: 'Curry', recipeIngredient: ['rice 300 g'] }],
        })}</script>`,
    );
    expect(parseJsonLdRecipe(html)?.name).toBe('Curry');
  });
  it('reads HowToStep instructions', () => {
    const html = page(
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'Recipe',
        name: 'X',
        recipeIngredient: [],
        recipeInstructions: [
          { '@type': 'HowToStep', text: 'Boil water' },
          { '@type': 'HowToStep', text: 'Serve' },
        ],
      })}</script>`,
    );
    expect(parseJsonLdRecipe(html)?.steps).toEqual(['Boil water', 'Serve']);
  });
  it('returns null when there is no recipe', () => {
    expect(parseJsonLdRecipe(page(''))).toBeNull();
  });
  it('accepts attribute order and case variations', () => {
    const html = `<SCRIPT id="x" TYPE='application/ld+json'>${JSON.stringify({ '@type': 'Recipe', name: 'Soup' })}</SCRIPT>`;
    expect(parseJsonLdRecipe(html)?.name).toBe('Soup');
  });
  it('stays fast on hostile markup', () => {
    const started = Date.now();
    parseJsonLdRecipe('<script a'.repeat(50_000));
    parseJsonLdRecipe('<script type="application/ld+json">'.repeat(50_000));
    parseJsonLdRecipe(`<script type="application/ld+json">${'['.repeat(100_000)}${']'.repeat(100_000)}</script>`);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
