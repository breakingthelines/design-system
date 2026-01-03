'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';

import { cn } from '#/lib/utils';
import { useToastContext } from './toast-context';
import { Toast } from './toast';

export type ToasterPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

const positionClasses: Record<ToasterPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
};

export interface ToasterProps {
  /** Position of the toast container */
  position?: ToasterPosition;
  /** Maximum number of toasts to show at once */
  maxToasts?: number;
  /** Additional class names */
  className?: string;
}

export function Toaster({ position = 'bottom-center', maxToasts = 5, className }: ToasterProps) {
  const { toasts, removeToast } = useToastContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only show the most recent toasts
  const visibleToasts = toasts.slice(-maxToasts);

  if (!mounted) return null;

  return createPortal(
    <div
      data-slot="toaster"
      className={cn(
        'fixed z-[100] flex flex-col gap-2 pointer-events-none',
        positionClasses[position],
        className
      )}
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
