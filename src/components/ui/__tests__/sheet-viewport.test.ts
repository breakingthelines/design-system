import { describe, expect, it } from 'vitest';

import {
  deriveBottomOcclusion,
  deriveSheetViewportOffset,
  sameSheetViewportOffset,
  MIN_TRACKED_INSET_PX,
  SHEET_VISIBLE_HEIGHT_RATIO,
  type ViewportMetrics,
} from '../sheet-viewport';

/**
 * Reference device: iPhone 14, 390x844 CSS px, whose on-screen keyboard with
 * the predictive bar is 336px tall. Every "keyboard up" reading below is that
 * device unless stated otherwise.
 */
const LAYOUT_H = 844;
const KEYBOARD_H = 336;
const VISIBLE_H = LAYOUT_H - KEYBOARD_H; // 508

function metrics(layoutHeight: number, visualHeight: number, visualOffsetTop = 0): ViewportMetrics {
  return { layoutHeight, visualHeight, visualOffsetTop };
}

describe('deriveBottomOcclusion — iOS, where the layout viewport never moves', () => {
  it('is the keyboard height when only the visual viewport shrank', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H))).toBe(KEYBOARD_H);
  });

  it('is zero at rest', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, LAYOUT_H))).toBe(0);
  });

  it('returns to exactly zero when the keyboard closes, however many cycles', () => {
    for (let i = 0; i < 5; i++) {
      expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H))).toBe(KEYBOARD_H);
      expect(deriveBottomOcclusion(metrics(LAYOUT_H, LAYOUT_H))).toBe(0);
    }
  });
});

describe('deriveBottomOcclusion — Android, where the browser already compensated', () => {
  /**
   * Chrome on Android defaults to `interactive-widget=resizes-content`: the
   * keyboard shrinks the LAYOUT viewport, so `bottom: 0` is already above the
   * keyboard and any lift on top of that would push the sheet up twice. The
   * residual is what protects against that, and it is zero here by
   * construction — the same expression, no platform branch.
   */
  it('is zero when the layout viewport shrank with the visual viewport', () => {
    expect(deriveBottomOcclusion(metrics(VISIBLE_H, VISIBLE_H))).toBe(0);
  });

  it('is zero across a sweep of keyboard heights, not just one', () => {
    for (const keyboard of [180, 220, 260, 300, 336, 400]) {
      const shrunk = LAYOUT_H - keyboard;
      expect(deriveBottomOcclusion(metrics(shrunk, shrunk))).toBe(0);
    }
  });
});

describe('deriveBottomOcclusion — the visual viewport panned off the top edge', () => {
  /**
   * iOS pans the visual viewport to bring a focused field into view, which
   * moves `offsetTop` without resizing anything. The strip below the visible
   * area is smaller by exactly the pan, so the lift has to be too — this is
   * the term a naive `innerHeight - height` drops, and the sheet would
   * over-lift by the pan distance without it.
   */
  it('subtracts the pan from the lift', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H, 100))).toBe(KEYBOARD_H - 100);
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H, 300))).toBe(KEYBOARD_H - 300);
  });

  it('is zero once the pan has already brought the visible area to the bottom edge', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H, KEYBOARD_H))).toBe(0);
  });

  it('never goes negative when the pan overshoots', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, VISIBLE_H, KEYBOARD_H + 200))).toBe(0);
  });
});

describe('deriveBottomOcclusion — the noise floor', () => {
  it('ignores sub-pixel disagreement between the two viewports', () => {
    expect(deriveBottomOcclusion(metrics(844, 843.5))).toBe(0);
    expect(deriveBottomOcclusion(metrics(844, 843.0001))).toBe(0);
  });

  it('ignores anything below the floor and acts on anything at or above it', () => {
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, LAYOUT_H - (MIN_TRACKED_INSET_PX - 1)))).toBe(0);
    expect(deriveBottomOcclusion(metrics(LAYOUT_H, LAYOUT_H - MIN_TRACKED_INSET_PX))).toBe(
      MIN_TRACKED_INSET_PX
    );
  });

  it('still catches an iPad hardware-keyboard accessory bar', () => {
    // ~55px, well above the floor and a real occluder worth correcting for.
    expect(deriveBottomOcclusion(metrics(1180, 1125))).toBe(55);
  });

  it('reports whole pixels', () => {
    expect(deriveBottomOcclusion(metrics(844, 507.6))).toBe(336);
    expect(Number.isInteger(deriveBottomOcclusion(metrics(844.4, 507.6)))).toBe(true);
  });
});

