'use client';

import * as React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';

/* ────────────────────────────────────────────────────────────
 * Animation variants
 * ──────────────────────────────────────────────────────────── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const slideVariants: Record<'left' | 'right', Variants> = {
  right: {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
    exit: { x: '100%', transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  },
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0, transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
    exit: { x: '-100%', transition: { type: 'spring' as const, damping: 30, stiffness: 300 } },
  },
};

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

type SheetSide = 'left' | 'right';

interface SheetProps {
  /** Controls panel visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Which side the sheet slides from (default: right) */
  side?: SheetSide;
  /** Panel title shown in the header */
  title?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Width class override (default: w-full sm:w-[400px]) */
  widthClass?: string;
  /** Additional class names on the panel container */
  className?: string;
}

/* ────────────────────────────────────────────────────────────
 * Sheet
 * ──────────────────────────────────────────────────────────── */

function Sheet({
  open,
  onClose,
  side = 'right',
  title,
  children,
  widthClass = 'w-full sm:w-[400px]',
  className,
}: SheetProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className={cn(
              'fixed top-0 z-50 flex h-full flex-col bg-black',
              side === 'right' ? 'right-0' : 'left-0',
              widthClass,
              className
            )}
            variants={slideVariants[side]}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            {title && (
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <h2 className="text-sm font-semibold tracking-[-0.2px] text-white">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close"
                >
                  <X weight="bold" className="size-3.5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export { Sheet, type SheetProps, type SheetSide };
