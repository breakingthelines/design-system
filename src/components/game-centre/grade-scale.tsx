'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { GradeBox } from '#/components/ui/grade-box';
import {
  RATING_SCALE,
  ratingDescriptor,
  type RatingScaleValue,
} from '#/components/ui/rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * GradeScale (Wave 6.4 unifying primitive)
 *
 * Vertical 1→6 grade scale that replaces both `RatingScale` (input) and
 * `RatingDistribution` (readout) on the Match Centre Ratings sub-tab. One
 * vertical list — 1 (Excellent) at the top, 6 (Poor) at the bottom — three
 * modes:
 *
 *   input     — interactive scale; tapping a row casts a grade.
 *   readout   — non-interactive aggregate scale; renders counts per bucket
 *               plus a `meanIndicator` line sitting between rows when the
 *               aggregate mean falls between two grades.
 *   composite — both at once: cast-CTA tiles AND the BTL average, on one
 *               vertical column. This is the Wave 6.4 single-card target.
 *
 * Row anatomy (each grade row is a horizontal lane):
 *
 *   [grade-box] [qualitative label] [vote count] [userGrade marker]
 *
 * Mean indicator: when `aggregate.mean` falls between two integers
 * (e.g. 2.4) the component draws a slim horizontal lozenge between rows
 * 2 and 3 carrying the mean value + count.
 *
 * Honest by default: with zero votes the readout still draws six rows and
 * a "No grades yet" caption. The composite mode keeps the cast-CTA active
 * regardless of aggregate state — readers can grade even when nobody else
 * has yet.
 *
 * The component is presentational. It does NOT submit grades. `onSelect`
 * is the host's hook into the rating sheet / write flow.
 *
 * Direction invariant: rows always render 1→6 top-to-bottom. The slot
 * `data-direction="lower-is-better"` and the per-row `data-value` attrs
 * are stable selectors for snapshot tests.
 *
 * Naming note: 'grade' is the user-facing noun for a cast 1-6 score, in
 * line with the Wave 6.4 rating→grade copy rename. The pre-existing
 * `RatingScale` stays exported for back-compat consumers and may be
 * deprecated later.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface GradeScaleAggregate {
  /** Mean of all cast grades, typically 1.0-6.0. */
  mean: number;
  /** Total number of cast grades contributing to the mean. */
  count: number;
}

export type GradeScaleCounts = Partial<Record<RatingScaleValue, number>>;

export type GradeScaleMode = 'input' | 'readout' | 'composite';

export interface GradeScaleProps extends React.ComponentProps<'div'> {
  /**
   * Rendering mode.
   *  - `input`     → six interactive rows; tap to cast a grade.
   *  - `readout`   → six rows with per-bucket counts; non-interactive.
   *  - `composite` → six rows with BOTH the cast-CTA tile and aggregate
   *                  counts, on a single vertical list.
   */
  mode?: GradeScaleMode;
  /** Viewer's cast grade, 1 (best) to 6 (worst). Omit when unset. */
  userGrade?: RatingScaleValue;
  /** Per-bucket vote counts. Missing keys treated as 0. */
  counts?: GradeScaleCounts;
  /** BTL aggregate mean + count. Drives the mean indicator. */
  aggregate?: GradeScaleAggregate;
  /** Tap handler for casting/changing a grade (input + composite modes). */
  onSelect?: (value: RatingScaleValue) => void;
  /**
   * Disable interaction even in `input` / `composite` mode (e.g. when the
   * rating window has closed). The user's existing `userGrade` still
   * shows.
   */
  disabled?: boolean;
}

const ALL_VALUES: readonly RatingScaleValue[] = RATING_SCALE.map(
  (r) => r.value
) as readonly RatingScaleValue[];

function totalCount(counts: GradeScaleCounts | undefined): number {
  if (!counts) return 0;
  let total = 0;
  for (const v of ALL_VALUES) total += counts[v] ?? 0;
  return total;
}

function maxBucket(counts: GradeScaleCounts | undefined): number {
  if (!counts) return 0;
  let max = 0;
  for (const v of ALL_VALUES) {
    const b = counts[v] ?? 0;
    if (b > max) max = b;
  }
  return max;
}

