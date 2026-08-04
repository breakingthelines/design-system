/* ────────────────────────────────────────────────────────────
 * Typeahead placement — pure, DOM-free
 *
 * Where the @mention menu opens relative to the caret. Extracted from the
 * plugin and kept free of React and the DOM so the load-bearing rule — "flip
 * above when there is no room below, clamp when there is room on neither
 * side" — is unit tested directly rather than eyeballed in a browser. Same
 * discipline as `sheet-drag.ts`.
 *
 * ─── Coordinate space ───
 *
 * Everything is expressed against Lexical's anchor box (the `#typeahead-menu`
 * div it appends to `document.body`), because that box is the menu's offset
 * parent and so the menu tracks it for free as the caret moves.
 *
 * Lexical pins that box to the CARET, not to the menu: it sets the box's
 * inline `height` to the caret rect's height and its `top` to the caret's
 * bottom plus a small fixed offset. So `anchorHeight` here is the caret's line
 * height, and the caret line occupies roughly
 *
 *     [anchorTop - anchorHeight, anchorTop]
 *
 * in viewport coordinates. That is the band a flipped menu has to clear, and
 * it is why `anchorHeight` — a value that looks like it should be the menu's
 * size — is the right input for the ABOVE placement.
 *
 * Lexical's own fixed offset between the caret's bottom and the anchor's top
 * (3px at the time of writing) is deliberately NOT modelled. Absorbing it
 * would couple this module to a private constant for a 3px gain; ignoring it
 * costs a 3px asymmetry (the flipped menu sits ~3px tighter to the caret than
 * the downward one) and, if Lexical ever changes the constant, costs a few px
 * of gap and never a wrong placement.
 * ──────────────────────────────────────────────────────────── */

/** Which side of the caret the menu opens on. */
export type TypeaheadPlacement = 'below' | 'above';

export interface TypeaheadMeasurements {
  /** Viewport-relative top edge of Lexical's anchor box. */
  anchorTop: number;
  /** Height of that box — the CARET's line height, not the menu's. See above. */
  anchorHeight: number;
  /**
   * The menu's natural height, measured with any previous clamp lifted. Must
   * be the unclamped height, otherwise a clamp applied at a tight caret
   * position latches and the menu can never grow back.
   */
  menuHeight: number;
  /** `window.innerHeight`. */
  viewportHeight: number;
  /** Gap to leave between the caret line and the menu's near edge. */
  gap: number;
  /** Breathing room to leave against the viewport edge. */
  margin: number;
}

export interface TypeaheadPlacementResult {
  placement: TypeaheadPlacement;
  /** The menu's `top`, in px, relative to the anchor box's top edge. */
  offsetTop: number;
  /**
   * Inline `max-height` in px, or `null` to leave the stylesheet's own cap in
   * charge. Non-null only when the menu had to be clamped to fit the viewport,
   * in which case the menu scrolls internally.
   */
  maxHeight: number | null;
}

/** Bottom edge of the caret line, in viewport coordinates. */
function caretBottom(m: TypeaheadMeasurements): number {
  return m.anchorTop;
}

/** Top edge of the caret line, in viewport coordinates. */
function caretTop(m: TypeaheadMeasurements): number {
  return m.anchorTop - m.anchorHeight;
}

/** Room for the menu below the caret, after gap and viewport margin. */
export function spaceBelowCaret(m: TypeaheadMeasurements): number {
  return m.viewportHeight - m.margin - (caretBottom(m) + m.gap);
}

/** Room for the menu above the caret, after gap and viewport margin. */
export function spaceAboveCaret(m: TypeaheadMeasurements): number {
  return caretTop(m) - m.gap - m.margin;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * Decide where the typeahead menu opens.
 *
 * Order of preference:
 *
 *  1. Below the caret, if the menu fits there. The default, and what a
 *     typeahead should do whenever it can — the eye is already below the
 *     caret and a flip is a surprise.
 *  2. Above the caret, if it fits there instead. This is the case the bottom
 *     sheet surfaces hit: a composer parked on the viewport floor has a few
 *     px below the caret and most of the screen above it.
 *  3. Neither side fits: open on the roomier side and CLAMP to that room, so
 *     the menu scrolls internally. Chosen over honouring a side preference
 *     and overflowing, because a clamped menu is entirely reachable — every
 *     option can be scrolled to and clicked — whereas an overflowing one puts
 *     options past the viewport edge where they cannot be clicked at all,
 *     and, inside a Sheet (which locks page scroll), cannot be scrolled to
 *     either. A tie goes below, keeping the unsurprising default.
 *
 * A final clamp then forces the resulting box inside the viewport regardless
 * of what the caret did. That matters because the caret can be OUTSIDE the
 * viewport — resize a short window with the composer scrolled below the fold
 * and the anchor lands past the bottom edge, at which point "room above the
 * caret" overstates the room actually on screen. Observed at 390x240: caret
 * at y=293 in a 240px viewport, menu still 27.5px off the bottom. Clamping
 * the box is what makes the "menu is always fully on screen" property hold
 * unconditionally rather than only while the caret is visible.
 */
export function decideTypeaheadPlacement(m: TypeaheadMeasurements): TypeaheadPlacementResult {
  const roomBelow = spaceBelowCaret(m);
  const roomAbove = spaceAboveCaret(m);
  const roomInViewport = Math.max(m.viewportHeight - 2 * m.margin, 0);

  let placement: TypeaheadPlacement;
  let height: number;
  let clamped: boolean;

  if (m.menuHeight <= roomBelow) {
    placement = 'below';
    height = m.menuHeight;
    clamped = false;
  } else if (m.menuHeight <= roomAbove) {
    placement = 'above';
    height = m.menuHeight;
    clamped = false;
  } else if (roomBelow >= roomAbove) {
    placement = 'below';
    height = Math.max(roomBelow, 0);
    clamped = true;
  } else {
    placement = 'above';
    height = Math.max(roomAbove, 0);
    clamped = true;
  }

  // A viewport shorter than the menu's own room budget caps it regardless.
  if (height > roomInViewport) {
    height = roomInViewport;
    clamped = true;
  }

  const preferredTop =
    placement === 'below' ? caretBottom(m) + m.gap : caretTop(m) - m.gap - height;

  // Keep the whole box on screen. `Math.max` on the upper bound keeps the
  // range non-empty when the viewport cannot even hold the margins.
  const lowestTop = Math.max(m.viewportHeight - m.margin - height, m.margin);
  const top = clamp(preferredTop, m.margin, lowestTop);

  return {
    placement,
    offsetTop: top - m.anchorTop,
    maxHeight: clamped ? height : null,
  };
}
