'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, XCircle, Warning, Info } from '@phosphor-icons/react';
import { cva } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import type { Toast as ToastType, ToastVariant } from './types';

const toastVariants = cva(
  [
    'relative flex items-start gap-3 w-full max-w-sm p-3',
    'bg-card border border-border rounded-btl-sm shadow-lg',
    'text-card-foreground',
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        success: 'border-cursor-mint/30',
        error: 'border-destructive/30',
        warning: 'border-cursor-gold/30',
        info: 'border-cursor-sky/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle weight="fill" className="size-5 text-cursor-mint" />,
  error: <XCircle weight="fill" className="size-5 text-destructive" />,
  warning: <Warning weight="fill" className="size-5 text-cursor-gold" />,
  info: <Info weight="fill" className="size-5 text-cursor-sky" />,
};

export interface ToastProps extends ToastType {
  onDismiss: (id: string) => void;
}

export function Toast({
  id,
  variant = 'default',
  title,
  description,
  icon,
  duration = 5000,
  dismissible = true,
  action,
  onDismiss,
}: ToastProps) {
  const timerRef = React.useRef<NodeJS.Timeout>();
  const [isPaused, setIsPaused] = React.useState(false);

  // Auto-dismiss timer
  React.useEffect(() => {
    if (duration === Infinity || isPaused) return;

    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, isPaused, onDismiss]);

  const displayIcon = icon ?? iconMap[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={motionTokens.spring.snappy}
      data-slot="toast"
      data-variant={variant}
      className={cn(toastVariants({ variant }))}
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {displayIcon && <div className="shrink-0 mt-0.5">{displayIcon}</div>}

      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium leading-tight">{title}</p>}
        {description && (
          <p className={cn('text-xs text-muted-foreground leading-relaxed', title && 'mt-1')}>
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => onDismiss(id)}
          className="shrink-0 -mr-1 -mt-0.5 p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <X weight="bold" className="size-3.5" />
        </button>
      )}
    </motion.div>
  );
}
