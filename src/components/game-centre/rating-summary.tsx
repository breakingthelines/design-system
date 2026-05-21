'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { RatingDistribution, type RatingCounts } from '#/components/ui/rating-distribution';
import { RatingScale, type RatingScaleValue } from '#/components/ui/rating-scale';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingSummary
 *
 * Aggregate rating block re-used in:
 *   - Match page Overview (compact)
 *   - Match page Ratings tab (full)
 *   - Ratings Club page (club-pulse block)
 *   - Personal Ratings Log (per-row summary, future)
 *   - Entity-page "Rated In" tab (aggregate)
 *
 * The block is honest by default, empty/loading/partial states each
 * render a tight `FallbackState` rather than a placeholder block. The
 * caller is responsible for composing a CTA (typically a gated action
 * wrapping a "Rate this" button); pass it via `cta`.
 *
 * The component does NOT submit ratings; that is the consumer's job
 * (a sheet, a dedicated form).
 *
 * Router-agnostic links: anchor links to club Ratings Club routes use
 * `<a href>` by default. Wrap the tree in `<LinkProvider component={...}>`
 * to swap in a tanstack-router / next-link / react-router primitive.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RatingClubAverage {
  squadHandle: string;
  /** Display label, falls back to squad handle. */
  label?: string;
  /** BTL 1-6 mean. Lower is better. */
  average: number;
  /** Number of ratings used to compute the average. */
  count: number;
  /** Route to the squad's Ratings Club page covering this subject. */
  route: string;
}

export interface RatingSummaryProps {
  /** Viewer's own rating, BTL 1-6 (1 best, 6 worst). */
  myRating?: number;
  /** Optional BTL global aggregate. */
  btlAverage?: { average: number; count: number };
  /** Optional club averages, sorted by relevance/recency. */
  clubAverages?: readonly RatingClubAverage[];
  /** Distribution (counts per 1..6). */
  distribution?: RatingCounts;
  /** Number of rating-tagged thoughts. */
  thoughtCount?: number;
  /**
   * Render mode. `ready` shows the full block; `partial` shows whatever
   * data is present but tones down empty sub-blocks; `empty` shows the
   * fallback only; `loading` shows skeleton-like placeholders.
   */
  state: 'empty' | 'loading' | 'partial' | 'ready';
  /** Optional fallback override (used when `state === "empty"`). */
  fallbackReason?: FallbackReason;
  /** Compact one-column variant for overview cards. */
  variant?: 'compact' | 'full';
  /** Optional rate-this CTA (composed by the caller via a gated action). */
  cta?: React.ReactNode;
  className?: string;
}

export function RatingSummary({
  myRating,
  btlAverage,
  clubAverages,
  distribution,
  thoughtCount,
  state,
  fallbackReason,
  variant = 'full',
  cta,
  className,
}: RatingSummaryProps) {
  const Link = useLinkComponent();
  const wrapper = cn('space-y-4', className);

  if (state === 'loading') {
    return (
      <div data-slot="rating-summary" data-state="loading" className={wrapper}>
        <div className="h-12 animate-pulse rounded-md bg-white/[0.04]" />
        <div className="h-20 animate-pulse rounded-md bg-white/[0.04]" />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div data-slot="rating-summary" data-state="empty" className={wrapper}>
        <FallbackState reason={fallbackReason ?? 'NO_RATINGS_YET'} cta={cta} />
      </div>
    );
  }

  const myValue = toRatingScaleValue(myRating);
  const btlMean = btlAverage?.average && btlAverage.average > 0 ? btlAverage.average : undefined;
  const hasDistribution = distribution && hasAnyCount(distribution);

  return (
    <div data-slot="rating-summary" data-state={state} className={wrapper}>
      <div
        className={
          variant === 'compact'
            ? 'grid gap-3'
            : 'grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
        }
      >
        {/* My rating */}
        <section
          data-slot="rating-summary-mine"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              Your rating
            </h3>
            {myValue ? (
              <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] tracking-wide text-white/75">
                {myValue} / 6
              </span>
            ) : null}
          </header>
          {myValue ? (
            <RatingScale value={myValue} variant="legend" />
          ) : (
            <>
              <p className="text-sm text-white/55">You have not rated this yet.</p>
              {cta ? <div className="mt-3">{cta}</div> : null}
            </>
          )}
        </section>

        {/* BTL average */}
        <section
          data-slot="rating-summary-btl"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              BTL average
            </h3>
            {btlAverage && btlAverage.count > 0 ? (
              <span className="text-xs text-white/45">{btlAverage.count} ratings</span>
            ) : null}
          </header>
          {btlAverage && btlAverage.count > 0 ? (
            <>
              <p className="text-3xl font-semibold text-white">{formatAverage(btlMean)}</p>
              {hasDistribution ? (
                <div className="mt-3">
                  <RatingDistribution counts={distribution!} meanValue={btlMean} showCounts />
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-white/55">Aggregate opens once a few ratings land.</p>
          )}
        </section>
      </div>

      {/* Club averages */}
      {clubAverages && clubAverages.length > 0 ? (
        <section
          data-slot="rating-summary-clubs"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              Rating clubs
            </h3>
            <span className="text-xs text-white/45">{clubAverages.length} clubs</span>
          </header>
          <ul className="space-y-2">
            {clubAverages.map((club) => (
              <li
                key={`${club.squadHandle}-${club.route}`}
                className="flex items-center justify-between gap-3"
              >
                <Link
                  href={club.route}
                  className="min-w-0 truncate text-sm text-white/75 hover:text-white"
                >
                  {club.label || `@${club.squadHandle}`}
                </Link>
                <span className="shrink-0 text-sm font-semibold text-white">
                  {formatAverage(club.average > 0 ? club.average : undefined)}
                </span>
                <span className="shrink-0 text-xs text-white/45">{club.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Thoughts count */}
      {thoughtCount !== undefined && thoughtCount > 0 ? (
        <p className="text-xs text-white/45">{thoughtCount} rating-tagged thoughts attached</p>
      ) : null}
    </div>
  );
}

function toRatingScaleValue(value: number | undefined): RatingScaleValue | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 6) return undefined;
  return rounded as RatingScaleValue;
}

function formatAverage(average?: number): string {
  if (average === undefined || !Number.isFinite(average) || average <= 0) return '-';
  return average.toFixed(1);
}

function hasAnyCount(counts: RatingCounts): boolean {
  return Object.values(counts).some((n) => typeof n === 'number' && n > 0);
}
