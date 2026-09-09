// Shared football entity image — the single render primitive.
//
// Renders a crest / competition badge / player avatar / hero / flag from the
// deterministic BTL CDN addresses (see `lib/entity-asset`), optimistically, with
// a tinted monogram fallback once every address has missed. This is the ONE
// component every surface uses (pickers, search rows, entity pages, standings,
// match header) so crest/avatar/hero behaviour can't drift and a raw provider
// hotlink can never reach the DOM.
//
// # IT WALKS A CHAIN, NOT A URL
//
// An entity's image has more than one possible address: BTL's own art first
// (and a mark may be stored as SVG or as WebP), then the mirrored provider
// layer. Nothing on the render path knows which of them exists — deliberately,
// because the coverage manifest that used to know was wrong often enough to
// monogram a crest that was 200 on the CDN (ADR-036). So this component asks
// the CDN, in order, by rendering: each `onError` advances to the next address
// and the first 200 stops the walk. Falling all the way through costs one
// request per address, each answered 404 and cached by the browser per URL for
// the asset's `max-age=300`.
//
// The practical consequence, which is the whole point: art uploaded five
// minutes ago appears on every surface with no deploy, no manifest regeneration
// and no cache purge. The address was always being requested; it just started
// returning 200.
//
// # THE WALK MUST SURVIVE HYDRATION
//
// `onError` alone only works if the handler is on the element before the
// browser answers. On a server-rendered page it often is not: the img is in the
// HTML, so the browser requests the first address during parse and can settle
// it — 404, ORB-blocked, anything — BEFORE React hydrates and attaches
// anything. That error event has no listener, is not replayed, and the walk
// never starts: the element sits at `complete === true` with
// `naturalWidth === 0` on a dead address forever, while the 200 two candidates
// down is never asked for. (Live symptom: an uploaded Premier League badge
// rendering as an empty 64x64 box, because the CDN answers a missing .svg with
// a text/html body that Chromium ORB-blocks.)
//
// So the chain also checks the settled state on mount, via the `imgRef` that
// every consumer hands its <img>. A client-rendered image is still in flight at
// that point and is left to `onError`; only an already-failed one is advanced.
//
// Plain <img> (no crossOrigin): normal surfaces never rasterise to a canvas, so
// a CORS request is unnecessary (and some mirrored crests are served without
// CORS headers, which a crossOrigin request would fail → monogram). The WebGL
// magazine reader is a separate consumer that loads its hero texture with
// crossOrigin itself.

import { useState } from 'react';

import {
  type EntityAssetKind,
  type EntityAssetRole,
  assetMonogram,
  entityAssetCandidates,
  entityAssetUrl,
} from '../../lib/entity-asset';

/**
 * Walk an ordered list of image addresses, advancing on each failure.
 *
 * Returns the address to render now, an `onError` to hand the `<img>`, and
 * whether the list is exhausted (the caller renders its own fallback). Exported
 * so a component that already holds a candidate list — a table cell with its
 * own markup, say — falls through identically without restating the logic.
 *
 * The walk RESTARTS when the list changes. React reuses a component instance
 * across a changed `id`, so without this a row scrolled into a virtualised list
 * would inherit the previous entity's exhausted cursor and monogram a crest
 * that exists.
 */
export function useSourceChain(sources: readonly string[]): {
  src: string | undefined;
  exhausted: boolean;
  onError: () => void;
  imgRef: (node: HTMLImageElement | null) => void;
} {
  const key = sources.join('\n');
  const [cursor, setCursor] = useState<{ key: string; index: number }>({ key, index: 0 });
  const index = cursor.key === key ? cursor.index : 0;

  // Computed from the render's own `index`, never from the previous state. Two
  // callers racing to advance the SAME address (the mount check below and a
  // late `onError` for the same element) therefore both land on `index + 1`
  // instead of stacking two increments and skipping a live candidate.
  const advance = () => setCursor({ key, index: index + 1 });

  return {
    src: sources[index],
    exhausted: index >= sources.length,
    onError: advance,
    imgRef: (node: HTMLImageElement | null) => {
      if (!node || !node.getAttribute('src')) return;
      // A settled image: `complete` with no pixels is the failed state, and the
      // error event that would have said so is already gone. See the block
      // comment above for why that happens on an SSR'd page. `complete` with
      // pixels is a success (leave it), and an image still in flight is
      // `complete === false` — its `onError` is attached by the same commit
      // that runs this ref, so a later failure still advances the walk.
      if (node.complete && node.naturalWidth === 0) advance();
    },
  };
}

