/**
 * A static page cannot read another site directly, so the fetch goes through a public
 * relay. The screen tells the user that the URL leaves the device before this runs.
 */
export const PROXIES: ReadonlyArray<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/${url}`,
];

export const FETCH_TIMEOUT_MS = 8000;

/** Returns the page text, or null when every relay fails. */
export async function fetchRecipeHtml(url: string): Promise<string | null> {
  for (const build of PROXIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(build(url), { signal: controller.signal });
      if (!response.ok) continue;
      const text = await response.text();
      if (text.trim()) return text;
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}
