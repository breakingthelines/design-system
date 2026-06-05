'use client';

import * as React from 'react';
import { Star } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { ratingDescriptor, type RatingScaleValue } from '#/components/ui/rating-scale';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingsReceivedCard (Entity page — featured latest-rating module)
 *
 * A featured card surfacing the rating an entity received in its most recent
 * rated match. The body reads "vs {crest} {opponent}" on the left and a large
 * score with a star on the right.
 *
 * The rating follows the BTL canonical 1-6 inverse scale (1 is best). The card
 * reuses `ratingDescriptor` so its semantics match the rest of the rating
 * surface and carries `data-direction="lower-is-better"` like the other rating
 * primitives so consumers and tests can verify the inversion is preserved.
 *
 * Honest by default: with no resolved rating (no `value`, or `state="empty"`)
 * the card renders a tight `FallbackState` (defaulting to `NO_RATINGS_YET`)
 * rather than a fake zero — the same pattern the other rating cards use.
 *
 * Render-only: props in, JSX out. No fetching, no router awareness.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RatingsReceivedOpponent {
  /** Opponent display name. */
  name: string;
  /** Optional opponent crest URL, rendered at 32px. */
  crestUrl?: string;
}

export interface RatingsReceivedCardProps {
  /** BTL rating, 1 (best) to 6 (worst). Omit to render the empty state. */
  value?: number;
  /** Scale maximum. Defaults to 6 (the BTL inverse scale). */
  ratingMax?: number;
  /** The opponent in the rated match. */
  opponent: RatingsReceivedOpponent;
  /**
   * Render mode. `ready` shows the card; `empty` shows the fallback only;
   * `loading` shows a skeleton. When no usable `value` is present the card
   * renders the fallback regardless of `state`.
   */
  state?: 'ready' | 'empty' | 'loading';
  /** Fallback override (used when empty). Defaults to `NO_RATINGS_YET`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

const DEFAULT_RATING_MAX = 6;

export function RatingsReceivedCard({
  value,
  ratingMax = DEFAULT_RATING_MAX,
  opponent,
  state = 'ready',
  fallbackReason,
  className,
}: RatingsReceivedCardProps) {
  const wrapper = cn(
    'flex w-full flex-col gap-4 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5 text-white',
    className
  );

  const scaleValue = toRatingScaleValue(value);

  if (state === 'loading') {
    return (
      <div data-slot="ratings-received-card" data-state="loading" className={wrapper}>
        <RatingsReceivedTitle />
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-4 w-28 animate-pulse rounded-sm bg-white/[0.04]" />
          </div>
          <div className="h-14 w-20 shrink-0 animate-pulse rounded-sm bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (state === 'empty' || scaleValue === undefined) {
    return (
      <div data-slot="ratings-received-card" data-state="empty" className={wrapper}>
        <RatingsReceivedTitle />
        <FallbackState reason={fallbackReason ?? 'NO_RATINGS_YET'} />
      </div>
    );
  }

  const descriptor = ratingDescriptor(scaleValue);
  const opponentInitials = initialsFromName(opponent.name);

  return (
    <div
      data-slot="ratings-received-card"
      data-state="ready"
      data-direction="lower-is-better"
      data-value={scaleValue}
      className={wrapper}
    >
      <RatingsReceivedTitle />
      <div className="flex items-end justify-between gap-4">
        <p
          data-slot="ratings-received-card-opponent"
          className="flex min-w-0 items-center gap-2 leading-none"
        >
          <span className="text-[var(--color-grey-500)]">vs</span>
          <span
            aria-hidden="true"
            className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-grey-300)] text-[10px] font-bold tracking-tight text-white"
          >
            {opponent.crestUrl ? (
              <img
                src={opponent.crestUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              opponentInitials
            )}
          </span>
          <span className="min-w-0 truncate text-base font-semibold tracking-tight text-white">
            {opponent.name}
          </span>
        </p>

        <span
          data-slot="ratings-received-card-score"
          data-direction="lower-is-better"
          data-value={scaleValue}
          title={`${descriptor.label} · lower is better`}
          className="flex shrink-0 items-center gap-2 leading-none"
        >
          <span className="font-mono text-[64px] leading-none font-semibold tabular-nums text-white">
            {formatRating(value, scaleValue)}
          </span>
          <Star weight="fill" aria-hidden="true" className="size-8 text-[var(--color-red-100)]" />
          <span className="sr-only">
            out of {ratingMax}, {descriptor.label}. Lower is better.
          </span>
        </span>
      </div>
    </div>
  );
}

function RatingsReceivedTitle() {
  return (
    <h5
      data-slot="ratings-received-card-title"
      className="font-display text-sm font-semibold tracking-tight text-white"
    >
      Ratings received
    </h5>
  );
}

function toRatingScaleValue(value: number | undefined): RatingScaleValue | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 6) return undefined;
  return rounded as RatingScaleValue;
}

/**
 * Display the rating to one decimal when the source value is fractional
 * (e.g. an aggregate "5.2"), otherwise show the rounded integer.
 */
function formatRating(raw: number | undefined, fallback: RatingScaleValue): string {
  if (raw === undefined || !Number.isFinite(raw)) return String(fallback);
  return Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}
