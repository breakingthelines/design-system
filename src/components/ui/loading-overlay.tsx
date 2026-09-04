'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { SpinnerGap } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * LoadingOverlay — a scrim over a panel whose contents are still on screen.
 *
 * The middle case between the two loaders the system already had.
 * `FullscreenLoader` is the wait that owns the viewport, when there is nothing
 * yet to show. `Skeleton` is the wait for a body that is being swapped out, and
 * it holds the shape of the thing arriving. This is the third one: a table that
 * is being refetched, a panel whose rows are about to change under a new
 * filter. The old figures stay legible underneath, dimmed, so the layout does
 * not collapse and jolt back.
 *
 * Promoted from admin-dashboard, which defined it eleven times (#218). The
 * copies had drifted: four different scrim colours, two z-indexes, two corner
 * radii, and `backdrop-filter` on some but not others. One definition settles
 * all four, and the scrim is `--color-background` mixed toward transparent
 * rather than a literal `rgba(0, 0, 0, 0.4)`, so it dims a light panel as well
 * as a dark one.
 *
 * It announces itself. `role="status"` with `aria-live="polite"` means the
 * label is read when the wait starts and again when it ends. Several of the
 * local copies were a silent `div` around a spinner, so a screen-reader user
 * got no signal either way.
 *
 * POSITIONING: this is `absolute inset-0`. The panel it covers must establish a
 * containing block — `relative` on the section, which is what every call site
 * already had. Without it the scrim escapes to the nearest positioned ancestor
 * and dims the page.
 * ──────────────────────────────────────────────────────────────────────────── */

export type LoadingOverlayRadius = 'none' | 'sm' | 'md';

const loadingOverlayVariants: VariantFn<{ radius?: LoadingOverlayRadius | null }> = cva(
  [
    'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2',
    // A mix toward `transparent` rather than an alpha literal: the scrim is the
    // panel's own ground, thinned, so it dims whichever surface is underneath.
    'bg-[color-mix(in_oklab,var(--color-background)_65%,transparent)] backdrop-blur-[2px]',
    'text-foreground',
  ].join(' '),
  {
    variants: {
      radius: {
        none: 'rounded-none',
        sm: 'rounded-btl-sm',
        md: 'rounded-btl-md',
      } satisfies Record<LoadingOverlayRadius, string>,
    },
    defaultVariants: {
      radius: 'sm',
    },
  }
);

export interface LoadingOverlayProps extends React.ComponentProps<'div'> {
  /**
   * What is being waited on. Announced, so make it specific: "Loading flags"
   * beats "Loading" on a page with more than one reason to wait.
   */
  label?: string;
  /** Spinner size in pixels. */
  size?: number;
  /**
   * Match the corner radius of the panel underneath, so the scrim does not
   * square off a rounded card. `sm` is 4px, `md` is 12px.
   */
  radius?: LoadingOverlayRadius;
  className?: string;
}

function LoadingOverlay({
  label,
  size = 20,
  radius = 'sm',
  className,
  ...props
}: LoadingOverlayProps) {
  return (
    <div
      data-slot="loading-overlay"
      role="status"
      aria-live="polite"
      className={cn(loadingOverlayVariants({ radius }), className)}
      {...props}
    >
      <SpinnerGap
        data-slot="loading-overlay-spinner"
        size={size}
        aria-hidden="true"
        className="animate-spin"
      />
      {label ? (
        <p data-slot="loading-overlay-label" className="text-xs text-muted-foreground">
          {label}
        </p>
      ) : null}
    </div>
  );
}

export { LoadingOverlay, loadingOverlayVariants };
