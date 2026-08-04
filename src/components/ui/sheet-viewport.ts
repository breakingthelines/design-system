/**
 * Pure, DOM-free viewport arithmetic for the bottom `Sheet`.
 *
 * Split out of `sheet.tsx` for the same reason `sheet-drag.ts` is: the
 * design-system "unit" vitest project runs in a node environment with no DOM,
 * so the only way to get real assertions on this logic is to express it as
 * plain functions over a plain metrics struct. The React hook that feeds it
 * live numbers stays in `sheet.tsx`.
 *
 * ## The problem
 *
 * A bottom sheet is `position: fixed; bottom: 0`, which anchors it to the
 * LAYOUT viewport. The on-screen keyboard does not shrink the layout viewport
 * on iOS — only the VISUAL viewport, the part of the layout viewport the user
 * can actually see. `dvh` doesn't help: it tracks browser chrome, not the
 * keyboard. So the sheet stays exactly where it was and the keyboard is drawn
 * on top of it, which is what the owner reported on the lineup player picker.
 *
 * ## The derivation
 *
 * Rather than trying to measure "the keyboard", measure what actually matters:
 * the strip at the bottom of the layout viewport that the user cannot see.
 *
 *     occluded = layoutHeight - visualHeight - visualOffsetTop
 *
 * All three terms are in the layout viewport's coordinate system —
 * `visualOffsetTop` is by definition the visual viewport's offset from the
 * layout viewport's top edge — so the result is the exact distance from the
 * bottom edge of what the user can see to the bottom edge of where `bottom: 0`
 * puts things. Lift the sheet by that and its bottom edge lands on the bottom
 * edge of the visible area.
 *
 * Two things fall out of measuring the residual rather than the keyboard:
 *
 *  1. **It cannot double-compensate.** Where the browser already handled the
 *     keyboard by shrinking the layout viewport (Chrome on Android's default
 *     `interactive-widget=resizes-content`), `layoutHeight` shrinks in
 *     lockstep with `visualHeight`, the residual is zero, and this returns
 *     zero — no correction, because none is owed. Where the browser does not
 *     (iOS, and `interactive-widget=resizes-visual`), the residual IS the
 *     keyboard. No platform sniffing, no user-agent branch: the same
 *     expression is right on both. Neither platform nor studio sets
 *     `interactive-widget` at all (`app/routes/__root.tsx` in each ships a
 *     bare `width=device-width, initial-scale=1`), so both get their
 *     browser's default, and both defaults are handled.
 *
 *     The one case this cannot serve is `interactive-widget=overlays-content`,
 *     where neither viewport moves and the browser deliberately reports
 *     nothing. No app here opts into it.
 *
 *  2. **Panning is already in it.** iOS pans the visual viewport to reveal a
 *     focused field, which moves `visualOffsetTop` off zero without the
 *     keyboard changing size. Subtracting it keeps the answer correct while
 *     that pan is in effect, instead of over-lifting by the pan distance.
 *
 * ## The noise floor
 *
 * `layoutHeight` and `visualHeight` are independently rounded and routinely
 * disagree by a fraction of a pixel with no keyboard anywhere, and browser
 * chrome can transiently widen that. Acting on those would drift the sheet by
 * a pixel or two every time a viewport event fired. Anything under
 * {@link MIN_TRACKED_INSET_PX} is therefore treated as no occlusion at all,
 * which is what guarantees the sheet returns to byte-identical geometry when
 * the keyboard closes. The floor sits well under the smallest real occluder
 * (an iPad hardware-keyboard accessory bar, ~55px) and well over the noise.
 */

/**
 * One reading of both viewports, taken at the same instant.
 *
 * In the browser these are `window.innerHeight`, `window.visualViewport.height`
 * and `window.visualViewport.offsetTop`. Nothing here touches `window`.
 */
export interface ViewportMetrics {
  /** The layout viewport's height in CSS px — what `bottom: 0` is measured against. */
  layoutHeight: number;
  /** The visual viewport's height in CSS px — what the user can actually see. */
  visualHeight: number;
  /** The visual viewport's offset from the layout viewport's top edge, in CSS px. */
  visualOffsetTop: number;
}

/** What the bottom sheet should override while part of it would be occluded. */
export interface SheetViewportOffset {
  /** px to raise the sheet's `bottom` by, so its bottom edge sits on the visible edge. */
  insetPx: number;
  /** px cap on the sheet's height, so raising it cannot push its top off-screen. */
  maxHeightPx: number;
}

/**
 * Occlusion below this is noise, not a keyboard. See the file header — this is
 * what makes closing the keyboard restore the sheet's exact original geometry.
 */
export const MIN_TRACKED_INSET_PX = 20;

/**
 * The share of the visible viewport a raised sheet may occupy. Deliberately
 * the same 90% the resting sheet takes of the dynamic viewport (`max-h-[90dvh]`
 * in `sheet.tsx`), so the keyboard changes what the sheet is measured against,
 * not how much of it the sheet takes.
 */
export const SHEET_VISIBLE_HEIGHT_RATIO = 0.9;

/**
 * The height of the strip at the bottom of the layout viewport that the user
 * cannot see, in whole CSS px. `0` means nothing is occluded, or the reading
 * is unusable.
 */
export function deriveBottomOcclusion(metrics: ViewportMetrics | null | undefined): number {
  if (!metrics) return 0;

  const { layoutHeight, visualHeight, visualOffsetTop } = metrics;
  if (
    !Number.isFinite(layoutHeight) ||
    !Number.isFinite(visualHeight) ||
    !Number.isFinite(visualOffsetTop)
  ) {
    return 0;
  }
  // A zero/negative height is a viewport that isn't laid out yet (a hidden
  // tab, a detached iframe). There is nothing to correct against.
  if (layoutHeight <= 0 || visualHeight <= 0) return 0;

  const occluded = layoutHeight - visualHeight - visualOffsetTop;
  if (occluded < MIN_TRACKED_INSET_PX) return 0;

  return Math.round(occluded);
}

/**
 * The full override for a bottom sheet at a given viewport reading, or `null`
 * when the sheet should be left exactly as its stylesheet has it.
 *
 * `null` is load-bearing: it is the caller's signal to emit NO inline style at
 * all, rather than an inline style that happens to equal the resting value.
 * That is what makes an open/close keyboard cycle exactly reversible.
 */
export function deriveSheetViewportOffset(
  metrics: ViewportMetrics | null | undefined
): SheetViewportOffset | null {
  const insetPx = deriveBottomOcclusion(metrics);
  if (insetPx === 0 || !metrics) return null;

  return {
    insetPx,
    maxHeightPx: Math.round(metrics.visualHeight * SHEET_VISIBLE_HEIGHT_RATIO),
  };
}

/**
 * Value equality for two offsets. The hook holds the last offset in state and
 * viewport events fire in bursts; without this, every `scroll` on the visual
 * viewport would re-render the sheet with an identical object.
 */
export function sameSheetViewportOffset(
  a: SheetViewportOffset | null,
  b: SheetViewportOffset | null
): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return a.insetPx === b.insetPx && a.maxHeightPx === b.maxHeightPx;
}
