'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * BarChart — one bar per bucket, with an optional two-line label under each.
 *
 * Promoted from admin-dashboard, where it was the analytics page's publishing
 * chart. Like `LineChart` it draws no axis: the bars carry the shape and the
 * labels carry the numbers.
 *
 * It scales its own bars. The local version took pixel heights, so the call
 * site had to know the plot height and do the arithmetic — and did it against a
 * 120px ceiling inside a 220px plot, which is why the chart never filled its
 * own box. This takes the values and scales them, so `height` is the only place
 * the plot's size is stated.
 *
 * The track count follows the data. The local grid was pinned to fourteen
 * columns, so every window other than a fortnight was drawn wrong: a 7-day
 * range left half the plot empty, and a 90-day range ran the bars off the end
 * of it. The count is published as `--bar-chart-count` and both grids read it.
 *
 * Bars are only buttons when they do something. Without `onSelect` the local
 * version still rendered ninety `<button>`s labelled "Select bar 1", "Select
 * bar 2" and so on, none of which was reachable by anything but a keyboard and
 * none of which did anything on arrival. A chart that cannot be selected is
 * drawn as plain marks now, and the labels beneath carry the reading.
 *
 * The palette is derived, not painted. Both bar tones are `--color-foreground`
 * mixed toward `--color-muted`, the same idiom as `MetricCard`'s delta tones,
 * so the bars sit above the panel under `:root` and under `.dark` alike. The
 * fills are flat: the bars used to fade to `--color-muted` at the foot, and
 * the design rules allow no gradients.
 *
 * `series` stacks the bars. Each series is one layer, first at the foot, in
 * its own step of the same foreground-to-muted mix, and a legend names them.
 * The bar's height is the bucket's total, scaled like `bars`.
 * ──────────────────────────────────────────────────────────────────────────── */

export type BarChartLabel = {
  /** The figure, e.g. a count. */
  top: React.ReactNode;
  /** What the bucket is, e.g. a date. */
  bottom: React.ReactNode;
};

export type BarChartBarState = 'idle' | 'active';

const barChartBarVariants: VariantFn<{ state?: BarChartBarState | null }> = cva(
  'relative box-border max-h-full rounded-btl-sm border p-0',
  {
    variants: {
      state: {
        idle: 'border-transparent bg-[color-mix(in_oklab,var(--color-foreground)_18%,var(--color-muted))] opacity-60',
        active:
          'border-border bg-[color-mix(in_oklab,var(--color-foreground)_60%,var(--color-muted))] opacity-100',
      } satisfies Record<BarChartBarState, string>,
    },
    defaultVariants: {
      state: 'idle',
    },
  }
);

/**
 * Bar heights as a percentage of the plot, scaled to the largest value.
 *
 * A series with no positive value stays flat rather than being stretched to
 * fill the plot: an empty window should read as empty, not as a full bar.
 */
export function barHeightPercents(bars: number[]): number[] {
  const max = Math.max(...bars, 0);
  if (max <= 0) return bars.map(() => 0);
  return bars.map((value) => Math.max((value / max) * 100, 0));
}

/**
 * The foreground share of each stacked layer's fill, foot first. Steps far
 * enough apart to tell adjacent layers apart on either theme; a sixth series
 * and beyond reuse the scale from the top.
 */
export const BAR_CHART_SERIES_TONES = [78, 58, 40, 24, 12] as const;

/** The fill of the stacked layer at `index`, from tokens only. */
export function barChartSeriesColor(index: number): string {
  const share = BAR_CHART_SERIES_TONES[index % BAR_CHART_SERIES_TONES.length];
  return `color-mix(in oklab, var(--color-foreground) ${share}%, var(--color-muted))`;
}

export type BarChartSeries = {
  /** Stable identity for the layer, e.g. `"chat"`. */
  key: string;
  /** What the layer is, shown in the legend. */
  label: React.ReactNode;
  /** One value per bucket, in the same order as every other series. */
  values: number[];
  /** Overrides the derived fill. Any CSS colour; tokens keep both themes right. */
  color?: string;
};

/**
 * Per-bucket totals of a stacked chart. A series shorter than the longest one
 * counts as zero in the buckets it does not reach.
 */
export function stackTotals(series: BarChartSeries[]): number[] {
  const length = Math.max(0, ...series.map((entry) => entry.values.length));
  return Array.from({ length }, (_, index) =>
    series.reduce((sum, entry) => sum + Math.max(entry.values[index] ?? 0, 0), 0)
  );
}

export interface BarChartProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  /**
   * The values, in order, one per bucket. Scaled to the plot — do not
   * pre-convert them to pixels. Ignored when `series` is given.
   */
  bars?: number[];
  /**
   * Stacks the bars: one layer per series, the first at the foot. The bar's
   * height is the bucket's total. With more than one series a legend names
   * the layers.
   */
  series?: BarChartSeries[];
  /**
   * Which bar reads as selected. Leave it out, or pass a negative index, and
   * every bar reads as selected: a chart with no selection is not a chart with
   * nothing in it.
   */
  activeIndex?: number;
  /** Makes the bars pressable. Without it they are drawn as plain marks. */
  onSelect?: (index: number) => void;
  /** Two lines under each bar. Shorter than `bars` leaves the tail unlabelled. */
  labels?: BarChartLabel[];
  /** Plot height in pixels, excluding the labels. */
  height?: number;
  /**
   * What a bar means, for the pressable form. Given the bucket index, so it can
   * name the bucket rather than its position.
   */
  barLabel?: (index: number) => string;
  className?: string;
}

