import { describe, expect, it, vi } from 'vitest';

import {
  canArmDismissDrag,
  createDragToDismissController,
  type DragPointerEvent,
} from '../sheet-drag';

function point(clientY: number, timeStamp: number, pointerId = 1): DragPointerEvent {
  return { clientY, timeStamp, pointerId };
}

describe('canArmDismissDrag', () => {
  it('is armable at the top of the scroll container', () => {
    expect(canArmDismissDrag(0)).toBe(true);
  });

  it('is armable when there is no scrollable body at all', () => {
    expect(canArmDismissDrag(undefined)).toBe(true);
    expect(canArmDismissDrag(null)).toBe(true);
  });

  it('is not armable when the body has scroll remaining', () => {
    expect(canArmDismissDrag(1)).toBe(false);
    expect(canArmDismissDrag(320)).toBe(false);
  });
});

describe('createDragToDismissController — the load-bearing gesture-arbitration rule', () => {
  it('does not fire while the body has scroll remaining, even for a large fast downward drag', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 40, // scrolled down — native scroll must win
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(400, 20)); // 300px in 20ms — would easily clear both thresholds
    controller.onPointerUp(point(400, 20));

    // Never armed: no drag offsets reported, no end-of-gesture callback at all.
    expect(onDrag).not.toHaveBeenCalled();
    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('does fire from the top, once the release crosses the distance threshold', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0, // scrolled to the top — dismiss-drag may arm
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(260, 300)); // 160px, well past the 120px default threshold
    controller.onPointerUp(point(260, 300));

    expect(onDrag).toHaveBeenCalledWith(160);
    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: true });
  });

  it('does fire from the top on a fast flick even when the distance is small (velocity gate)', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0,
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(140, 10)); // 40px in 10ms = 4px/ms, well past 0.5px/ms
    controller.onPointerUp(point(140, 10));

    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: true });
  });

  it('snaps back (does not dismiss) from the top for a small, slow drag under both thresholds', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0,
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(130, 400)); // 30px over 400ms — small and slow
    controller.onPointerUp(point(130, 400));

    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: false });
    // Offset resets to 0 so the caller can spring the panel back into place.
    expect(onDrag).toHaveBeenLastCalledWith(0);
  });

  it('ignores upward movement (clamps the reported offset at 0)', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0,
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(200, 0));
    controller.onPointerMove(point(120, 50)); // moved up
    controller.onPointerUp(point(120, 50));

    expect(onDrag).toHaveBeenCalledWith(0);
    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: false });
  });

  it('ignores events from a second pointer while a gesture is already active', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0,
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0, 1));
    controller.onPointerMove(point(400, 10, 2)); // different pointerId
    controller.onPointerUp(point(400, 10, 2));

    expect(onDragEnd).not.toHaveBeenCalled();
  });

  it('always arms from a handle/affordance regardless of body scroll position', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 500, // body is scrolled deep into the thread
      onDrag,
      onDragEnd,
      alwaysArm: true, // e.g. the sheet's grab handle, not part of the body
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(260, 300));
    controller.onPointerUp(point(260, 300));

    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: true });
  });

  it('treats pointercancel as a non-dismissing end of the gesture', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const controller = createDragToDismissController({
      getScrollTop: () => 0,
      onDrag,
      onDragEnd,
    });

    controller.onPointerDown(point(100, 0));
    controller.onPointerMove(point(300, 300)); // would have dismissed on pointerup
    controller.onPointerCancel(point(300, 300));

    expect(onDragEnd).toHaveBeenCalledWith({ dismissed: false });
  });
});
