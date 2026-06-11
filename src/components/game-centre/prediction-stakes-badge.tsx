'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionStakesBadge (Wave 6.5; chrome refresh Wave 6.25i; Wave 6.25j cleanup)
 *
 * The "stake" affordance for a prediction rubric field. Each field carries a
 * small editorial eyebrow chip that tells the viewer what it scores:
 * `+1 pt`, `+3 pts`, `+2 pts each`.
 *
 * Visual language (Wave 6.25j):
 *   - `font-content` (Inter) — same family the surrounding section headings use,
 *     so the badge reads as a quiet inline annotation rather than its own
 *     editorial accent (the Wave 6.25i Monde Journal experiment didn't sit).
 *   - tight tracking, sentence-case "pt"/"pts" — grammatically correct
 *     pluralisation (auto-picked from `points`).
 *   - BTL red colour, no underline, no border. The colour alone carries the
 *     stake signal.
 *
 * The badge sits INLINE next to its section heading by default; pass
 * `tone="total"` for the larger banner usage at the top of the modal.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionStakesBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Points available — rendered as `+N`. */
  points: number;
  /**
   * Modifier copy after the points number.
   *  - `pt`   → `+1 pt` (auto-picked when points === 1)
   *  - `pts`  → `+3 pts` (auto-picked when points > 1)
   *  - `each` → `+2 pts each` (per-pick fields — points still pluralised)
   */
  modifier?: 'pt' | 'pts' | 'each';
  /**
   * Visual emphasis:
   *  - `default` → red label, sized to sit inline with a section heading.
   *  - `muted`   → white/40 — used when the field is hidden / inactive
   *  - `total`   → red label + bigger; used in the modal "stakes banner".
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
  // `each` pluralises the noun based on points: `+1 pt each` / `+2 pts each`.
  const plural = points === 1 ? 'pt' : 'pts';
  const effectiveModifier = modifier === 'each' ? `${plural} each` : (modifier ?? plural);
  const isTotal = tone === 'total';
  const isMuted = tone === 'muted';

  return (
    <span
      data-slot="prediction-stakes-badge"
      data-tone={tone}
      data-points={points}
      className={cn(
        'font-content inline-flex items-baseline gap-1 tabular-nums',
        isMuted ? 'text-white/40' : 'text-[var(--color-red-100)]',
        isTotal ? 'text-base font-semibold' : 'text-xs font-semibold',
        className
      )}
      {...props}
    >
      <span data-slot="prediction-stakes-badge-amount">+{points}</span>
      <span
        data-slot="prediction-stakes-badge-modifier"
        className={cn(
          isTotal ? 'text-sm' : 'text-[11px]',
          'font-medium',
          isMuted ? 'text-white/40' : 'text-[var(--color-red-100)]/85'
        )}
      >
        {effectiveModifier}
      </span>
    </span>
  );
}

export { PredictionStakesBadge };
