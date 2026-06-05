'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Image } from '#/components/ui/image';
import { SectionHeader } from '#/components/ui/section-header';
import { useLinkComponent } from '#/components/ui/link-context';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * MediaTile (Entity page — "MEDIA" block)
 *
 * A "MEDIA" section header above a single full-width image block. Used on the
 * entity page to surface a featured photo / poster beside the editorial grid.
 *
 * Honest by default: with no `imageUrl` the tile renders a tight `FallbackState`
 * (defaulting to `SOURCE_NOT_AVAILABLE`) rather than an empty grey box.
 *
 * Router-agnostic: when `href` is set the image links via the `useLinkComponent`
 * context (defaults to `<a>`). Render-only otherwise.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MediaTileProps {
  /** Featured image URL. Omit to render the empty state. */
  imageUrl?: string;
  /** Accessible alt text for the image. */
  alt?: string;
  /** Optional caption rendered beneath the image. */
  caption?: React.ReactNode;
  /** Optional route. When set, the image becomes a link. */
  href?: string;
  /** Aspect ratio class for the image block. Defaults to a wide 16/9. */
  aspectClassName?: string;
  /** Fallback override (used when empty). Defaults to `SOURCE_NOT_AVAILABLE`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

export function MediaTile({
  imageUrl,
  alt = '',
  caption,
  href,
  aspectClassName = 'aspect-[16/9]',
  fallbackReason,
  className,
}: MediaTileProps) {
  const Link = useLinkComponent();

  return (
    <section data-slot="media-tile" className={cn('flex w-full flex-col gap-6', className)}>
      <SectionHeader label="Media" />
      {imageUrl ? (
        <figure data-slot="media-tile-figure" className="flex flex-col gap-2">
          {href ? (
            <Link
              href={href}
              className={cn('w-full overflow-hidden rounded-[4px]', aspectClassName)}
            >
              <Image src={imageUrl} alt={alt} className="size-full" />
            </Link>
          ) : (
            <div className={cn('w-full overflow-hidden rounded-[4px]', aspectClassName)}>
              <Image src={imageUrl} alt={alt} className="size-full" />
            </div>
          )}
          {caption ? (
            <figcaption className="text-[12px] tracking-tight text-[var(--color-grey-500)]">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      ) : (
        <FallbackState reason={fallbackReason ?? 'SOURCE_NOT_AVAILABLE'} />
      )}
    </section>
  );
}
