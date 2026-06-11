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

/**
 * A qualification / relegation band. Renders a thin coloured rail on the left of
 * every row in `[fromRank, toRank]` (inclusive, 1-based) plus a legend entry.
 * Opt-in: the consumer decides the zones for the competition (they differ per
 * league and season), so the table never invents them.
 */
export interface CompetitionStandingsZone {
  /** First rank in the band (1-based, inclusive). */
  fromRank: number;
  /** Last rank in the band (1-based, inclusive). */
  toRank: number;
  /** Visual tone of the rail + legend swatch. */
  tone: 'champions' | 'europa' | 'conference' | 'promotion' | 'relegation';
  /** Legend label, e.g. "Champions League". */
  label: string;
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
  /**
   * Compact mode for narrow panels (e.g. the Arena Office): drops the GF/GA
   * columns (keeping # · Team · P W D L · GD · Pts) and shrinks the type. Keeps
   * a smaller min-width (440px) so the table scrolls horizontally in a narrow
   * panel instead of squeezing/truncating the team names.
   */
  compact?: boolean;
  /**
   * Optional qualification / relegation bands. When provided, each row in a
   * band's rank range gets a thin coloured left rail and a legend renders below
   * the table. Omitted entirely when absent (the table never guesses zones).
   * Suppressed in `compact` mode where horizontal room is tight.
   */
  zones?: readonly CompetitionStandingsZone[];
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
  compact = false,
  zones,
  className,
}: CompetitionStandingsTableProps) {
  const Link = useLinkComponent();
  const wrapper = cn(
    'overflow-hidden rounded-[4px] border border-white/10 bg-[var(--color-grey-200)]',
    className
  );
  const showForm = rows.some((row) => Boolean(row.form));
  // Zones are a wide-table affordance; the compact Office panel has no room for
  // the rail + legend, so they only apply outside compact mode.
  const activeZones = !compact && zones && zones.length > 0 ? zones : undefined;
  // Compact drops the goals-for / goals-against columns so the panel only has
  // to fit # · Team · P W D L · GD · Pts.
  const numericColumns = compact
    ? NUMERIC_COLUMNS.filter((col) => col.key !== 'goalsFor' && col.key !== 'goalsAgainst')
    : NUMERIC_COLUMNS;

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
          <FallbackState reason={fallbackReason ?? 'NO_DATA_FOR_SEASON'} />
        </div>
      </div>
    );
  }

  return (
    <div data-slot="competition-standings-table" data-state="ready" className={wrapper}>
      {/* Inner scroller — kept separate from the rounded `overflow-hidden`
          wrapper so the horizontal scroll isn't clipped (twMerge would drop a
          sibling `overflow-x-auto` against the wrapper's `overflow-hidden`). */}
      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full border-collapse text-white/85',
            compact ? 'min-w-[440px] text-xs' : 'min-w-[520px] text-sm'
          )}
        >
          <caption className="sr-only">{caption}</caption>
          <thead
            className={cn(
              'bg-white/[0.04] tracking-wide text-white/55 uppercase',
              compact ? 'text-[10px]' : 'text-[11px]'
            )}
          >
            <tr>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                <abbr title="Position" className="no-underline">
                  #
                </abbr>
              </th>
              <th scope="col" className="px-2 py-2 text-left font-medium">
                Team
              </th>
              {numericColumns.map((col) => (
                <th key={col.key} scope="col" className="px-2 py-2 text-right font-medium">
                  <abbr title={col.full} className="no-underline">
                    {col.short}
                  </abbr>
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-right font-medium text-white/70">
                <abbr title="Goal difference" className="no-underline">
                  GD
                </abbr>
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold text-white/80">
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
            {rows.map((row, idx) => (
              <StandingsRowItem
                key={row.team.id ?? `rank-${row.rank}`}
                row={row}
                zebra={idx % 2 === 1}
                highlighted={isHighlighted(row, highlightTeamId)}
                zone={zoneForRank(activeZones, row.rank)}
                showForm={showForm}
                numericColumns={numericColumns}
                Link={Link}
              />
            ))}
          </tbody>
        </table>
      </div>
      {activeZones ? <StandingsLegend zones={activeZones} /> : null}
    </div>
  );
}

const ZONE_RAIL_CLASS: Record<CompetitionStandingsZone['tone'], string> = {
  champions: 'bg-[var(--color-status-done)]',
  europa: 'bg-[var(--color-blue-100,#4c8dff)]',
  conference: 'bg-[var(--color-teal-100,#2dd4bf)]',
  promotion: 'bg-[var(--color-status-done)]',
  relegation: 'bg-[var(--color-red-100)]',
};

function zoneForRank(
  zones: readonly CompetitionStandingsZone[] | undefined,
  rank: number
): CompetitionStandingsZone | undefined {
  if (!zones) return undefined;
  return zones.find((zone) => rank >= zone.fromRank && rank <= zone.toRank);
}

function StandingsLegend({ zones }: { zones: readonly CompetitionStandingsZone[] }) {
  // De-duplicate by tone+label so two ranges that share a meaning (rare) show
  // once. Order follows the supplied array (consumer orders by importance).
  const seen = new Set<string>();
  const items = zones.filter((zone) => {
    const key = `${zone.tone}:${zone.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return (
    <ul
      data-slot="competition-standings-legend"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.06] px-3 py-2.5 text-[11px] text-white/55"
    >
      {items.map((zone) => (
        <li key={`${zone.tone}:${zone.label}`} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn('h-2.5 w-1 shrink-0 rounded-full', ZONE_RAIL_CLASS[zone.tone])}
          />
          {zone.label}
        </li>
      ))}
    </ul>
  );
}

function isHighlighted(row: CompetitionStandingsRow, highlightTeamId?: string): boolean {
  return Boolean(highlightTeamId) && row.team.id === highlightTeamId;
}

interface StandingsRowItemProps {
  row: CompetitionStandingsRow;
  zebra: boolean;
  highlighted: boolean;
  zone?: CompetitionStandingsZone;
  showForm: boolean;
  numericColumns: readonly NumericColumn[];
  Link: ReturnType<typeof useLinkComponent>;
}

function StandingsRowItem({
  row,
  zebra,
  highlighted,
  zone,
  showForm,
  numericColumns,
  Link,
}: StandingsRowItemProps) {
  const numericCell = 'px-2 py-2 text-right tabular-nums';
  const gd = Math.round(row.goalDifference);
  return (
    <tr
      data-slot="competition-standings-row"
      data-highlighted={highlighted || undefined}
      data-zone={zone?.tone}
      aria-current={highlighted ? 'true' : undefined}
      className={cn(
        'border-t border-white/[0.06] transition-colors',
        // Zebra is the base; hover lifts it; the active team wins over both.
        zebra ? 'bg-white/[0.015]' : 'bg-transparent',
        'hover:bg-white/[0.045]',
        highlighted && 'bg-[var(--color-red-100)]/12 hover:bg-[var(--color-red-100)]/15'
      )}
    >
      <td className="relative py-2 pr-2 pl-3 text-right tabular-nums text-white/65">
        {/* Qualification-zone rail (left edge) — only when a zone matches. The
            highlighted team always wins the rail colour so its row stays the
            clear focus. */}
        {zone || highlighted ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-y-1 left-0 w-[3px] rounded-full',
              highlighted ? 'bg-[var(--color-red-100)]' : zone ? ZONE_RAIL_CLASS[zone.tone] : ''
            )}
          />
        ) : null}
        {row.rank}
      </td>
      <th scope="row" className="px-2 py-2 text-left font-medium">
        <span className="flex min-w-0 items-center gap-2.5">
          {row.team.crestUrl ? (
            <img
              src={row.team.crestUrl}
              alt=""
              loading="lazy"
              className="size-5 shrink-0 object-contain"
            />
          ) : (
            <span
              aria-hidden="true"
              className="size-5 shrink-0 rounded-[3px] border border-white/10 bg-white/[0.04]"
            />
          )}
          {row.team.href ? (
            <Link
              href={row.team.href}
              className="min-w-0 truncate text-white transition-colors hover:text-[var(--color-red-100)]"
            >
              {row.team.name}
            </Link>
          ) : (
            <span className="min-w-0 truncate text-white">{row.team.name}</span>
          )}
        </span>
      </th>
      {numericColumns.map((col) => (
        <td key={col.key} className={cn(numericCell, 'text-white/70')}>
          {row[col.key]}
        </td>
      ))}
      <td
        className={cn(
          numericCell,
          gd > 0 ? 'text-[var(--color-status-done)]' : gd < 0 ? 'text-white/45' : 'text-white/70'
        )}
      >
        {formatGoalDifference(row.goalDifference)}
      </td>
      <td className={cn(numericCell, 'text-[15px] font-bold text-white')}>{row.points}</td>
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
