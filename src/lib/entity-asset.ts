/**
 * Entity asset resolver — deterministic-by-convention.
 *
 * Every football entity asset lives at a deterministic CDN address keyed by
 * canonical id + role:  `${cdnBase}/<layer>/<seg>/<id>.<ext>`. Resolution is a
 * CONVENTION, not a lookup — given (kind, role, id) the URL is pure string
 * construction, so the render path needs no manifest, no RPC, and no coverage
 * gate. (The coverage gate is exactly what made a crest render a monogram while
 * it was 200 on the CDN.) The browser's own 200/404 is the source of truth:
 * callers render optimistically and fall back to a monogram `onError`.
 *
 * role → (layer, seg, ext) — the PINNED address contract:
 *   crest   team        → provider/crest/<id>.png
 *   crest   competition → provider/competition/<id>.png
 *   avatar  player      → apifootball/player/<id>.png   (small round headshot)
 *   hero    player      → wikimedia/player/<id>.jpg      (high-res portrait)
 *   hero    manager     → wikimedia/manager/<id>.jpg
 *   flag    nation      → flags/<iso2>.svg               (id = iso2)
 *
 * The resolver NEVER emits a non-BTL-CDN URL. A backend-supplied `imageUrl` is
 * honoured only when it is BTL-CDN-safe (a relative R2 key, or an absolute
 * `cdn.breakingthelines.*` URL); a raw provider hotlink (`media.api-sports.io…`)
 * is ignored and the deterministic address is built from the id instead. This
 * is the single choke-point that keeps CORS-tainting provider hotlinks off every
 * surface (including the WebGL magazine reader). The `hero` role additionally
 * IGNORES `imageUrl` entirely — identity's baked `image_url` points at the
 * low-res headshot for most people, so the high-res hero is always built by
 * convention.
 *
 * Pure: takes `cdnBase` as an argument (the host injects
 * `getPublicRuntimeConfig().mediaCdnBase`, which already ends in `/media`).
 *
 * Supersedes the manifest resolver `entityImage` (coverage-gated) and unifies
 * the platform builders `crestUrl`, `playerHeroSrc`, `heroUrl`, `countryFlagUrl`
 * and the passthrough `resolveMediaUrl`. See the charter
 * `ENTITY_ASSET_RESOLUTION_GOAL.md` and ADR-036.
 */

/** Canonical entity kind (maps to identity entity types; `coach`→manager). */
export type EntityAssetKind = 'team' | 'competition' | 'player' | 'manager' | 'nation';

/** Which image of an entity is wanted. Part of the address. */
export type EntityAssetRole = 'crest' | 'avatar' | 'hero' | 'flag';

interface AddressSpec {
  readonly layer: string;
  readonly seg: string;
  readonly ext: string;
}

/** (kind, role) → address spec. Absent combos resolve to null (caller monograms). */
function addressSpec(kind: EntityAssetKind, role: EntityAssetRole): AddressSpec | null {
  switch (role) {
    case 'crest':
      if (kind === 'team') return { layer: 'provider', seg: 'crest', ext: 'png' };
      if (kind === 'competition') return { layer: 'provider', seg: 'competition', ext: 'png' };
      return null;
    case 'avatar':
      // Small round headshot. Only players have a canonical headshot layer;
      // a manager avatar falls back to a BTL-safe imageUrl or the monogram.
      if (kind === 'player') return { layer: 'apifootball', seg: 'player', ext: 'png' };
      return null;
    case 'hero':
      if (kind === 'player') return { layer: 'wikimedia', seg: 'player', ext: 'jpg' };
      if (kind === 'manager') return { layer: 'wikimedia', seg: 'manager', ext: 'jpg' };
      return null;
    default:
      return null; // flag handled separately (id = iso2, no <seg>)
  }
}

const TRAILING_SLASH = /\/+$/;
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

/** Hosts whose absolute URLs are safe to render (the BTL CDN). */
function isBtlCdnHost(host: string): boolean {
  return /(^|\.)breakingthelines\.(app|dev)$/i.test(host);
}

