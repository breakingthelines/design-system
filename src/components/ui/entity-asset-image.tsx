// Shared football entity image — the single render primitive.
//
// Renders a crest / competition badge / player avatar / hero / flag from the
// deterministic BTL CDN address (see `lib/entity-asset`), optimistically, with a
// tinted monogram fallback on miss / `onError`. This is the ONE component every
// surface uses (pickers, search rows, entity pages, standings, match header) so
// crest/avatar/hero behaviour can't drift and a raw provider hotlink can never
// reach the DOM.
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
  entityAssetUrl,
} from '../../lib/entity-asset';

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
  /** Monogram background when no image resolves. */
  accentColor?: string;
  /** Sizing/shape classes applied to both the <img> and the monogram box. */
  className?: string;
  /** Decorative by default (`alt=""`); pass a string to announce it. */
  alt?: string;
}

/**
 * The single entity-image render primitive. Builds the deterministic CDN URL via
 * {@link entityAssetUrl} and falls back to a monogram — never to a non-BTL host.
 */
export function EntityImage({
  kind,
  role,
  id,
  label,
  cdnBase,
  imageUrl,
  accentColor,
  className,
  alt,
}: EntityImageProps) {
  const [errored, setErrored] = useState(false);
  const url = entityAssetUrl(kind, role, id, cdnBase, { imageUrl });
  // Logos sit inside their box (contain); faces fill it (cover).
  const fit = role === 'crest' || role === 'flag' ? 'object-contain' : 'object-cover';

  if (!url || errored) {
    return (
      <span
        aria-hidden={alt ? undefined : 'true'}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={`grid shrink-0 place-items-center rounded-full font-sans text-[11px] font-bold text-white ${className ?? ''}`}
        style={{ background: accentColor ?? 'var(--color-grey-300)' }}
      >
        {assetMonogram(label)}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? ''}
      loading="lazy"
      onError={() => setErrored(true)}
      className={`shrink-0 ${fit} ${className ?? ''}`}
    />
  );
}
