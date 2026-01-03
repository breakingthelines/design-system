'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';

const statusDotVariants = cva('relative inline-flex shrink-0 rounded-full', {
  variants: {
    size: {
      sm: 'size-1.5',
      default: 'size-2',
      lg: 'size-2.5',
    },
    variant: {
      success: 'bg-cursor-mint',
      warning: 'bg-cursor-gold',
      error: 'bg-destructive',
      info: 'bg-cursor-sky',
      neutral: 'bg-muted-foreground',
    },
    pulse: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'neutral',
    pulse: false,
  },
});

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusDotVariants> {}

function StatusDot({ className, size, variant, pulse, style, ...props }: StatusDotProps) {
  // Map variant to pulse color CSS variable
  const pulseColorMap: Record<string, string> = {
    success: 'var(--color-cursor-mint)',
    warning: 'var(--color-cursor-gold)',
    error: 'var(--color-destructive)',
    info: 'var(--color-cursor-sky)',
    neutral: 'var(--color-muted-foreground)',
  };

  const pulseColor = variant ? pulseColorMap[variant] : pulseColorMap.neutral;

  return (
    <span
      data-slot="status-dot"
      data-variant={variant}
      data-pulse={pulse}
      className={cn(statusDotVariants({ size, variant, pulse }), className)}
      style={pulse ? ({ ...style, '--pulse-color': pulseColor } as React.CSSProperties) : style}
      {...props}
    >
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-pulse-ring',
            statusDotVariants({ variant })
          )}
        />
      )}
    </span>
  );
}

export { StatusDot, statusDotVariants };
