'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * EngagementOpsHeader (L7 — Squad Engagement Overview shell)
 *
 * Page-level header for the Squad Engagement Overview surface. Surfaces the
 * squad's current engagement at a glance with a small set of pinned KPIs:
 *
 *   - readers (per-window)
 *   - subscribers (active)
 *   - thoughts (per-window)
 *   - ratings (per-window)
 *
 * Each KPI accepts an optional trend (delta vs the previous window) and an
 * optional sparkline node — supplied by the consumer so we don't take a
 * charting dep at the design-system layer.
 *
 * The header also exposes a small action bar slot for "Export CSV",
 * "Open report", "Refresh", etc. The window toggle (last 7 / 14 / 30 days)
 * is rendered as a tab strip the consumer wires up.
 *
 * Honest fallback: when a KPI value is undefined we render `—` instead of
 * a zero, so an empty window cannot be misread as "0 readers this week".
 * ──────────────────────────────────────────────────────────────────────────── */

export interface EngagementOpsKpi {
  /** Stable id for keys and data-attribs. */
  id: string;
  /** Visible label — e.g. "Readers". */
  label: string;
  /** Current value. Pass undefined when the metric is genuinely unavailable. */
  value: number | string | undefined;
  /** Optional secondary readout — e.g. "per day", "active". */
  caption?: string;
  /** Delta vs the previous window. Positive = up. */
  delta?: number;
  /** Delta unit hint — defaults to `'count'`. */
  deltaUnit?: 'count' | 'percent';
  /** Optional sparkline node — consumer-provided. */
  sparkline?: React.ReactNode;
  /** Higher-is-better KPIs (default) colour up-deltas green. Set false for
   *  inverse metrics (e.g. bounce rate). */
  higherIsBetter?: boolean;
}

export interface EngagementOpsWindow {
  /** Stable id. */
  id: string;
  /** Visible label — e.g. "7d", "14d", "30d", "All time". */
  label: string;
  isActive?: boolean;
}

export interface EngagementOpsHeaderProps {
  /** Pre-title eyebrow. */
  eyebrow?: string;
  /** Page title — typically the squad name. */
  title: string;
  /** Optional subtitle. */
  subtitle?: React.ReactNode;
  /** Pinned KPIs (max 4 visually, but no hard limit). */
  kpis: readonly EngagementOpsKpi[];
  /** Window toggle items. */
  windows?: readonly EngagementOpsWindow[];
  /** Called when a window toggle is clicked. */
  onSelectWindow?: (id: string) => void;
  /** Action bar slot — e.g. "Export", "Refresh" buttons. */
  actions?: React.ReactNode;
  className?: string;
}

export function EngagementOpsHeader({
  eyebrow,
  title,
  subtitle,
  kpis,
  windows,
  onSelectWindow,
  actions,
  className,
}: EngagementOpsHeaderProps) {
  return (
    <header
      data-slot="engagement-ops-header"
      data-kpi-count={kpis.length}
      className={cn(
        'flex flex-col gap-4 border-b border-white/[0.06] bg-[var(--color-grey-100)]',
        'px-5 py-4 text-white',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? (
            <span
              data-slot="engagement-ops-header-eyebrow"
              className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
            >
              {eyebrow}
            </span>
          ) : null}
          <h2
            data-slot="engagement-ops-header-title"
            className="truncate text-lg font-semibold tracking-tight"
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              data-slot="engagement-ops-header-subtitle"
              className="text-[12px] leading-snug text-white/70"
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div
            data-slot="engagement-ops-header-actions"
            className="flex flex-wrap items-center gap-2"
          >
            {actions}
          </div>
        ) : null}
      </div>

      {windows && windows.length > 0 ? (
        <div
          data-slot="engagement-ops-header-windows"
          role="tablist"
          aria-label="Engagement window"
          className="inline-flex flex-wrap items-center gap-1"
        >
          {windows.map((window) => {
            const active = Boolean(window.isActive);
            return (
              <button
                key={window.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-slot="engagement-ops-header-window"
                data-id={window.id}
                data-active={active || undefined}
                onClick={() => onSelectWindow?.(window.id)}
                className={cn(
                  'inline-flex h-7 items-center px-3 text-[11px] tracking-[0.04em] uppercase',
                  'border transition-colors',
                  active
                    ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)]/15 text-[var(--color-red-100)]'
                    : 'border-white/15 text-white/70 hover:border-white/30',
                  'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]'
                )}
              >
                {window.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <dl
        data-slot="engagement-ops-header-kpis"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <KpiCell key={kpi.id} kpi={kpi} />
        ))}
      </dl>
    </header>
  );
}

function KpiCell({ kpi }: { kpi: EngagementOpsKpi }) {
  const display = kpi.value === undefined || kpi.value === '' ? '—' : kpi.value;
  return (
    <div
      data-slot="engagement-ops-header-kpi"
      data-id={kpi.id}
      data-empty={display === '—' || undefined}
      className="flex flex-col gap-1 border border-white/[0.08] bg-[var(--color-grey-200)] px-3 py-2"
    >
      <dt className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
        {kpi.label}
      </dt>
      <dd className="flex items-baseline justify-between gap-2">
        <span
          data-slot="engagement-ops-header-kpi-value"
          className="font-mono text-lg font-semibold tabular-nums tracking-tight text-white"
        >
          {display}
        </span>
        {kpi.delta !== undefined && display !== '—' ? (
          <KpiDelta
            delta={kpi.delta}
            unit={kpi.deltaUnit ?? 'count'}
            higherIsBetter={kpi.higherIsBetter ?? true}
          />
        ) : null}
      </dd>
      {kpi.caption ? (
        <span
          data-slot="engagement-ops-header-kpi-caption"
          className="text-[10px] tracking-[0.04em] text-white/55"
        >
          {kpi.caption}
        </span>
      ) : null}
      {kpi.sparkline ? (
        <div data-slot="engagement-ops-header-kpi-sparkline" aria-hidden="true" className="h-6">
          {kpi.sparkline}
        </div>
      ) : null}
    </div>
  );
}

interface KpiDeltaProps {
  delta: number;
  unit: 'count' | 'percent';
  higherIsBetter: boolean;
}

function KpiDelta({ delta, unit, higherIsBetter }: KpiDeltaProps) {
  if (delta === 0) {
    return (
      <span
        data-slot="engagement-ops-header-kpi-delta"
        data-direction="flat"
        aria-label="No change"
        className="font-mono text-[10px] tabular-nums tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
      >
        —
      </span>
    );
  }
  const up = delta > 0;
  const positive = up === higherIsBetter;
  return (
    <span
      data-slot="engagement-ops-header-kpi-delta"
      data-direction={up ? 'up' : 'down'}
      data-positive={positive || undefined}
      aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(delta)}${unit === 'percent' ? '%' : ''}`}
      className={cn(
        'inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums tracking-[0.04em] uppercase',
        positive ? 'text-[var(--color-status-done)]' : 'text-[var(--color-status-todo)]'
      )}
    >
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span>
        {Math.abs(delta)}
        {unit === 'percent' ? '%' : ''}
      </span>
    </span>
  );
}
