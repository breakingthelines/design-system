'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

type ProgressTone = 'neutral' | 'success' | 'warn' | 'destructive';

const toneFill: Record<ProgressTone, string> = {
  neutral: 'bg-white/60',
  success: 'bg-[var(--color-status-done)]',
  warn: 'bg-[var(--color-status-progress)]',
  destructive: 'bg-[var(--color-status-todo)]',
};

interface ProgressProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  completed: number;
  total: number;
  tone?: ProgressTone;
  showLabel?: boolean;
  size?: 'default' | 'sm';
}

function Progress({
  completed,
  total,
  tone = 'neutral',
  showLabel = false,
  size = 'default',
  className,
  ...props
}: ProgressProps) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.max(0, Math.min(completed, safeTotal));
  const ratio = safeTotal === 0 ? 0 : safeCompleted / safeTotal;
  const pct = Math.round(ratio * 100);
  const empty = safeTotal === 0;

  return (
    <div
      data-slot="progress"
      data-tone={tone}
      data-empty={empty || undefined}
      data-size={size}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeTotal || 1}
        aria-valuenow={safeCompleted}
        aria-valuetext={empty ? 'No subtasks yet' : `${safeCompleted} of ${safeTotal} complete`}
        className={cn(
          'relative flex-1 overflow-hidden rounded-full bg-white/10',
          size === 'default' ? 'h-1.5' : 'h-1'
        )}
      >
        {!empty && (
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out',
              toneFill[tone]
            )}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-muted-foreground text-[11px] font-medium tabular-nums whitespace-nowrap">
          {empty ? '—' : `${safeCompleted}/${safeTotal}`}
        </span>
      )}
    </div>
  );
}

export { Progress, type ProgressProps, type ProgressTone };