/**
 * Fold a component's legacy single-URL prop into its candidate list.
 *
 * Every image seam in here grew a `*Sources` array beside an existing
 * `imageUrl`. Both are honoured: the chain first, the single URL as its tail,
 * so a caller that has not migrated behaves exactly as it did and a caller that
 * has passes only the array.
 */
export function imageChain(
  sources: readonly string[] | undefined,
  url: string | null | undefined
): string[] {
  const out = [...(sources ?? [])];
  if (url && !out.includes(url)) out.push(url);
  return out;
}

export interface EntityImageProps {
  /** Canonical entity kind. */
  kind: EntityAssetKind;
  /** Which image of the entity to render. */
  role: EntityAssetRole;
  /** Canonical `btl_football_*` id (or ISO-2 for a flag). */
  id: string;
  /** Label for the monogram fallback (and alt text when announced). */
  label: string;
  /** Public CDN base — host injects `getPublicRuntimeConfig().mediaCdnBase`. */
  cdnBase: string;
  /**
   * Backend-supplied url/key. Honoured only when BTL-CDN-safe; a raw provider
   * hotlink is ignored and the address is built from `id`. See {@link entityAssetUrl}.
   */
  imageUrl?: string | null;
  /**
   * Addresses to try AFTER the entity's own chain and before the monogram — the
   * caller's own last resort. The standings table passes a national team's
   * country flag here, so a World Cup row shows its flag rather than a letter
   * when neither bespoke nor mirrored crest exists.
   */
  fallbackSources?: readonly string[];
  /**
   * Resolve one address instead of the chain. `'chain'` (the default) is what
   * every surface wants. `'provider'` pins the single mirrored address — a
   * debug view, or a caller that must not pay a bespoke probe.
   */
  resolve?: 'chain' | 'provider';
  /** Monogram background when no image resolves. */
  accentColor?: string;
  /** Sizing/shape classes applied to both the <img> and the monogram box. */
  className?: string;
  /** Decorative by default (`alt=""`); pass a string to announce it. */
  alt?: string;
}

/**
 * The single entity-image render primitive. Walks the deterministic CDN chain
 * from {@link entityAssetCandidates} and falls back to a monogram — never to a
 * non-BTL host.
 */
export function EntityImage({
  kind,
  role,
  id,
  label,
  cdnBase,
  imageUrl,
  fallbackSources,
  resolve = 'chain',
  accentColor,
  className,
  alt,
}: EntityImageProps) {
  const chain =
    resolve === 'provider'
      ? [entityAssetUrl(kind, role, id, cdnBase, { imageUrl })].filter((u): u is string => !!u)
      : entityAssetCandidates(kind, role, id, cdnBase, { imageUrl });
  const sources = fallbackSources?.length ? [...chain, ...fallbackSources] : chain;

  const { src, onError, imgRef } = useSourceChain(sources);
  // Logos sit inside their box (contain); faces fill it (cover).
  const fit = role === 'crest' || role === 'flag' ? 'object-contain' : 'object-cover';

  if (!src) {
    return (
      <span
        aria-hidden={alt ? undefined : 'true'}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        data-slot="entity-image-monogram"
        className={`grid shrink-0 place-items-center rounded-full font-sans text-[11px] font-bold text-white ${className ?? ''}`}
        style={{ background: accentColor ?? 'var(--color-grey-300)' }}
      >
        {assetMonogram(label)}
      </span>
    );
  }

  return (
    <img
      // Keyed by the address: a browser will not re-request a src that failed
      // and was then set back to the same value, and swapping src on a live
      // element leaves the broken-image frame visible for a tick.
      key={src}
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      data-slot="entity-image"
      ref={imgRef}
      onError={onError}
      className={`shrink-0 ${fit} ${className ?? ''}`}
    />
  );
}
