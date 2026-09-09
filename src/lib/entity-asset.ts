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
 * role → (layer, seg, ext) — the PINNED PROVIDER address contract:
 *   crest   team        → provider/crest/<id>.png
 *   crest   competition → provider/competition/<id>.png
 *   avatar  player      → apifootball/player/<id>.png   (small round headshot)
 *   hero    player      → wikimedia/player/<id>.jpg      (high-res portrait)
 *   hero    manager     → wikimedia/manager/<id>.jpg
 *   flag    nation      → flags/<iso2>.svg               (id = iso2)
 *
 * Above the provider layers sits BTL's OWN art — the `btl` layer, written by
 * the admin Entity assets surface straight into the content bucket. Its
 * addresses are just as deterministic, so the read path is still a string
 * build; what it is not is single-valued. A mark may be stored as SVG or as
 * WebP and nothing on the render path knows which, so a mark contributes TWO
 * candidates and the browser's 404 picks. See {@link entityAssetCandidates}.
 *
 *   crest   team        → btl/crest/<id>.svg        then btl/crest/<id>.webp
 *   crest   competition → btl/competition/<id>.svg  then btl/competition/<id>.webp
 *   avatar  player      → btl/avatar/<id>.webp
 *   hero    player      → btl/hero/<id>.webp
 *   hero    manager     → btl/hero/<id>.webp
 *   hero    venue       → btl/stadium/<id>.webp
 *
 * # THE READ-SIDE ASYMMETRY, WRITTEN OUT BECAUSE IT LOOKS LIKE A BUG
 *
 * The btl directories are ROLE-keyed. The provider layers are KIND-keyed. The
 * same two arguments therefore split differently on either side of the chain:
 *
 *   (player,  hero) → btl/hero/<id>.webp   and   wikimedia/player/<id>.jpg
 *   (manager, hero) → btl/hero/<id>.webp   and   wikimedia/manager/<id>.jpg
 *                     ^ ONE directory              ^ TWO directories
 *
 * A player hero and a manager hero are the same kind of picture of the same
 * kind of subject, and the canonical id prefix (`btl_football_player_` vs
 * `btl_football_coach_`) already disambiguates who is in the frame, so the
 * bespoke layer shares one directory with no chance of collision. The mirror
 * split its portraits by entity type before the role model existed and its
 * objects were never moved. Neither side is wrong; they are keyed on different
 * things, and code that derives one segment from the other is wrong for exactly
 * one of the two. This is documented in `btl/content/v1/entity_assets_service.proto`
 * (the `EntityAssetRole` enum) and is repeated here because this is the file
 * that has to hold both vocabularies at once.
 *
 * Two more consequences of role-keying, both load bearing:
 *   - `avatar` pins `btl_football_player_` ids only, so (manager, avatar) has
 *     NO bespoke candidate — the server refuses a coach avatar and it would
 *     never resolve if it did not.
 *   - `btl/player/` and `btl/manager/` are RETIRED directories. Nothing writes
 *     them and nothing may read them; the manifest resolver in `entity-image`
 *     still addresses them, which is one of the reasons it is superseded.
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
export type EntityAssetKind = 'team' | 'competition' | 'player' | 'manager' | 'nation' | 'venue';

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

/**
 * The `btl` layer's address spec for a (kind, role): the directory segment and
 * the extensions to probe, IN ORDER.
 *
 * ROLE-KEYED, and the directory comes from this table and nowhere else — see
 * the module header. Deriving it from the role name would address `btl/badge/`
 * and `btl/image/`; deriving it from the kind would address the retired
 * `btl/player/` and `btl/manager/`. Both would be an upload that succeeds and
 * an image that never appears.
 *
 * This table is the read-side mirror of the write path's role table (admin
 * `lib/entity-assets.ts`, `EntityAssetRole` in
 * `btl/content/v1/entity_assets_service.proto`) and the two are a matched pair:
 * marks are vector only and photographic roles raster only, so each probes
 * exactly ONE address: svg for a mark, webp for a photo. An SVG hero is
 * refused on write, so probing for one here would be a guaranteed 404 on
 * every render — and since content-service stopped accepting a raster mark,
 * so would a webp crest.
 *
 * Null for a combination BTL cannot store art for: a flag (no bespoke layer), a
 * manager avatar (the role pins player ids), a nation crest.
 */