function BarChart({
  bars: barsProp,
  series,
  activeIndex = -1,
  onSelect,
  labels,
  height = 220,
  barLabel,
  className,
  style,
  ...props
}: BarChartProps) {
  const isAllActive = activeIndex < 0;
  const stacked = Array.isArray(series) && series.length > 0;
  const bars = React.useMemo(
    () => (stacked ? stackTotals(series) : (barsProp ?? [])),
    [stacked, series, barsProp]
  );
  const percents = React.useMemo(() => barHeightPercents(bars), [bars]);
  const selectable = typeof onSelect === 'function';

  return (
    /*
     * Fourteen fluid tracks come out ~17px wide at 375px: the bars are too
     * narrow to hit and the labels spill out of their columns and widen the
     * page. Below md both grids are pinned to 44px columns and the pair scrolls
     * together — this wrapper is the scroll container, so the labels can never
     * drift out of step with the bars.
     */
    <div
      data-slot="bar-chart"
      className={cn(
        'flex flex-col gap-4',
        // A scroll container clips at its edges, and a full-height bar's focus
        // ring sits 2px above the top one.
        'overflow-x-auto overscroll-x-contain pt-[3px] md:overflow-x-visible md:pt-0',
        '[scrollbar-width:thin] [scrollbar-color:var(--color-border)_var(--color-muted)]',
        '[&::-webkit-scrollbar]:h-[3px]',
        '[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted',
        '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border',
        className
      )}
      style={
        {
          ...style,
          ['--bar-chart-height' as string]: `${height}px`,
          ['--bar-chart-count' as string]: String(bars.length),
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="bar-chart-plot"
        className={cn(
          'grid h-[var(--bar-chart-height,220px)] items-end gap-2',
          /*
           * `overflow: hidden` would clip the off-screen columns below md and
           * the wrapper could not scroll them back into view. Bars are already
           * capped by `max-h-full`, so the clip is not what keeps them inside
           * the plot.
           */
          'w-max overflow-visible [grid-template-columns:repeat(var(--bar-chart-count,1),44px)]',
          'md:w-auto md:overflow-hidden md:[grid-template-columns:repeat(var(--bar-chart-count,1),minmax(0,1fr))]'
        )}
      >
        {percents.map((percent, index) => {
          const isActive = index === activeIndex || isAllActive;
          const state: BarChartBarState = isActive ? 'active' : 'idle';
          const barStyle: React.CSSProperties = { height: `${percent}%` };
          const total = bars[index] ?? 0;
          const segments =
            stacked && total > 0
              ? series.map((entry, seriesIndex) => {
                  const value = Math.max(entry.values[index] ?? 0, 0);
                  return value > 0 ? (
                    <span
                      key={entry.key}
                      data-slot="bar-chart-segment"
                      data-series={entry.key}
                      className="block w-full shrink-0"
                      style={{
                        height: `${(value / total) * 100}%`,
                        backgroundColor: entry.color ?? barChartSeriesColor(seriesIndex),
                      }}
                    />
                  ) : null;
                })
              : null;
          const barClass = cn(
            barChartBarVariants({ state }),
            // The layers paint the bar; the column only clips them to its corners.
            stacked && 'flex flex-col-reverse overflow-hidden bg-transparent'
          );

          return selectable ? (
            <button
              // Buckets are a fixed, ordered list; position is the identity.
              key={index}
              type="button"
              data-slot="bar-chart-bar"
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                barClass,
                'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
              )}
              style={barStyle}
              onClick={() => onSelect(index)}
              aria-pressed={isActive}
              aria-label={barLabel ? barLabel(index) : `Select bar ${index + 1}`}
            >
              {segments}
            </button>
          ) : (
            <div
              key={index}
              data-slot="bar-chart-bar"
              data-active={isActive ? 'true' : 'false'}
              aria-hidden="true"
              className={barClass}
              style={barStyle}
            >
              {segments}
            </div>
          );
        })}
      </div>
      {labels ? (
        <div
          data-slot="bar-chart-labels"
          className={cn(
            'grid items-center gap-2 text-xs text-muted-foreground',
            // The desktop inset would offset the labels from the bars once both
            // grids share a column width.
            'w-max px-0 [grid-template-columns:repeat(var(--bar-chart-count,1),44px)]',
            'md:w-auto md:px-4 md:[grid-template-columns:repeat(var(--bar-chart-count,1),minmax(0,1fr))]'
          )}
        >
          {bars.map((_, index) => {
            const label = labels[index];
            const isActive = index === activeIndex && !isAllActive;
            return (
              <span
                key={index}
                data-slot="bar-chart-label"
                data-active={isActive ? 'true' : 'false'}
                className={cn(
                  'flex flex-row items-center justify-center gap-1 text-center leading-[18px]',
                  isActive && 'text-foreground'
                )}
              >
                {label ? (
                  <>
                    <span data-slot="bar-chart-label-top">{label.top}</span>
                    <span data-slot="bar-chart-label-bottom">{label.bottom}</span>
                  </>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
      {stacked && series.length > 1 ? (
        <ul
          data-slot="bar-chart-legend"
          // Sticky, so it stays in view while the bars scroll below md.
          className="sticky left-0 m-0 flex w-max list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-muted-foreground md:w-auto md:px-4"
        >
          {series.map((entry, seriesIndex) => (
            <li
              key={entry.key}
              data-slot="bar-chart-legend-item"
              className="flex items-center gap-1.5"
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-btl-sm"
                style={{ backgroundColor: entry.color ?? barChartSeriesColor(seriesIndex) }}
              />
              {entry.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { BarChart, barChartBarVariants };
