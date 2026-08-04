import { describe, expect, it } from 'vitest';

import {
  decideTypeaheadPlacement,
  spaceAboveCaret,
  spaceBelowCaret,
  type TypeaheadMeasurements,
} from './typeahead-placement';

const GAP = 6;
const MARGIN = 8;

/**
 * A caret on a 20px line, in a 780px-tall viewport, with a 6px gap and an 8px
 * viewport margin — the geometry of the real composer. `anchorTop` is the only
 * thing most cases vary, since it is what moves as the composer moves down the
 * screen.
 */
function measure(overrides: Partial<TypeaheadMeasurements> = {}): TypeaheadMeasurements {
  return {
    anchorTop: 300,
    anchorHeight: 20,
    menuHeight: 226,
    viewportHeight: 780,
    gap: GAP,
    margin: MARGIN,
    ...overrides,
  };
}

describe('space helpers', () => {
  it('measures the room below the caret, net of gap and viewport margin', () => {
    // 780 - (300 + 6) - 8
    expect(spaceBelowCaret(measure())).toBe(466);
  });

  it('measures the room above the caret, net of the caret line, gap and margin', () => {
    // 300 - 20 - 6 - 8
    expect(spaceAboveCaret(measure())).toBe(266);
  });
});

describe('decideTypeaheadPlacement — room below', () => {
  it('opens below when the menu fits below', () => {
    const result = decideTypeaheadPlacement(measure({ anchorTop: 300 }));
    expect(result.placement).toBe('below');
    expect(result.offsetTop).toBe(GAP);
    expect(result.maxHeight).toBeNull();
  });

  it('opens below with no clamp even when there is far more room above', () => {
    // 700px of viewport above, and still 300px below — below wins, because a
    // flip the user did not need is a surprise.
    const result = decideTypeaheadPlacement(
      measure({ anchorTop: 440, menuHeight: 100, viewportHeight: 780 })
    );
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBeNull();
  });

  it('opens below when the caret is at the very top and there is no room above at all', () => {
    const result = decideTypeaheadPlacement(measure({ anchorTop: 20, menuHeight: 226 }));
    expect(spaceAboveCaret(measure({ anchorTop: 20 }))).toBeLessThan(0);
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBeNull();
  });
});

describe('decideTypeaheadPlacement — the exactly-fits boundaries', () => {
  it('opens below when the menu is exactly the room below', () => {
    const m = measure({ anchorTop: 300 });
    const result = decideTypeaheadPlacement({ ...m, menuHeight: spaceBelowCaret(m) });
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBeNull();
  });

  it('flips one px past exactly-fits below, when above can take it', () => {
    // Caret low enough that above is the roomier side (566px vs 166px), so
    // one px too many below is enough to send the menu over the top.
    const m = measure({ anchorTop: 600 });
    expect(spaceAboveCaret(m)).toBeGreaterThan(spaceBelowCaret(m));

    const fits = decideTypeaheadPlacement({ ...m, menuHeight: spaceBelowCaret(m) });
    expect(fits.placement).toBe('below');

    const result = decideTypeaheadPlacement({ ...m, menuHeight: spaceBelowCaret(m) + 1 });
    expect(result.placement).toBe('above');
    expect(result.maxHeight).toBeNull();
  });

  it('clamps below rather than flipping when below is still the roomier side', () => {
    // Caret above the midpoint: the menu no longer fits below, but there is
    // even less room above, so flipping would be strictly worse. Clamp.
    const m = measure({ anchorTop: 300 });
    expect(spaceBelowCaret(m)).toBeGreaterThan(spaceAboveCaret(m));

    const result = decideTypeaheadPlacement({ ...m, menuHeight: spaceBelowCaret(m) + 1 });
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBe(spaceBelowCaret(m));
  });

  it('opens above unclamped when the menu is exactly the room above', () => {
    // Room below deliberately too small, room above exactly enough.
    const m = measure({ anchorTop: 700 });
    const result = decideTypeaheadPlacement({ ...m, menuHeight: spaceAboveCaret(m) });
    expect(result.placement).toBe('above');
    expect(result.maxHeight).toBeNull();
  });

  it('clamps one px past exactly-fits above', () => {
    const m = measure({ anchorTop: 700 });
    const menuHeight = spaceAboveCaret(m) + 1;
    const result = decideTypeaheadPlacement({ ...m, menuHeight });
    expect(result.placement).toBe('above');
    expect(result.maxHeight).toBe(spaceAboveCaret(m));
  });
});