function GradeScale({
  mode = 'composite',
  userGrade,
  counts,
  aggregate,
  onSelect,
  disabled = false,
  className,
  ...props
}: GradeScaleProps) {
  const showInput = (mode === 'input' || mode === 'composite') && !disabled;
  const showReadout = mode === 'readout' || mode === 'composite';
  const total = totalCount(counts);
  const max = maxBucket(counts);

  // The mean indicator slips between rows when the mean isn't an integer.
  // Round to one decimal for the display label; use the raw value to
  // decide the insertion slot.
  const meanInsertAfter = (() => {
    if (!showReadout || !aggregate) return undefined;
    const { mean } = aggregate;
    if (!Number.isFinite(mean)) return undefined;
    if (mean < 1 || mean > 6) return undefined;
    // If the mean is essentially integer, anchor the indicator to that row
    // (rendered after it) so it doesn't lose precision.
    const floor = Math.floor(mean);
    return Math.max(1, Math.min(5, floor)) as 1 | 2 | 3 | 4 | 5;
  })();

  return (
    <div
      data-slot="grade-scale"
      data-mode={mode}
      data-direction="lower-is-better"
      role={showInput ? 'radiogroup' : 'group'}
      aria-label={showInput ? 'Grade scale, lower is better' : 'Grade distribution'}
      className={cn('flex flex-col gap-1', className)}
      {...props}
    >
      {RATING_SCALE.map((entry) => {
        const bucket = counts?.[entry.value] ?? 0;
        const active = userGrade === entry.value;
        const ratio = max === 0 ? 0 : bucket / max;
        return (
          <React.Fragment key={entry.value}>
            <GradeScaleRow
              value={entry.value}
              label={entry.shortLabel}
              bucket={bucket}
              ratio={ratio}
              active={active}
              showInput={showInput}
              showReadout={showReadout}
              disabled={disabled}
              onSelect={onSelect}
            />
            {meanInsertAfter === entry.value ? (
              <MeanIndicator mean={aggregate!.mean} count={aggregate!.count} />
            ) : null}
          </React.Fragment>
        );
      })}
      {showReadout && total === 0 ? (
        <p data-slot="grade-scale-empty" className="px-1 pt-1 text-[11px] text-white/55">
          No grades yet.
        </p>
      ) : null}
    </div>
  );
}

interface GradeScaleRowProps {
  value: RatingScaleValue;
  label: string;
  bucket: number;
  ratio: number;
  active: boolean;
  showInput: boolean;
  showReadout: boolean;
  disabled: boolean;
  onSelect?: (value: RatingScaleValue) => void;
}

function GradeScaleRow({
  value,
  label,
  bucket,
  ratio,
  active,
  showInput,
  showReadout,
  disabled,
  onSelect,
}: GradeScaleRowProps) {
  const handleClick = onSelect && showInput ? () => onSelect(value) : undefined;
  const Element = showInput ? 'button' : 'div';
  const interactiveProps = showInput
    ? {
        type: 'button' as const,
        onClick: handleClick,
        role: 'radio' as const,
        'aria-checked': active,
        'aria-label': `Grade ${value}, ${label}${
          showReadout ? `, ${bucket} ${bucket === 1 ? 'vote' : 'votes'}` : ''
        }`,
      }
    : {
        role: 'presentation' as const,
        'aria-label': `Grade ${value}, ${label}, ${bucket} ${bucket === 1 ? 'vote' : 'votes'}`,
      };

  return (
    <Element
      data-slot="grade-scale-row"
      data-value={value}
      data-active={active || undefined}
      data-bucket={bucket}
      disabled={handleClick ? disabled : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-[4px] px-2 py-1.5 text-left',
        'border border-transparent transition-colors',
        handleClick && 'cursor-pointer hover:border-white/15 focus-visible:outline-none',
        handleClick && 'focus-visible:border-[var(--color-red-100)]',
        active && 'border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/10',
        disabled && 'cursor-not-allowed opacity-60'
      )}
      {...interactiveProps}
    >
      <GradeBox value={value} size="sm" showLabel={false} />
      <span
        data-slot="grade-scale-row-label"
        className={cn('flex-1 text-[12px] tracking-tight', active ? 'text-white' : 'text-white/70')}
      >
        {label}
      </span>

      {showReadout ? (
        <div
          data-slot="grade-scale-row-readout"
          className="flex items-center gap-2"
          aria-hidden="true"
        >
          <span
            data-slot="grade-scale-row-bar"
            className="block h-1.5 w-16 overflow-hidden rounded-full bg-white/5"
          >
            <span
              className={cn(
                'block h-full rounded-full',
                bucket === 0 ? 'bg-transparent' : 'bg-[var(--color-red-100)]/80'
              )}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </span>
          <span
            data-slot="grade-scale-row-count"
            className="w-7 text-right font-mono text-[11px] tabular-nums text-white/60"
          >
            {bucket}
          </span>
        </div>
      ) : null}

      {active ? (
        <span
          data-slot="grade-scale-row-marker"
          aria-hidden="true"
          className="text-[10px] font-semibold tracking-[0.16em] text-[var(--color-red-100)] uppercase"
        >
          You
        </span>
      ) : null}
    </Element>
  );
}

function MeanIndicator({ mean, count }: { mean: number; count: number }) {
  const descriptor = ratingDescriptor(
    Math.max(1, Math.min(6, Math.round(mean))) as RatingScaleValue
  );
  return (
    <div
      data-slot="grade-scale-mean-indicator"
      data-mean={mean.toFixed(1)}
      className="my-0.5 flex items-center gap-2 px-2"
    >
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-red-100)]/30" />
      <span className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/10 px-2 py-0.5">
        <span
          data-slot="grade-scale-mean-value"
          className="font-mono text-[12px] font-bold tabular-nums text-white"
        >
          {mean.toFixed(1)}
        </span>
        <span className="text-[10px] tracking-wide text-white/70 uppercase">BTL avg</span>
        <span className="text-[10px] text-white/50">
          · {count} {count === 1 ? 'grade' : 'grades'}
        </span>
        <span className="sr-only">, {descriptor.label}</span>
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-red-100)]/30" />
    </div>
  );
}

export { GradeScale };
