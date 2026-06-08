'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * CompetitionStandingsTable (Entity page — Competition "Standings" tab)
 *
 * A league table. One row per team with the standard
 * Played / Won / Drawn / Lost / Goals-For / Goals-Against / Goal-Difference /
 * Points columns, an optional recent-form string, an optional team crest, and
 * an optional highlighted row for the entity being viewed.
 *
 * Promoted from the platform-local `CompetitionStandingsTable`
 * (`platform/app/components/entity/entity-tabs.tsx`) into the design system so
 * any consumer renders the same canonical shape. The platform keeps its own
 * proto/REST → props mapping; this component is purely presentational.
 *
 * Accessible by default: a real `<table>` with a `<caption>`, scoped column
 * headers (`<th scope="col">`), and a row header per team
 * (`<th scope="row">`). Numeric columns expose a terse `<abbr>` so the
 * single-letter headers (P, W, D, …) are announced in full.
 *
 * Honest by default: with no rows (`state="empty"` or an empty `rows` array)
 * the component renders a tight `FallbackState` rather than an empty table —
 * the same pattern `RatingSummary` / `TeamStatsComparison` use.
 *
 * Router-agnostic: when a team carries an `href` the name links via the
 * `useLinkComponent` context (defaults to `<a>`). Render-only otherwise.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface CompetitionStandingsTeam {
  /** Stable identifier — matched against `highlightTeamId` to highlight a row. */
  id?: string;
  /** Team display name. */
  name: string;
  /** Optional crest image URL, rendered beside the name. */
  crestUrl?: string;
  /** Optional route to the team page. When set, the name becomes a link. */
  href?: string;
}

export interface CompetitionStandingsRow {
  /** League position. */
  rank: number;
  team: CompetitionStandingsTeam;
  /** Matches played. */
  played: number;
  /** Matches won. */
  won: number;
  /** Matches drawn. */
  drawn: number;
  /** Matches lost. */
  lost: number;
  /** Goals scored. */
  goalsFor: number;
  /** Goals conceded. */
  goalsAgainst: number;
  /** Goal difference (already computed by the caller). */
  goalDifference: number;
  /** Points. */
  points: number;
  /**
   * Optional recent form, most recent last, as a compact string of result
   * letters, e.g. "WWDLW". Rendered as coloured pips when present.
   */
  form?: string;
}

