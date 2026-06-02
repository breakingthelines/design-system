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

  /**
   * Pointer handlers to spread onto the flip ROOT (which wraps the live page
   * DOM). They use deferred capture — a press only arms a peel and takes no
   * pointer capture, so a real click falls through to the page control beneath;
   * capture is taken only once the gesture escalates to a drag.
   */
  pointerHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };

  /**
   * Abandon an in-flight peel without turning the page, releasing pointer
   * capture if one had been taken. With deferred capture a press that never
   * escalates holds no capture and starts no turn, so this is a no-op for a
   * plain click — letting it reach the page control beneath. Exposed for hosts
   * that need to force-cancel a gesture (e.g. on an external navigation).
   */
  cancelDrag(e: React.PointerEvent): void;

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

  const [index, setIndexState] = useState(() => clampIndex(initialIndex, pageCount));
  const [direction, setDirection] = useState<FlipDirection>('forward');
  const [progress, setProgress] = useState(0);
  const [target, setTargetState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTurning, setIsTurning] = useState(false);
  const [releaseVelocity, setReleaseVelocity] = useState(0);

  // `index` and `target` are also mirrored into refs so settle/commit can read
  // the live value WITHOUT a functional state updater. Calling a setter (or the
  // consumer's `onIndexChange`) from inside another setter's updater runs it
  // during React's render phase — a "setState while rendering" violation that,
  // in a production build (no warning), drops/reorders the commit and wedges the
  // turn (isTurning stuck true, pointer-events never restored, index never
  // advancing). Reads go through the ref; writes update ref + state together.
  const indexRef = useRef(index);
  const setIndex = useCallback((next: number) => {
    indexRef.current = next;
    setIndexState(next);
  }, []);
  const targetRef = useRef(target);
  const setTarget = useCallback((next: number) => {
    targetRef.current = next;
    setTargetState(next);
  }, []);

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
    /**
     * Deferred-capture gate. A pointer-down only *arms* a potential peel; it does
     * NOT capture the pointer or start a turn. We escalate to a real, captured
     * drag only once the pointer travels past {@link TAP_THRESHOLD_PX}. Until
     * then the gesture is still a candidate *click*, so the press passes straight
     * through to the live page control beneath (a real coordinate click reaches
     * the page's own buttons). `escalated` flips true at that point; a release
     * before escalation is a plain click we leave entirely to the DOM.
     */
    escalated: boolean;
  } | null>(null);

  const commitIndex = useCallback(
    (dir: FlipDirection) => {
      const current = indexRef.current;
      const nextIdx = clampIndex(dir === 'forward' ? current + 1 : current - 1, pageCount);
      if (nextIdx === current) return;
      setIndex(nextIdx);
      onIndexChange?.(nextIdx, dir);
    },
    [pageCount, onIndexChange, setIndex]
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
    [canGo, isTurning, setTarget]
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
    [index, pageCount, onIndexChange, setIndex, setTarget]
  );

  // settle: turn arrived at target. If it completed (target 1), advance the
  // index and reset progress to 0 for the new page-pair. Runs from the
  // renderer's spring `onRest` / a settle effect — never render — so every
  // setter here (and the `onIndexChange` inside `commitIndex`) is a plain
  // event-time update, not a setState-in-render. The committed target is read
  // from `targetRef`, so we don't need a functional updater (which WOULD run in
  // render) to see it.
  const settle = useCallback(() => {
    const committed = targetRef.current >= 1;
    setIsTurning(false);
    setProgress(0);
    setTarget(0);
    if (committed) commitIndex(direction);
  }, [direction, commitIndex, setTarget]);

  // ── Pointer: drag-to-peel (deferred capture) ─────────────────────────────
  // A press only *arms* a peel — it does NOT capture the pointer or begin a
  // turn. This is what lets a real coordinate click fall through to the live
  // page control beneath (the at-rest page owns the hit-test). We escalate to a
  // captured 1:1 drag only once the pointer crosses the tap threshold; see
  // `escalate` below. These handlers are spread onto the flip ROOT (which wraps
  // the live page DOM), so a peel can start anywhere — including the binding
  // edges and corners — without an always-on overlay stealing clicks.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    // NOTE: no setPointerCapture / no setIsDragging here — capturing on the
    // press would redirect the ensuing `click` to the flip chrome and the page
    // button would never fire. We defer both to `escalate()`.
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
      escalated: false,
    };
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

      // Dead-zone: under the tap threshold this is still a *candidate click*. We
      // neither capture nor start a turn, so the press stays click-through to
      // the page control beneath; we only track velocity for a flick from rest.
      if (!d.escalated && d.moved < TAP_THRESHOLD_PX) {
        const dt0 = Math.max(e.timeStamp - d.lastT, 1);
        d.velocity = (e.clientX - d.lastX) / effWidth / dt0;
        d.lastX = e.clientX;
        d.lastT = e.timeStamp;
        return;
      }

      // First crossing of the threshold → escalate to a real, captured peel.
      // Capture now (not on the press) so the rest of the gesture is delivered
      // 1:1 even if it strays off the surface, while a pure click never captured.
      if (!d.escalated) {
        d.escalated = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(d.pointerId);
        setIsDragging(true);
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
    [canGo, dragWidthFactor, setTarget]
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;

      // Never escalated to a peel → this was a plain click/tap. The press already
      // passed through to whatever lives at the point (a page control fires its
      // own handler). We MUST NOT also turn the page when the user clicked an
      // interactive control, or a Continue/CTA click would double as a flip. Tap
      // -to-advance survives only on *non-interactive* page area, preserving the
      // "tap a half to turn" affordance without stealing control clicks.
      if (!d.escalated) {
        const hitInteractive = isInteractiveAtPoint(e.clientX, e.clientY);
        if (!hitInteractive && d.moved < TAP_THRESHOLD_PX) {
          const rect = e.currentTarget.getBoundingClientRect();
          const hitForward = e.clientX - rect.left > rect.width / 2;
          const dir: FlipDirection = hitForward ? 'forward' : 'backward';
          if (canGo(dir)) beginTurn(dir);
        }
        // No capture was taken on a non-escalated gesture, so nothing to release
        // and no in-flight curl to reset.
        return;
      }

      setIsDragging(false);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(d.pointerId);

      // A captured peel that never passed the threshold mid-move (defensive): if
      // somehow escalated with negligible travel, just reset without turning.
      if (d.moved < TAP_THRESHOLD_PX) {
        setProgress(0);
        setTarget(0);
        setIsTurning(false);
        return;
      }

      // Drag release: commit if past the midpoint OR flicked hard enough.
      const dir = d.dir;
      // Speed of the flick toward the travel direction (≥0). The renderer maps
      // this to spring stiffness: a fast fling snaps; a slow drag eases.
      const towardVel = dir === 'forward' ? Math.max(0, -d.velocity) : Math.max(0, d.velocity);
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
    [progress, canGo, beginTurn, setTarget]
  );

  // Abandon an in-progress (or just-armed) gesture WITHOUT turning the page, and
  // release pointer capture if a peel had escalated. With deferred capture a
  // press alone takes no capture and starts no turn, so for an un-escalated
  // gesture this is effectively a no-op beyond clearing the arm — exactly what
  // lets a real click reach the page control beneath.
  const cancelDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (d.escalated) {
        setIsDragging(false);
        setProgress(0);
        setTarget(0);
        setIsTurning(false);
        (e.currentTarget as HTMLElement).releasePointerCapture?.(d.pointerId);
      }
    },
    [setTarget]
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
    cancelDrag,
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

/** Selector matching the elements a tap should defer to (never flip over). */
const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, [role="button"], [role="tab"], [role="option"], [role="link"], [role="menuitem"], [role="switch"], [role="checkbox"], [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

/**
 * Does the topmost element at this viewport point belong to an interactive page
 * control? A tap there must NOT also turn the page — the control owns the click.
 * Flip chrome (`[data-page-flip-exclude]`) is skipped so it never counts as the
 * hit. Used only on a non-escalated release, so it runs at most once per click.
 */
function isInteractiveAtPoint(clientX: number, clientY: number): boolean {
  if (typeof document === 'undefined') return false;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest('[data-page-flip-exclude]')) continue; // ignore flip chrome
    return !!el.closest(INTERACTIVE_SELECTOR);
  }
  return false;
}
