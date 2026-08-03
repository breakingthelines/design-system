'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { X } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { createDragToDismissController } from './sheet-drag';

/* ────────────────────────────────────────────────────────────
 * Animation variants
 * ──────────────────────────────────────────────────────────── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SPRING_TRANSITION = { type: 'spring' as const, damping: 30, stiffness: 300 };
const REDUCED_TRANSITION = { duration: 0.01 };

function getSlideVariants(side: SheetSide, reducedMotion: boolean): Variants {
  const transition = reducedMotion ? REDUCED_TRANSITION : SPRING_TRANSITION;
  switch (side) {
    case 'right':
      return {
        hidden: { x: '100%' },
        visible: { x: 0, transition },
        exit: { x: '100%', transition },
      };
    case 'left':
      return {
        hidden: { x: '-100%' },
        visible: { x: 0, transition },
        exit: { x: '-100%', transition },
      };
    case 'bottom':
      return {
        hidden: { y: '100%' },
        visible: { y: 0, transition },
        exit: { y: '100%', transition },
      };
  }
}

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

type SheetSide = 'left' | 'right' | 'bottom';

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
  /** Width class override (default: w-full sm:w-[400px]). Ignored for `side="bottom"`. */
  widthClass?: string;
  /** Additional class names on the panel container */
  className?: string;
  /** Additional class names on the scrollable body wrapper */
  bodyClassName?: string;
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
  bodyClassName,
}: SheetProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const isBottom = side === 'bottom';

  const bodyRef = React.useRef<HTMLDivElement>(null);
  // The live drag-follow offset lives on its own inner element (see below),
  // deliberately separate from the `motion.aside`'s own enter/exit `y`
  // animation — both would otherwise fight over the same `transform`
  // channel, since framer-motion owns `transform` on any element it
  // animates via variants.
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isReleasing, setIsReleasing] = React.useState(false);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock the page's own scroll while the sheet is open. A near-full-height
  // bottom sheet still leaves a sliver of the page visible on purpose (for
  // context) — without this, that sliver is draggable and fights the sheet
  // for the gesture, the exact class of bug this component exists to avoid.
  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleDragEnd = React.useCallback(
    ({ dismissed }: { dismissed: boolean }) => {
      if (dismissed) {
        onClose();
        return;
      }
      setIsReleasing(true);
    },
    [onClose]
  );

  // Two independent controllers feed the same drag-follow offset: one gated
  // on the scrollable body's position (the load-bearing rule — a gesture
  // that starts where the body can still scroll up must lose to that
  // scroll, so `onPointerDown` there captures nothing), one always-armed
  // for the grab handle, which isn't part of the scrolling body and is
  // exempt from that rule. See `sheet-drag.ts` for the arbitration logic
  // and its unit tests.
  const bodyDragController = React.useMemo(
    () =>
      createDragToDismissController({
        getScrollTop: () => bodyRef.current?.scrollTop,
        onDrag: setDragOffset,
        onDragEnd: handleDragEnd,
      }),
    [handleDragEnd]
  );
  const handleDragController = React.useMemo(
    () =>
      createDragToDismissController({
        getScrollTop: () => 0,
        onDrag: setDragOffset,
        onDragEnd: handleDragEnd,
        alwaysArm: true,
      }),
    [handleDragEnd]
  );

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
            transition={reducedMotion ? REDUCED_TRANSITION : undefined}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className={cn(
              'fixed z-50 flex flex-col bg-black',
              isBottom
                ? cn(
                    'inset-x-0 bottom-0 mx-auto max-h-[90dvh] w-full overflow-hidden rounded-t-2xl',
                    'sm:bottom-6 sm:max-h-[min(90dvh,720px)] sm:max-w-lg sm:rounded-2xl'
                  )
                : cn('top-0 h-full', side === 'right' ? 'right-0' : 'left-0', widthClass),
              className
            )}
            variants={getSlideVariants(side, reducedMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Drag-follow wrapper — carries the live dismiss-drag offset,
                intentionally on its own `transform`, not the motion.aside
                above. */}
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                isReleasing && !reducedMotion && 'transition-transform duration-200 ease-out'
              )}
              style={{ transform: `translateY(${dragOffset}px)` }}
              onTransitionEnd={() => setIsReleasing(false)}
            >
              {isBottom && (
                <div
                  className="flex shrink-0 touch-none cursor-grab justify-center py-2.5 active:cursor-grabbing"
                  onPointerDown={(e) =>
                    handleDragController.onPointerDown({
                      clientY: e.clientY,
                      timeStamp: e.timeStamp,
                      pointerId: e.pointerId,
                    })
                  }
                  onPointerMove={(e) =>
                    handleDragController.onPointerMove({
                      clientY: e.clientY,
                      timeStamp: e.timeStamp,
                      pointerId: e.pointerId,
                    })
                  }
                  onPointerUp={(e) =>
                    handleDragController.onPointerUp({
                      clientY: e.clientY,
                      timeStamp: e.timeStamp,
                      pointerId: e.pointerId,
                    })
                  }
                  onPointerCancel={(e) =>
                    handleDragController.onPointerCancel({
                      clientY: e.clientY,
                      timeStamp: e.timeStamp,
                      pointerId: e.pointerId,
                    })
                  }
                  aria-hidden="true"
                >
                  <div className="h-1.5 w-10 rounded-full bg-white/20" />
                </div>
              )}

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
              <div
                ref={bodyRef}
                className={cn(
                  'min-h-0 flex-1 overflow-y-auto px-6 pt-5',
                  // `pb-5` and the safe-area variant both set padding-bottom —
                  // never apply both at once, since Tailwind's cascade order
                  // between two utilities touching the same property isn't
                  // something to rely on for correctness.
                  isBottom
                    ? cn(
                        'overscroll-y-contain pb-[calc(env(safe-area-inset-bottom)+1.25rem)]',
                        dragOffset > 0 && 'overflow-hidden'
                      )
                    : 'pb-5',
                  bodyClassName
                )}
                onPointerDown={
                  isBottom
                    ? (e) =>
                        bodyDragController.onPointerDown({
                          clientY: e.clientY,
                          timeStamp: e.timeStamp,
                          pointerId: e.pointerId,
                        })
                    : undefined
                }
                onPointerMove={
                  isBottom
                    ? (e) =>
                        bodyDragController.onPointerMove({
                          clientY: e.clientY,
                          timeStamp: e.timeStamp,
                          pointerId: e.pointerId,
                        })
                    : undefined
                }
                onPointerUp={
                  isBottom
                    ? (e) =>
                        bodyDragController.onPointerUp({
                          clientY: e.clientY,
                          timeStamp: e.timeStamp,
                          pointerId: e.pointerId,
                        })
                    : undefined
                }
                onPointerCancel={
                  isBottom
                    ? (e) =>
                        bodyDragController.onPointerCancel({
                          clientY: e.clientY,
                          timeStamp: e.timeStamp,
                          pointerId: e.pointerId,
                        })
                    : undefined
                }
              >
                {children}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export { Sheet, type SheetProps, type SheetSide };
