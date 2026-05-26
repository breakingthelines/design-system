'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { LeaderboardRow, type LeaderboardRowProps } from '#/components/ui/leaderboard-row';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionLeaderboardTable (L4 — Prediction League standings)
 *
 * Wraps a list of LeaderboardRow primitives in a table-like surface so the
 * Prediction League standings tab has a single primitive to render. The
 * caller passes already-prepared row data; this component handles:
 *
 *   - sticky column eyebrow (rank / member / pts / Δ / gameweek)
 *   - viewer-row scroll anchoring via id="leaderboard-viewer-row"
 *   - empty state (`emptyReason` -> FallbackState in the consumer surface)
 *
 * This primitive is deliberately *display-only*: no sort handlers, no
 * pagination, no client-side filter. Those concerns belong to the consumer.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionLeaderboardEntry extends Omit<
  LeaderboardRowProps,
  'className' | 'onClick'
> {
  /** Stable React key — the squad member id. */
  id: string;
  /** Optional per-row click handler. */
  onSelect?: (id: string) => void;
}

export interface PredictionLeaderboardTableProps {
  /** Visible heading — e.g. "Premier League Predictor", "Gameweek 32". */
  title: string;
  /** Optional eyebrow — typically the league/club context. */
  eyebrow?: string;
  /** Rows in display order (already sorted by rank ascending). */
  rows: readonly PredictionLeaderboardEntry[];
  /** Total entrants in the league, for the eyebrow stat. */
  totalEntrants?: number;
  /** Optional footer slot — pagination, "view full table" link, etc. */
  footer?: React.ReactNode;
  className?: string;
}

export function PredictionLeaderboardTable({
  title,
  eyebrow,
  rows,
  totalEntrants,
  footer,
  className,
}: PredictionLeaderboardTableProps) {
  return (
    <section
      data-slot="prediction-leaderboard-table"
      data-row-count={rows.length}
      className={cn(
        'flex w-full flex-col border border-white/10 bg-[var(--color-grey-200)] text-white',
        className
      )}
    >
      <header
        data-slot="prediction-leaderboard-table-eyebrow"
        className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] px-4 py-3"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow ? (
            <span className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]">
              {eyebrow}
            </span>
          ) : null}
          <h3
            data-slot="prediction-leaderboard-table-title"
            className="truncate text-sm font-semibold tracking-tight"
          >
            {title}
          </h3>
        </div>
        {totalEntrants !== undefined ? (
          <span
            data-slot="prediction-leaderboard-table-total"
            className="font-mono text-[11px] tabular-nums text-white/60"
          >
            {totalEntrants} {totalEntrants === 1 ? 'entrant' : 'entrants'}
          </span>
        ) : null}
      </header>

      <div role="table" data-slot="prediction-leaderboard-table-body" className="flex flex-col">
        <div
          data-slot="prediction-leaderboard-table-column-eyebrow"
          aria-hidden="true"
          className={cn(
            'grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/[0.06]',
            'px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]'
          )}
        >
          <span>Rank</span>
          <span>Member</span>
          <span className="text-right">Pts</span>
        </div>

        {rows.length === 0 ? (
          <p
            data-slot="prediction-leaderboard-table-empty"
            className="px-4 py-6 text-center text-[12px] text-white/55"
          >
            No standings yet. Picks will be ranked once the first gameweek settles.
          </p>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              id={row.isViewer ? 'leaderboard-viewer-row' : undefined}
              data-slot="prediction-leaderboard-table-row"
              data-id={row.id}
            >
              <LeaderboardRow
                {...row}
                onClick={row.onSelect ? () => row.onSelect?.(row.id) : undefined}
              />
            </div>
          ))
        )}
      </div>

      {footer ? (
        <footer
          data-slot="prediction-leaderboard-table-footer"
          className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-[11px] text-white/60"
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
