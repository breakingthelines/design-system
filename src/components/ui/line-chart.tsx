'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * LineChart — a smoothed series over a filled area, with an optional readout.
 *
 * Promoted from admin-dashboard, where it was the analytics page's traffic
 * chart. Nothing about it was admin-specific: a series, a fade underneath it
 * and a labelled point is what any trend line needs.
 *
 * It draws no axes and no grid. The plot is a 0–100 viewBox stretched to the
 * box it is given (`preserveAspectRatio="none"`), so the shape of the series is
 * what reads, not its absolute values. Where the numbers themselves matter, put
 * a `MetricCard` beside it — that is what the pages this backs already do.
 *
 * The palette is derived, not painted. The local version drew a `#bfbfbf` to
 * `#2B2B2B` gradient under a `#ffffff` stroke, which is legible on one surface
 * only: on a light one the line disappeared and the area went to a grey slab.
 * Here the stroke is `--color-foreground` and the area is a mix of it toward
 * `--color-muted`, following `MetricCard`'s delta tones — one definition, and
 * it flips with the theme instead of needing a second.
 *
 * The axis is as wide as its labels. The local grid was pinned to eight
 * columns whatever it was handed, so the three-label axis its own call site
 * passed sat crammed into the left third of the chart. The track count comes
 * from `xLabels.length` now, published as `--line-chart-x-count`.
 * ──────────────────────────────────────────────────────────────────────────── */

export type LineChartPoint = { x: number; y: number };

export type LineChartTooltip = {
  /** The figure. Pre-formatted by the caller. */
  title: React.ReactNode;
  /** What the figure is. */
  subtitle: React.ReactNode;
};

/**
 * Maps a series onto the 0–100 plot, top and bottom inset so the extremes are
 * not drawn on the edge. The range is floored at 1, so a constant series is
 * drawn flat along the bottom of the plot rather than dividing by zero.
 */
export function getLinePoints(series: number[]): LineChartPoint[] {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, 1);
  const padding = 10;
  const height = 100 - padding * 2;
  return series.map((value, index) => {
    const x = series.length > 1 ? (index / (series.length - 1)) * 100 : 0;
    const y = padding + (1 - (value - min) / range) * height;
    return { x, y };
  });
}

