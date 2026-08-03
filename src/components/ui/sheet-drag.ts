/**
 * Pure, DOM-free drag-to-dismiss arbitration for the bottom `Sheet`.
 *
 * This is split out from `sheet.tsx` specifically so the gesture-arbitration
 * rule can be unit tested without a browser: the design-system "unit" vitest
 * project runs in a node environment with no DOM (see
 * `src/components/ui/__tests__/test-utils.ts`), so anything that needs
 * assertions on real pointer interactions has to be expressed as plain
 * functions/closures rather than DOM event listeners.
 *
 * The load-bearing rule: a drag gesture that starts over the sheet's
 * scrollable body may only arm into a dismiss-drag when that body has no
 * remaining upward scroll (`scrollTop <= 0`). If there is scroll remaining,
 * `onPointerDown` deliberately captures nothing, so the browser's native
 * scroll handles the gesture untouched — scroll wins, not dismiss. A
 * dedicated drag handle (not part of the scrollable body) is exempt from
 * this check via `alwaysArm`, matching every native bottom-sheet affordance.
 */

export interface DragPointerEvent {
  clientY: number;
  timeStamp: number;
  pointerId: number;
}

export interface DragEndResult {
  dismissed: boolean;
}

export interface DragToDismissOptions {
  /**
   * Reads the current `scrollTop` of the sheet's scrollable body at the
   * moment a pointer goes down. `null`/`undefined` (no scrollable body, or
   * content that doesn't overflow) is treated as "already at the top".
   */
  getScrollTop: () => number | null | undefined;
  /** Called with the live, clamped (>= 0) downward drag offset in px. */
  onDrag: (offsetPx: number) => void;
  /** Called exactly once per armed gesture, when it ends or is cancelled. */
  onDragEnd: (result: DragEndResult) => void;
  /** Distance past which a release counts as a dismiss, in px. */
  distanceThresholdPx?: number;
  /** Velocity past which a release counts as a dismiss, in px/ms. */
  velocityThresholdPxMs?: number;
  /**
   * Skip the scroll-position gate entirely — for drag surfaces that are not
   * part of the scrollable body (e.g. a grab handle in the sheet header).
   */
  alwaysArm?: boolean;
}

export interface DragToDismissController {
  onPointerDown: (event: DragPointerEvent) => void;
  onPointerMove: (event: DragPointerEvent) => void;
  onPointerUp: (event: DragPointerEvent) => void;
  onPointerCancel: (event: DragPointerEvent) => void;
}

export const DEFAULT_DISMISS_DISTANCE_PX = 120;
export const DEFAULT_DISMISS_VELOCITY_PX_MS = 0.5;

/** The single source of truth for the scroll-position gate described above. */
export function canArmDismissDrag(scrollTop: number | null | undefined): boolean {
  if (scrollTop == null) return true;
  return scrollTop <= 0;
}

export function createDragToDismissController(
  options: DragToDismissOptions
): DragToDismissController {
  const {
    getScrollTop,
    onDrag,
    onDragEnd,
    distanceThresholdPx = DEFAULT_DISMISS_DISTANCE_PX,
    velocityThresholdPxMs = DEFAULT_DISMISS_VELOCITY_PX_MS,
    alwaysArm = false,
  } = options;

  let armed = false;
  let activePointerId: number | null = null;
  let startY = 0;
  let startTime = 0;

  function endGesture(dismissed: boolean) {
    armed = false;
    activePointerId = null;
    onDrag(0);
    onDragEnd({ dismissed });
  }

  return {
    onPointerDown(event) {
      // The load-bearing gate. If the body can still scroll toward its top,
      // do nothing at all — no state is captured here, so a subsequent
      // pointermove is free to be handled as a native scroll instead.
      if (!alwaysArm && !canArmDismissDrag(getScrollTop())) return;
      armed = true;
      activePointerId = event.pointerId;
      startY = event.clientY;
      startTime = event.timeStamp;
      onDrag(0);
    },
    onPointerMove(event) {
      if (!armed || event.pointerId !== activePointerId) return;
      onDrag(Math.max(0, event.clientY - startY));
    },
    onPointerUp(event) {
      if (!armed || event.pointerId !== activePointerId) return;
      const offset = Math.max(0, event.clientY - startY);
      const elapsed = Math.max(1, event.timeStamp - startTime);
      const velocity = offset / elapsed;
      const dismissed = offset > distanceThresholdPx || velocity > velocityThresholdPxMs;
      endGesture(dismissed);
    },
    onPointerCancel(event) {
      if (!armed || event.pointerId !== activePointerId) return;
      endGesture(false);
    },
  };
}
