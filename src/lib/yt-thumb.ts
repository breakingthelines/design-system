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

/**
 * Rewrite a YouTube thumbnail URL to `hqdefault` resolution.
 *
 * `hqdefault.jpg` (480×360) is the highest resolution **guaranteed** to exist
 * for every valid YouTube video. Higher resolutions (`maxresdefault`,
 * `sddefault`) are unavailable for many videos and requesting them produces
 * browser-level "Failed to load resource: 404" console errors that **no**
 * JavaScript mechanism can suppress — not `<img onError>`, not `fetch()`,
 * not `new Image()`. The only solution is to never request them.
 *
 * Pure string operation — zero network requests, zero 404 risk.
 */
export function safeYtThumbnail(url: string): string {
  const m = url.match(YT_THUMB_RE);
  if (!m) return url;
  const currentRes = m[2];
  if (currentRes === 'hqdefault' || currentRes === 'mqdefault' || currentRes === 'default') {
    return url;
  }
  return url.replace(`/${currentRes}.`, '/hqdefault.');
}
