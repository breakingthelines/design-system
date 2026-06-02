/**
 * Entity-imagery resolver (SCAFFOLD).
 *
 * Resolves a football entity (crest, competition logo, player, manager,
 * stadium) to a CORS-clean BTL CDN URL, following a three-layer priority chain:
 *
 *   1. BTL-own bespoke  → `${cdnBase}/btl/<type>/<entityId>.<ext>`        (designed by Gab)
 *   2. Mirrored provider → `${cdnBase}/provider/<type>/<entityId>.<ext>`   (gamewire-mirrored)
 *   3. Monogram          → null (caller renders a tinted monogram placeholder)
 *
 * The resolver is PURE: given a coverage manifest it does no I/O. The manifest
 * is injected (fetched once at app boot, or build-time embedded) so the render
 * path stays synchronous. See `proposals/entity-imagery-system.md` (engineering
 * spec) and `design/entity-imagery-mandate.md` (designer brief) in the docs repo.
 *
 * STATUS: scaffold. The seed manifest (`entity-imagery-manifest`) is a static
 * cold-start hint covering the onboarding corpus. The bucket name and public
 * CDN base are still OPEN decisions (see spec); `media.breakingthelines.dev` is
 * the proposed default. gamewire's mirror (which fills the `provider` layer and
 * patches the manifest) is designed but NOT YET BUILT.
 */

/** Entity image type. Maps to identity entity types (`venue`→stadium, `coach`→manager). */
export type EntityImageType = 'crest' | 'competition' | 'player' | 'manager' | 'stadium';

/** Which storage layer an asset lives in. */
export type EntityImageLayer = 'btl' | 'provider';

/**
 * Coverage manifest entry for one entity. Records which layers exist and the
 * stored file extension of each. Absence of an entity (or of both layers) means
 * the resolver returns null → caller renders a monogram.
 */
export interface EntityImageManifestEntry {
  /** Entity image type (drives the `<type>` key segment). */
  readonly type: EntityImageType;
  /** Extension of the BTL-own bespoke asset, if present (e.g. 'svg', 'webp'). */
  readonly btl?: string;
  /** Extension of the mirrored provider asset, if present (e.g. 'png', 'webp'). */
  readonly provider?: string;
}

/**
 * The coverage manifest. Keyed by canonical BTL identity entity ID — a
 * content-hashed id such as `btl_football_team_t9d7dd08f` (the suffix is an
 * opaque hash, never a provider's numeric id). `cdnBase` is the public custom
 * domain bound to the entity-imagery R2 bucket (no trailing slash).
 */
export interface EntityImageManifest {
  /** Manifest version / generation timestamp (ISO 8601). */
  readonly version: string;
  /** Public CDN base for the entity-imagery bucket, e.g. 'https://media.breakingthelines.dev'. */
  readonly cdnBase: string;
  /** Entity ID → coverage entry. */
  readonly entities: Readonly<Record<string, EntityImageManifestEntry>>;
}

/** Options for {@link entityImage}. */
export interface EntityImageOptions {
  /**
   * A backend-supplied image URL that is already CORS-clean by contract
   * (e.g. a freshly-indexed entity from intelligence/game-service whose URL
   * already points at our CDN). When provided, it wins over the manifest so a
   * new entity can render before the manifest is regenerated. A raw provider
   * hotlink should NOT be passed here — that is exactly what this system removes.
   */
  readonly imageUrl?: string | null;
  /**
   * Preferred layer order. Defaults to ['btl', 'provider'] (bespoke wins).
   * Pass ['provider'] to force the mirrored asset (e.g. a debug/admin view).
   */
  readonly preferLayers?: readonly EntityImageLayer[];
}

const DEFAULT_LAYER_ORDER: readonly EntityImageLayer[] = ['btl', 'provider'];

/** Build the storage/CDN key for a given layer, type, entity, and extension. */
export function entityImageKey(
  layer: EntityImageLayer,
  type: EntityImageType,
  entityId: string,
  ext: string
): string {
  return `${layer}/${type}/${entityId}.${ext}`;
}

/**
 * Resolve an entity to a CORS-clean image URL, or `null` for the monogram
 * fallback. Pure given the manifest.
 *
 * @example
 *   const url = entityImage('crest', 'btl_football_team_t9d7dd08f', manifest);
 *   // -> "https://media.breakingthelines.dev/btl/crest/btl_football_team_t9d7dd08f.svg"
 *   //    (or .../provider/... if no bespoke art, or null → monogram)
 */
export function entityImage(
  type: EntityImageType,
  entityId: string,
  manifest: EntityImageManifest,
  opts: EntityImageOptions = {}
): string | null {
  // 0. Explicit CORS-clean override (e.g. backend-indexed URL) wins.
  if (opts.imageUrl) return opts.imageUrl;

  if (!entityId) return null;

  const entry = manifest.entities[entityId];
  if (!entry || entry.type !== type) return null;

  const cdnBase = manifest.cdnBase.replace(/\/+$/, '');
  const order = opts.preferLayers ?? DEFAULT_LAYER_ORDER;

  for (const layer of order) {
    const ext = layer === 'btl' ? entry.btl : entry.provider;
    if (ext) {
      return `${cdnBase}/${entityImageKey(layer, type, entityId, ext)}`;
    }
  }

  // 3. No layer present → monogram (caller's responsibility).
  return null;
}

/**
 * Compute a 1–2 letter monogram from an entity label, for the layer-3 fallback.
 * Mirrors the existing First Touch `Crest` placeholder behaviour so callers can
 * share one implementation.
 */
export function entityMonogram(label: string): string {
  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}
