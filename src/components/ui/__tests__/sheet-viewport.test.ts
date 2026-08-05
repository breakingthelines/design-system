import { describe, expect, it } from 'vitest';

import {
  deriveBottomOcclusion,
  deriveSheetViewportOffset,
  sameSheetViewportOffset,
  MIN_TRACKED_INSET_PX,
  SHEET_FLOATING_BOTTOM_GAP_PX,
  SHEET_FLOATING_MAX_HEIGHT_PX,
  SHEET_VISIBLE_HEIGHT_RATIO,
  type SheetViewportOffset,
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

/** A full offset from the two flush numbers, for the equality tests below. */
function sheetOffset(
  insetPx: number,
  maxHeightPx: number,
  overrides: Partial<SheetViewportOffset> = {}
): SheetViewportOffset {
  return {
    insetPx,
    maxHeightPx,
    floatingInsetPx: insetPx + SHEET_FLOATING_BOTTOM_GAP_PX,
    floatingMaxHeightPx: maxHeightPx,
    ...overrides,
  };
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
    expect(deriveSheetViewportOffset(metrics(LAYOUT_H, VISIBLE_H))).toEqual(
      sheetOffset(KEYBOARD_H, Math.round(VISIBLE_H * SHEET_VISIBLE_HEIGHT_RATIO))
    );
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
    expect(sameSheetViewportOffset(sheetOffset(336, 457), sheetOffset(336, 457))).toBe(true);
  });

  it('treats any difference as changed', () => {
    expect(sameSheetViewportOffset(sheetOffset(336, 457), sheetOffset(300, 457))).toBe(false);
    expect(sameSheetViewportOffset(sheetOffset(336, 457), sheetOffset(336, 400))).toBe(false);
    expect(sameSheetViewportOffset(sheetOffset(336, 457), null)).toBe(false);
    expect(sameSheetViewportOffset(null, sheetOffset(336, 457))).toBe(false);
  });

  /**
   * The floating pair is compared too. It is not redundant with the flush
   * pair: `floatingMaxHeightPx` has two ceilings the flush one does not, so a
   * reading can move the floating card's height while leaving the flush
   * numbers identical. Comparing only the flush pair would drop that render
   * and pin the card at a stale height.
   */
  it('treats a floating-only difference as changed', () => {
    expect(
      sameSheetViewportOffset(
        sheetOffset(336, 457),
        sheetOffset(336, 457, { floatingInsetPx: 999 })
      )
    ).toBe(false);
    expect(
      sameSheetViewportOffset(
        sheetOffset(336, 457),
        sheetOffset(336, 457, { floatingMaxHeightPx: 400 })
      )
    ).toBe(false);
  });
});

/* ────────────────────────────────────────────────────────────
 * The floating (`sm` and up) variant
 *
 * The case the first cut of this fix missed. It gated on a phone-width media
 * query, reasoning that a keyboard implies a phone. A tablet has an on-screen
 * keyboard and a viewport above `sm`, so the bug survived there untouched.
 * ──────────────────────────────────────────────────────────── */

/** iPad Air 11", portrait, whose on-screen keyboard is ~398px with the shortcut bar. */
const TABLET_LAYOUT_H = 1180;
const TABLET_KEYBOARD_H = 398;
const TABLET_VISIBLE_H = TABLET_LAYOUT_H - TABLET_KEYBOARD_H; // 782

