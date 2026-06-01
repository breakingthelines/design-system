'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import {
  ratingDescriptor,
  RATING_SCALE,
  type RatingScaleValue,
} from '#/components/ui/rating-scale';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * RecentPerformanceStrip (Entity page — "Recent Match Performances" block)
 *
 * A horizontal strip of per-match rating bars, one bar per recent match (most
 * recent first, left to right). Each bar carries a numeric readout in a pill at
 * the top and a thin vertical column beneath; the column height encodes match
 * quality on the BTL canonical 1-6 INVERSE scale (1 is best, 6 is worst), so
 * the best performance draws the *tallest* column and the worst the shortest.
 *
 * The single best (peak) performance is highlighted in red per the Figma. When
 * several matches tie on the best value, only the most recent (leftmost) of the
 * tied set is highlighted so the strip reads as "their peak in this window".
 *
 * Reuses the canonical rating semantics from `rating-scale.tsx`
 * (`ratingDescriptor`, `RatingScaleValue`) and carries
 * `data-direction="lower-is-better"` like the other rating primitives so
 * consumers, screen readers and snapshot tests can verify the inversion is
 * preserved.
 *
 * Honest by default: with no data (`state="empty"` or an empty `data` array)
 * the strip renders a tight `FallbackState` rather than a fake zeroed strip —
 * the same pattern `RatingSummary` / `TeamStatsComparison` use.
 *
 * Router-agnostic: when a bar carries an `href` the pill becomes a link via the
 * `useLinkComponent` context (defaults to `<a>`). Render-only otherwise — no
 * fetching, no router awareness.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RecentPerformanceEntry {
  /** BTL rating for the match, 1 (best) to 6 (worst). Fractional aggregates allowed. */
  value: number;
  /** Optional short label beneath the bar (e.g. a date or matchday "MD12"). */
  label?: string;
  /** Optional opponent name — used for the accessible per-bar description. */
  opponent?: string;
  /** Optional route to the match. When set, the value pill becomes a link. */
  href?: string;
}

export interface RecentPerformanceStripProps {
  /** Recent matches, most recent first (left to right). Empty renders the fallback. */
  data: readonly RecentPerformanceEntry[];
  /**
   * Render mode. `ready` shows the strip; `empty` shows the fallback only;
   * `loading` shows skeleton bars. When `data` is empty the strip renders the
   * fallback regardless of `state`.
   */
  state?: 'ready' | 'empty' | 'loading';
  /** Fallback override (used when empty). Defaults to `NO_RATINGS_YET`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

const SCALE_MIN = RATING_SCALE[0].value; // 1 — best
const SCALE_MAX = RATING_SCALE[RATING_SCALE.length - 1].value; // 6 — worst
const SKELETON_BARS = 8;

export function RecentPerformanceStrip({
  data,
  state = 'ready',
  fallbackReason,
  className,
}: RecentPerformanceStripProps) {
  const Link = useLinkComponent();
  const wrapper = cn(
    'flex w-full flex-col gap-4 border border-white/10 bg-[var(--color-grey-200)] p-5 text-white',
    className
  );

  if (state === 'loading') {
    return (
      <div data-slot="recent-performance-strip" data-state="loading" className={wrapper}>
        <StripEyebrow />
        <div className="flex items-end justify-between gap-2">
          {Array.from({ length: SKELETON_BARS }).map((_, idx) => (
            <div
              key={`recent-performance-skeleton-${idx}`}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="h-6 w-full animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-10 w-1 animate-pulse rounded-full bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const points = data.map(normalisePoint).filter((p): p is NormalisedPoint => p !== null);

  if (state === 'empty' || points.length === 0) {
    return (
      <div data-slot="recent-performance-strip" data-state="empty" className={wrapper}>
        <StripEyebrow />
        <FallbackState reason={fallbackReason ?? 'NO_RATINGS_YET'} />
      </div>
    );
  }

  // Peak = best = lowest value on the inverse scale. On a tie, the most recent
  // (leftmost) match wins, so the strip reads as "their peak in this window".
  const bestValue = points.reduce((min, p) => Math.min(min, p.value), SCALE_MAX);
  const peakIndex = points.findIndex((p) => p.value === bestValue);

  return (
    <div
      data-slot="recent-performance-strip"
      data-state="ready"
      data-direction="lower-is-better"
      className={wrapper}
    >
      <StripEyebrow />
      <ol
        data-slot="recent-performance-strip-bars"
        className="flex items-end justify-between gap-2"
      >
        {points.map((point, idx) => (
          <PerformanceBar
            key={`recent-performance-${idx}`}
            point={point}
            isPeak={idx === peakIndex}
            Link={Link}
          />
        ))}
      </ol>
    </div>
  );
}

function StripEyebrow() {
  return (
    <header
      data-slot="recent-performance-strip-eyebrow"
      className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-grey-500)] uppercase"
    >
      Recent Match Performances
    </header>
  );
}

interface NormalisedPoint {
  /** Rounded 1-6 value driving the bar height and descriptor. */
  value: RatingScaleValue;
  /** Original value, used for the numeric readout (keeps a fractional aggregate). */
  raw: number;
  label?: string;
  opponent?: string;
  href?: string;
}

