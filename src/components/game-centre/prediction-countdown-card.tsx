'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice, type FallbackReasonInput } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionCountdownCard
 *
 * Wave 6 Predictions sub-tab top card. Lean four-row composition:
 *
 *   countdown          (time-adaptive — see below)
 *   competition + round + venue
 *   lifecycle copy slot (e.g. "Picks open closer to kickoff")
 *   primary CTA
 *
 * Time-adaptive countdown format (host computes the phase + label):
 *   - >7d out: absolute ("Kicks off Tue 17 Jun, 20:00 GMT")
 *   - 1-7d out: "Kickoff in 6d 2h"
 *   - <24h: "Kickoff in 4h 12m"
 *   - <1h: same as <24h but rendered in BTL red (cross-cutting urgency rule)
 *   - LIVE: "Live · 67'"
 *   - FT: "FT"
 *
 * The component is presentational. The lifecycle reason (if any) renders via
 * FallbackNotice with the matching key. The CTA is a node — wrap your own
 * button (GatedAction, anchor, etc.).
 * ──────────────────────────────────────────────────────────────────────────── */

export type CountdownPhase =
  | 'far' // >7d
  | 'days' // 1-7d
  | 'hours' // <24h
  | 'imminent' // <1h — BTL red urgency tint
  | 'live' // currently playing
  | 'finished'; // FT

export interface PredictionCountdownCardProps extends React.ComponentProps<'div'> {
  /** Pre-computed countdown label for the current phase. */
  countdownLabel: string;
  /** Phase classification — drives urgency tint. */
  phase: CountdownPhase;
  /** Competition + round caption, e.g. "Premier League · Matchday 12". */
  caption?: string;
  /** Venue name. */
  venue?: string;
  /**
   * Lifecycle reason key. Renders the matching FallbackNotice copy in
   * 'compact' variant. Common keys: 'prediction_not_yet_open',
   * 'prediction_locked', 'league_not_started'.
   */
  lifecycleReason?: FallbackReasonInput;
  /** Primary CTA. Typically <GatedAction>...<button>Make pick</button>... */
  cta?: React.ReactNode;
}

function PredictionCountdownCard({
  countdownLabel,
  phase,
  caption,
  venue,
  lifecycleReason,
  cta,
  className,
  ...props
}: PredictionCountdownCardProps) {
  const isUrgent = phase === 'imminent';
  const isLive = phase === 'live';

  return (
    <div
      data-slot="prediction-countdown-card"
      data-phase={phase}
      className={cn(
        'bg-grey-200 border border-white/5 rounded-[4px] p-5',
        'flex flex-col gap-3',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <span
          data-slot="prediction-countdown-label"
          className={cn(
            'text-3xl leading-none font-bold tracking-tight',
            isUrgent
              ? 'text-[var(--color-red-100)]'
              : isLive
                ? 'text-[var(--color-red-100)]'
                : 'text-white'
          )}
        >
          {countdownLabel}
        </span>
        {caption || venue ? (
          <span className="text-sm text-white/60">
            {[caption, venue].filter(Boolean).join(' · ')}
          </span>
        ) : null}
      </div>

      {lifecycleReason !== undefined ? (
        <FallbackNotice reasons={[lifecycleReason]} variant="compact" />
      ) : null}

      {cta !== undefined ? (
        <div data-slot="prediction-countdown-cta" className="pt-1">
          {cta}
        </div>
      ) : null}
    </div>
  );
}

export { PredictionCountdownCard };
