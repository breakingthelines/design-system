'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionLifecycleRecap (Wave 6.5)
 *
 * The FINISHED-state recap card for the Predictions sub-tab. Shows the
 * viewer's per-field breakdown of points earned + an optional crowd recap
 * line. Sits BELOW the PredictionsHero "How you did" ribbon — the ribbon
 * is the headline, this is the receipt.
 *
 *   ─────────────────────────────────────────────────────
 *   YOUR PICK BREAKDOWN
 *   Outcome           HOME              +1
 *   Exact score       2–0   ACTUAL 2-1  +0
 *   Goalscorers       Saka, Ødegaard    +2 / 2 picks
 *   ─────────────────────────────────────────────────────
 *   1,247 predicted   41% nailed the result
 *
 * Honest empty states:
 *  - empty rows array → "You didn't place a pick on this match."
 *  - undefined crowd → no crowd recap line
 * ──────────────────────────────────────────────────────────────────────────── */

export type PredictionRecapFieldStatus = 'correct' | 'incorrect' | 'partial' | 'void';

const STATUS_TINT: Record<PredictionRecapFieldStatus, string> = {
  correct: 'text-[var(--color-red-100)]',
  partial: 'text-[var(--color-red-100)]/70',
  incorrect: 'text-white/40',
  void: 'text-white/30',
};

export interface PredictionRecapRow {
  /** Stable React key. */
  id: string;
  /** Field label — "Outcome", "Exact score", "Goalscorers", "Bookings". */
  label: string;
  /** Pick value (the viewer's pick, formatted). */
  pickValue: React.ReactNode;
  /**
   * Actual outcome (the truth from settlement). Optional — when omitted we
   * just show the pick + points. When present it renders to the right.
   */
  actualValue?: React.ReactNode;
  /** Points earned for this field. */
  pointsEarned: number;
  /** Points that were available on this field. */
  pointsAvailable: number;
  /** Settlement status. */
  status: PredictionRecapFieldStatus;
}

export interface PredictionLifecycleRecapCrowd {
  /** Total predictions counted. */
  total: number;
  /** Percentage who nailed the headline result (0-100). */
  resultHitPct: number;
}

export interface PredictionLifecycleRecapProps extends React.ComponentProps<'div'> {
  /** Per-field breakdown rows. */
  rows: readonly PredictionRecapRow[];
  /** Optional crowd recap line. */
  crowd?: PredictionLifecycleRecapCrowd;
}

function PredictionLifecycleRecap({
  rows,
  crowd,
  className,
  ...props
}: PredictionLifecycleRecapProps) {
  const hasRows = rows.length > 0;
  return (
    <div
      data-slot="prediction-lifecycle-recap"
      className={cn(
        'bg-grey-200 flex flex-col gap-4 rounded-[4px] border border-white/5 p-5',
        className
      )}
      {...props}
    >
      <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
        Your pick breakdown
      </span>

      {hasRows ? (
        <dl data-slot="prediction-lifecycle-recap-rows" className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, delay: 0.04 * index }}
              className="grid grid-cols-[120px_1fr_auto] items-baseline gap-3 border-b border-white/[0.04] pb-2 last:border-b-0 last:pb-0"
              data-slot="prediction-lifecycle-recap-row"
              data-status={row.status}
            >
              <dt className="font-content text-[10px] tracking-[0.12em] text-white/40 uppercase">
                {row.label}
              </dt>
              <dd className="font-content min-w-0 truncate text-xs text-white">
                <span data-slot="prediction-lifecycle-recap-pick">{row.pickValue}</span>
                {row.actualValue !== undefined ? (
                  <span
                    data-slot="prediction-lifecycle-recap-actual"
                    className="font-content ml-2 text-[10px] tracking-[0.12em] text-white/40 uppercase"
                  >
                    actual {row.actualValue}
                  </span>
                ) : null}
              </dd>
              <dd
                data-slot="prediction-lifecycle-recap-points"
                className={cn(
                  'font-display text-sm font-bold tracking-tight tabular-nums',
                  STATUS_TINT[row.status]
                )}
              >
                +{row.pointsEarned}
                <span className="ml-1 text-[10px] font-medium tracking-[0.12em] text-white/40 uppercase">
                  / {row.pointsAvailable}
                </span>
              </dd>
            </motion.div>
          ))}
        </dl>
      ) : (
        <span className="font-content text-xs text-white/55">
          You didn&apos;t place a pick on this match.
        </span>
      )}

      {crowd ? (
        <div
          data-slot="prediction-lifecycle-recap-crowd"
          className="flex flex-wrap items-baseline justify-between gap-3 border-t border-white/[0.06] pt-3"
        >
          <span className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase">
            {crowd.total.toLocaleString()} predicted
          </span>
          <span className="font-content text-xs text-white/70 tabular-nums">
            <span className="text-[var(--color-red-100)]">{Math.round(crowd.resultHitPct)}%</span>{' '}
            nailed the result
          </span>
        </div>
      ) : null}
    </div>
  );
}

export { PredictionLifecycleRecap };