export interface CompetitionStandingsTableProps {
  /** Standings rows, in table order (rank ascending). Empty renders the fallback. */
  rows: readonly CompetitionStandingsRow[];
  /** When set, the row whose `team.id` matches is visually highlighted. */
  highlightTeamId?: string;
  /** Accessible table caption. Defaults to "League standings". */
  caption?: string;
  /**
   * Render mode. `ready` shows the table; `empty` shows the fallback only;
   * `loading` shows skeleton rows. When `rows` is empty the component renders
   * the fallback regardless of `state`.
   */
  state?: 'ready' | 'empty' | 'loading';
  /** Fallback override (used when empty). Defaults to `NO_DATA_FOR_SEASON`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

interface NumericColumn {
  key: 'played' | 'won' | 'drawn' | 'lost' | 'goalsFor' | 'goalsAgainst';
  short: string;
  full: string;
}

const NUMERIC_COLUMNS: readonly NumericColumn[] = [
  { key: 'played', short: 'P', full: 'Played' },
  { key: 'won', short: 'W', full: 'Won' },
  { key: 'drawn', short: 'D', full: 'Drawn' },
  { key: 'lost', short: 'L', full: 'Lost' },
  { key: 'goalsFor', short: 'GF', full: 'Goals for' },
  { key: 'goalsAgainst', short: 'GA', full: 'Goals against' },
];

const SKELETON_ROWS = 6;

export function CompetitionStandingsTable({
  rows,
  highlightTeamId,
  caption = 'League standings',
  state = 'ready',
  fallbackReason,
  className,
}: CompetitionStandingsTableProps) {
  const Link = useLinkComponent();
  const wrapper = cn(
    'overflow-hidden border border-white/10 bg-[var(--color-grey-200)]',
    className
  );
  const showForm = rows.some((row) => Boolean(row.form));

  if (state === 'loading') {
    return (
      <div data-slot="competition-standings-table" data-state="loading" className={wrapper}>
        <div className="flex flex-col">
          {Array.from({ length: SKELETON_ROWS }).map((_, idx) => (
            <div
              key={`competition-standings-skeleton-${idx}`}
              className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0"
            >
              <div className="size-5 shrink-0 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-4 flex-1 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-4 w-24 shrink-0 animate-pulse rounded-sm bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state === 'empty' || rows.length === 0) {
    return (
      <div data-slot="competition-standings-table" data-state="empty" className={wrapper}>
        <div className="px-5 py-4">
          <FallbackState
            reason={fallbackReason ?? 'NO_DATA_FOR_SEASON'}
            title="Standings not available yet."
          />
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="competition-standings-table"
      data-state="ready"
      className={cn('overflow-x-auto', wrapper)}
    >
      <table className="w-full min-w-[520px] border-collapse text-sm text-white/85">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-white/[0.04] text-[11px] tracking-wide text-white/55 uppercase">
          <tr>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              <abbr title="Position" className="no-underline">
                #
              </abbr>
            </th>
            <th scope="col" className="px-2 py-2 text-left font-medium">
              Team
            </th>
            {NUMERIC_COLUMNS.map((col) => (
              <th key={col.key} scope="col" className="px-2 py-2 text-right font-medium">
                <abbr title={col.full} className="no-underline">
                  {col.short}
                </abbr>
              </th>
            ))}
            <th scope="col" className="px-2 py-2 text-right font-medium">
              <abbr title="Goal difference" className="no-underline">
                GD
              </abbr>
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              <abbr title="Points" className="no-underline">
                Pts
              </abbr>
            </th>
            {showForm ? (
              <th scope="col" className="px-2 py-2 text-left font-medium">
                Form
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <StandingsRowItem
              key={row.team.id ?? `rank-${row.rank}`}
              row={row}
              highlighted={isHighlighted(row, highlightTeamId)}
              showForm={showForm}
              Link={Link}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isHighlighted(row: CompetitionStandingsRow, highlightTeamId?: string): boolean {
  return Boolean(highlightTeamId) && row.team.id === highlightTeamId;
}

interface StandingsRowItemProps {
  row: CompetitionStandingsRow;
  highlighted: boolean;
  showForm: boolean;
  Link: ReturnType<typeof useLinkComponent>;
}

function StandingsRowItem({ row, highlighted, showForm, Link }: StandingsRowItemProps) {
  const numericCell = 'px-2 py-2 text-right tabular-nums';
  return (
    <tr
      data-slot="competition-standings-row"
      data-highlighted={highlighted || undefined}
      aria-current={highlighted ? 'true' : undefined}
      className={cn('border-t border-white/[0.06]', highlighted && 'bg-[var(--color-red-100)]/10')}
    >
      <td className={cn(numericCell, 'text-white/65')}>{row.rank}</td>
      <th scope="row" className="px-2 py-2 text-left font-medium">
        <span className="flex min-w-0 items-center gap-2">
          {highlighted ? (
            <span
              aria-hidden="true"
              className="h-4 w-0.5 shrink-0 rounded-full bg-[var(--color-red-100)]"
            />
          ) : null}
          {row.team.crestUrl ? (
            <img
              src={row.team.crestUrl}
              alt=""
              loading="lazy"
              className="size-4 shrink-0 rounded-full border border-white/10 object-cover"
            />
          ) : null}
          {row.team.href ? (
            <Link
              href={row.team.href}
              className="min-w-0 truncate text-white hover:text-[var(--color-red-100)]"
            >
              {row.team.name}
            </Link>
          ) : (
            <span className="min-w-0 truncate text-white">{row.team.name}</span>
          )}
        </span>
      </th>
      <td className={numericCell}>{row.played}</td>
      <td className={numericCell}>{row.won}</td>
      <td className={numericCell}>{row.drawn}</td>
      <td className={numericCell}>{row.lost}</td>
      <td className={numericCell}>{row.goalsFor}</td>
      <td className={numericCell}>{row.goalsAgainst}</td>
      <td className={numericCell}>{formatGoalDifference(row.goalDifference)}</td>
      <td className={cn(numericCell, 'font-semibold text-white')}>{row.points}</td>
      {showForm ? (
        <td className="px-2 py-2 text-left">{row.form ? <FormPips form={row.form} /> : null}</td>
      ) : null}
    </tr>
  );
}

function FormPips({ form }: { form: string }) {
  const results = form.trim().toUpperCase().split('').filter(Boolean);
  if (results.length === 0) return null;
  return (
    <span data-slot="competition-standings-form" className="inline-flex items-center gap-1">
      {results.map((result, idx) => (
        <span
          key={`form-${idx}`}
          aria-hidden="true"
          title={formResultLabel(result)}
          className={cn(
            'inline-flex size-4 items-center justify-center rounded-sm text-[9px] font-bold',
            formResultClass(result)
          )}
        >
          {result}
        </span>
      ))}
      <span className="sr-only">Recent form: {results.map(formResultLabel).join(', ')}</span>
    </span>
  );
}

function formResultClass(result: string): string {
  switch (result) {
    case 'W':
      return 'bg-[var(--color-status-done)]/20 text-[var(--color-status-done)]';
    case 'L':
      return 'bg-[var(--color-red-100)]/20 text-[var(--color-red-100)]';
    case 'D':
      return 'bg-white/10 text-white/70';
    default:
      return 'bg-white/[0.06] text-white/50';
  }
}

function formResultLabel(result: string): string {
  switch (result) {
    case 'W':
      return 'Win';
    case 'L':
      return 'Loss';
    case 'D':
      return 'Draw';
    default:
      return result;
  }
}

function formatGoalDifference(diff: number): string {
  if (!Number.isFinite(diff)) return '—';
  const rounded = Math.round(diff);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}
