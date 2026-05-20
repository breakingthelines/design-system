'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { RATING_SCALE, type RatingScaleValue } from '#/components/ui/rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingDistribution
 *
 * Histogram of the BTL 1-6 inverse rating scale. Six vertical bars, one per
 * rating value. The component renders honestly even when the total is zero
 * (empty state, no fake values), and obeys the inversion: bar 1 is always
 * the leftmost "best" column.
 *
 *   counts: Record<RatingScaleValue, number>
 *
 * Optional `meanValue` (between 1 and 6) renders a centroid marker. We do not
 * compute the mean here — the caller is responsible. This keeps the component
 * a pure render and lets callers source the mean from server-side intelligence
 * (where rounding rules may differ).
 * ──────────────────────────────────────────────────────────────────────────── */

export type RatingCounts = Record<RatingScaleValue, number>;

export const EMPTY_RATING_COUNTS: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

export interface RatingDistributionProps {
  counts: RatingCounts;
  /** Rounded mean (1-6) — optional centroid marker. */
  meanValue?: number;
  /** Show numeric count above each bar. */
  showCounts?: boolean;
  className?: string;
}

export function ratingTotal(counts: RatingCounts): number {
  return (
    (counts[1] ?? 0) +
    (counts[2] ?? 0) +
    (counts[3] ?? 0) +
    (counts[4] ?? 0) +
    (counts[5] ?? 0) +
    (counts[6] ?? 0)
  );
}

export function RatingDistribution({
  counts,
  meanValue,
  showCounts,
  className,
}: RatingDistributionProps) {
  const total = ratingTotal(counts);
  const maxBucket = Math.max(
    counts[1] ?? 0,
    counts[2] ?? 0,
    counts[3] ?? 0,
    counts[4] ?? 0,
    counts[5] ?? 0,
    counts[6] ?? 0,
    1 // floor at 1 so a 0-total scale still draws empty rails
  );

  return (
    <div
      data-slot="rating-distribution"
      data-direction="lower-is-better"
      data-total={total}
      className={cn(
        'flex flex-col gap-2 border border-white/10 bg-[var(--color-grey-200)] px-4 py-3 text-white',
        className
      )}
    >
      <header
        data-slot="rating-distribution-eyebrow"
        className="flex items-center justify-between text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        <span>Rating spread</span>
        <span data-slot="rating-distribution-total" className="tabular-nums">
          {total} {total === 1 ? 'rating' : 'ratings'}
        </span>
      </header>

      <div
        data-slot="rating-distribution-bars"
        className="flex h-[88px] items-end justify-between gap-1.5"
      >
        {RATING_SCALE.map((entry) => {
          const bucket = counts[entry.value] ?? 0;
          const ratio = bucket / maxBucket;
          // Clamp the visible height so the smallest non-zero bucket is still legible.
          const heightPct = bucket === 0 ? 0 : Math.max(8, Math.round(ratio * 100));
          return (
            <div
              key={entry.value}
              data-slot="rating-distribution-column"
              data-value={entry.value}
              data-count={bucket}
              className="flex flex-1 flex-col items-center justify-end gap-1.5 text-center"
            >
              {showCounts ? (
                <span
                  data-slot="rating-distribution-count"
                  className="text-[10px] font-mono tabular-nums text-white/70"
                >
                  {bucket}
                </span>
              ) : null}
              <div
                data-slot="rating-distribution-bar"
                aria-hidden="true"
                style={{ height: `${heightPct}%` }}
                className={cn(
                  'w-full rounded-sm transition-all',
                  bucket === 0
                    ? 'bg-white/[0.04]'
                    : 'bg-gradient-to-t from-[var(--color-red-100)]/40 to-[var(--color-red-100)]'
                )}
              />
              <span
                data-slot="rating-distribution-label"
                className="text-[10px] font-mono tabular-nums text-white/70"
              >
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>

      {meanValue !== undefined ? (
        <p data-slot="rating-distribution-mean" className="text-[11px] text-white/70">
          Mean rating{' '}
          <span className="font-mono tabular-nums text-white">{meanValue.toFixed(1)}</span> · Lower
          is better
        </p>
      ) : null}
    </div>
  );
}
