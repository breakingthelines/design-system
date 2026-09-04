'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * MetricCard — one number, named, with an optional movement and a footnote.
 *
 * The design system already had a KPI readout, but only welded inside
 * `EngagementOpsHeader`: it is a `dl` cell of a squad-engagement header,
 * painted in `--color-grey-200` and `text-white`, and it cannot be lifted out.
 * This is the standalone one. It keeps that component's delta semantics — a
 * direction published as `data-direction`, up is good unless told otherwise —
 * and drops the dark-only palette.
 *
 * Charts stay outside. `EngagementOpsHeader` takes a `sparkline` node rather
 * than drawing one, for the same reason this takes none at all: a charting
 * dependency is a decision the estate has not made. The pages this backs put
 * their charts beside the cards, not inside them.
 *
 * The delta is sign-aware. A card rendering "+12.4%" should not also have to be
 * told that is a rise, and the local version made `positive` the default tone,
 * so a fall shown without a tone was painted green, and so was an empty delta.
 * Here the sign in the value decides, an absent or unsigned delta is neutral,
 * and `deltaTone` is the override for what a sign cannot answer.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MetricCardTone = 'positive' | 'negative' | 'neutral';

export type MetricCardDensity = 'comfortable' | 'spacious';

const metricCardVariants: VariantFn<{ density?: MetricCardDensity | null }> = cva(
  'flex min-w-0 flex-col items-center border border-border bg-card text-center text-card-foreground',
  {
    variants: {
      density: {
        comfortable: 'px-4 py-6',
        spacious: 'px-5 py-8',
      } satisfies Record<MetricCardDensity, string>,
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

/**
 * The status hues are tuned for a dark surface, so neither is legible as text
 * on a light one. Mixing each toward `--color-foreground` — which flips with
 * the theme — darkens them under `:root` and lightens them under `.dark`, from
 * a single class, with no literal colour and no second definition to drift.
 */
const metricCardDeltaVariants: VariantFn<{ tone?: MetricCardTone | null }> = cva(
  'inline-flex items-center gap-1 font-medium',
  {
    variants: {
      tone: {
        positive: 'text-[color-mix(in_oklab,var(--color-status-done)_50%,var(--color-foreground))]',
        negative: 'text-[color-mix(in_oklab,var(--color-status-todo)_50%,var(--color-foreground))]',
        neutral: 'text-muted-foreground',
      } satisfies Record<MetricCardTone, string>,
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
);

/**
 * Reads the direction out of the delta itself.
 *
 * A number is its own sign. A string is read from its first meaningful
 * character, which covers the shapes call sites pass: `+12.4%`, `-3 this week`,
 * `−3` with the real minus sign, `▲ 8`, `▼ 8`. Anything else — `3 pending`,
 * `over the last 7 days`, a bare `0`, an empty string — is flat, and a flat
 * delta is neutral whichever way the metric points.
 */
function readDeltaDirection(delta: React.ReactNode): 'up' | 'down' | 'flat' {
  if (typeof delta === 'number') {
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return 'flat';
  }
  if (typeof delta !== 'string') return 'flat';
  const first = delta.trim().charAt(0);
  if (first === '+' || first === '▲' || first === '↑') return 'up';
  if (first === '-' || first === '−' || first === '▼' || first === '↓') return 'down';
  return 'flat';
}

export interface MetricCardProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof metricCardVariants> {
  /** What the number is. Rendered above the value. */
  label: React.ReactNode;
  /**
   * The number. Pre-formatted by the caller — currency, units and digit
   * grouping are not this component's business.
   */
  value: React.ReactNode;
  /**
   * Movement against the previous period, e.g. `+12.4%`. Also carries an
   * unsigned qualifier where a metric has no previous period to move against,
   * e.g. `3 pending`. Omit it, or pass an empty string, and nothing is drawn:
   * an empty delta must not leave a coloured dot behind.
   */
  delta?: React.ReactNode;
  /**
   * Overrides the tone the sign of `delta` would have chosen. Needed for a
   * delta with no sign to read, and for an inverse metric where a rise is the
   * bad news — though `higherIsBetter={false}` covers that one for you.
   */
  deltaTone?: MetricCardTone;
  /**
   * Set `false` for a metric where up is bad: refunds, bounce rate, time to
   * first response. A rise then reads negative and a fall positive. Ignored
   * when `deltaTone` is given.
   */
  higherIsBetter?: boolean;
  /**
   * Footnote beside the delta, e.g. `Article view starts`. Muted, and never
   * coloured by the tone — it qualifies the metric, not the movement.
   */
  hint?: React.ReactNode;
  className?: string;
}

function MetricCard({
  label,
  value,
  delta,
  deltaTone,
  higherIsBetter = true,
  hint,
  density = 'comfortable',
  className,
  ...props
}: MetricCardProps) {
  const direction = readDeltaDirection(delta);
  const resolvedTone: MetricCardTone =
    deltaTone ??
    (direction === 'flat'
      ? 'neutral'
      : (direction === 'up') === higherIsBetter
        ? 'positive'
        : 'negative');

  const hasDelta = delta !== undefined && delta !== null && delta !== '';
  const hasHint = hint !== undefined && hint !== null && hint !== '';

  return (
    <div
      data-slot="metric-card"
      className={cn(metricCardVariants({ density }), className)}
      {...props}
    >
      <p data-slot="metric-card-label" className="text-xs tracking-[-0.03em]">
        {label}
      </p>
      <p
        data-slot="metric-card-value"
        className="mt-3 mb-2 text-[32px] leading-none font-semibold tracking-[-0.03em] tabular-nums"
      >
        {value}
      </p>
      {hasDelta || hasHint ? (
        <div
          data-slot="metric-card-footer"
          className="flex flex-wrap items-center justify-center gap-3 text-xs"
        >
          {hasDelta ? (
            <span
              data-slot="metric-card-delta"
              data-direction={direction}
              data-tone={resolvedTone}
              className={metricCardDeltaVariants({ tone: resolvedTone })}
            >
              {/*
               * Decorative. The tone is a second reading of a sign the text
               * already carries, so nothing here is conveyed by hue alone.
               */}
              <span
                data-slot="metric-card-delta-dot"
                aria-hidden="true"
                className="inline-flex size-1 shrink-0 rounded-full bg-current"
              />
              {delta}
            </span>
          ) : null}
          {hasHint ? (
            <span data-slot="metric-card-hint" className="text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { MetricCard, readDeltaDirection, metricCardVariants, metricCardDeltaVariants };