/**
 * Is a backend-supplied media value safe to render as-is?
 * - A relative R2 key (`media/…`, `/media/…`, no host) → safe (the host prefixes it).
 * - An absolute URL → safe ONLY if its host is the BTL CDN.
 * - A raw provider hotlink (`https://media.api-sports.io/…`) or any other host → NOT safe.
 * - A `data:` URI → not an entity asset → not safe.
 */
export function isBtlCdnSafe(value: string | null | undefined): boolean {
  const v = value?.trim();
  if (!v || v.startsWith('data:')) return false;
  const m = /^(?:[a-z][a-z0-9+.-]*:)?\/\/([^/]+)/i.exec(v);
  if (!m) return true; // no host → relative key → safe
  return isBtlCdnHost(m[1].toLowerCase());
}

/**
 * Prefix a relative R2 key with `cdnBase`, collapsing the doubled `/media/`
 * segment (base ends in `/media`, the key also starts with `media/`). Absolute
 * URLs are returned verbatim. Mirrors platform `resolveMediaUrl`, kept here so
 * the resolver is self-contained and host-agnostic.
 */
function joinCdn(base: string, value: string): string {
  if (ABSOLUTE_URL.test(value)) return value;
  let path = value.replace(/^\/+/, '');
  const baseLast = base.slice(base.lastIndexOf('/') + 1);
  if (baseLast && (path === baseLast || path.startsWith(`${baseLast}/`))) {
    path = path.slice(baseLast.length).replace(/^\/+/, '');
  }
  return path ? `${base}/${path}` : base;
}

/** Options for {@link entityAssetUrl}. */
export interface EntityAssetOptions {
  /**
   * A backend-supplied image url or relative R2 key. Honoured ONLY when
   * BTL-CDN-safe (see {@link isBtlCdnSafe}); a raw provider hotlink is ignored
   * and the deterministic address is built instead. Consulted for `crest` and
   * `avatar` (the latter encodes identity's per-player apifootball-vs-wikimedia
   * choice); IGNORED for `hero` (identity's value is the low-res headshot) and
   * `flag`.
   */
  readonly imageUrl?: string | null;
}

/**
 * Resolve a football entity asset to a BTL-CDN URL, or `null` for the monogram
 * fallback. Pure. See the module header for the address contract.
 *
 * @example
 *   entityAssetUrl('team', 'crest', 'btl_football_team_t8596499a', base)
 *   // -> "https://cdn.breakingthelines.app/media/provider/crest/btl_football_team_t8596499a.png"
 */
export function entityAssetUrl(
  kind: EntityAssetKind,
  role: EntityAssetRole,
  id: string,
  cdnBase: string,
  opts: EntityAssetOptions = {}
): string | null {
  if (!id || !cdnBase) return null;
  const base = cdnBase.replace(TRAILING_SLASH, '');

  if (role === 'flag') {
    const iso2 = id.trim().toLowerCase();
    return iso2 ? `${base}/flags/${iso2}.svg` : null;
  }

  // crest + avatar may defer to a BTL-safe backend value; hero never does.
  const consultImageUrl = role !== 'hero';
  if (consultImageUrl && opts.imageUrl && isBtlCdnSafe(opts.imageUrl)) {
    return joinCdn(base, opts.imageUrl.trim());
  }

  const spec = addressSpec(kind, role);
  if (spec) return `${base}/${spec.layer}/${spec.seg}/${id}.${spec.ext}`;

  // No canonical address for this (kind, role): last resort a BTL-safe backend
  // value (e.g. a manager avatar), else the monogram.
  if (opts.imageUrl && isBtlCdnSafe(opts.imageUrl)) return joinCdn(base, opts.imageUrl.trim());
  return null;
}

/**
 * Compute a 1–2 letter monogram from an entity label, for the `onError` /
 * null-URL fallback. (Re-exported alongside {@link entityMonogram} in
 * `entity-image` so callers share one implementation.)
 */
export function assetMonogram(label: string): string {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}
