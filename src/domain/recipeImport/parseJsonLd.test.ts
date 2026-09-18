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
});
