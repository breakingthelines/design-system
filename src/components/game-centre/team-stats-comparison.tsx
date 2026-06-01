'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * TeamStatsComparison (Match page — "Game Stats" tab)
 *
 * Head-to-head team stat table. A legend row names the two sides (home = red,
 * away = the secondary accent), then one row per stat: the home value on the
 * left, the stat label centred, the away value on the right, with a single
 * bidirectional bar beneath. The home fill grows from the left in red, the
 * away fill grows from the right in the away accent; the split point is
 * home / (home + away).
 *
 * Honest by default: the backend has no team-aggregate stats contract yet, so
 * an empty `rows` array (or `state="empty"`) renders a tight `FallbackState`
 * rather than a fake zeroed table — the same pattern `RatingSummary` uses.
 *
 * Render-only. No fetching, no router awareness. Consumers map their
 * proto/REST data to `rows`.
 *
 * Colour note: the design system has no dedicated "blue" token, so the away
 * side defaults to the canonical secondary accent (`--color-cyan-500`). Pass
 * `homeColor` / `awayColor` to honour real club brand colours when known.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TeamStatFormat = 'int' | 'percent' | 'decimal' | 'fraction';

export interface TeamStatRow {
  /** Centred stat label, e.g. "Possession %". */
  label: string;
  /** Home raw value. Drives the left fill and the default left readout. */
  home: number;
  /** Away raw value. Drives the right fill and the default right readout. */
  away: number;
  /** How to format the numeric readout. Defaults to `int`. Ignored when *Text is set. */
  format?: TeamStatFormat;
  /** Explicit home display string, overrides the formatted value (e.g. "6/16"). */
  homeText?: string;
  /** Explicit away display string, overrides the formatted value (e.g. "15/24"). */
  awayText?: string;
}

export interface TeamStatsComparisonProps {
  /** Home side display name (legend + aria). */
  homeName: string;
  /** Away side display name (legend + aria). */
  awayName: string;
  /** Home accent colour (any CSS colour). Defaults to the red token. */
  homeColor?: string;
  /** Away accent colour (any CSS colour). Defaults to the secondary (cyan) token. */
  awayColor?: string;
  /** Stat rows, top to bottom. Empty renders the fallback. */
  rows: readonly TeamStatRow[];
  /**
   * Render mode. `ready` shows the table; `empty` shows the fallback only;
   * `loading` shows skeleton rails. When `rows` is empty the component renders
   * the fallback regardless of `state`.
   */
  state?: 'ready' | 'empty' | 'loading';
  /** Fallback override (used when empty). Defaults to `RICH_ACTIONS_UNAVAILABLE`. */
  fallbackReason?: FallbackReason;
  className?: string;
}

const DEFAULT_HOME_COLOR = 'var(--color-red-100)';
const DEFAULT_AWAY_COLOR = 'var(--color-cyan-500)';

