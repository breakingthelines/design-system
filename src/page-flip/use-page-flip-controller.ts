import { useCallback, useMemo, useRef, useState } from 'react';

/** Which page-pair edge a turn moves toward. */
export type FlipDirection = 'forward' | 'backward';

export interface PageFlipControllerOptions {
  /** Total number of pages. Turns clamp to [0, pageCount - 1]. */
  pageCount: number;
  /** Starting page index. */
  initialIndex?: number;
  /** Fired when a turn settles on a new page. */
  onIndexChange?: (index: number, direction: FlipDirection) => void;
  /**
   * Fraction of the container width the *curl region* spans, so a drag maps 1:1
   * to curl progress. `1` for a single page; `0.5` for a two-page spread (only
   * the right leaf curls, across half the width). Default `1`.
   */
  dragWidthFactor?: number;
}

export interface PageFlipController {
  /** The page currently shown / being turned away from. */
  index: number;
  /** True while a turn is animating (drag or programmatic). */
  isTurning: boolean;
  /**
   * Live turn progress 0→1. During a drag this is set directly from pointer
   * delta; on release it's the spring target. `direction` says which way.
   */
  progress: number;
  direction: FlipDirection;
  /** True while the user is actively dragging (pointer captured). */
  isDragging: boolean;

  /** Spring/lerp target the renderer animates `uProgress` toward. */
  target: number;

  /**
   * Magnitude of the pointer velocity at the last release (progress-units/ms,
   * always ≥ 0). The renderer reads this to pick a velocity-proportional spring
   * — a hard flick snaps in ~150ms, a slow drag eases at ~600ms. 0 for taps /
   * keyboard / programmatic turns (which use the default settle spring).
   */
  releaseVelocity: number;

  next(): void;
  prev(): void;
  goTo(index: number): void;

  /** Pointer handlers to spread onto the interaction surface. */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };

  /** Document-level key handler (ArrowLeft / ArrowRight). Wire via an effect. */
  onKeyDown(e: KeyboardEvent): void;

  /**
   * Drive `progress` directly. Used by the flat-mode cross-fade tween (which
   * has no useFrame loop) to animate the fade; the curl/skim renderers drive
   * their own progress via springs and don't need this.
   */
  setLiveProgress(value: number): void;

  /** Called by the renderer once a turn animation completes. */
  settle(): void;
}

/** Drag distance under this (px) counts as a tap, not a peel. */
const TAP_THRESHOLD_PX = 5;
/** Release past this fraction (or with enough velocity) completes the turn. */
const COMMIT_FRACTION = 0.5;
/** Velocity (progress units/ms) above which a flick commits regardless of position. */
const FLICK_VELOCITY = 0.0015;

/**
 * Headless interaction model for the page-flip: drag-to-peel with pointer
 * capture, tap-to-advance, keyboard, and release-momentum snapping. It owns
 * *intent* (target progress + index); the renderer owns the actual animation
 * (spring/lerp toward `target`) and calls {@link PageFlipController.settle}
 * when it arrives.
 */
