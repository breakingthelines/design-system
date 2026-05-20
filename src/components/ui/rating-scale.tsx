'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingScale
 *
 * BTL canonical 1-6 inverse rating scale. *Lower is better.*
 *
 *   1 — Excellent
 *   2 — Very Good
 *   3 — Good
 *   4 — Satisfactory
 *   5 — Below Standard
 *   6 — Poor
 *
 * Two layouts:
 *   - `compact` (default) — pill row of six numbered tiles, current value
 *     highlighted. Suitable for a match-side ratings strip.
 *   - `legend` — full vertical legend with descriptors. Suitable for the
 *     "How we rate" footer on EntityPageShell.
 *
 * The component never lies about direction: the active tile carries a
 * `data-direction="lower-is-better"` attribute and the label reads
 * "Lower is better" so consumers (screen readers, snapshot tests, etc.) can
 * verify the inversion is preserved.
 * ──────────────────────────────────────────────────────────────────────────── */

export type RatingScaleValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface RatingScaleDescriptor {
  value: RatingScaleValue;
  label: string;
  shortLabel: string;
}

export const RATING_SCALE: readonly RatingScaleDescriptor[] = [
  { value: 1, label: 'Excellent', shortLabel: 'Excellent' },
  { value: 2, label: 'Very Good', shortLabel: 'Very good' },
  { value: 3, label: 'Good', shortLabel: 'Good' },
  { value: 4, label: 'Satisfactory', shortLabel: 'Satisfactory' },
  { value: 5, label: 'Below Standard', shortLabel: 'Below standard' },
  { value: 6, label: 'Poor', shortLabel: 'Poor' },
] as const;

export function ratingDescriptor(value: RatingScaleValue): RatingScaleDescriptor {
  // Inputs are typed as 1..6; this lookup is total.
  return RATING_SCALE[value - 1];
}

export interface RatingScaleProps {
  /** Active rating, 1 (best) to 6 (worst). Omit to render the empty scale. */
  value?: RatingScaleValue;
  /** Layout. Defaults to `compact`. */
  variant?: 'compact' | 'legend';
  /** Optional click handler. When provided, tiles render as buttons. */
  onSelect?: (value: RatingScaleValue) => void;
  className?: string;
}

export function RatingScale({ value, variant = 'compact', onSelect, className }: RatingScaleProps) {
  const interactive = Boolean(onSelect);

  if (variant === 'legend') {
    return (
      <div
        data-slot="rating-scale"
        data-variant="legend"
        data-direction="lower-is-better"
        className={cn(
          'flex flex-col gap-2 border border-white/10 bg-[var(--color-grey-200)] p-4 text-xs text-white/80',
          className
        )}
      >
        <header
          data-slot="rating-scale-eyebrow"
          className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
        >
          Lower is better
        </header>
        <ul className="flex flex-col gap-1">
          {RATING_SCALE.map((entry) => {
            const active = value === entry.value;
            return (
              <li
                key={entry.value}
                data-slot="rating-scale-entry"
                data-value={entry.value}
                data-active={active || undefined}
                className={cn('flex items-center gap-3', active ? 'text-white' : 'text-white/70')}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-6 shrink-0 items-center justify-center rounded-sm border text-[11px] font-semibold tabular-nums',
                    active
                      ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)]/15 text-[var(--color-red-100)]'
                      : 'border-white/15 text-white/70'
                  )}
                >
                  {entry.value}
                </span>
                <span>{entry.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      data-slot="rating-scale"
      data-variant="compact"
      data-direction="lower-is-better"
      role="group"
      aria-label="Rating scale, lower is better"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {RATING_SCALE.map((entry) => {
        const active = value === entry.value;
        const Element = interactive ? 'button' : 'span';
        return (
          <Element
            key={entry.value}
            data-slot="rating-scale-tile"
            data-value={entry.value}
            data-active={active || undefined}
            data-direction={active ? 'lower-is-better' : undefined}
            {...(interactive
              ? {
                  type: 'button' as const,
                  onClick: () => onSelect?.(entry.value),
                  'aria-pressed': active,
                  'aria-label': `${entry.value}, ${entry.label}`,
                }
              : { 'aria-label': `${entry.value}, ${entry.label}` })}
            className={cn(
              'inline-flex size-7 items-center justify-center font-mono text-[12px] font-semibold tabular-nums tracking-tight',
              'border border-white/10 transition-colors',
              active
                ? 'bg-[var(--color-red-100)] text-white border-[var(--color-red-100)]'
                : 'bg-[var(--color-grey-200)] text-white/70',
              interactive && !active && 'hover:border-white/30 cursor-pointer',
              interactive &&
                'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]'
            )}
          >
            {entry.value}
          </Element>
        );
      })}
    </div>
  );
}
