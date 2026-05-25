'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import {
  EMPTY_RATING_COUNTS,
  type RatingCounts,
  ratingTotal,
} from '#/components/ui/rating-distribution';
import { ratingDescriptor, type RatingScaleValue } from '#/components/ui/rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingDistributionBar (L5 — Ratings Club row + Game Centre player tab)
 *
 * Compact horizontal companion to RatingDistribution. Where the canonical
 * histogram occupies a 200×140 card, this primitive packs the same shape
 * into a single 24-32px row suitable for tight list contexts:
 *
 *   - a Ratings Club leaderboard row
 *   - a player page summary strip
 *   - an inline subject card on the entity page
 *
 * Each of the six rating values is rendered as a stacked segment of a single
 * horizontal bar. The width of each segment is proportional to its count vs
 * the total. When `counts` is the EMPTY_RATING_COUNTS sentinel, the bar
 * renders an empty rail so the caller never has to switch primitives between
 * empty and populated states.
 *
 * Hold the inversion: the leftmost segment is rating 1 ("Excellent"),
 * the rightmost is rating 6 ("Poor"). data-direction="lower-is-better".
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RatingDistributionBarProps {
  /** Raw counts, with explicit zeros for empty buckets. */
  counts: RatingCounts;
  /** Caller-computed mean (1-6), used for the right-hand readout. */
  meanValue?: number;
  /** Optional label rendered before the bar — e.g. a player's name. */
  label?: React.ReactNode;
  /** Optional explicit total override (otherwise sum of counts). */
  totalOverride?: number;
  /** When true, show the per-segment count above each segment on hover. */
  showSegmentCounts?: boolean;
  /** Layout. `stacked` is the default single-bar layout. */
  variant?: 'stacked' | 'grouped';
  className?: string;
}

const ORDERED_VALUES: ReadonlyArray<RatingScaleValue> = [1, 2, 3, 4, 5, 6];

const SEGMENT_COLOR: Record<RatingScaleValue, string> = {
  1: 'bg-[var(--color-red-100)]',
  2: 'bg-[var(--color-red-100)]/85',
  3: 'bg-[var(--color-red-100)]/65',
  4: 'bg-[var(--color-red-100)]/45',
  5: 'bg-[var(--color-red-100)]/25',
  6: 'bg-[var(--color-red-100)]/10',
};

export function RatingDistributionBar({
  counts,
  meanValue,
  label,
  totalOverride,
  showSegmentCounts,
  variant = 'stacked',
  className,
}: RatingDistributionBarProps) {
  const safeCounts = counts ?? EMPTY_RATING_COUNTS;
  const computedTotal = ratingTotal(safeCounts);
  const total = totalOverride ?? computedTotal;
  const empty = total <= 0;

  return (
    <div
      data-slot="rating-distribution-bar"
      data-direction="lower-is-better"
      data-variant={variant}
      data-total={total}
      data-empty={empty || undefined}
      className={cn(
        'flex w-full items-center gap-3 border border-white/[0.06] bg-[var(--color-grey-200)]',
        'px-3 py-2 text-white',
        className
      )}
    >
      {label ? (
        <span
          data-slot="rating-distribution-bar-label"
          className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-tight"
        >
          {label}
        </span>
      ) : null}

      {variant === 'grouped' ? (
        <GroupedTrack counts={safeCounts} total={total} showSegmentCounts={showSegmentCounts} />
      ) : (
        <StackedTrack counts={safeCounts} total={total} showSegmentCounts={showSegmentCounts} />
      )}

      <div
        data-slot="rating-distribution-bar-readout"
        className="flex shrink-0 flex-col items-end gap-0.5 text-right"
      >
        <span className="font-mono text-[12px] font-semibold tabular-nums text-white">
          {meanValue !== undefined ? meanValue.toFixed(1) : '—'}
        </span>
        <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--color-grey-500)]">
          {empty ? 'No ratings' : `${total} ${total === 1 ? 'rating' : 'ratings'}`}
        </span>
      </div>
    </div>
  );
}

interface TrackProps {
  counts: RatingCounts;
  total: number;
  showSegmentCounts?: boolean;
}

function StackedTrack({ counts, total, showSegmentCounts }: TrackProps) {
  const empty = total <= 0;
  return (
    <div
      data-slot="rating-distribution-bar-track"
      role="img"
      aria-label="Rating distribution, lower is better"
      className="flex h-3 min-w-[120px] flex-1 overflow-hidden border border-white/10"
    >
      {empty ? (
        <div className="size-full bg-white/[0.04]" />
      ) : (
        ORDERED_VALUES.map((value) => {
          const bucket = counts[value] ?? 0;
          if (bucket <= 0) return null;
          const width = (bucket / total) * 100;
          return (
            <div
              key={value}
              data-slot="rating-distribution-bar-segment"
              data-value={value}
              data-count={bucket}
              style={{ width: `${width}%` }}
              title={
                showSegmentCounts
                  ? `${value} — ${ratingDescriptor(value).label}: ${bucket}`
                  : undefined
              }
              className={cn('h-full', SEGMENT_COLOR[value])}
            />
          );
        })
      )}
    </div>
  );
}

function GroupedTrack({ counts, total, showSegmentCounts }: TrackProps) {
  const empty = total <= 0;
  return (
    <div
      data-slot="rating-distribution-bar-track"
      role="img"
      aria-label="Rating distribution, lower is better"
      className="grid min-w-[180px] flex-1 grid-cols-6 items-end gap-0.5 px-0.5"
    >
      {ORDERED_VALUES.map((value) => {
        const bucket = counts[value] ?? 0;
        const ratio = empty ? 0 : bucket / total;
        const heightPct = bucket === 0 ? 6 : Math.max(12, Math.round(ratio * 100));
        return (
          <div
            key={value}
            data-slot="rating-distribution-bar-segment"
            data-value={value}
            data-count={bucket}
            className="flex h-6 flex-col justify-end"
          >
            <div
              style={{ height: `${heightPct}%` }}
              title={
                showSegmentCounts
                  ? `${value} — ${ratingDescriptor(value).label}: ${bucket}`
                  : undefined
              }
              className={cn('w-full', bucket > 0 ? SEGMENT_COLOR[value] : 'bg-white/[0.04]')}
            />
          </div>
        );
      })}
    </div>
  );
}