describe('deriveBottomOcclusion — unusable readings', () => {
  it('is zero for a missing reading', () => {
    expect(deriveBottomOcclusion(null)).toBe(0);
    expect(deriveBottomOcclusion(undefined)).toBe(0);
  });

  it('is zero for a viewport that is not laid out', () => {
    expect(deriveBottomOcclusion(metrics(0, 0))).toBe(0);
    expect(deriveBottomOcclusion(metrics(844, 0))).toBe(0);
    expect(deriveBottomOcclusion(metrics(-844, 508))).toBe(0);
  });

  it('is zero for non-finite numbers rather than propagating NaN into a style', () => {
    expect(deriveBottomOcclusion(metrics(NaN, 508))).toBe(0);
    expect(deriveBottomOcclusion(metrics(844, NaN))).toBe(0);
    expect(deriveBottomOcclusion(metrics(844, 508, NaN))).toBe(0);
    expect(deriveBottomOcclusion(metrics(Infinity, 508))).toBe(0);
  });
});

describe('deriveSheetViewportOffset', () => {
  it('emits nothing at all at rest, so the sheet keeps its stylesheet geometry', () => {
    expect(deriveSheetViewportOffset(metrics(LAYOUT_H, LAYOUT_H))).toBeNull();
  });

  it('emits nothing on Android, where the browser already compensated', () => {
    expect(deriveSheetViewportOffset(metrics(VISIBLE_H, VISIBLE_H))).toBeNull();
  });

  it('lifts by the occlusion and caps against the VISIBLE viewport, not the layout one', () => {
    expect(deriveSheetViewportOffset(metrics(LAYOUT_H, VISIBLE_H))).toEqual({
      insetPx: KEYBOARD_H,
      maxHeightPx: Math.round(VISIBLE_H * SHEET_VISIBLE_HEIGHT_RATIO),
    });
  });

  it('keeps the same 90% share the resting sheet takes', () => {
    const offset = deriveSheetViewportOffset(metrics(LAYOUT_H, VISIBLE_H));
    expect(offset?.maxHeightPx).toBe(457); // 508 * 0.9
  });

  it('is exactly reversible across repeated keyboard cycles', () => {
    const up = deriveSheetViewportOffset(metrics(LAYOUT_H, VISIBLE_H));
    for (let i = 0; i < 5; i++) {
      expect(deriveSheetViewportOffset(metrics(LAYOUT_H, LAYOUT_H))).toBeNull();
      expect(deriveSheetViewportOffset(metrics(LAYOUT_H, VISIBLE_H))).toEqual(up);
    }
  });
});

describe('deriveSheetViewportOffset — the invariant that makes the lift safe', () => {
  /**
   * Lifting a sheet without capping its height pushes its TOP off the screen.
   * These two must hold together at every reading: the raised sheet's top edge
   * stays inside the layout viewport, and inside the visible area.
   */
  it('never pushes the sheet top past either edge, across a sweep', () => {
    for (const layoutHeight of [568, 667, 844, 926, 1180]) {
      for (const visualHeight of [180, 240, 320, 420, 508, 640, layoutHeight]) {
        if (visualHeight > layoutHeight) continue;
        for (const offsetTop of [0, 40, 120, layoutHeight - visualHeight]) {
          const reading = metrics(layoutHeight, visualHeight, offsetTop);
          const offset = deriveSheetViewportOffset(reading);
          if (!offset) continue;

          const topEdge = layoutHeight - offset.insetPx - offset.maxHeightPx;
          expect(topEdge).toBeGreaterThanOrEqual(0);
          expect(topEdge).toBeGreaterThanOrEqual(offsetTop - 1); // 1px of rounding slack
        }
      }
    }
  });
});

describe('sameSheetViewportOffset', () => {
  it('treats two null readings as unchanged, so a resting sheet never re-renders', () => {
    expect(sameSheetViewportOffset(null, null)).toBe(true);
  });

  it('treats equal values as unchanged, so a burst of scroll events is one render', () => {
    expect(
      sameSheetViewportOffset(
        { insetPx: 336, maxHeightPx: 457 },
        { insetPx: 336, maxHeightPx: 457 }
      )
    ).toBe(true);
  });

  it('treats any difference as changed', () => {
    expect(
      sameSheetViewportOffset(
        { insetPx: 336, maxHeightPx: 457 },
        { insetPx: 300, maxHeightPx: 457 }
      )
    ).toBe(false);
    expect(
      sameSheetViewportOffset(
        { insetPx: 336, maxHeightPx: 457 },
        { insetPx: 336, maxHeightPx: 400 }
      )
    ).toBe(false);
    expect(sameSheetViewportOffset({ insetPx: 336, maxHeightPx: 457 }, null)).toBe(false);
    expect(sameSheetViewportOffset(null, { insetPx: 336, maxHeightPx: 457 })).toBe(false);
  });
});
