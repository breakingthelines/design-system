import { CaretLeft, CaretRight, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { cn } from '#/lib/utils';

interface FlipHoverControlProps {
  /** Current turn position (0-based). */
  position: number;
  /** Total turn positions. */
  positionCount: number;
  atStart: boolean;
  atEnd: boolean;
  isTurning: boolean;
  muted: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  className?: string;
}

/**
 * Hover-to-advance control for the page-flip.
 *
 * This deliberately REUSES the design language of the platform article-detail
 * "floating content bar" (`platform/app/components/floating-content-bar.tsx`,
 * mounted from `platform/app/components/article-detail.tsx:1116`): a centred
 * rounded-full pill, `bg-black/80` + `backdrop-blur-xl`, a hairline `white/10`
 * border, a circular progress ring in `--color-red-100`, Phosphor glyphs, and a
 * framer-motion spring entrance — so the affordance feels native to the BTL
 * reading surface the user already knows.
 *
 * Where the article bar surfaces on scroll, here it surfaces on **hover** (and
 * on keyboard focus), and its actions advance the magazine: a back caret, a
 * progress ring + folio count, a forward caret, and a persistent mute toggle.
 * Drag-to-peel, tap, and arrow keys remain the primary controls; this is the
 * hover affordance on top.
 */
export function FlipHoverControl({
  position,
  positionCount,
  atStart,
  atEnd,
  isTurning,
  muted,
  onPrev,
  onNext,
  onToggleMute,
  className,
}: FlipHoverControlProps) {
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Reveal on hover over the lower band of the flip region (the bar's home), or
  // whenever a control inside has keyboard focus. Pointer tracking lives on the
  // parent so the hot-zone is the whole surface, not just the pill.
  useEffect(() => {
    const host = wrapRef.current?.parentElement;
    if (!host) return;
    const onMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const y = e.clientY - rect.top;
      // Lower ~38% of the surface arms the bar; leaving the surface hides it.
      setHovering(y > rect.height * 0.62);
    };
    const onLeave = () => setHovering(false);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    return () => {
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const visible = hovering || focusWithin;
  const total = Math.max(positionCount, 1);
  const progress = total <= 1 ? 100 : Math.round((position / (total - 1)) * 100);

  return (
    <div
      ref={wrapRef}
      data-page-flip-exclude="true"
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false);
      }}
      // The wrapper itself is inert; the pill captures pointer events.
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onPointerEnter={() => setHovering(true)}
            className={cn(
              'pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 pb-[env(safe-area-inset-bottom)]',
              className
            )}
          >
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/80 px-3 py-2 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={onPrev}
                disabled={atStart || isTurning}
                aria-label="Previous page"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:text-red-100 disabled:cursor-default disabled:opacity-30 disabled:hover:text-white/70"
              >
                <CaretLeft size={18} weight="bold" />
              </button>

              <div className="flex items-center gap-2">
                <ProgressRing progress={progress} />
                <span className="font-content text-[11px] whitespace-nowrap text-white/50 tabular-nums">
                  {position + 1} / {total}
                </span>
              </div>

              <button
                type="button"
                onClick={onNext}
                disabled={atEnd || isTurning}
                aria-label="Next page"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:text-red-100 disabled:cursor-default disabled:opacity-30 disabled:hover:text-white/70"
              >
                <CaretRight size={18} weight="bold" />
              </button>

              <div className="h-4 w-px bg-white/10" />

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Unmute page-turn sound' : 'Mute page-turn sound'}
                aria-pressed={muted}
                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-white/40 transition-colors hover:text-white"
              >
                {muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Circular reading-progress ring — same construction as the article-detail
 * floating bar's ring (red-100 stroke over a faint track, 500ms ease-out).
 */
function ProgressRing({ progress, size = 28 }: { progress: number; size?: number }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-red-100)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  );
}
