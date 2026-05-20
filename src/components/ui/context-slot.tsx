'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * ContextSlot
 *
 * A placement slot used by the Game Centre's `context_slots` layout. The
 * slot is a labelled, dotted-outline rectangle that hosts either:
 *
 *   - filled    → real content rendered as children
 *   - pending   → a non-content placeholder ("Loading lineups…")
 *   - empty     → an explicit empty state ("No predictions yet")
 *
 * The slot itself is purely structural — it does not provide its own data
 * source. It exists so the layout engine can keep a stable visual
 * scaffolding while content streams in (or honestly declares its absence).
 *
 * Each slot has a stable `slotId` that flows through to `data-slot-id` so
 * snapshot tests, analytics, and the curation editor can target it.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ContextSlotState = 'filled' | 'pending' | 'empty';

export interface ContextSlotProps {
  /** Stable identifier from the GameCentre context_slots config. */
  slotId: string;
  /** Display title — "Lineups", "Live timeline", "Predictions". */
  title: string;
  /** Optional one-line description. */
  description?: string;
  /** State of this slot. */
  state?: ContextSlotState;
  /** Optional rail (right-aligned actions). */
  actions?: React.ReactNode;
  /** Content rendered inside the slot (filled state). */
  children?: React.ReactNode;
  /** Override the empty / pending copy. */
  emptyLabel?: string;
  pendingLabel?: string;
  className?: string;
}

export function ContextSlot({
  slotId,
  title,
  description,
  state = 'filled',
  actions,
  children,
  emptyLabel,
  pendingLabel,
  className,
}: ContextSlotProps) {
  return (
    <section
      data-slot="context-slot"
      data-slot-id={slotId}
      data-state={state}
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-4 py-4 text-white',
        state !== 'filled' && 'border-dashed border-white/15',
        className
      )}
    >
      <header data-slot="context-slot-header" className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3
            data-slot="context-slot-title"
            className="font-display text-xs font-bold tracking-[0.18em] uppercase text-white"
          >
            {title}
          </h3>
          {description ? (
            <p
              data-slot="context-slot-description"
              className="text-[11px] text-[var(--color-grey-500)]"
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div data-slot="context-slot-actions" className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        ) : null}
      </header>

      <div data-slot="context-slot-body" className="flex flex-col gap-2">
        {state === 'filled' ? children : null}
        {state === 'pending' ? (
          <p
            data-slot="context-slot-pending"
            className="text-[12px] tracking-[0.04em] text-white/70"
          >
            {pendingLabel ?? 'Loading…'}
          </p>
        ) : null}
        {state === 'empty' ? (
          <p
            data-slot="context-slot-empty"
            className="text-[12px] tracking-[0.04em] text-[var(--color-grey-500)]"
          >
            {emptyLabel ?? 'Nothing to show yet.'}
          </p>
        ) : null}
      </div>
    </section>
  );
}
