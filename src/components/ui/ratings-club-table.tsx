'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { RatingDistributionBar } from '#/components/ui/rating-distribution-bar';
import {
  EMPTY_RATING_COUNTS,
  type RatingCounts,
  ratingTotal,
} from '#/components/ui/rating-distribution';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingsClubTable (L5 — Ratings Club standings)
 *
 * Standings view for a Ratings Club. Each row represents either a player or a
 * manager who has been rated by the club's members. Rows are display-only
 * data containers — the consumer wires links / hover-cards on top.
 *
 *   - rank        — current standings rank
 *   - subject     — player/manager label + crest/avatar
 *   - aggregate   — caller-computed mean (the lower the better)
 *   - distribution — RatingCounts; we draw a compact RatingDistributionBar
 *
 * Note: BTL's rating scale is inverse (1 = best). The table is sorted by mean
 * *ascending* — the consumer is responsible for passing rows in the correct
 * order. The header carries `data-direction="lower-is-better"` so this never
 * gets misread by an automated test or a refactor.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RatingsClubTableEntry {
  /** Stable React key — the subject's identity-spine id. */
  id: string;
  /** Current standings rank. */
  rank: number;
  /** Subject display label — "Bukayo Saka". */
  subjectLabel: string;
  /** Optional secondary line — position, role, team. */
  subjectSecondary?: string;
  /** Optional avatar / crest. */
  subjectImageUrl?: string;
  /** Brand tint used as the avatar fallback. */
  subjectAccentColor?: string;
  /** Caller-computed mean rating (1-6). Undefined means "no ratings yet". */
  meanValue?: number;
  /** Rating counts. */
  counts?: RatingCounts;
  /** Optional click handler. */
  onSelect?: (id: string) => void;
}

export interface RatingsClubTableProps {
  /** Visible heading — e.g. "Arsenal player ratings, GW32". */
  title: string;
  /** Optional eyebrow — typically the club context. */
  eyebrow?: string;
  /** Rows in display order (sorted ascending by mean). */
  rows: readonly RatingsClubTableEntry[];
  /** Optional total entrants stat (rated subjects). */
  totalSubjects?: number;
  /** Optional footer slot. */
  footer?: React.ReactNode;
  className?: string;
}

export function RatingsClubTable({
  title,
  eyebrow,
  rows,
  totalSubjects,
  footer,
  className,
}: RatingsClubTableProps) {
  return (
    <section
      data-slot="ratings-club-table"
      data-direction="lower-is-better"
      data-row-count={rows.length}
      className={cn(
        'flex w-full flex-col border border-white/10 bg-[var(--color-grey-200)] text-white',
        className
      )}
    >
      <header
        data-slot="ratings-club-table-eyebrow"
        className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] px-4 py-3"
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow ? (
            <span className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]">
              {eyebrow}
            </span>
          ) : null}
          <h3
            data-slot="ratings-club-table-title"
            className="truncate text-sm font-semibold tracking-tight"
          >
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          {totalSubjects !== undefined ? (
            <span
              data-slot="ratings-club-table-total"
              className="font-mono text-[11px] tabular-nums text-white/60"
            >
              {totalSubjects} {totalSubjects === 1 ? 'subject' : 'subjects'}
            </span>
          ) : null}
          <span className="text-[9px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
            Lower is better
          </span>
        </div>
      </header>

      <div
        data-slot="ratings-club-table-column-eyebrow"
        aria-hidden="true"
        className={cn(
          'grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-white/[0.06]',
          'px-3 py-1.5 text-[9px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]'
        )}
      >
        <span>Rank</span>
        <span>Subject</span>
        <span className="text-right">Mean · spread</span>
      </div>

      {rows.length === 0 ? (
        <p
          data-slot="ratings-club-table-empty"
          className="px-4 py-6 text-center text-[12px] text-white/55"
        >
          No ratings yet. Standings appear after the first scored match settles.
        </p>
      ) : (
        rows.map((row) => <RatingsClubTableRow key={row.id} row={row} />)
      )}

      {footer ? (
        <footer
          data-slot="ratings-club-table-footer"
          className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-[11px] text-white/60"
        >
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

function RatingsClubTableRow({ row }: { row: RatingsClubTableEntry }) {
  const counts = row.counts ?? EMPTY_RATING_COUNTS;
  const total = ratingTotal(counts);
  const interactive = Boolean(row.onSelect);
  const Element = interactive ? 'button' : 'div';
  const interactiveProps = interactive
    ? ({ type: 'button' as const, onClick: () => row.onSelect?.(row.id) } as const)
    : null;

  return (
    <Element
      data-slot="ratings-club-table-row"
      data-rank={row.rank}
      data-id={row.id}
      {...(interactiveProps ?? {})}
      className={cn(
        'group/ratings-club-table-row flex w-full items-center gap-3 border-b border-white/[0.06]',
        'px-3 py-2.5 text-left last:border-b-0',
        interactive && 'cursor-pointer transition-colors hover:bg-white/[0.03]',
        interactive && 'focus-visible:outline-none focus-visible:bg-white/[0.04]'
      )}
    >
      <span
        data-slot="ratings-club-table-rank"
        className="inline-flex w-10 shrink-0 items-center justify-center font-mono text-base font-semibold tabular-nums text-white"
      >
        {row.rank}
      </span>

      <span
        data-slot="ratings-club-table-avatar"
        aria-hidden="true"
        style={{ backgroundColor: row.subjectAccentColor ?? 'var(--color-grey-300)' }}
        className={cn(
          'relative inline-flex size-9 shrink-0 items-center justify-center',
          'rounded-full border border-white/10 overflow-hidden',
          'text-[10px] font-bold tracking-tight text-white'
        )}
      >
        {row.subjectImageUrl ? (
          <img
            src={row.subjectImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initialsForSubject(row.subjectLabel)}</span>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          data-slot="ratings-club-table-subject"
          className="truncate text-[13px] font-semibold tracking-tight text-white"
        >
          {row.subjectLabel}
        </span>
        {row.subjectSecondary ? (
          <span
            data-slot="ratings-club-table-subject-secondary"
            className="truncate text-[10px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
          >
            {row.subjectSecondary}
          </span>
        ) : null}
      </div>

      <div data-slot="ratings-club-table-summary" className="flex shrink-0 items-center gap-2">
        <RatingDistributionBar
          counts={counts}
          totalOverride={total}
          meanValue={row.meanValue}
          variant="grouped"
          className="border-0 bg-transparent p-0"
        />
      </div>
    </Element>
  );
}

function initialsForSubject(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