export function usePageFlipController(options: PageFlipControllerOptions): PageFlipController {
  const { pageCount, initialIndex = 0, onIndexChange, dragWidthFactor = 1 } = options;

  const [index, setIndex] = useState(() => clampIndex(initialIndex, pageCount));
  const [direction, setDirection] = useState<FlipDirection>('forward');
  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTurning, setIsTurning] = useState(false);
  const [releaseVelocity, setReleaseVelocity] = useState(0);

  // Drag bookkeeping (refs — no re-render needed mid-gesture beyond progress).
  const drag = useRef<{
    startX: number;
    lastX: number;
    lastT: number;
    velocity: number;
    width: number;
    moved: number;
    dir: FlipDirection;
    /** Locked once the drag passes the dead-zone, so jitter near dx≈0 can't flip it. */
    dirLocked: boolean;
    pointerId: number;
  } | null>(null);

  const commitIndex = useCallback(
    (dir: FlipDirection) => {
      setIndex((i) => {
        const nextIdx = clampIndex(dir === 'forward' ? i + 1 : i - 1, pageCount);
        if (nextIdx !== i) onIndexChange?.(nextIdx, dir);
        return nextIdx;
      });
    },
    [pageCount, onIndexChange]
  );

  const canGo = useCallback(
    (dir: FlipDirection) => (dir === 'forward' ? index < pageCount - 1 : index > 0),
    [index, pageCount]
  );

  const beginTurn = useCallback(
    (dir: FlipDirection) => {
      if (!canGo(dir) || isTurning) return;
      setDirection(dir);
      setReleaseVelocity(0); // tap / keyboard / programmatic → default settle spring
      setIsTurning(true);
      setTarget(1);
    },
    [canGo, isTurning]
  );

  const next = useCallback(() => beginTurn('forward'), [beginTurn]);
  const prev = useCallback(() => beginTurn('backward'), [beginTurn]);

  const goTo = useCallback(
    (to: number) => {
      const clamped = clampIndex(to, pageCount);
      if (clamped === index) return;
      // For multi-page jumps the renderer uses skim mode; we just set the
      // index and let progress reset.
      setDirection(clamped > index ? 'forward' : 'backward');
      setIndex(clamped);
      onIndexChange?.(clamped, clamped > index ? 'forward' : 'backward');
      setProgress(0);
      setTarget(0);
      setReleaseVelocity(0);
    },
    [index, pageCount, onIndexChange]
  );

  // settle: turn arrived at target. If it completed (target 1), advance the
  // index and reset progress to 0 for the new page-pair.
  const settle = useCallback(() => {
    setIsTurning(false);
    setTarget((tgt) => {
      if (tgt >= 1) {
        commitIndex(direction);
        setProgress(0);
        return 0;
      }
      setProgress(0);
      return 0;
    });
  }, [direction, commitIndex]);

  // ── Pointer: drag-to-peel ────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    // Capture the pointer so the whole gesture is delivered here even if it
    // strays off the grip — the curl follows the finger 1:1 with no teleport.
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = {
      startX: e.clientX,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      width,
      moved: 0,
      dir: 'forward',
      dirLocked: false,
      pointerId: e.pointerId,
    };
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      d.moved = Math.max(d.moved, Math.abs(dx));

      // The curl region may be only part of the container (half, for a spread),
      // so progress + velocity are measured against that width for a true 1:1.
      const effWidth = Math.max(d.width * dragWidthFactor, 1);

      // Dead-zone: under the tap threshold we don't start a turn at all, so a
      // grab that doesn't move yet never flashes the curl or flips direction.
      if (!d.dirLocked && d.moved < TAP_THRESHOLD_PX) {
        // Keep tracking velocity so a fast flick from rest is still measured.
        const dt0 = Math.max(e.timeStamp - d.lastT, 1);
        d.velocity = (e.clientX - d.lastX) / effWidth / dt0;
        d.lastX = e.clientX;
        d.lastT = e.timeStamp;
        return;
      }

      // Drag left → turn forward (page peels from the right edge); drag right →
      // turn backward. Lock direction on the first committed move so jitter
      // around dx≈0 can't tear the texture pair mid-flip.
      if (!d.dirLocked) {
        d.dir = dx <= 0 ? 'forward' : 'backward';
        d.dirLocked = true;
      }
      const dir = d.dir;

      if (!canGo(dir)) {
        // Resist at the ends — let it peel a little then stop (rubber-band).
        setDirection(dir);
        setProgress((Math.abs(dx) / effWidth) * 0.15);
        return;
      }

      // Instantaneous velocity for flick detection.
      const dt = Math.max(e.timeStamp - d.lastT, 1);
      d.velocity = (e.clientX - d.lastX) / effWidth / dt;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;

      setDirection(dir);
      setIsTurning(true);
      // Map drag distance 1:1 to curl progress, measured along the locked
      // direction so a small wobble back doesn't unwind the whole turn.
      const along = dir === 'forward' ? -dx : dx;
      const p = clamp01(along / effWidth);
      setProgress(p);
      setTarget(p); // while dragging, target tracks the finger
    },
    [canGo, dragWidthFactor]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      setIsDragging(false);
      if (!d) return;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(d.pointerId);

      // Tap (negligible travel): advance/back depending on which half was hit.
      if (d.moved < TAP_THRESHOLD_PX) {
        const rect = e.currentTarget.getBoundingClientRect();
        const hitForward = e.clientX - rect.left > rect.width / 2;
        const dir: FlipDirection = hitForward ? 'forward' : 'backward';
        if (canGo(dir)) beginTurn(dir);
        else {
          setProgress(0);
          setTarget(0);
          setIsTurning(false);
        }
        return;
      }

      // Drag release: commit if past the midpoint OR flicked hard enough.
      const dir = d.dir;
      // Speed of the flick toward the travel direction (≥0). The renderer maps
      // this to spring stiffness: a fast fling snaps; a slow drag eases.
      const towardVel =
        dir === 'forward' ? Math.max(0, -d.velocity) : Math.max(0, d.velocity);
      setReleaseVelocity(towardVel);
      if (!canGo(dir)) {
        setTarget(0);
        return; // spring eases the resist-peel back
      }
      const flicked = towardVel > FLICK_VELOCITY;
      const commit = progress > COMMIT_FRACTION || flicked;
      setDirection(dir);
      setTarget(commit ? 1 : 0);
      setIsTurning(true);
    },
    [progress, canGo, beginTurn]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    },
    [next, prev]
  );

  const pointerHandlers = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    }),
    [onPointerDown, onPointerMove, endDrag]
  );

  return {
    index,
    isTurning,
    progress,
    direction,
    isDragging,
    target,
    releaseVelocity,
    next,
    prev,
    goTo,
    pointerHandlers,
    onKeyDown,
    setLiveProgress: setProgress,
    settle,
  };
}

function clampIndex(i: number, count: number): number {
  return Math.max(0, Math.min(i, Math.max(count - 1, 0)));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
