/** YouTube thumbnail resolution fallback utilities. */

const YT_THUMB_RE = /(?:i\d*\.ytimg\.com|img\.youtube\.com)\/vi\/([^/]+)\/([^/.]+)/;
const YT_RESOLUTIONS = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'] as const;

/** Extract the video ID from a YouTube thumbnail URL, or null. */
export function extractYtVideoId(url: string): string | null {
  const m = url.match(YT_THUMB_RE);
  return m?.[1] ?? null;
}

/** Return the next lower-resolution YouTube thumbnail URL, or null if exhausted. */
export function nextYtResolution(src: string): string | null {
  const m = src.match(YT_THUMB_RE);
  if (!m) return null;
  const currentRes = m[2];
  const idx = YT_RESOLUTIONS.indexOf(currentRes as typeof YT_RESOLUTIONS[number]);
  if (idx === -1 || idx >= YT_RESOLUTIONS.length - 1) return null;
  return src.replace(`/${currentRes}.`, `/${YT_RESOLUTIONS[idx + 1]}.`);
}

/* ── Fetch-based resolution probe ──────────────────────────────────────────── */

/** Global cache — deduplicates in-flight probes and caches resolved URLs. */
const resolveCache = new Map<string, Promise<string | null>>();

/**
 * Resolve a YouTube thumbnail URL to the highest available resolution
 * using `fetch()` HEAD requests. Because `fetch()` 404s do NOT produce
 * browser console errors (unlike `<img src>`), this eliminates the
 * "Failed to load resource: 404" noise entirely.
 *
 * Returns the first resolution that responds 200, or:
 * - `null` if all resolutions return non-200 (video truly unavailable)
 * - the original `url` if fetch itself throws (CORS/network — graceful degradation)
 *
 * Results are cached globally so each URL is probed at most once.
 */
export function resolveYtThumbnail(url: string): Promise<string | null> {
  if (!extractYtVideoId(url)) return Promise.resolve(url);

  const cached = resolveCache.get(url);
  if (cached) return cached;

  const promise = (async (): Promise<string | null> => {
    let current: string | null = url;
    while (current) {
      try {
        const res = await fetch(current, { method: 'HEAD' });
        if (res.ok) return current;
      } catch {
        // CORS or network error — fetch can't probe this CDN.
        // Return original URL so <img> still gets a chance.
        return url;
      }
      current = nextYtResolution(current);
    }
    return null;
  })();

  resolveCache.set(url, promise);
  return promise;
}
