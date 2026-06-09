'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { ratingDescriptor, type RatingScaleValue } from './rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * GradeBox
 *
 * Single 1-6 grade rendered as a coloured square — the canonical "cast
 * grade" idiom for BTL. BILD-style: number large, qualitative label small
 * underneath. Red-intensity gradient where 1 (Excellent) is the deepest
 * BTL red and 6 (Poor) is dim grey — reinforces "red = peak" consistent
 * with Wave 5's LIVE indicators and Wave 1's peak-rating bars.
 *
 * Used wherever a single cast grade is shown: PotM card, PlayerRatingCard,
 * the Ratings sub-tab PlayerRatingBoard markers, Recent Performances strip.
 *
 * For aggregate averages (e.g. "BTL average: 2.1"), use the sibling
 * `MeanBox` primitive — averages are quieter than cast grades by design.
 *
 * Size tiers (named so the type-scale ↔ box-size relationship is owned
 * by the ds, not by every consumer):
 *
 *   xs  — Recent Performances chip, ~16-20px
 *   sm  — Player Rating Board marker, ~24-32px
 *   lg  — PotM card hero, ~64-80px
 *   xl  — RatingsReceivedCard hero, ~96-128px
 * ──────────────────────────────────────────────────────────────────────────── */

export type GradeBoxSize = 'xs' | 'sm' | 'lg' | 'xl';

export interface GradeBoxProps extends React.ComponentProps<'div'> {
  /** Cast grade. 1 = Excellent (best); 6 = Poor (worst). */
  value: RatingScaleValue;
  /** Size tier. Defaults to `lg`. */
  size?: GradeBoxSize;
  /**
   * Show the qualitative label underneath ("Very Good", etc.). Defaults to
   * `true` for `lg` and `xl`, `false` for `xs` and `sm` (no room).
   */
  showLabel?: boolean;
}

const SIZE_CONFIG: Record<
  GradeBoxSize,
  { box: string; number: string; label: string; gap: string }
> = {
  xs: {
    box: 'h-4 w-4 min-w-4',
    number: 'text-[10px] leading-none font-bold',
    label: 'text-[8px] uppercase tracking-wide',
    gap: 'gap-0.5',
  },
  sm: {
    box: 'h-7 w-7 min-w-7',
    number: 'text-base leading-none font-bold',
    label: 'text-[10px] uppercase tracking-wide',
    gap: 'gap-0.5',
  },
  lg: {
    box: 'h-16 w-16 min-w-16',
    number: 'text-[40px] leading-none font-bold',
    label: 'text-xs uppercase tracking-wide',
    gap: 'gap-1',
  },
  xl: {
    box: 'h-24 w-24 min-w-24',
    number: 'text-[64px] leading-none font-bold',
    label: 'text-sm uppercase tracking-wide',
    gap: 'gap-1.5',
  },
};

// Red-intensity gradient: 1 = deepest BTL red; 6 = dim grey.
// Uses arbitrary Tailwind values so the visual stays single-source-of-truth
// here rather than embedded in tailwind.config.
const GRADE_FILL: Record<RatingScaleValue, string> = {
  1: 'bg-[var(--color-red-100)] text-white',
  2: 'bg-[color-mix(in_srgb,var(--color-red-100)_75%,transparent)] text-white',
  3: 'bg-[color-mix(in_srgb,var(--color-red-100)_50%,transparent)] text-white',
  4: 'bg-[color-mix(in_srgb,var(--color-red-100)_25%,transparent)] text-white/90',
  5: 'bg-[color-mix(in_srgb,var(--color-grey-300)_40%,transparent)] text-white/80',
  6: 'bg-[color-mix(in_srgb,var(--color-grey-500)_30%,transparent)] text-white/70',
};

function GradeBox({ value, size = 'lg', showLabel, className, ...props }: GradeBoxProps) {
  const descriptor = ratingDescriptor(value);
  const cfg = SIZE_CONFIG[size];
  const shouldShowLabel = showLabel ?? (size === 'lg' || size === 'xl');

  return (
    <div
      data-slot="grade-box"
      data-value={value}
      data-size={size}
      className={cn('inline-flex flex-col items-center', cfg.gap, className)}
      {...props}
    >
      <div
        data-slot="grade-box-square"
        className={cn('flex items-center justify-center rounded-[4px]', cfg.box, GRADE_FILL[value])}
        aria-label={`Grade ${value}, ${descriptor.label}`}
      >
        <span className={cn(cfg.number)}>{value}</span>
      </div>
      {shouldShowLabel ? (
        <span data-slot="grade-box-label" className={cn('text-white/70', cfg.label)}>
          {descriptor.shortLabel}
        </span>
      ) : null}
    </div>
  );
}

export { GradeBox };
