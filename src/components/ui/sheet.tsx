'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { X } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { createDragToDismissController } from './sheet-drag';
import {
  deriveSheetViewportOffset,
  sameSheetViewportOffset,
  type SheetViewportOffset,
} from './sheet-viewport';

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
 * Keyboard / visual-viewport tracking
 * ──────────────────────────────────────────────────────────── */

/**
 * Tracks how much of the layout viewport's bottom edge is currently hidden —
 * in practice, the on-screen keyboard — and returns what the bottom sheet
 * should override while that is true, or `null` when it should be left alone.
 *
 * The arithmetic (and the reason it is right on both iOS and Android without
 * branching on either) lives in `sheet-viewport.ts`. This hook is only the
 * subscription: read the two viewports together, on every event that can move
 * either of them.
 *
 *  - `visualViewport`'s `resize` is the keyboard opening and closing.
 *  - `visualViewport`'s `scroll` is iOS panning the visual viewport to reveal
 *    a focused field, which changes `offsetTop` without changing `height`.
 *  - `window`'s `resize` is rotation, and it is also the belt-and-braces for
 *    a browser that updates `innerHeight` on a later tick than
 *    `visualViewport.height`: if the two ever disagree momentarily, the
 *    second event settles it rather than leaving the sheet mispositioned.
 *
 * All three are attached only while `enabled`, and removed the moment it goes
 * false — so a closed sheet, or a sheet that isn't a bottom sheet, runs
 * nothing at all.
 *
 * `enabled` deliberately does NOT include a breakpoint. What this corrects for
 * is an occlusion, and a viewport with no on-screen keyboard does not report
 * one: `visualViewport.height` equals `innerHeight`, `offsetTop` is zero, the
 * residual is zero, and this returns `null` without a width ever being
 * consulted. Gating on the reading rather than on the width is what makes the
 * correction right on a tablet, whose keyboard is real and whose viewport is
 * above `sm`, without a tablet-shaped branch — and it leaves desktop inert by
 * arithmetic instead of by assumption.
 */
function useSheetViewportOffset(enabled: boolean): SheetViewportOffset | null {
  const [offset, setOffset] = React.useState<SheetViewportOffset | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setOffset(null);
      return;
    }

    // No `visualViewport` at all means no way to know, and nothing to do:
    // the sheet keeps the geometry it has always had.
    const viewport = typeof window === 'undefined' ? null : window.visualViewport;
    if (!viewport) return;

    const read = () => {
      const next = deriveSheetViewportOffset({
        layoutHeight: window.innerHeight,
        visualHeight: viewport.height,
        visualOffsetTop: viewport.offsetTop,
      });
      setOffset((prev) => (sameSheetViewportOffset(prev, next) ? prev : next));
    };

    read();
    viewport.addEventListener('resize', read);
    viewport.addEventListener('scroll', read);
    window.addEventListener('resize', read);
    return () => {
      viewport.removeEventListener('resize', read);
      viewport.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [enabled]);

  return offset;
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

  // Every open bottom sheet tracks the viewport, at every width. The reading
  // is what decides whether anything is written — see `useSheetViewportOffset`
  // for why that is the right gate and a breakpoint is not.
  const viewportOffset = useSheetViewportOffset(open && isBottom);

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

  // `undefined` — not an object of resting values — whenever nothing is
  // occluded, so the panel carries no inline style at all and the stylesheet
  // is left to speak for itself.
  //
  // `--sheet-body-pb` drops the safe-area term while the keyboard is up.
  // `env(safe-area-inset-bottom)` reserves room for the home indicator, and
  // iOS keeps reporting it once the keyboard covers the indicator entirely —
  // so leaving it in adds ~34px of dead space at the bottom of the body at
  // exactly the moment vertical room is scarcest.
  //
  // Both variants' properties are written together and the media query picks
  // one. Nothing here measures the width: the flush pair is dead weight at
  // `sm` and the floating pair is dead weight below it, and a property nobody
  // reads costs nothing — whereas asking JS which variant is live would put a
  // second, laggier copy of the breakpoint next to the stylesheet's.
  const sheetStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (!viewportOffset) return undefined;
    return {
      '--sheet-keyboard-inset': `${viewportOffset.insetPx}px`,
      '--sheet-max-height': `${viewportOffset.maxHeightPx}px`,
      '--sheet-floating-keyboard-inset': `${viewportOffset.floatingInsetPx}px`,
      '--sheet-floating-max-height': `${viewportOffset.floatingMaxHeightPx}px`,
      '--sheet-body-pb': '1.25rem',
    } as React.CSSProperties;
  }, [viewportOffset]);

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
                    // Both of these read a custom property that is only ever
                    // SET while the keyboard is up (see `sheetStyle` below).
                    // Unset, each falls back to the value it has always had,
                    // so the resting sheet is byte-identical to before — the
                    // property is the whole mechanism for making the
                    // correction exactly reversible.
                    'inset-x-0 bottom-[var(--sheet-keyboard-inset,0px)] mx-auto w-full',
                    'max-h-[var(--sheet-max-height,90dvh)] overflow-hidden rounded-t-2xl',
                    // At `sm` and up the sheet is a floating card, so it reads
                    // the FLOATING pair — same mechanism, different resting
                    // value in the fallback. Unset, these are character-for-
                    // character the `bottom-6` and `min(90dvh,720px)` they
                    // replace, so a resting card at this width is unchanged;
                    // set, they already carry the 24px gap and the 720px
                    // ceiling composed in (see `sheet-viewport.ts`), which is
                    // why neither number is repeated in a `calc()` here.
                    'sm:bottom-[var(--sheet-floating-keyboard-inset,1.5rem)]',
                    'sm:max-h-[var(--sheet-floating-max-height,min(90dvh,720px))]',
                    'sm:max-w-lg sm:rounded-2xl'
                  )
                : cn('top-0 h-full', side === 'right' ? 'right-0' : 'left-0', widthClass),
              className
            )}
            style={sheetStyle}
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
                        'overscroll-y-contain',
                        'pb-[var(--sheet-body-pb,calc(env(safe-area-inset-bottom)+1.25rem))]',
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
