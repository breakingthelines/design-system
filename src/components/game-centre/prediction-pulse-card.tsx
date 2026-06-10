'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice, type FallbackReasonInput } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionPulseCard (Wave 6.4: single-bar collapse)
 *
 * The Predictions sub-tab pulse card. Wave 6 had a two-column layout
 * (Your pick / Pulse). Wave 6.4 collapses to a SINGLE horizontal pulse
 * bar + one caption line ("324 picks · BTL pulse"). The "Your pick"
 * column is gone — the cast prediction lives on the sibling
 * `PredictionPickCard`. The state subtitle is gone too — lifecycle
 * copy is communicated once on the sibling countdown card.
 *
 * Empty pulse renders a compact FallbackNotice when `emptyPulseReason`
 * is supplied, otherwise a tight inviting copy line.
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

/**
 * @deprecated Wave 6.4 collapsed the pulse card; the cast pick lives on
 * `PredictionPickCard`. The type is kept exported for back-compat.
 */
export interface PredictionPickSummary {
  label: string;
  tint?: 'home' | 'draw' | 'away';
}

export interface PredictionPulseCardProps extends React.ComponentProps<'div'> {
  /** Aggregate pulse. */
  pulse?: PredictionPulse;
  /**
   * Fallback reason key when no pulse data exists yet
   * (e.g. 'no_predictions_yet'). Renders compact in place of the bar.
   */
  emptyPulseReason?: FallbackReasonInput;
  /** Caption suffix appended after the count. Defaults to `BTL pulse`. */
  captionSuffix?: string;
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

function PredictionPulseCard({
  pulse,
  emptyPulseReason,
  captionSuffix = 'BTL pulse',
  className,
  ...props
}: PredictionPulseCardProps) {
  return (
    <div
      data-slot="prediction-pulse-card"
      className={cn(
        'bg-grey-200 border border-white/5 rounded-[4px] p-5',
        'flex flex-col gap-2',
        className
      )}
      {...props}
    >
      {pulse !== undefined ? (
        <>
          <PulseBar pulse={pulse} />
          <span data-slot="prediction-pulse-caption" className="text-xs text-white/55">
            {pulse.count} {pulse.count === 1 ? 'pick' : 'picks'} · {captionSuffix}
          </span>
        </>
      ) : emptyPulseReason !== undefined ? (
        <FallbackNotice reasons={[emptyPulseReason]} variant="compact" />
      ) : (
        <span className="text-sm text-white/60">Picks haven&apos;t started landing yet.</span>
      )}
    </div>
  );
}

export { PredictionPulseCard };
