'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionCountdownCard (Wave 6.4: two-row collapse)
 *
 * The Predictions sub-tab top card. Trimmed to TWO rows max:
 *
 *   Row 1 — countdown OR FT/Live status
 *   Row 2 — competition + round (left) · CTA (right) — single line
 *
 * The previous standalone lifecycle-copy slot (`lifecycleReason`) and
 * venue caption are gone. Lifecycle copy is communicated once on the
 * sibling cards; venue lives in the match header.
 *
 * Time-adaptive countdown format (host computes the phase + label):
 *   - >7d out: absolute ("Kicks off Tue 17 Jun, 20:00 GMT")
 *   - 1-7d out: "Kickoff in 6d 2h"
 *   - <24h: "Kickoff in 4h 12m"
 *   - <1h: same as <24h but rendered in BTL red (urgency tint)
 *   - LIVE: "Live · 67'"
 *   - FT: "FT"
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
  /** Primary CTA. Typically <GatedAction>...<button>Make pick</button>... */
  cta?: React.ReactNode;
}

function PredictionCountdownCard({
  countdownLabel,
  phase,
  caption,
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
      {/* Row 1: countdown / status */}
      <span
        data-slot="prediction-countdown-label"
        className={cn(
          'text-3xl leading-none font-bold tracking-tight',
          isUrgent || isLive ? 'text-[var(--color-red-100)]' : 'text-white'
        )}
      >
        {countdownLabel}
      </span>

      {/* Row 2: caption (left) + CTA (right) on a single line */}
      {caption || cta ? (
        <div
          data-slot="prediction-countdown-meta-row"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          {caption ? (
            <span data-slot="prediction-countdown-caption" className="text-sm text-white/60">
              {caption}
            </span>
          ) : null}
          {cta !== undefined ? (
            <div data-slot="prediction-countdown-cta" className="ml-auto">
              {cta}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { PredictionCountdownCard };