describe('deriveSheetViewportOffset — the floating variant composes with its resting gap', () => {
  it('keeps the card the same distance clear of the edge the user can see', () => {
    const result = deriveSheetViewportOffset(metrics(TABLET_LAYOUT_H, TABLET_VISIBLE_H));

    // The gap is preserved, not consumed: the card's bottom edge lands
    // SHEET_FLOATING_BOTTOM_GAP_PX above the visible bottom edge, exactly as
    // it lands that far above the screen's bottom edge at rest.
    expect(result?.floatingInsetPx).toBe(TABLET_KEYBOARD_H + SHEET_FLOATING_BOTTOM_GAP_PX);
    const bottomEdge = TABLET_LAYOUT_H - result!.floatingInsetPx;
    expect(TABLET_VISIBLE_H - bottomEdge).toBe(SHEET_FLOATING_BOTTOM_GAP_PX);
  });

  it('lifts the card by exactly the occlusion, gap and all', () => {
    const result = deriveSheetViewportOffset(metrics(TABLET_LAYOUT_H, TABLET_VISIBLE_H));
    const restingBottom = TABLET_LAYOUT_H - SHEET_FLOATING_BOTTOM_GAP_PX;
    const raisedBottom = TABLET_LAYOUT_H - result!.floatingInsetPx;
    expect(restingBottom - raisedBottom).toBe(TABLET_KEYBOARD_H);
  });

  it('takes the same 90% share of the visible viewport the flush variant takes', () => {
    const result = deriveSheetViewportOffset(metrics(TABLET_LAYOUT_H, TABLET_VISIBLE_H));
    expect(result?.floatingMaxHeightPx).toBe(704); // 782 * 0.9
    expect(result?.floatingMaxHeightPx).toBe(result?.maxHeightPx);
  });

  it('is still capped by the card ceiling on a viewport big enough to exceed it', () => {
    // iPad Pro 12.9" portrait with its keyboard up: 90% of what remains visible
    // is 851px, which would make the floating card taller than a card.
    const result = deriveSheetViewportOffset(metrics(1366, 946));
    expect(Math.round(946 * SHEET_VISIBLE_HEIGHT_RATIO)).toBeGreaterThan(
      SHEET_FLOATING_MAX_HEIGHT_PX
    );
    expect(result?.floatingMaxHeightPx).toBe(SHEET_FLOATING_MAX_HEIGHT_PX);
    // …while the flush variant, which has no such ceiling, is unaffected.
    expect(result?.maxHeightPx).toBe(851);
  });

  it('yields to the room actually left when the gap no longer fits', () => {
    // A phone in landscape is above `sm`, so it gets the floating card. 390px
    // tall with a ~215px keyboard leaves 175px visible: 90% of that is 158,
    // but only 151 fits above the 24px gap. The tighter number has to win, or
    // the card's header is pushed off the top of the visible area.
    const result = deriveSheetViewportOffset(metrics(390, 175));
    expect(result?.maxHeightPx).toBe(158);
    expect(result?.floatingMaxHeightPx).toBe(175 - SHEET_FLOATING_BOTTOM_GAP_PX);
  });

  it('never emits a negative height on a viewport shorter than the gap', () => {
    const result = deriveSheetViewportOffset(metrics(100, 20));
    expect(result?.floatingMaxHeightPx).toBeGreaterThanOrEqual(0);
  });
});

describe('deriveSheetViewportOffset — the floating variant stays inside the visible area', () => {
  /**
   * The floating counterpart of the flush invariant above, and the reason the
   * two ceilings exist. At every reading the raised card's top edge must sit
   * below the top of what the user can see, and its bottom edge above the
   * bottom of it — with the gap intact at both ends.
   */
  it('holds across a sweep of viewports, including short wide ones', () => {
    for (const layoutHeight of [390, 430, 568, 820, 1024, 1180, 1366]) {
      for (const visualHeight of [120, 175, 240, 400, 640, 782, 946, layoutHeight]) {
        if (visualHeight > layoutHeight) continue;
        for (const offsetTop of [0, 40, 120, layoutHeight - visualHeight]) {
          const result = deriveSheetViewportOffset(metrics(layoutHeight, visualHeight, offsetTop));
          if (!result) continue;

          const bottomEdge = layoutHeight - result.floatingInsetPx;
          const topEdge = bottomEdge - result.floatingMaxHeightPx;

          // Inside the visible slice, which runs from `offsetTop` to
          // `offsetTop + visualHeight`.
          expect(topEdge).toBeGreaterThanOrEqual(offsetTop - 1); // 1px rounding slack
          expect(bottomEdge).toBeLessThanOrEqual(offsetTop + visualHeight);
          expect(topEdge).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
