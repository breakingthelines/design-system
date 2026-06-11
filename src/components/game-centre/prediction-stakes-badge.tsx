'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionStakesBadge (Wave 6.5)
 *
 * The "stake" affordance for a prediction rubric field. The premise of the
 * Wave 6.5 modal redesign is that predicting is the act of placing a stake
 * across many fields. Each field carries a small, brutalist eyebrow chip
 * that tells the viewer exactly what it scores: `+1 PT`, `+3 PTS`, `+1 EACH`.
 *
 * Visual language:
 *   - tight tracking, uppercase, monospace digits
 *   - a thin BTL-red rule on the left (a "stake post")
 *   - flat — no rounded pill, no shadow, no gradient
 *
 * The badge sits inline with the field legend OR right-aligned next to it.
 * Hosts can opt into the `each` modifier for fields that score per-pick.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionStakesBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Points available — rendered as `+N`. */
  points: number;
  /**
   * Modifier copy after the points number.
   *  - `pt`   → `+1 pt` (default, singular)
   *  - `pts`  → `+3 pts` (plural; auto-picked if points > 1 and no modifier)
   *  - `each` → `+1 each` (per-pick fields like goalscorers / bookings)
   */
  modifier?: 'pt' | 'pts' | 'each';
  /**
   * Visual emphasis:
   *  - `default` → red rule + red label (the canonical stake)
   *  - `muted`   → white/40 — used when the field is hidden / inactive
   *  - `total`   → red rule + larger label; used in the modal "stakes banner"
   */
  tone?: 'default' | 'muted' | 'total';
  className?: string;
}

function PredictionStakesBadge({
  points,
  modifier,
  tone = 'default',
  className,
  ...props
}: PredictionStakesBadgeProps) {
  const effectiveModifier = modifier ?? (points === 1 ? 'pt' : 'pts');
  const isTotal = tone === 'total';
  const isMuted = tone === 'muted';

  return (
    <span
      data-slot="prediction-stakes-badge"
      data-tone={tone}
      data-points={points}
      className={cn(
        'inline-flex items-baseline gap-1.5 border-l-2 pl-2',
        'font-content tracking-[0.16em] uppercase tabular-nums',
        isTotal ? 'border-[var(--color-red-100)]' : 'border-[var(--color-red-100)]',
        isMuted ? 'border-white/20' : '',
        isTotal ? 'text-sm' : 'text-[10px]',
        isMuted ? 'text-white/40' : 'text-[var(--color-red-100)]',
        className
      )}
      {...props}
    >
      <span
        data-slot="prediction-stakes-badge-amount"
        className={cn('font-semibold', isTotal ? 'text-base' : '')}
      >
        +{points}
      </span>
      <span
        data-slot="prediction-stakes-badge-modifier"
        className={cn(
          'text-[10px] leading-none',
          isTotal ? 'text-[11px]' : '',
          isMuted ? 'text-white/40' : 'text-[var(--color-red-100)]/85'
        )}
      >
        {effectiveModifier}
      </span>
    </span>
  );
}

export { PredictionStakesBadge };