describe('decideTypeaheadPlacement — no room below', () => {
  // The bug this module exists for: a composer parked on the viewport floor.
  // Anchor top 716, caret line 19.5, menu 226, viewport 780 — the exact
  // numbers measured in a bottom sheet at 390x780.
  const floored = measure({ anchorTop: 716, anchorHeight: 19.5, menuHeight: 226 });

  it('flips above rather than overflowing off the bottom of the viewport', () => {
    expect(decideTypeaheadPlacement(floored).placement).toBe('above');
  });

  it('does not clamp, because the whole menu fits above', () => {
    expect(decideTypeaheadPlacement(floored).maxHeight).toBeNull();
  });

  it('places the menu so its bottom edge clears the caret line by the gap', () => {
    const { offsetTop } = decideTypeaheadPlacement(floored);
    // Menu bottom, in anchor-relative terms, is offsetTop + menuHeight.
    expect(offsetTop + floored.menuHeight).toBe(-(floored.anchorHeight + GAP));
    // And in viewport terms it sits above the caret line's top.
    const menuBottomInViewport = floored.anchorTop + offsetTop + floored.menuHeight;
    expect(menuBottomInViewport).toBeLessThan(floored.anchorTop - floored.anchorHeight);
  });

  it('keeps the whole menu inside the viewport', () => {
    const { offsetTop, maxHeight } = decideTypeaheadPlacement(floored);
    const height = maxHeight ?? floored.menuHeight;
    const top = floored.anchorTop + offsetTop;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + height).toBeLessThanOrEqual(floored.viewportHeight);
  });
});

describe('decideTypeaheadPlacement — no room on either side', () => {
  it('clamps above when above is the roomier side', () => {
    // 420px viewport, caret at 300: 106px below, 266px above, menu 400 — too
    // tall for either side.
    const m = measure({ anchorTop: 300, viewportHeight: 420, menuHeight: 400 });
    const result = decideTypeaheadPlacement(m);
    expect(spaceBelowCaret(m)).toBeLessThan(m.menuHeight);
    expect(spaceAboveCaret(m)).toBeLessThan(m.menuHeight);
    expect(spaceAboveCaret(m)).toBeGreaterThan(spaceBelowCaret(m));
    expect(result.placement).toBe('above');
    expect(result.maxHeight).toBe(spaceAboveCaret(m));
  });

  it('flips above unclamped when only below is short — a 390x420 composer on the floor', () => {
    // The short-viewport case that still has a clean answer: 420px tall,
    // caret near the floor. Nothing fits below, everything fits above.
    const m = measure({ anchorTop: 356, anchorHeight: 19.5, viewportHeight: 420, menuHeight: 226 });
    const result = decideTypeaheadPlacement(m);
    expect(spaceBelowCaret(m)).toBeLessThan(m.menuHeight);
    expect(result.placement).toBe('above');
    expect(result.maxHeight).toBeNull();
  });

  it('clamps below when below is the roomier side', () => {
    // Caret near the top of a short viewport: little above, more below.
    const m = measure({ anchorTop: 120, viewportHeight: 420, menuHeight: 400 });
    const result = decideTypeaheadPlacement(m);
    expect(spaceBelowCaret(m)).toBeGreaterThan(spaceAboveCaret(m));
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBe(spaceBelowCaret(m));
    expect(result.offsetTop).toBe(GAP);
  });

  it('breaks a tie in favour of below, the unsurprising default', () => {
    // Pick an anchorTop where the two spaces are equal:
    //   H - (t + gap) - margin === t - h - gap - margin  =>  t = (H + h) / 2
    const anchorHeight = 20;
    const viewportHeight = 420;
    const anchorTop = (viewportHeight + anchorHeight) / 2;
    const m = measure({ anchorTop, anchorHeight, viewportHeight, menuHeight: 999 });
    expect(spaceBelowCaret(m)).toBe(spaceAboveCaret(m));
    expect(decideTypeaheadPlacement(m).placement).toBe('below');
  });

  it('keeps the clamped menu inside the viewport on both sides', () => {
    for (const anchorTop of [40, 120, 210, 300, 380]) {
      const m = measure({ anchorTop, viewportHeight: 420, menuHeight: 600 });
      const { offsetTop, maxHeight } = decideTypeaheadPlacement(m);
      const height = maxHeight ?? m.menuHeight;
      const top = m.anchorTop + offsetTop;
      expect(top).toBeGreaterThanOrEqual(0);
      expect(top + height).toBeLessThanOrEqual(m.viewportHeight);
    }
  });
});

