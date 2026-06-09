'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { GradeBox } from '#/components/ui/grade-box';
import { MeanBox } from '#/components/ui/mean-box';
import { RatingDistribution, type RatingCounts } from '#/components/ui/rating-distribution';
import { RatingScale, type RatingScaleValue } from '#/components/ui/rating-scale';
import { FallbackNotice, type FallbackReasonInput } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchRatingCard
 *
 * Wave 6 Ratings sub-tab hero card. Two-row vertical layout:
 *
 *   Row 1 — Your grade  (RatingScale tiles; tap to cast a grade)
 *   Row 2 — BTL average  (MeanBox + RatingDistribution histogram)
 *
 * Card chrome `bg-grey-200 border-white/5 rounded-[4px] p-5` matching the
 * universal card chrome contract. Empty state replaces the whole card with
 * the FallbackNotice "Be the first to grade this game."
 *
 * The component is presentational — it does NOT submit grades; the
 * `onSelectGrade` callback is the host's hook into the rating sheet /
 * write flow.
 *
 * Anonymous viewers see the BTL average row + the RatingScale tiles
 * (tapping triggers a sign-in prompt via the host).
 *
 * Composes:
 *   - GradeBox      → viewer's cast grade summary
 *   - RatingScale   → tile row for the cast action
 *   - MeanBox       → BTL aggregate readout
 *   - RatingDistribution → 1-6 histogram
 *   - FallbackNotice (greyscale) → empty state
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchRatingCardProps extends React.ComponentProps<'div'> {
  /** Viewer's cast grade, 1 (best) to 6 (worst). Omit when unset. */
  myGrade?: RatingScaleValue;
  /** BTL aggregate mean and count. Omit when none have landed yet. */
  btlAverage?: { value: number; count: number };
  /** Per-grade counts for the histogram. */
  distribution?: RatingCounts;
  /** Tap handler for casting/changing a grade. */
  onSelectGrade?: (value: RatingScaleValue) => void;
  /**
   * Render mode:
   *  - 'ready'   → full two-row card
   *  - 'partial' → renders any present data, dims the absent sub-row
   *  - 'empty'   → full-card FallbackNotice ("Be the first to grade…")
   *  - 'locked'  → render the readout row only, scale is disabled
   *  - 'loading' → skeleton placeholder
   */
  state: 'ready' | 'partial' | 'empty' | 'locked' | 'loading';
  /** FallbackReason override for `empty`. Defaults to `no_ratings_yet`. */
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
  lockedReason: _lockedReason = 'rating_period_closed',
  className,
  ...props
}: MatchRatingCardProps) {
  const chrome = cn(
    'bg-grey-200 border border-white/5 rounded-[4px] p-5',
    'flex flex-col gap-5',
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
        <div className="h-10 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="h-20 w-full animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  return (
    <div data-slot="match-rating-card" data-state={state} className={chrome} {...props}>
      {/* Row 1: Your grade */}
      <div data-slot="match-rating-card-row" data-row="your-grade" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-white/50">
              {state === 'locked' ? 'Final grade' : 'Your grade'}
            </span>
            <span className="text-sm text-white/80">
              {myGrade !== undefined
                ? `You graded this ${myGrade}`
                : state === 'locked'
                  ? lockedReason === 'rating_period_closed'
                    ? 'Ratings closed.'
                    : 'Grading window closed.'
                  : 'Pick a grade (1 = excellent, 6 = poor).'}
            </span>
          </div>
          {myGrade !== undefined ? <GradeBox value={myGrade} size="lg" /> : null}
        </div>
        {state !== 'locked' ? (
          <RatingScale value={myGrade} variant="compact" onSelect={onSelectGrade} />
        ) : null}
      </div>

      {/* Row 2: BTL average */}
      <div
        data-slot="match-rating-card-row"
        data-row="btl-average"
        className="flex flex-col gap-3 border-t border-white/5 pt-5"
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-white/50">BTL average</span>
            {btlAverage !== undefined ? (
              <MeanBox value={btlAverage.value} count={btlAverage.count} size="lg" />
            ) : (
              <span className="text-sm text-white/60">Picks haven't started landing yet.</span>
            )}
          </div>
        </div>
        {distribution !== undefined && btlAverage !== undefined ? (
          <RatingDistribution counts={distribution} mean={btlAverage.value} />
        ) : null}
      </div>
    </div>
  );
}

export { MatchRatingCard };
