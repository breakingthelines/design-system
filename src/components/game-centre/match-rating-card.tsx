'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice, type FallbackReasonInput } from '#/components/ui/fallback-notice';
import { type RatingScaleValue } from '#/components/ui/rating-scale';

import { GradeScale, type GradeScaleAggregate, type GradeScaleCounts } from './grade-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchRatingCard (Wave 6.4: single-card collapse)
 *
 * The Ratings sub-tab hero card. Previously a two-row layout (Your grade /
 * BTL average). Wave 6.4 collapses both rows into ONE vertical card backed
 * by the new `GradeScale` composite mode:
 *
 *   header   "Grade this match" (or "BTL Grades" once cast)
 *   body     <GradeScale mode="composite" ...>
 *
 * The standalone "BTL average" eyebrow block is gone — the mean indicator
 * inside the scale subsumes it. Locked state still renders the readout-only
 * scale; empty state renders the canonical "Be the first to grade" fallback.
 *
 * Anonymous viewers see the scale enabled (taps trigger sign-in via the host).
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchRatingCardProps extends React.ComponentProps<'div'> {
  /** Viewer's cast grade, 1 (best) to 6 (worst). Omit when unset. */
  myGrade?: RatingScaleValue;
  /** BTL aggregate mean and count. Omit when none have landed yet. */
  btlAverage?: { value: number; count: number };
  /** Per-grade counts for the distribution. */
  distribution?: GradeScaleCounts;
  /** Tap handler for casting/changing a grade. */
  onSelectGrade?: (value: RatingScaleValue) => void;
  /**
   * Render mode:
   *  - 'ready'   → composite scale (input + readout)
   *  - 'partial' → composite scale, host data may be sparse
   *  - 'empty'   → full-card FallbackNotice ("Be the first to grade…")
   *  - 'locked'  → readout-only scale, scale is disabled
   *  - 'loading' → skeleton placeholder
   */
  state: 'ready' | 'partial' | 'empty' | 'locked' | 'loading';
  /** FallbackReason override for `empty`. Defaults to `no_grades_yet`. */
  emptyReason?: FallbackReasonInput;
  /** FallbackReason for `locked`. Defaults to `rating_period_closed`. */
  lockedReason?: FallbackReasonInput;
}

function MatchRatingCard({
  myGrade,
  btlAverage,
  distribution,
  onSelectGrade,
  state,
  emptyReason = 'no_ratings_yet',
  lockedReason = 'rating_period_closed',
  className,
  ...props
}: MatchRatingCardProps) {
  const chrome = cn(
    'bg-grey-200 border border-white/5 rounded-[4px] p-5',
    'flex flex-col gap-4',
    className
  );

  if (state === 'empty') {
    return (
      <div data-slot="match-rating-card" className={chrome} {...props}>
        <FallbackNotice reasons={[emptyReason]} variant="default" />
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div data-slot="match-rating-card" data-state="loading" className={chrome} {...props}>
        <div className="h-4 w-1/3 animate-pulse rounded bg-white/5" />
        <div className="h-48 w-full animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  const aggregate: GradeScaleAggregate | undefined = btlAverage
    ? { mean: btlAverage.value, count: btlAverage.count }
    : undefined;

  const headerLabel = myGrade !== undefined ? 'BTL Grades' : 'Grade this match';

  return (
    <div data-slot="match-rating-card" data-state={state} className={chrome} {...props}>
      <header
        data-slot="match-rating-card-header"
        className="flex items-center justify-between gap-3"
      >
        <h3 className="font-display text-sm font-semibold tracking-tight text-white">
          {headerLabel}
        </h3>
        {state === 'locked' ? <FallbackNotice reasons={[lockedReason]} variant="compact" /> : null}
      </header>

      <GradeScale
        mode={state === 'locked' ? 'readout' : 'composite'}
        userGrade={myGrade}
        counts={distribution}
        aggregate={aggregate}
        onSelect={onSelectGrade}
        disabled={state === 'locked'}
      />
    </div>
  );
}

export { MatchRatingCard };
