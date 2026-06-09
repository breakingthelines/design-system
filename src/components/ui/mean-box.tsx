'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { ratingDescriptor, type RatingScaleValue } from './rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * MeanBox
 *
 * Aggregate-mean readout primitive. Sibling to `GradeBox`. Mean rating is
 * NOT a cast grade — it's a calculated signal. MeanBox is typographic-only:
 *
 *   bold decimal number (e.g. "2.1")
 *   qualitative label rounded to nearest integer ("Very Good")
 *   tiny count tag ("100 grades")
 *
 * NO red tint, NO card chrome — sits inside whatever container the consumer
 * provides. Visually distinguishable from GradeBox so viewers never confuse
 * `BTL average 2.1` with `your grade 2`.
 *
 * Used wherever an aggregate average is shown: MatchRatingCard's BTL
 * average row, RatingDistribution mean marker, entity Overview stat rows.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MeanBoxProps extends React.ComponentProps<'div'> {
  /** Mean value (typically 1.0-6.0). Display rounds to 1 decimal place. */
  value: number;
  /** Number of grades contributing to the mean. */
  count?: number;
  /** Custom count label suffix. Defaults to `count === 1 ? 'grade' : 'grades'`. */
  countLabel?: string;
  /** Layout tier. Defaults to `md`. */
  size?: 'sm' | 'md' | 'lg';
  /** Hide the qualitative label. Defaults to false. */
  hideQualitativeLabel?: boolean;
  /** Hide the count tag (even when `count` is provided). Defaults to false. */
  hideCount?: boolean;
}

const SIZE_CONFIG: Record<
  Exclude<MeanBoxProps['size'], undefined>,
  { number: string; label: string; count: string; gap: string }
> = {
  sm: {
    number: 'text-lg leading-none font-bold tracking-tight',
    label: 'text-[10px] uppercase tracking-wide text-white/60',
    count: 'text-[10px] text-white/40',
    gap: 'gap-0.5',
  },
  md: {
    number: 'text-3xl leading-none font-bold tracking-tight',
    label: 'text-xs uppercase tracking-wide text-white/60',
    count: 'text-xs text-white/40',
    gap: 'gap-1',
  },
  lg: {
    number: 'text-5xl leading-none font-bold tracking-tight',
    label: 'text-sm uppercase tracking-wide text-white/60',
    count: 'text-xs text-white/40',
    gap: 'gap-1',
  },
};

function clampRatingValue(value: number): RatingScaleValue {
  const rounded = Math.round(value);
  if (rounded < 1) return 1;
  if (rounded > 6) return 6;
  return rounded as RatingScaleValue;
}

function MeanBox({
  value,
  count,
  countLabel,
  size = 'md',
  hideQualitativeLabel = false,
  hideCount = false,
  className,
  ...props
}: MeanBoxProps) {
  const cfg = SIZE_CONFIG[size];
  const descriptor = ratingDescriptor(clampRatingValue(value));
  const resolvedCountLabel = countLabel ?? (count === 1 ? 'grade' : 'grades');
  const showCount = !hideCount && count !== undefined;

  return (
    <div
      data-slot="mean-box"
      data-value={value.toFixed(1)}
      data-size={size}
      className={cn('inline-flex flex-col text-white', cfg.gap, className)}
      {...props}
    >
      <span data-slot="mean-box-number" className={cfg.number}>
        {value.toFixed(1)}
      </span>
      {!hideQualitativeLabel ? (
        <span data-slot="mean-box-label" className={cfg.label}>
          {descriptor.shortLabel}
        </span>
      ) : null}
      {showCount ? (
        <span data-slot="mean-box-count" className={cfg.count}>
          {count} {resolvedCountLabel}
        </span>
      ) : null}
    </div>
  );
}

export { MeanBox };
