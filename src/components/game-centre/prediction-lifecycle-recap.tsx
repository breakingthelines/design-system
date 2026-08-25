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
 * TWO LAYOUTS, chosen from the rows themselves
 * ────────────────────────────────────────────
 * COMPARE (the original): at least one row carries `actualValue`, so the card
 * is a matrix — the viewer's call and the actual outcome in their own aligned
 * columns, under a Yours / Actual legend.
 *
 * SINGLE VALUE: no row carries `actualValue`. The Actual column is not
 * rendered at all and the grid drops to three tracks, so the one value a row
 * does have gets the width the second column used to hold. A host that folds
 * the comparison into the value itself ("2-1 → 0-2") is in this mode, and for
 * it the old layout spent half the row on a placeholder dash.
 *
 * The legend goes with the column: with a single value column there is no
 * comparison to name, and the card cannot know whose value it is holding —
 * the same rows render another entrant's round in spectator mode — so it
 * labels only the points and lets the value speak for itself.
 *
 * `data-layout` on the rows list names the mode, so a host can target it
 * without counting cells.
 *
 * `note` is an optional second line, full width under the value: the muted
 * trailing context a set market needs ("Also scored: Iwobi") without a column
 * of its own.
 *
 * OVERFLOW IS THE HOST'S. The value cells do not truncate. A recap value can
 * be a list of names, and how a list of names should shorten (count the
 * overflow, scroll it, wrap it) is a question about the data, which the host
 * has and this card does not.
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
  /** The row's value. In COMPARE mode this is the viewer's pick. */
  pickValue: React.ReactNode;
  /**
   * Actual outcome (the truth from settlement), rendered in its own column to
   * the right of the pick.
   *
   * Omit it on EVERY row to get the SINGLE VALUE layout: the column and its
   * legend disappear rather than standing empty. Omitting it on only some rows
   * keeps the comparison layout, and those rows show a placeholder dash — a
   * blank in a matrix still has to read as a blank.
   */
  actualValue?: React.ReactNode;
  /**
   * Optional trailing line, rendered muted and full width beneath the value.
   * For context that belongs to the row but is not its result — the scorers
   * the viewer did not pick, say. Omitted entirely when undefined.
   */
  note?: React.ReactNode;
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
  /**
   * Wave 6.25z: when true, drops the in-card "Your pick breakdown" eyebrow
   * so the host can render an external `SectionHeading` instead. Off-by-
   * default — back-compat for stories + any other consumer.
   */
  hideHeader?: boolean;
}

/**
 * The two row templates: label, value(s), points. Written out in full because
 * Tailwind matches source text — a template assembled at runtime compiles to
 * nothing at all.
 */
const ROW_GRID_COMPARE =
  'grid grid-cols-[104px_minmax(0,1fr)_minmax(0,1fr)_auto] items-baseline gap-3';
const ROW_GRID_SINGLE_VALUE = 'grid grid-cols-[104px_minmax(0,1fr)_auto] items-baseline gap-3';

function PredictionLifecycleRecap({
  rows,
  crowd,
  hideHeader = false,
  className,
  ...props
}: PredictionLifecycleRecapProps) {
  const hasRows = rows.length > 0;
  // The layout is read off the rows, not passed in: a host that has stopped
  // supplying `actualValue` has stopped comparing, and there is nothing left
  // for the second column to hold.
  const hasActualColumn = rows.some((row) => row.actualValue !== undefined);
  const rowGrid = hasActualColumn ? ROW_GRID_COMPARE : ROW_GRID_SINGLE_VALUE;
  return (
    <div
      data-slot="prediction-lifecycle-recap"
      className={cn(
        'bg-grey-200 flex flex-col gap-4 rounded-[4px] border border-white/5 p-5',
        className
      )}
      {...props}
    >
      {hideHeader ? null : (
        <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
          Your prediction breakdown
        </span>
      )}

      {hasRows ? (
        <dl
          data-slot="prediction-lifecycle-recap-rows"
          data-layout={hasActualColumn ? 'compare' : 'single-value'}
          className="flex flex-col gap-2.5"
        >
          {/* Column legend. In COMPARE mode it names the two value columns the
              matrix splits (Yours · Actual · Pts). In SINGLE VALUE mode there
              is one value column and nothing true to call it, so only the
              points are named and the rule stays as the head's divider. */}
          <div
            data-slot="prediction-lifecycle-recap-head"
            aria-hidden="true"
            className={cn(
              rowGrid,
              'border-b border-white/[0.08] pb-2 font-content text-[10px] tracking-[0.12em] text-white/40 uppercase'
            )}
          >
            <span />
            {hasActualColumn ? (
              <>
                <span>Yours</span>
                <span>Actual</span>
              </>
            ) : (
              <span />
            )}
            <span className="text-right">Pts</span>
          </div>
          {rows.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.24, delay: 0.04 * index }}
              className={cn(rowGrid, 'border-b border-white/[0.04] pb-2 last:border-b-0 last:pb-0')}
              data-slot="prediction-lifecycle-recap-row"
              data-status={row.status}
            >
              <dt className="font-content text-[10px] tracking-[0.12em] text-white/40 uppercase">
                {row.label}
              </dt>
              <dd
                data-slot="prediction-lifecycle-recap-pick"
                className="font-content min-w-0 text-xs text-white"
              >
                {row.pickValue}
              </dd>
              {hasActualColumn ? (
                <dd
                  data-slot="prediction-lifecycle-recap-actual"
                  className="font-content min-w-0 text-xs text-white/55"
                >
                  {row.actualValue !== undefined ? (
                    row.actualValue
                  ) : (
                    <span className="text-white/25">&ndash;</span>
                  )}
                </dd>
              ) : null}
              <dd
                data-slot="prediction-lifecycle-recap-points"
                className={cn(
                  'font-content text-right text-sm font-bold tracking-tight tabular-nums',
                  STATUS_TINT[row.status]
                )}
              >
                +{row.pointsEarned}
                <span className="font-content ml-1 text-[10px] font-medium tracking-[0.12em] text-white/40 uppercase">
                  / {row.pointsAvailable}
                </span>
              </dd>
              {row.note !== undefined ? (
                /* Second line, starting under the value and running to the end
                   of the row. `grid-column` is written out rather than spelled
                   as a span so it lands in column 2 under both templates. */
                <dd
                  data-slot="prediction-lifecycle-recap-note"
                  className="font-content mt-1 min-w-0 text-[11px] text-white/45 [grid-column:2/-1]"
                >
                  {row.note}
                </dd>
              ) : null}
            </motion.div>
          ))}
        </dl>
      ) : (
        <span className="font-content text-xs text-white/55">
          You didn&apos;t place a prediction on this match.
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