function btlSpec(
  kind: EntityAssetKind,
  role: EntityAssetRole
): { readonly dir: string; readonly exts: readonly string[] } | null {
  switch (role) {
    case 'crest':
      // Marks: svg, and only svg. ONE candidate.
      if (kind === 'team') return { dir: 'crest', exts: MARK_EXTS };
      if (kind === 'competition') return { dir: 'competition', exts: MARK_EXTS };
      return null;
    case 'avatar':
      if (kind === 'player') return { dir: 'avatar', exts: PHOTO_EXTS };
      return null;
    case 'hero':
      // ONE directory for both people — the id prefix says who is in the frame.
      if (kind === 'player' || kind === 'manager') return { dir: 'hero', exts: PHOTO_EXTS };
      // A ground photograph. No provider layer exists for a venue at all, so
      // bespoke art or a monogram and nothing in between.
      if (kind === 'venue') return { dir: 'stadium', exts: PHOTO_EXTS };
      return null;
    default:
      return null; // flag: mirrored only, there is no bespoke flag layer
  }
}

// ONE address per mark, because content-service stores one.
//
// A crest used to be storable as svg OR webp, and nothing could tell which
// without asking the CDN, so this list had two entries and every badge on a
// page paid two guaranteed 404s before falling through to the mirrored
// provider layer — arriving one at a time as their chains finished.
// content-service now refuses a raster mark outright (ADR-036 position 3,
// "normalize on write"), so the second address cannot be written any more and
// probing for it is a round trip that can only ever miss.
//
// A .webp mark written under the old canon stops being probed here. It falls
// through to the mirrored provider crest rather than to a monogram, and
// re-uploading it as SVG restores it — which is why this needs no migration
// and no coverage record. A coverage record is the gate ADR-036 exists to
// remove, and it has shipped and been reverted once already (platform#363).
const MARK_EXTS: readonly string[] = ['svg'];
const PHOTO_EXTS: readonly string[] = ['webp'];

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

/**
 * The `btl` layer's candidate addresses for one (kind, role), in probe order.
 *
 * LAYER-EXPLICIT: this is BTL's own art and nothing else, so a caller that
 * wants only the bespoke address (an admin preview, a coverage probe) gets it
 * without the provider tail. Empty for a combination with no bespoke layer.
 *
 * A backend `imageUrl` is deliberately not consulted: bespoke art is addressed
 * by convention or not at all.
 *
 * @example
 *   btlAssetCandidates('competition', 'crest', 'btl_football_competition_lb3d230cb', base)
 *   // -> [".../btl/competition/<id>.svg", ".../btl/competition/<id>.webp"]
 */
export function btlAssetCandidates(
  kind: EntityAssetKind,
  role: EntityAssetRole,
  id: string,
  cdnBase: string
): string[] {
  if (!id || !cdnBase) return [];
  const spec = btlSpec(kind, role);
  if (!spec) return [];
  const base = cdnBase.replace(TRAILING_SLASH, '');
  return spec.exts.map((ext) => `${base}/btl/${spec.dir}/${id}.${ext}`);
}

/**
 * Every address this entity's image could be at, in the order to try them.
 *
 * This is the FALLBACK CHAIN, and it is the whole read path for bespoke art.
 * There is no manifest, no coverage index and no per-render RPC (ADR-036): the
 * renderer walks the list and the browser's own 200/404 answers which address
 * exists. Each miss costs one image request that the CDN answers 404 to and the
 * browser caches per URL for the asset's `max-age=300`, so a chain that falls
 * through is cheap and stops being paid within the cache window.
 *
 * Order, and why:
 *   1. BTL's own art — ONE address: svg for a mark, webp for a photo.
 *      Bespoke wins; that is the point of commissioning it.
 *   2. Whatever {@link entityAssetUrl} resolves, WHICH IS UNCHANGED: a BTL-safe
 *      backend `imageUrl` where the role consults one, else the pinned provider
 *      address. The precedence below the bespoke layer is not re-litigated here.
 *   3. The bare pinned provider address, when (2) was a backend value and
 *      differs. Breadth only — it can never displace something above it.
 *   4. Nothing. The caller renders its monogram.
 *
 * The list is deduplicated and never contains a non-BTL-CDN host: every entry
 * is either built here or has passed {@link isBtlCdnSafe}.
 *
 * @example
 *   entityAssetCandidates('team', 'crest', TEAM_ID, base)
 *   // -> [".../btl/crest/<id>.svg", ".../btl/crest/<id>.webp", ".../provider/crest/<id>.png"]
 */
export function entityAssetCandidates(
  kind: EntityAssetKind,
  role: EntityAssetRole,
  id: string,
  cdnBase: string,
  opts: EntityAssetOptions = {}
): string[] {
  const out: string[] = [...btlAssetCandidates(kind, role, id, cdnBase)];

  // The provider tail is entityAssetUrl's own answer, then its answer with no
  // backend value. Expressed in terms of the pinned resolver rather than
  // restated, so the two can never drift apart.
  const resolved = entityAssetUrl(kind, role, id, cdnBase, opts);
  if (resolved) out.push(resolved);
  const deterministic = entityAssetUrl(kind, role, id, cdnBase);
  if (deterministic && deterministic !== resolved) out.push(deterministic);

  return out.filter((url, i) => out.indexOf(url) === i);
}
