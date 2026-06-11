'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionStakesBadge (Wave 6.5; chrome refresh Wave 6.25i)
 *
 * The "stake" affordance for a prediction rubric field. Each field carries a
 * small editorial eyebrow chip that tells the viewer exactly what it scores:
 * `+1 PT`, `+3 PTS`, `+1 EACH`.
 *
 * Visual language (Wave 6.25i):
 *   - Monde Journal (`font-display`) — the display family that already carries
 *     BTL's editorial accents (SectionHeader, ContextSlot eyebrows).
 *   - tight tracking, uppercase, tabular digits.
 *   - a thin BTL-red underline beneath the text — the same red-100 rule the
 *     SectionHeader pattern uses, which keeps the stake chip rhyming with the
 *     rest of the editorial chrome.
 *   - no left border, no rounded pill, no shadow.
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
   *  - `default` → red label + red underline (the canonical stake)
   *  - `muted`   → white/40 — used when the field is hidden / inactive
   *  - `total`   → red label + larger size; used in the modal "stakes banner"
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
        'inline-flex flex-col items-start gap-0.5',
        isMuted ? 'text-white/40' : 'text-[var(--color-red-100)]',
        className
      )}
      {...props}
    >
      <span
        data-slot="prediction-stakes-badge-row"
        className={cn(
          'inline-flex items-baseline gap-1.5',
          'font-display tracking-[0.16em] uppercase tabular-nums',
          isTotal ? 'text-sm' : 'text-[10px]'
        )}
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
      <span
        data-slot="prediction-stakes-badge-underline"
        aria-hidden="true"
        className={cn('h-px w-full', isMuted ? 'bg-white/25' : 'bg-[var(--color-red-100)]')}
      />
    </span>
  );
}

export { PredictionStakesBadge };
