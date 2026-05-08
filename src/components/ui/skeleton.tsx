'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * Skeleton — a refined loading placeholder with a glossy shimmer sweep.
 *
 * Pure CSS — no framer-motion dependency, renders on the server.
 * The dual-band gradient (primary highlight 4% + secondary 2%) reads as a
 * glossy surface catching light rather than a generic loading bar.
 * ───────────────────────────────────────────────────────────────────────────── */

const skeletonVariants = cva(
  [
    'bg-white/[0.06]',
    // Dual-band shimmer gradient — soft highlight + faint secondary
    'bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.04)_37%,rgba(255,255,255,0.07)_50%,rgba(255,255,255,0.04)_63%,transparent_75%)]',
    'bg-[length:200%_100%]',
    'animate-[skeleton-shimmer_2s_ease-in-out_infinite]',
  ],
  {
    variants: {
      variant: {
        rect: 'rounded',
        circle: 'rounded-full aspect-square',
        text: 'h-3.5 w-full rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'rect',
    },
  }
);

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant — defaults to 'rect' */
  variant?: 'rect' | 'circle' | 'text';
}

function Skeleton({ variant = 'rect', className, style, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant }), className)}
      style={style}
      {...props}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * SkeletonGroup — multi-line text block convenience.
 *
 * Renders `lines` text-variant Skeletons in a spaced container.
 * Each line gets staggered animationDelay for a cascading shimmer sweep.
 * Last line is shorter for realistic paragraph ragging.
 * ───────────────────────────────────────────────────────────────────────────── */

interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  lastLineWidth?: string;
}

function SkeletonGroup({
  lines = 3,
  lastLineWidth = '60%',
  className,
  ...props
}: SkeletonGroupProps) {
  return (
    <div className={cn('space-y-2.5', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{
            animationDelay: `${i * 80}ms`,
            width: i === lines - 1 ? lastLineWidth : undefined,
          }}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonGroup, skeletonVariants };
export type { SkeletonProps, SkeletonGroupProps };
