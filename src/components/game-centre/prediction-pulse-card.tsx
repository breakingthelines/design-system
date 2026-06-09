'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice, type FallbackReasonInput } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionPulseCard
 *
 * Wave 6 Predictions sub-tab two-column card:
 *
 *   LEFT  — Your pick (chip showing the viewer's submitted prediction)
 *   RIGHT — Pulse (home/draw/away aggregate bar + count caption)
 *
 * Caption is state-free: "324 picks" only. Lock state is communicated ONCE
 * on the sibling PredictionCountdownCard's lifecycle copy — adding state
 * suffixes here ("324 picks · locked") doubles the signal.
 *
 * Empty pulse renders the Wave 5 "no_predictions_yet" or equivalent
 * compact FallbackNotice; empty pick renders an inviting CTA copy line.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionPulse {
  /** Percentage of picks for home (0-100). */
  home: number;
  /** Percentage of picks for draw (0-100). */
  draw: number;
  /** Percentage of picks for away (0-100). */
  away: number;
  /** Total number of picks contributing to the pulse. */
  count: number;
}

export interface PredictionPickSummary {
  /**
   * Human label for the pick. Caller decides format: "Home win",
   * "2-1 Arsenal", "Draw", etc.
   */
  label: string;
  /** Optional badge tint (`home`, `draw`, `away` map to BTL palette). */
  tint?: 'home' | 'draw' | 'away';
}

export interface PredictionPulseCardProps extends React.ComponentProps<'div'> {
  /** Viewer's pick summary, when submitted. */
  pick?: PredictionPickSummary;
  /** Aggregate pulse. */
  pulse?: PredictionPulse;
  /**
   * Fallback reason key when no pulse data exists yet
   * (e.g. 'no_predictions_yet'). Renders compact below the right column.
   */
  emptyPulseReason?: FallbackReasonInput;
  /** Empty-pick CTA copy (left column, when no pick yet). */
  emptyPickHint?: string;
  /** Optional class. */
  className?: string;
}

function PulseBar({ pulse }: { pulse: PredictionPulse }) {
  const total = Math.max(pulse.home + pulse.draw + pulse.away, 1);
  const homePct = (pulse.home / total) * 100;
  const drawPct = (pulse.draw / total) * 100;
  const awayPct = (pulse.away / total) * 100;
  return (
    <div
      data-slot="prediction-pulse-bar"
      className="flex h-4 w-full overflow-hidden rounded-[3px] bg-white/5"
      role="img"
      aria-label={`Pulse: home ${Math.round(homePct)}%, draw ${Math.round(drawPct)}%, away ${Math.round(awayPct)}%`}
    >
      <div className="h-full bg-[var(--color-red-100)]" style={{ width: `${homePct}%` }} />
      <div className="h-full bg-white/30" style={{ width: `${drawPct}%` }} />
      <div className="h-full bg-white/60" style={{ width: `${awayPct}%` }} />
    </div>
  );
}

function PickChip({ pick }: { pick: PredictionPickSummary }) {
  const tintClass =
    pick.tint === 'home'
      ? 'bg-[var(--color-red-100)] text-white'
      : pick.tint === 'away'
        ? 'bg-white/15 text-white'
        : 'bg-white/10 text-white/80';
  return (
    <span
      data-slot="prediction-pulse-pick-chip"
      data-tint={pick.tint ?? 'draw'}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        tintClass
      )}
    >
      {pick.label}
    </span>
  );
}

function PredictionPulseCard({
  pick,
  pulse,
  emptyPulseReason,
  emptyPickHint = 'Predict the outcome to lock in your call.',
  className,
  ...props
}: PredictionPulseCardProps) {
  return (
    <div
      data-slot="prediction-pulse-card"
      className={cn(
        'bg-grey-200 border border-white/5 rounded-[4px] p-5',
        'grid grid-cols-1 sm:grid-cols-2 gap-5',
        className
      )}
      {...props}
    >
      {/* LEFT: Your pick */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-white/50">Your pick</span>
        {pick !== undefined ? (
          <PickChip pick={pick} />
        ) : (
          <span className="text-sm text-white/60">{emptyPickHint}</span>
        )}
      </div>

      {/* RIGHT: Pulse */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-white/50">Pulse</span>
        {pulse !== undefined ? (
          <>
            <PulseBar pulse={pulse} />
            <span className="text-xs text-white/50">
              {pulse.count} {pulse.count === 1 ? 'pick' : 'picks'}
            </span>
          </>
        ) : emptyPulseReason !== undefined ? (
          <FallbackNotice reasons={[emptyPulseReason]} variant="compact" />
        ) : (
          <span className="text-sm text-white/60">Picks haven&apos;t started landing yet.</span>
        )}
      </div>
    </div>
  );
}

export { PredictionPulseCard };
