'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * EntityStatsSummary (Entity page — season stats + overview block)
 *
 * A card that pairs a season-stats header bar with an optional prose overview.
 * The header bar reads "{crest} {club} {season}" on the left and a compact
 * metric group (label + value pairs) on the right — Games / Minutes / Goals /
 * Assists for a player, Games / Wins / Draws / Defeats for a manager or team.
 * The consumer supplies the metrics so the card stays entity-agnostic.
 *
 * Below the bar, an optional `bio` renders under an "Overview" heading. When no
 * bio is provided the card is just the stat header.
 *
 * Render-only: props in, JSX out. No fetching, no router awareness.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface EntityStatsSummaryHeader {
  /** Optional club crest URL, rendered at 16px before the label. */
  crestUrl?: string;
  /** Primary label, e.g. the club name. */
  label: string;
  /** Optional season string, e.g. "2024/25". */
  season?: string;
}

export interface EntityStatsMetric {
  /** Stable key. Falls back to the metric index. */
  id?: string;
  /** Metric label, e.g. "Games", "Goals", "Wins". */
  label: string;
  /** Metric value, e.g. 34, "1,980", "12". */
  value: React.ReactNode;
}

export interface EntityStatsSummaryProps {
  /** Header bar identity — crest, club label, season. */
  header: EntityStatsSummaryHeader;
  /** Season metric group. Empty hides the metric group. */
  metrics: readonly EntityStatsMetric[];
  /** Optional prose overview rendered below an "Overview" heading. */
  bio?: React.ReactNode;
  className?: string;
}

export function EntityStatsSummary({ header, metrics, bio, className }: EntityStatsSummaryProps) {
  const crestInitials = initialsFromName(header.label);

  return (
    <section
      data-slot="entity-stats-summary"
      className={cn(
        'flex w-full flex-col gap-4 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5 text-white',
        className
      )}
    >
      <header
        data-slot="entity-stats-summary-bar"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[2px] border border-white/[0.05] bg-[var(--color-grey-300)] px-2 py-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            data-slot="entity-stats-summary-crest"
            aria-hidden="true"
            className="relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-grey-100)] text-[8px] font-bold tracking-tight text-white"
          >
            {header.crestUrl ? (
              <img
                src={header.crestUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              crestInitials
            )}
          </span>
          <span className="min-w-0 truncate text-[13px] font-semibold tracking-tight text-white">
            {header.label}
            {header.season ? (
              <span className="ml-1.5 font-normal text-[var(--color-grey-500)]">
                {header.season}
              </span>
            ) : null}
          </span>
        </div>

        {metrics.length > 0 ? (
          <dl
            data-slot="entity-stats-summary-metrics"
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
          >
            {metrics.map((metric, idx) => (
              <div
                key={metric.id ?? `entity-stat-${idx}`}
                data-slot="entity-stats-summary-metric"
                className="inline-flex items-baseline gap-1.5"
              >
                <dt className="text-[11px] tracking-tight text-[var(--color-grey-500)]">
                  {metric.label}
                </dt>
                <dd className="text-[13px] font-semibold tabular-nums text-white">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {bio ? (
        <div data-slot="entity-stats-summary-overview" className="flex flex-col gap-2">
          <h5 className="font-display text-sm font-semibold tracking-tight text-white">Overview</h5>
          <div className="text-[13px] leading-relaxed text-white/70">{bio}</div>
        </div>
      ) : null}
    </section>
  );
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}
