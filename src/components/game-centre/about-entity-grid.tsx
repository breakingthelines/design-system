'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { ContentCard } from '#/components/ui/content-card';
import { SectionHeader } from '#/components/ui/section-header';
import type { ContentItem } from '#/types/content';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * AboutEntityGrid (Entity page — "ABOUT {name}" editorial block)
 *
 * A three-column editorial grid composing the shared `ContentCard`:
 *
 *   [ large portrait ] [ 5-item stacked list ] [ large portrait ]
 *
 * The two flanking columns render `ContentCard` in its `portrait` variant; the
 * middle column stacks up to five `list`-variant cards. The block is preceded
 * by a `SectionHeader` reading "ABOUT {name}".
 *
 * The consumer passes a single `items` feed (most relevant first). The grid
 * slots them: item 0 → left portrait, items 1–5 → middle list, item 6 → right
 * portrait. Hosts wire routing via the `hrefFor` / `authorHrefFor` resolvers.
 *
 * Honest by default: with no items the block renders a tight `FallbackState`
 * (defaulting to `NO_CONTENT_YET`). Individual columns that run out of items
 * collapse rather than render placeholders, and the grid stacks to one column
 * on narrow viewports.
 *
 * Render-only: props in, JSX out. No fetching.
 * ──────────────────────────────────────────────────────────────────────────── */

const LIST_SLOTS = 5;

export interface AboutEntityGridProps {
  /** Entity display name, used in the "ABOUT {name}" header. */
  name: string;
  /** Content feed, most relevant first. Empty renders the fallback. */
  items: readonly ContentItem[];
  /** Resolve a route for a content item (title + image link). */
  hrefFor?: (item: ContentItem) => string | undefined;
  /** Resolve a route for an item's author. */
  authorHrefFor?: (item: ContentItem) => string | undefined;
  /** Fallback override (used when empty). Defaults to `NO_CONTENT_YET`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

export function AboutEntityGrid({
  name,
  items,
  hrefFor,
  authorHrefFor,
  fallbackReason,
  className,
}: AboutEntityGridProps) {
  const leftFeature = items[0];
  const listItems = items.slice(1, 1 + LIST_SLOTS);
  const rightFeature = items[1 + LIST_SLOTS];

  const heading = `About ${name}`;

  if (items.length === 0) {
    return (
      <section data-slot="about-entity-grid" className={cn('flex w-full flex-col gap-6', className)}>
        <SectionHeader label={heading} />
        <FallbackState reason={fallbackReason ?? 'NO_CONTENT_YET'} />
      </section>
    );
  }

  return (
    <section data-slot="about-entity-grid" className={cn('flex w-full flex-col gap-6', className)}>
      <SectionHeader label={heading} />
      <div
        data-slot="about-entity-grid-columns"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div data-slot="about-entity-grid-feature" className="lg:col-span-1">
          {leftFeature ? (
            <ContentCard
              variant="portrait"
              item={leftFeature}
              href={hrefFor?.(leftFeature)}
              authorHref={authorHrefFor?.(leftFeature)}
            />
          ) : null}
        </div>

        <ul
          data-slot="about-entity-grid-list"
          className="flex flex-col gap-4 lg:col-span-1"
        >
          {listItems.map((item) => (
            <li key={item.id}>
              <ContentCard
                variant="list"
                item={item}
                href={hrefFor?.(item)}
                authorHref={authorHrefFor?.(item)}
              />
            </li>
          ))}
        </ul>

        <div data-slot="about-entity-grid-feature" className="lg:col-span-1">
          {rightFeature ? (
            <ContentCard
              variant="portrait"
              item={rightFeature}
              href={hrefFor?.(rightFeature)}
              authorHref={authorHrefFor?.(rightFeature)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
