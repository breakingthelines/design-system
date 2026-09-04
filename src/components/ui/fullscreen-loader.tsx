'use client';

import * as React from 'react';
import { SpinnerGap } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * FullscreenLoader — the whole viewport, while there is nothing yet to show.
 *
 * For the wait that owns the page: a session being resolved before a route can
 * decide what to render, a shell booting. Anything loading inside a page that
 * is already drawn wants a `Skeleton` in the shape of the thing arriving, not
 * a spinner over the top of it.
 *
 * The system's loading idiom is `SpinnerGap` with `animate-spin` — that is what
 * `AudioPlayer`, `ThoughtComposer`, `ThoughtsPanel` and `ThoughtComment` all
 * draw. This uses the same icon and the same animation utility rather than the
 * hand-written `@keyframes rotate` the local version shipped, which had to be a
 * global stylesheet and put an unscoped `.spin` and `.fullscreen-loader` into
 * every consumer's global namespace.
 *
 * It announces itself. `role="status"` with `aria-live="polite"` means the
 * label is read when the loader appears and again when it goes; the local
 * version was a silent `div`, so a screen-reader user got no signal that a wait
 * had started or ended.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FullscreenLoaderProps extends React.ComponentProps<'div'> {
  /**
   * What is being waited on. Announced, so make it specific: "Loading session"
   * beats "Loading" on a page that has more than one reason to wait.
   */
  label?: string;
  /** Spinner size in pixels. */
  size?: number;
  className?: string;
}

function FullscreenLoader({
  label = 'Loading...',
  size = 40,
  className,
  ...props
}: FullscreenLoaderProps) {
  return (
    <div
      data-slot="fullscreen-loader"
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-screen w-full flex-col items-center justify-center gap-3',
        'bg-background text-foreground',
        className
      )}
      {...props}
    >
      <SpinnerGap
        data-slot="fullscreen-loader-spinner"
        size={size}
        aria-hidden="true"
        className="animate-spin"
      />
      <p data-slot="fullscreen-loader-label" className="text-sm text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export { FullscreenLoader };
