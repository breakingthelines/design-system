'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import {
  RATING_SCALE,
  ratingDescriptor,
  type RatingScaleValue,
} from '#/components/ui/rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * VerticalGradeScale (Wave 6.4.10 — grade-modal input)
 *
 * A six-row vertical input scale built for the BTL grade-submission sheet.
 * Six clickable rows arranged vertically with a red-intensity gradient
 * from row 1 (full BTL red) at the top to row 6 (greyed-out, ~10% opacity)
 * at the bottom. Selected row gets a white ring + 100% opacity to confirm.
 *
 * Distinct from the existing `GradeScale` composite:
 *   - `GradeScale` is a horizontally-laid-out "row per grade" with
 *     descriptor labels + bar/count readouts (cast-CTA + aggregate readout
 *     for the Match Centre ratings sub-tab).
 *   - `VerticalGradeScale` is a single visual column of large numbered
 *     tiles — the grade input axis IS the vertical visual axis. Every
 *     row carries its qualitative descriptor (Excellent / Very Good /
 *     Good / Average / Poor / Very Poor) at all times so viewers can
 *     scan the meaning of every grade without hovering or selecting.
 *     Wave 6.4.15: labels are always-visible on every row (was anchor +
 *     hover/selected only in Wave 6.4.10).
 *
 * Direction invariant: 1 (best) is at the TOP; 6 (worst) at the BOTTOM.
 * The slot `data-direction="lower-is-better"` and per-row `data-value`
 * attrs are stable selectors for snapshot tests.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface VerticalGradeScaleProps extends React.ComponentProps<'div'> {
  /** Selected grade. Omit for unset. */
  value?: RatingScaleValue;
  /** Select handler — called when the viewer taps a row. */
  onSelect?: (value: RatingScaleValue) => void;
  /** Disable interaction (visual still rendered). */
  disabled?: boolean;
}

// Red-intensity gradient: row 1 = full BTL red; row 6 = greyed-out red.
// Mirrors the GradeBox `GRADE_FILL` table but tuned for input tiles (no
// label rendered inside the tile; the row's adjacent label slot carries
// the qualitative descriptor on hover/selection).
const ROW_FILL: Record<RatingScaleValue, string> = {
  1: 'bg-[var(--color-red-100)] text-white',
  2: 'bg-[color-mix(in_srgb,var(--color-red-100)_80%,transparent)] text-white',
  3: 'bg-[color-mix(in_srgb,var(--color-red-100)_60%,transparent)] text-white',
  4: 'bg-[color-mix(in_srgb,var(--color-red-100)_40%,transparent)] text-white/90',
  5: 'bg-[color-mix(in_srgb,var(--color-red-100)_20%,transparent)] text-white/75',
  6: 'bg-[color-mix(in_srgb,var(--color-red-100)_10%,transparent)] text-white/60',
};

function VerticalGradeScale({
  value,
  onSelect,
  disabled = false,
  className,
  ...props
}: VerticalGradeScaleProps) {
  const interactive = Boolean(onSelect) && !disabled;

  return (
    <div
      data-slot="vertical-grade-scale"
      data-direction="lower-is-better"
      role={interactive ? 'radiogroup' : 'group'}
      aria-label="Grade scale, lower is better"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      {RATING_SCALE.map((entry) => {
        const active = value === entry.value;
        return (
          <VerticalGradeRow
            key={entry.value}
            value={entry.value}
            descriptor={entry.label}
            active={active}
            interactive={interactive}
            disabled={disabled}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

interface VerticalGradeRowProps {
  value: RatingScaleValue;
  descriptor: string;
  active: boolean;
  interactive: boolean;
  disabled: boolean;
  onSelect?: (value: RatingScaleValue) => void;
}

function VerticalGradeRow({
  value,
  descriptor,
  active,
  interactive,
  disabled,
  onSelect,
}: VerticalGradeRowProps) {
  const Element = interactive ? 'button' : 'div';
  const handleClick =
    interactive && onSelect
      ? () => onSelect(value)
      : undefined;

  const interactiveProps = interactive
    ? {
        type: 'button' as const,
        onClick: handleClick,
        role: 'radio' as const,
        'aria-checked': active,
        'aria-label': `Grade ${value}, ${descriptor}`,
      }
    : {
        role: 'presentation' as const,
        'aria-label': `Grade ${value}, ${descriptor}`,
      };

  // Tip label visibility (Wave 6.4.15): the qualitative descriptor for
  // every row is always visible. The active row's label brightens to
  // confirm selection; idle rows stay legible at a softer weight.
  return (
    <Element
      data-slot="vertical-grade-row"
      data-value={value}
      data-active={active || undefined}
      disabled={interactive ? disabled : undefined}
      className={cn(
        'group relative flex items-center gap-3 text-left',
        interactive && 'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-60'
      )}
      {...interactiveProps}
    >
      <span
        data-slot="vertical-grade-row-tile"
        aria-hidden="true"
        className={cn(
          'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[4px] font-mono text-[28px] font-bold leading-none tabular-nums tracking-tight',
          'transition-all duration-150',
          ROW_FILL[value],
          active
            ? 'ring-2 ring-white shadow-[0_0_0_2px_rgba(0,0,0,0.4)] scale-[1.02]'
            : interactive && 'group-hover:ring-1 group-hover:ring-white/40 opacity-90 group-hover:opacity-100',
          !interactive && 'opacity-80'
        )}
      >
        {value}
      </span>

      {/* Tip label slot — every row's qualitative descriptor is always
          visible (Wave 6.4.15). Selection lifts to full white; idle rows
          stay legible at a softer weight. */}
      <span
        data-slot="vertical-grade-row-label"
        className={cn(
          'font-content text-xs tracking-tight transition-colors duration-150',
          active ? 'text-white' : 'text-white/70 group-hover:text-white/90'
        )}
      >
        {ratingDescriptor(value).label}
      </span>
    </Element>
  );
}

export { VerticalGradeScale };
