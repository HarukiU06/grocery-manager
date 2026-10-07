/**
 * A static page cannot read another site directly, so the fetch goes through a public
 * relay. The screen tells the user that the URL leaves the device before this runs.
 * Every relay host must also be listed in connect-src in the CSP in vite.config.ts.
 */
export const PROXIES: ReadonlyArray<(url: string) => string> = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://r.jina.ai/${url}`,
];

export const FETCH_TIMEOUT_MS = 8000;

export function isFetchableUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Returns the page text, or null when the URL is not http(s) or every relay fails. */
export async function fetchRecipeHtml(url: string): Promise<string | null> {
  // Only web pages are sent to the relays; anything else typed in the box stays local.
  if (!isFetchableUrl(url)) return null;
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
