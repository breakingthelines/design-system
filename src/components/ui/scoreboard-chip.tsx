'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * ScoreboardChip
 *
 * Compact live-state badge. Used in MatchHeader, fixture rows, and any live
 * surface that needs a one-glance status pill.
 *
 *   - scheduled  → "Kick-off"
 *   - live       → "Live" with a pulsing red dot (and optional clock label)
 *   - half_time  → "Half time"
 *   - finished   → "Full time"
 *   - postponed  → "Postponed"
 *   - cancelled  → "Cancelled" (struck through)
 *
 * The chip is render-only — no fetching, no live tick. Callers feed it the
 * current state derived from their data source.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ScoreboardChipStatus =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'finished'
  | 'postponed'
  | 'cancelled';

export interface ScoreboardChipProps {
  status: ScoreboardChipStatus;
  /** Optional clock string ("78'", "HT", "AET"). Only rendered when relevant. */
  clockLabel?: string;
  className?: string;
}

const STATUS_LABEL: Record<ScoreboardChipStatus, string> = {
  scheduled: 'Kick-off',
  live: 'Live',
  half_time: 'Half time',
  finished: 'Full time',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

export function ScoreboardChip({ status, clockLabel, className }: ScoreboardChipProps) {
  const label = STATUS_LABEL[status];
  const isLive = status === 'live';
  const isHalfTime = status === 'half_time';
  const isFinished = status === 'finished';

  return (
    <span
      data-slot="scoreboard-chip"
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-[10px] font-semibold tracking-[0.14em] uppercase',
        'border',
        isLive &&
          'border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/10 text-[var(--color-red-100)]',
        isHalfTime && 'border-amber-200/30 bg-amber-200/10 text-amber-100',
        isFinished && 'border-white/15 bg-white/[0.04] text-white/80',
        status === 'scheduled' && 'border-white/10 bg-transparent text-white/70',
        status === 'postponed' && 'border-amber-200/30 bg-amber-200/10 text-amber-100',
        status === 'cancelled' &&
          'border-white/10 bg-transparent text-[var(--color-grey-500)] line-through',
        className
      )}
    >
      {isLive ? (
        <span
          aria-hidden="true"
          data-slot="scoreboard-chip-dot"
          className="size-1.5 rounded-full bg-[var(--color-red-100)] animate-pulse-ring"
        />
      ) : null}
      <span data-slot="scoreboard-chip-label">{label}</span>
      {clockLabel ? (
        <span data-slot="scoreboard-chip-clock" className="tabular-nums text-white/70">
          {clockLabel}
        </span>
      ) : null}
    </span>
  );
}
