import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRecipeHtml, isFetchableUrl } from './fetchRecipe';

describe('fetchRecipeHtml', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts only http and https URLs', () => {
    expect(isFetchableUrl('https://example.com/recipe')).toBe(true);
    expect(isFetchableUrl('http://example.com/recipe')).toBe(true);
    expect(isFetchableUrl('javascript:alert(1)')).toBe(false);
    expect(isFetchableUrl('file:///etc/passwd')).toBe(false);
    expect(isFetchableUrl('my pantry notes')).toBe(false);
  });
  it('never contacts a relay for other input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchRecipeHtml('not a url')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