/** Catmull-Rom control points, expressed as a cubic Bézier path. */
export function buildSmoothLinePath(points: LineChartPoint[]): string {
  if (points.length < 2) return '';
  const tension = 1;
  const path = [`M ${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    path.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }
  return path.join(' ');
}

/** The line, closed down to the baseline, so it can be filled. */
export function buildAreaPath(points: LineChartPoint[]): string {
  if (points.length < 2) return '';
  const linePath = buildSmoothLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath} L ${last.x},100 L ${first.x},100 Z`;
}

export interface LineChartProps extends Omit<React.ComponentProps<'div'>, 'onSelect'> {
  /** The values, in order. Scaled to the plot; absolute magnitude is not read. */
  series: number[];
  /**
   * Which point the dot and the tooltip sit on. Omit and the chart holds its
   * own, starting at the last point.
   */
  activeIndex?: number;
  /** Called with the index the pointer landed nearest. Requires `interactive`. */
  onSelect?: (index: number) => void;
  /** Lets the pointer move the readout along the series. */
  interactive?: boolean;
  /** The readout at the active point. Omit it and only the dot is drawn. */
  tooltip?: LineChartTooltip;
  /**
   * Labels under the plot, evenly spaced. As many or as few as you like — the
   * track count follows the array, so three labels span the full width.
   */
  xLabels?: string[];
  /** Plot height in pixels, excluding the axis. */
  height?: number;
  className?: string;
}

function LineChart({
  series,
  activeIndex,
  onSelect,
  interactive = false,
  tooltip,
  xLabels,
  height = 220,
  className,
  style,
  ...props
}: LineChartProps) {
  const areaGradientId = React.useId();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const points = React.useMemo(() => (series.length ? getLinePoints(series) : []), [series]);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const [internalIndex, setInternalIndex] = React.useState(
    typeof activeIndex === 'number' ? activeIndex : Math.max(series.length - 1, 0)
  );

  const selectedIndex = typeof activeIndex === 'number' ? activeIndex : internalIndex;
  const displayIndex = hoverIndex ?? selectedIndex;
  const resolvedIndex =
    points.length > 0 ? Math.min(Math.max(displayIndex, 0), points.length - 1) : -1;
  const activePoint = resolvedIndex >= 0 ? points[resolvedIndex] : undefined;
  const linePath = React.useMemo(() => buildSmoothLinePath(points), [points]);
  const areaPath = React.useMemo(() => buildAreaPath(points), [points]);

  /*
   * The point's x is published as a custom property rather than as `left`
   * directly. `left` then lives in a class, where the narrow-viewport rule can
   * clamp it: an inline `left` could not be overridden, and a dot or tooltip
   * centred on the last point would hang past the chart's right edge and widen
   * the page.
   */
  const pointStyle = activePoint
    ? ({
        ['--line-chart-point-x' as string]: `${activePoint.x}%`,
        top: `${activePoint.y}%`,
      } as React.CSSProperties)
    : undefined;

  const getIndexFromClientX = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current || series.length <= 1) {
        return 0;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const clamped = Math.min(Math.max(ratio, 0), 1);
      return Math.round(clamped * (series.length - 1));
    },
    [series.length]
  );

  const handlePointerMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive || series.length === 0) return;
      setHoverIndex(getIndexFromClientX(event.clientX));
    },
    [getIndexFromClientX, interactive, series.length]
  );

  const handlePointerLeave = React.useCallback(() => {
    if (!interactive) return;
    setHoverIndex(null);
  }, [interactive]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive || series.length === 0) return;
      const index = getIndexFromClientX(event.clientX);
      if (onSelect) {
        onSelect(index);
      } else {
        setInternalIndex(index);
      }
    },
    [getIndexFromClientX, interactive, onSelect, series.length]
  );

  const showsReadout = Boolean(activePoint) && (!interactive || hoverIndex !== null);

  return (
    <div
      data-slot="line-chart"
      className={cn('flex flex-col gap-4', className)}
      style={
        {
          ...style,
          ['--line-chart-height' as string]: `${height}px`,
          ['--line-chart-x-count' as string]: String(xLabels?.length ?? 0),
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="line-chart-plot"
        data-interactive={interactive ? 'true' : undefined}
        ref={containerRef}
        className={cn(
          'relative flex h-[var(--line-chart-height,220px)] items-end',
          interactive && 'cursor-pointer'
        )}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <svg
          data-slot="line-chart-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-full w-full"
        >
          <defs>
            {/*
             * Both stops are the foreground mixed toward the panel, so the fade
             * runs from the line's own colour into the surface under it. Under
             * `:root` that is dark-into-light and under `.dark` light-into-dark,
             * from one definition, with no literal colour to keep in step.
             */}
            <linearGradient id={areaGradientId} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop
                offset="0"
                stopColor="color-mix(in oklab, var(--color-foreground) 75%, var(--color-muted))"
                stopOpacity="1"
              />
              <stop
                offset="1"
                stopColor="color-mix(in oklab, var(--color-foreground) 20%, var(--color-muted))"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {areaPath ? (
            <path
              data-slot="line-chart-area"
              d={areaPath}
              className="opacity-65"
              fill={`url(#${areaGradientId})`}
            />
          ) : null}
          <path
            data-slot="line-chart-line"
            d={linePath}
            className="fill-none stroke-foreground"
            strokeWidth={0.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {showsReadout ? (
          <span
            data-slot="line-chart-dot"
            aria-hidden="true"
            style={pointStyle}
            /*
             * Both marks are centred on their point with a -50% translate, so at
             * the first and last point half of each hangs outside the chart.
             * Below md they are held a bubble-width in from the edges; the dot
             * still marks the exact point.
             */
            className={cn(
              'pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground',
              'shadow-[0_0_10px_color-mix(in_oklab,var(--color-foreground)_55%,transparent)]',
              'left-[clamp(4px,var(--line-chart-point-x,50%),calc(100%_-_4px))]',
              'md:left-[var(--line-chart-point-x,50%)]'
            )}
          />
        ) : null}
        {tooltip && showsReadout ? (
          <div
            data-slot="line-chart-tooltip"
            style={pointStyle}
            className={cn(
              'absolute inline-flex -translate-x-1/2 translate-y-[calc(-100%_-_16px)] items-center gap-2',
              'rounded-lg border border-border bg-popover px-3 py-2 text-center text-xs',
              'tracking-[-0.03em] text-popover-foreground shadow-md',
              'max-w-[min(160px,100%)] left-[clamp(80px,var(--line-chart-point-x,50%),calc(100%_-_80px))]',
              'md:max-w-none md:left-[var(--line-chart-point-x,50%)]',
              // The arrow: a bordered square rotated under the bubble, with a
              // slightly smaller unbordered one over it to mask the seam.
              "before:absolute before:bottom-[-6px] before:left-1/2 before:size-3 before:-translate-x-1/2 before:rotate-45 before:rounded-[2px] before:border before:border-border before:bg-popover before:content-['']",
              "after:absolute after:bottom-[-5px] after:left-1/2 after:size-2.5 after:-translate-x-1/2 after:rotate-45 after:rounded-[2px] after:bg-popover after:content-['']"
            )}
          >
            <span data-slot="line-chart-tooltip-title" className="leading-normal font-normal">
              {tooltip.title}
            </span>
            <span data-slot="line-chart-tooltip-subtitle" className="leading-[18px]">
              {tooltip.subtitle}
            </span>
          </div>
        ) : null}
      </div>
      {xLabels?.length ? (
        /*
         * Eight labels share ~40px each at 375px, which is narrower than
         * "Dec 11". Below md the inset goes and the label breaks at its space,
         * which keeps the type and the alignment while nothing spills into the
         * neighbouring column.
         */
        <div
          data-slot="line-chart-axis"
          className={cn(
            'grid gap-x-1 px-0 text-xs text-muted-foreground md:gap-x-0 md:px-4',
            '[grid-template-columns:repeat(var(--line-chart-x-count,1),minmax(0,1fr))]'
          )}
        >
          {xLabels.map((label, index) => (
            <span
              // Labels are a fixed, ordered list and repeat legitimately at the
              // coarse buckets; position is the identity.
              key={index}
              data-slot="line-chart-axis-label"
              className="text-center leading-[18px] break-words"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { LineChart };