export function TeamStatsComparison({
  homeName,
  awayName,
  homeColor = DEFAULT_HOME_COLOR,
  awayColor = DEFAULT_AWAY_COLOR,
  rows,
  state = 'ready',
  fallbackReason,
  className,
}: TeamStatsComparisonProps) {
  const wrapper = cn(
    'flex w-full flex-col border border-white/10 bg-[var(--color-grey-200)] text-white',
    className
  );

  if (state === 'loading') {
    return (
      <div data-slot="team-stats-comparison" data-state="loading" className={wrapper}>
        <div className="border-b border-white/[0.06] px-5 py-3">
          <div className="h-4 w-40 animate-pulse rounded-sm bg-white/[0.04]" />
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={`team-stat-skeleton-${idx}`} className="flex flex-col gap-2">
              <div className="h-4 w-full animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-1 w-full animate-pulse rounded-full bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (state === 'empty' || rows.length === 0) {
    return (
      <div data-slot="team-stats-comparison" data-state="empty" className={wrapper}>
        <TeamStatsLegend
          homeName={homeName}
          awayName={awayName}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <div className="px-5 py-4">
          <FallbackState
            reason={fallbackReason ?? 'RICH_ACTIONS_UNAVAILABLE'}
            title="Match stats not available yet."
          />
        </div>
      </div>
    );
  }

  return (
    <div data-slot="team-stats-comparison" data-state="ready" className={wrapper}>
      <TeamStatsLegend
        homeName={homeName}
        awayName={awayName}
        homeColor={homeColor}
        awayColor={awayColor}
      />
      <ul data-slot="team-stats-comparison-rows" className="flex flex-col">
        {rows.map((row, idx) => (
          <TeamStatRowItem
            key={`${row.label}-${idx}`}
            row={row}
            homeName={homeName}
            awayName={awayName}
            homeColor={homeColor}
            awayColor={awayColor}
          />
        ))}
      </ul>
    </div>
  );
}

interface TeamStatsLegendProps {
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
}

function TeamStatsLegend({ homeName, awayName, homeColor, awayColor }: TeamStatsLegendProps) {
  return (
    <header
      data-slot="team-stats-comparison-legend"
      className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-3"
    >
      <LegendItem name={homeName} color={homeColor} align="start" />
      <LegendItem name={awayName} color={awayColor} align="end" />
    </header>
  );
}

function LegendItem({
  name,
  color,
  align,
}: {
  name: string;
  color: string;
  align: 'start' | 'end';
}) {
  return (
    <span
      data-slot="team-stats-comparison-legend-item"
      data-align={align}
      className={cn(
        'flex min-w-0 items-center gap-2 text-[12px] font-medium tracking-tight text-white',
        align === 'end' && 'flex-row-reverse text-right'
      )}
    >
      <span
        aria-hidden="true"
        style={{ backgroundColor: color }}
        className="size-2 shrink-0 rounded-full"
      />
      <span className="truncate">{name}</span>
    </span>
  );
}

interface TeamStatRowItemProps {
  row: TeamStatRow;
  homeName: string;
  awayName: string;
  homeColor: string;
  awayColor: string;
}

function TeamStatRowItem({ row, homeName, awayName, homeColor, awayColor }: TeamStatRowItemProps) {
  const homeDisplay = row.homeText ?? formatStat(row.home, row.format);
  const awayDisplay = row.awayText ?? formatStat(row.away, row.format);
  const split = barSplit(row.home, row.away);
  const homePct = Math.round(split * 100);
  const awayPct = 100 - homePct;

  return (
    <li
      data-slot="team-stats-comparison-row"
      className="flex flex-col gap-2 border-b border-white/[0.06] px-5 py-3 last:border-b-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          data-slot="team-stats-comparison-home-value"
          className="font-mono text-[15px] font-semibold tabular-nums tracking-tight text-white"
        >
          {homeDisplay}
        </span>
        <span
          data-slot="team-stats-comparison-label"
          className="min-w-0 flex-1 truncate text-center text-[11px] tracking-[0.04em] text-[var(--color-grey-500)]"
        >
          {row.label}
        </span>
        <span
          data-slot="team-stats-comparison-away-value"
          className="font-mono text-[15px] font-semibold tabular-nums tracking-tight text-white"
        >
          {awayDisplay}
        </span>
      </div>
      <div
        data-slot="team-stats-comparison-bar"
        role="img"
        aria-label={`${row.label}: ${homeName} ${homeDisplay}, ${awayName} ${awayDisplay}`}
        className="flex h-1 w-full overflow-hidden rounded-full bg-white/[0.06]"
      >
        <span
          data-slot="team-stats-comparison-bar-home"
          style={{ width: `${homePct}%`, backgroundColor: homeColor }}
          className="h-full"
        />
        <span
          data-slot="team-stats-comparison-bar-away"
          style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
          className="h-full"
        />
      </div>
    </li>
  );
}

/**
 * Home share of the bar, in [0, 1]. When both values are zero (or negative,
 * which is not expected) the bar sits at the midpoint so neither side is
 * misrepresented.
 */
export function barSplit(home: number, away: number): number {
  const h = Number.isFinite(home) ? Math.max(0, home) : 0;
  const a = Number.isFinite(away) ? Math.max(0, away) : 0;
  const total = h + a;
  if (total <= 0) return 0.5;
  return h / total;
}

function formatStat(value: number, format: TeamStatFormat = 'int'): string {
  if (!Number.isFinite(value)) return '—';
  switch (format) {
    case 'percent':
      return `${trimNumber(value, 1)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'fraction':
    case 'int':
    default:
      return String(Math.round(value));
  }
}

function trimNumber(value: number, maxDecimals: number): string {
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, '');
}