function normalisePoint(entry: RecentPerformanceEntry): NormalisedPoint | null {
  const value = toRatingScaleValue(entry.value);
  if (value === undefined) return null;
  return {
    value,
    raw: entry.value,
    label: entry.label,
    opponent: entry.opponent,
    href: entry.href,
  };
}

interface PerformanceBarProps {
  point: NormalisedPoint;
  isPeak: boolean;
  Link: ReturnType<typeof useLinkComponent>;
}

function PerformanceBar({ point, isPeak, Link }: PerformanceBarProps) {
  const descriptor = ratingDescriptor(point.value);
  const display = formatRating(point.raw, point.value);
  const heightPct = barHeightPct(point.value);
  const ariaLabel = barAriaLabel(display, descriptor.label, point.opponent);

  const pill = (
    <span
      data-slot="recent-performance-strip-value"
      data-peak={isPeak || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-sm border px-2 py-1',
        'font-mono text-[13px] font-semibold tabular-nums tracking-tight transition-colors',
        isPeak
          ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)] text-white'
          : 'border-white/10 bg-white/[0.04] text-white/85'
      )}
    >
      {display}
    </span>
  );

  return (
    <li
      data-slot="recent-performance-strip-bar"
      data-peak={isPeak || undefined}
      data-value={point.value}
      className="flex min-w-0 flex-1 flex-col items-center gap-2"
    >
      {point.href ? (
        <Link
          href={point.href}
          aria-label={ariaLabel}
          className="rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-red-100)]"
        >
          {pill}
        </Link>
      ) : (
        <span aria-label={ariaLabel} title={`${descriptor.label} · lower is better`}>
          {pill}
        </span>
      )}
      <span
        data-slot="recent-performance-strip-column"
        aria-hidden="true"
        style={{ height: `${heightPct}%` }}
        className={cn(
          'w-1 shrink-0 rounded-full transition-all',
          isPeak ? 'bg-[var(--color-red-100)]' : 'bg-white/15'
        )}
      />
      {point.label ? (
        <span
          data-slot="recent-performance-strip-label"
          className="max-w-full truncate text-[10px] tracking-tight text-white/45"
        >
          {point.label}
        </span>
      ) : null}
    </li>
  );
}

function barAriaLabel(display: string, descriptor: string, opponent?: string): string {
  const subject = opponent ? `vs ${opponent}` : 'match';
  return `${subject}: rated ${display}, ${descriptor}. Lower is better.`;
}

/**
 * Column height as a percentage of the track, inverted so the best rating (1)
 * is the tallest column and the worst (6) the shortest. A small floor keeps the
 * worst rating's column legible rather than collapsing it to nothing.
 */
function barHeightPct(value: RatingScaleValue): number {
  const span = SCALE_MAX - SCALE_MIN; // 5
  const fromBest = value - SCALE_MIN; // 0 (best) .. 5 (worst)
  const ratio = 1 - fromBest / span; // 1 (best) .. 0 (worst)
  return Math.round(20 + ratio * 80); // 20%..100%
}

function toRatingScaleValue(value: number | undefined): RatingScaleValue | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < SCALE_MIN || rounded > SCALE_MAX) return undefined;
  return rounded as RatingScaleValue;
}

/**
 * Show the rating to one decimal when the source value is fractional (e.g. an
 * aggregate "4.8"), otherwise show the rounded integer.
 */
function formatRating(raw: number, fallback: RatingScaleValue): string {
  if (!Number.isFinite(raw)) return String(fallback);
  return Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
}
