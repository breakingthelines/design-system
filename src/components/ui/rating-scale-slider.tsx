'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import {
  RATING_SCALE,
  ratingDescriptor,
  type RatingScaleValue,
} from '#/components/ui/rating-scale';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingScaleSlider (L5 — Ratings Club composer)
 *
 * Interactive 1-6 rating composer for a single subject (player / manager).
 * The component supports two interaction models:
 *
 *   - Tap-to-rate (default) — six pill buttons aligned to RatingScale's
 *     compact variant. Keyboard arrow keys move selection by 1.
 *   - Slider mode — a horizontal continuous slider that snaps to the nearest
 *     integer on commit. Visually distinct from the canonical RatingScale.
 *
 * Hold the inversion: lower is better. A `data-direction="lower-is-better"`
 * attribute is always exposed on the root so consumers and tests can verify
 * the directionality survived.
 *
 * The component is uncontrolled by default — pass `value` + `onChange` to
 * make it controlled.
 * ──────────────────────────────────────────────────────────────────────────── */

const VALUES: readonly RatingScaleValue[] = [1, 2, 3, 4, 5, 6];

export interface RatingScaleSliderProps {
  /** Active rating, 1 (best) to 6 (worst). Omit to render empty. */
  value?: RatingScaleValue;
  /** Default uncontrolled value. */
  defaultValue?: RatingScaleValue;
  /** Called whenever the rating changes. */
  onChange?: (value: RatingScaleValue) => void;
  /** Visual layout. Defaults to `tiles`. */
  variant?: 'tiles' | 'slider';
  /** Optional eyebrow — typically the rated subject's name. */
  eyebrow?: string;
  /** Optional helper line under the slider. */
  helpText?: React.ReactNode;
  /** Disable input. */
  disabled?: boolean;
  /** ARIA label for the group. */
  ariaLabel?: string;
  className?: string;
}

export function RatingScaleSlider({
  value: valueProp,
  defaultValue,
  onChange,
  variant = 'tiles',
  eyebrow,
  helpText,
  disabled,
  ariaLabel,
  className,
}: RatingScaleSliderProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<RatingScaleValue | undefined>(
    defaultValue
  );
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const commit = React.useCallback(
    (next: RatingScaleValue) => {
      if (!isControlled) setUncontrolledValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return (
    <div
      data-slot="rating-scale-slider"
      data-variant={variant}
      data-direction="lower-is-better"
      data-value={value ?? ''}
      role="group"
      aria-label={ariaLabel ?? eyebrow ?? 'Rating'}
      className={cn(
        'flex flex-col gap-2 border border-white/10 bg-[var(--color-grey-200)] px-4 py-3 text-white',
        className
      )}
    >
      {eyebrow ? (
        <header
          data-slot="rating-scale-slider-eyebrow"
          className="flex items-baseline justify-between text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
        >
          <span className="truncate">{eyebrow}</span>
          <span data-slot="rating-scale-slider-current" className="tabular-nums text-white">
            {value ?? '—'}
          </span>
        </header>
      ) : null}

      {variant === 'slider' ? (
        <SliderTrack value={value} onCommit={commit} disabled={disabled} />
      ) : (
        <TileRow value={value} onCommit={commit} disabled={disabled} />
      )}

      <p
        data-slot="rating-scale-slider-descriptor"
        className="flex items-baseline justify-between text-[11px] text-white/70"
      >
        <span>{value ? ratingDescriptor(value).label : 'No rating yet'}</span>
        <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--color-grey-500)]">
          Lower is better
        </span>
      </p>
      {helpText ? (
        <p data-slot="rating-scale-slider-help" className="text-[11px] leading-snug text-white/55">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

interface TileRowProps {
  value: RatingScaleValue | undefined;
  onCommit: (value: RatingScaleValue) => void;
  disabled?: boolean;
}

function TileRow({ value, onCommit, disabled }: TileRowProps) {
  return (
    <div data-slot="rating-scale-slider-tiles" className="inline-flex flex-wrap items-center gap-1">
      {RATING_SCALE.map((entry) => {
        const active = value === entry.value;
        return (
          <button
            key={entry.value}
            type="button"
            data-slot="rating-scale-slider-tile"
            data-value={entry.value}
            data-active={active || undefined}
            aria-pressed={active}
            aria-label={`${entry.value}, ${entry.label}`}
            onClick={() => onCommit(entry.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                const next = Math.min(6, (value ?? entry.value) + 1) as RatingScaleValue;
                onCommit(next);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                const next = Math.max(1, (value ?? entry.value) - 1) as RatingScaleValue;
                onCommit(next);
              }
            }}
            disabled={disabled}
            className={cn(
              'inline-flex size-9 items-center justify-center font-mono text-[13px] font-semibold tabular-nums',
              'border transition-colors',
              active
                ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)] text-white'
                : 'border-white/15 bg-[var(--color-grey-300)] text-white/70 hover:border-white/30',
              'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {entry.value}
          </button>
        );
      })}
    </div>
  );
}

interface SliderTrackProps {
  value: RatingScaleValue | undefined;
  onCommit: (value: RatingScaleValue) => void;
  disabled?: boolean;
}

function SliderTrack({ value, onCommit, disabled }: SliderTrackProps) {
  return (
    <label data-slot="rating-scale-slider-track" className="flex flex-col gap-2">
      <input
        type="range"
        min={1}
        max={6}
        step={1}
        value={value ?? 1}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isNaN(next)) return;
          const clamped = Math.max(1, Math.min(6, next));
          onCommit(VALUES[clamped - 1]);
        }}
        disabled={disabled}
        aria-label="Rating"
        aria-valuemin={1}
        aria-valuemax={6}
        aria-valuenow={value ?? 1}
        aria-valuetext={
          value
            ? `${value} — ${ratingDescriptor(value).label}, lower is better`
            : 'No rating, lower is better'
        }
        className={cn(
          'h-2 w-full appearance-none bg-white/10 accent-[var(--color-red-100)]',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      />
      <div
        aria-hidden="true"
        className="grid grid-cols-6 text-center text-[10px] tracking-[0.08em] uppercase text-[var(--color-grey-500)]"
      >
        {VALUES.map((v) => (
          <span key={v} data-slot="rating-scale-slider-stop" data-value={v}>
            {v}
          </span>
        ))}
      </div>
    </label>
  );
}
