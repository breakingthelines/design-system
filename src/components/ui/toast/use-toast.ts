'use client';

import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useToastContext } from './toast-context';
import type { ToastInput, ToastVariant } from './types';

interface UseToastReturn {
  toast: (input: ToastInput) => string;
  success: (description: string, title?: string) => string;
  error: (description: string, title?: string) => string;
  warning: (description: string, title?: string) => string;
  info: (description: string, title?: string) => string;
  custom: (input: Omit<ToastInput, 'variant'> & { icon: ReactNode }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export function useToast(): UseToastReturn {
  const { addToast, removeToast, clearToasts } = useToastContext();

  const createVariantToast = useCallback(
    (variant: ToastVariant) =>
      (description: string, title?: string): string =>
        addToast({ variant, description, title }),
    [addToast]
  );

  return {
    toast: addToast,
    success: createVariantToast('success'),
    error: createVariantToast('error'),
    warning: createVariantToast('warning'),
    info: createVariantToast('info'),
    custom: (input) => addToast({ ...input, variant: 'default' }),
    dismiss: removeToast,
    clear: clearToasts,
  };
}