describe('decideTypeaheadPlacement — the caret itself is off screen', () => {
  // Resize a short window with the composer scrolled below the fold and the
  // anchor lands past the viewport's bottom edge. "Room above the caret" then
  // overstates the room actually on screen. Observed at 390x240: caret at
  // y=293 in a 240px viewport.
  const offBottom = measure({ anchorTop: 293, anchorHeight: 19.5, viewportHeight: 240 });

  it('still keeps the whole menu inside the viewport', () => {
    const { offsetTop, maxHeight } = decideTypeaheadPlacement(offBottom);
    const height = maxHeight ?? offBottom.menuHeight;
    const top = offBottom.anchorTop + offsetTop;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + height).toBeLessThanOrEqual(offBottom.viewportHeight);
  });

  it('clamps the height rather than trusting the overstated room above', () => {
    const result = decideTypeaheadPlacement(offBottom);
    expect(result.maxHeight).not.toBeNull();
    expect(result.maxHeight).toBeLessThan(offBottom.menuHeight);
  });

  it('keeps the menu on screen when the caret is off the TOP edge too', () => {
    const m = measure({ anchorTop: -40, anchorHeight: 19.5, viewportHeight: 780 });
    const { offsetTop, maxHeight } = decideTypeaheadPlacement(m);
    const height = maxHeight ?? m.menuHeight;
    const top = m.anchorTop + offsetTop;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + height).toBeLessThanOrEqual(m.viewportHeight);
  });
});

describe('decideTypeaheadPlacement — degenerate geometry', () => {
  it('never returns a negative max-height when the viewport is shorter than the caret line', () => {
    const m = measure({ anchorTop: 4, anchorHeight: 20, viewportHeight: 10, menuHeight: 226 });
    const result = decideTypeaheadPlacement(m);
    expect(result.maxHeight).not.toBeNull();
    expect(result.maxHeight).toBeGreaterThanOrEqual(0);
  });

  it('never returns a negative max-height for a zero-height viewport', () => {
    const result = decideTypeaheadPlacement(measure({ viewportHeight: 0 }));
    expect(result.maxHeight).toBe(0);
  });

  it('handles an empty menu by opening below with no clamp', () => {
    const result = decideTypeaheadPlacement(measure({ menuHeight: 0 }));
    expect(result.placement).toBe('below');
    expect(result.maxHeight).toBeNull();
  });

  it('is unaffected by the caret moving horizontally — placement is vertical only', () => {
    const a = decideTypeaheadPlacement(measure({ anchorTop: 716, menuHeight: 226 }));
    const b = decideTypeaheadPlacement(measure({ anchorTop: 716, menuHeight: 226 }));
    expect(a).toEqual(b);
  });
});

describe('decideTypeaheadPlacement — sweep', () => {
  it('never places any part of the menu outside the viewport, at any caret position', () => {
    for (const viewportHeight of [240, 420, 780, 900]) {
      for (const menuHeight of [40, 100, 226, 288, 700]) {
        // Deliberately swept PAST both viewport edges: the caret can end up
        // off screen, and the menu still may not.
        for (let anchorTop = -60; anchorTop <= viewportHeight + 120; anchorTop += 10) {
          const m = measure({ anchorTop, viewportHeight, menuHeight });
          const { offsetTop, maxHeight } = decideTypeaheadPlacement(m);
          const height = maxHeight ?? m.menuHeight;
          const top = m.anchorTop + offsetTop;
          expect(
            top,
            `top at anchorTop=${anchorTop} vh=${viewportHeight} mh=${menuHeight}`
          ).toBeGreaterThanOrEqual(0);
          expect(
            top + height,
            `bottom at anchorTop=${anchorTop} vh=${viewportHeight} mh=${menuHeight}`
          ).toBeLessThanOrEqual(viewportHeight);
        }
      }
    }
  });

  it('never overlaps the caret line, at any caret position', () => {
    for (const anchorTop of [0, 50, 200, 400, 600, 760]) {
      const m = measure({ anchorTop, menuHeight: 226 });
      const { placement, offsetTop, maxHeight } = decideTypeaheadPlacement(m);
      const height = maxHeight ?? m.menuHeight;
      const top = m.anchorTop + offsetTop;
      const caretTop = m.anchorTop - m.anchorHeight;
      if (placement === 'above') {
        expect(top + height).toBeLessThanOrEqual(caretTop);
      } else {
        expect(top).toBeGreaterThanOrEqual(m.anchorTop);
      }
    }
  });
});
