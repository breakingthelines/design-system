import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import preview from '#.storybook/preview';
import { Sheet } from './sheet';
import { Button } from './button';
import { Input } from './input';
import {
  MIN_TRACKED_INSET_PX,
  SHEET_FLOATING_BOTTOM_GAP_PX,
  SHEET_FLOATING_MAX_HEIGHT_PX,
  SHEET_VISIBLE_HEIGHT_RATIO,
} from './sheet-viewport';

const meta = preview.meta({
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

/* ────────────────────────────────────────────────────────────
 * Test doubles for the on-screen keyboard
 *
 * A headless browser cannot be made to raise a real keyboard, so the two
 * stories below drive the thing the keyboard actually moves — the visual
 * viewport — and then MEASURE the sheet. Nothing here asserts on a class
 * name: every check is a `getBoundingClientRect()` against a number derived
 * independently of the component.
 * ──────────────────────────────────────────────────────────── */

/** An iPhone 14's keyboard with the predictive bar, in CSS px. */
const KEYBOARD_PX = 336;

/**
 * An iPad Air 11" in portrait, and its on-screen keyboard with the shortcut
 * bar. The point of the size is that 820 is comfortably above `sm` (640), so
 * the sheet under test is genuinely the floating card — the variant the first
 * cut of this fix left behind on the reasoning that a keyboard implies a phone.
 */
const TABLET_WIDTH = 820;
const TABLET_HEIGHT = 1180;
const TABLET_KEYBOARD_PX = 398;

/**
 * A classic (non-overlay) horizontal scrollbar, the one standing reason a
 * DESKTOP browser's two viewport heights disagree: `innerHeight` includes it
 * and `visualViewport.height` does not. 17px is the widest in common use —
 * Firefox on Windows; Chrome's is 15 and macOS's overlay scrollbars are 0.
 */
const DESKTOP_SCROLLBAR_PX = 17;

/**
 * Stands in for `window.visualViewport`. Shrinking it and firing `resize` is
 * exactly what iOS does when the keyboard opens: the LAYOUT viewport
 * (`window.innerHeight`, untouched here) stays where it is, and only the
 * visible slice moves. Extending the real `EventTarget` means the component's
 * own `addEventListener`/`removeEventListener` calls are the real ones.
 */
class FakeVisualViewport extends EventTarget {
  width: number;
  height: number;
  offsetLeft = 0;
  offsetTop = 0;
  pageLeft = 0;
  pageTop = 0;
  scale = 1;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  /** Move the visible slice and tell listeners, the way a real keyboard does. */
  setVisible(height: number, offsetTop = 0) {
    this.height = height;
    this.offsetTop = offsetTop;
    this.dispatchEvent(new Event('resize'));
  }
}

/**
 * Reports a shrunken LAYOUT viewport, which is what Chrome on Android does
 * under its default `interactive-widget=resizes-content`: the page itself is
 * made shorter, so `bottom: 0` is already sitting above the keyboard and any
 * lift on top of that would raise the sheet twice.
 */
function installFakeLayoutHeight(height: number): () => void {
  const original = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => height });
  return () => {
    if (original) Object.defineProperty(window, 'innerHeight', original);
    else Reflect.deleteProperty(window, 'innerHeight');
  };
}

function installFakeVisualViewport(fake: FakeVisualViewport): () => void {
  const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => fake });
  return () => {
    if (original) Object.defineProperty(window, 'visualViewport', original);
    else Reflect.deleteProperty(window, 'visualViewport');
  };
}

/**
 * Makes a `window` API read as `undefined` for the duration of a test, the way
 * it does in a host that never implemented it.
 *
 * `matchMedia` lives on `Window.prototype` and `visualViewport` on the window
 * instance, so neither can simply be deleted — shadowing the name with an own
 * property whose value is `undefined` is what covers both.
 */
function removeWindowApi(name: 'matchMedia' | 'visualViewport'): () => void {
  const own = Object.getOwnPropertyDescriptor(window, name);
  Object.defineProperty(window, name, { configurable: true, value: undefined, writable: true });
  return () => {
    if (own) Object.defineProperty(window, name, own);
    else Reflect.deleteProperty(window, name);
  };
}

/**
 * Resizes the real browser window, or reports that it cannot.
 *
 * Under vitest this is the faithful thing and the only honest one: which of
 * the two bottom variants is live is decided by the STYLESHEET, so a story
 * about one of them needs a window that genuinely matches its media query.
 * Nothing about the breakpoint is mocked. Returns `null` outside vitest (a
 * human opening the story in Storybook), where no such API exists.
 */
async function resizeViewport(
  width: number,
  height: number
): Promise<(() => Promise<void>) | null> {
  const before = { width: window.innerWidth, height: window.innerHeight };

  const context = await import('vitest/browser').catch(() => null);
  const viewport = context?.page?.viewport as
    | ((width: number, height: number) => Promise<void>)
    | undefined;
  if (typeof viewport !== 'function') return null;

  await viewport(width, height);
  await waitFor(() => expect(window.innerWidth).toBe(width));
  return async () => {
    await viewport(before.width, before.height);
  };
}

/**
 * Puts the page at phone dimensions — a real 390x844 layout viewport and a
 * real `window.innerHeight` — and hands back a restore.
 *
 * Outside vitest there is no way to resize the window, so the phone media
 * query is reported instead. That keeps a human's Storybook run on the flush
 * variant's code path even in a wide window.
 */
async function enterPhoneViewport(): Promise<() => Promise<void>> {
  const resized = await resizeViewport(390, 844);
  if (resized) return resized;

  const originalMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string) =>
    originalMatchMedia.call(window, query.replace('639px', '99999px'))) as typeof window.matchMedia;
  return async () => {
    window.matchMedia = originalMatchMedia;
  };
}

/**
 * Puts the page at tablet dimensions, above `sm`, where the sheet is the
 * floating card.
 *
 * There is no fallback here and there cannot be a useful one: the floating
 * variant is selected by a real media query against a real window, so faking
 * `matchMedia` would change nothing about which CSS applies. Outside vitest
 * the story runs at whatever width the window already is, and asserts up
 * front that it is wide enough to be the variant under test.
 */
async function enterTabletViewport(): Promise<() => Promise<void>> {
  const resized = await resizeViewport(TABLET_WIDTH, TABLET_HEIGHT);
  return resized ?? (async () => {});
}

interface Geometry {
  top: number;
  bottom: number;
  height: number;
}

function measure(element: Element): Geometry {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, height: rect.height };
}

/**
 * Samples the element every frame until its box has been identical for
 * `frames` in a row, then returns that box.
 *
 * Necessary, not defensive: the sheet's enter spring is underdamped
 * (`damping: 30, stiffness: 300`), so it crosses its resting position and
 * comes back. A single reading taken when the box merely ROUNDS to the right
 * value catches the overshoot instead of the rest position, and every "is it
 * back where it started" assertion here would then be comparing two different
 * points on the same curve.
 */
async function waitForStableGeometry(element: Element, frames = 6): Promise<Geometry> {
  const deadline = Date.now() + 5000;
  let last = measure(element);
  let stable = 0;

  while (stable < frames) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const next = measure(element);
    stable =
      next.top === last.top && next.bottom === last.bottom && next.height === last.height
        ? stable + 1
        : 0;
    last = next;
    if (Date.now() > deadline) throw new Error('sheet geometry never settled');
  }

  return last;
}

/* ────────────────────────────────────────────────────────────
 * Stories
 * ──────────────────────────────────────────────────────────── */

function SheetDemo({
  side,
  triggerLabel = 'Open picker',
}: {
  side: 'left' | 'right' | 'bottom';
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-grey-100 p-6">
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Sheet open={open} onClose={() => setOpen(false)} side={side} title="Add GK">
        <div className="flex flex-col gap-3">
          <Input placeholder="Search players" />
          {Array.from({ length: 14 }, (_, index) => (
            <div
              key={index}
              className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/70"
            >
              Player {index + 1}
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/**
 * Same sheet, but the whole `Sheet` subtree is created by the click rather
 * than merely revealed by it — see `BottomWithoutViewportApis`, which needs a
 * first mount to happen inside its `play`.
 */
function LateMountedSheet() {
  const [mounted, setMounted] = useState(false);

  return (
    <div className="min-h-dvh bg-grey-100 p-6">
      <Button onClick={() => setMounted(true)}>Open picker</Button>
      {mounted && (
        <Sheet open onClose={() => setMounted(false)} side="bottom" title="Add GK">
          <div className="flex flex-col gap-3">
            <Input placeholder="Search players" />
            {Array.from({ length: 14 }, (_, index) => (
              <div
                key={index}
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/70"
              >
                Player {index + 1}
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

export const Bottom = meta.story({
  name: 'Bottom',
  render: () => <SheetDemo side="bottom" />,
});

export const Right = meta.story({
  name: 'Right',
  render: () => <SheetDemo side="right" />,
});

/**
 * The bug the owner reported: on a phone, the keyboard was drawn over the
 * player picker. This story opens the sheet on a 390x844 layout viewport,
 * shrinks the visual viewport by a keyboard's worth, and measures where the
 * panel actually is.
 */
export const BottomAboveTheKeyboard = meta.story({
  name: 'Bottom — stays above the keyboard',
  render: () => <SheetDemo side="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreViewport = await enterPhoneViewport();
    // Installed BEFORE the sheet mounts, so the subscription the component
    // makes on open is a subscription to this.
    const fake = new FakeVisualViewport(window.innerWidth, window.innerHeight);
    const restoreVisualViewport = installFakeVisualViewport(fake);

    try {
      const layoutHeight = window.innerHeight;
      const visibleWithKeyboard = layoutHeight - KEYBOARD_PX;

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');

      // Resting: flush to the bottom of the layout viewport.
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight);

      // Three open/close cycles, because the failure mode of a
      // reposition-on-event fix is drift, not a wrong first answer.
      for (let cycle = 0; cycle < 3; cycle++) {
        fake.setVisible(visibleWithKeyboard);
        const raised = await waitForStableGeometry(panel);

        // Moved up by exactly the occluded strip — measured, not asserted
        // from the class list.
        expect(resting.bottom - raised.bottom).toBe(KEYBOARD_PX);
        expect(raised.bottom).toBe(visibleWithKeyboard);
        // …and shrank to fit above it, rather than pushing its own top off
        // the screen.
        expect(raised.height).toBeLessThanOrEqual(
          Math.round(visibleWithKeyboard * SHEET_VISIBLE_HEIGHT_RATIO) + 0.5
        );
        expect(raised.top).toBeGreaterThanOrEqual(0);
        // The home-indicator inset is dropped while the keyboard covers it,
        // so it is not reserved twice. (Its visible effect needs a device:
        // `env(safe-area-inset-bottom)` is 0 in a headless browser.)
        expect(getComputedStyle(panel).getPropertyValue('--sheet-body-pb').trim()).toBe('1.25rem');

        fake.setVisible(layoutHeight);
        const restored = await waitForStableGeometry(panel);
        expect(restored).toEqual(resting);
        expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');
      }

      // Drag-to-dismiss still works from the raised position. The grab handle
      // is the panel's only `aria-hidden` block.
      fake.setVisible(visibleWithKeyboard);
      await waitForStableGeometry(panel);

      const handle = panel.querySelector('div[aria-hidden="true"]');
      expect(handle).not.toBeNull();
      const handleRect = handle!.getBoundingClientRect();
      const startY = handleRect.top + handleRect.height / 2;
      const pointer = { bubbles: true, pointerId: 1, isPrimary: true };
      handle!.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, clientY: startY }));
      handle!.dispatchEvent(new PointerEvent('pointermove', { ...pointer, clientY: startY + 220 }));
      handle!.dispatchEvent(new PointerEvent('pointerup', { ...pointer, clientY: startY + 220 }));

      await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    } finally {
      restoreVisualViewport();
      await restoreViewport();
    }
  },
});

/**
 * The trap on the other platform. Chrome on Android already shrinks the layout
 * viewport for the keyboard, so a fix that assumes iOS behaviour lifts a sheet
 * that is already clear of the keyboard and leaves a keyboard-sized hole under
 * it. Here BOTH viewports shrink together — the Android reading — and the
 * sheet must not move at all.
 */
export const BottomOnAndroidDoesNotDoubleCompensate = meta.story({
  name: 'Bottom — no double lift where the browser already resized',
  render: () => <SheetDemo side="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreViewport = await enterPhoneViewport();
    const fake = new FakeVisualViewport(window.innerWidth, window.innerHeight);
    const restoreVisualViewport = installFakeVisualViewport(fake);
    let restoreLayoutHeight: (() => void) | null = null;

    try {
      const layoutHeight = window.innerHeight;

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight);

      // The keyboard opens and the browser handles it: layout AND visual
      // viewport both lose the keyboard's height, together.
      restoreLayoutHeight = installFakeLayoutHeight(layoutHeight - KEYBOARD_PX);
      fake.setVisible(layoutHeight - KEYBOARD_PX);
      window.dispatchEvent(new Event('resize'));

      // Not moved, and no inline override written. The real page would have
      // reflowed under the sheet; what must not happen is the sheet moving
      // relative to it.
      expect(await waitForStableGeometry(panel)).toEqual(resting);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');
    } finally {
      restoreLayoutHeight?.();
      restoreVisualViewport();
      await restoreViewport();
    }
  },
});

/**
 * The case 0.85.0 scoped itself out of.
 *
 * That fix gated on a phone-width media query, on the reasoning that a
 * keyboard implies a phone. An iPad has an on-screen keyboard and a viewport
 * well above `sm`, so the original bug survived there untouched — and `sm` is
 * not the same sheet: it is a floating card held clear of the bottom edge and
 * capped at its own ceiling, so getting it right is not just a matter of
 * letting the existing correction through.
 *
 * The two things this measures that the phone story cannot:
 *
 *  1. the card's resting GAP survives the lift — it ends up the same 24px
 *     clear of the edge the user can see that it sits clear of the screen at
 *     rest, rather than being flattened onto it;
 *  2. the raised card is shorter than the resting one, which is only true if
 *     the `sm` height cap moved too. Leave `sm:max-h-[min(90dvh,720px)]` as it
 *     was and the card stays 720px tall in a 782px visible slice, which no
 *     longer fits above the gap.
 */
export const BottomOnATabletAboveTheKeyboard = meta.story({
  name: 'Bottom — floating card clears the keyboard at sm and up',
  render: () => <SheetDemo side="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreViewport = await enterTabletViewport();
    const fake = new FakeVisualViewport(window.innerWidth, window.innerHeight);
    const restoreVisualViewport = installFakeVisualViewport(fake);

    try {
      // The variant under test is the floating one, decided by the real
      // stylesheet against the real window — not by anything stubbed here.
      expect(window.matchMedia('(min-width: 40rem)').matches).toBe(true);

      const layoutHeight = window.innerHeight;
      const visibleWithKeyboard = layoutHeight - TABLET_KEYBOARD_PX;
      // Independently derived: the same 90% share the flush variant takes,
      // under the card's own ceiling, with room left for the gap.
      const expectedRaisedHeight = Math.min(
        Math.round(visibleWithKeyboard * SHEET_VISIBLE_HEIGHT_RATIO),
        visibleWithKeyboard - SHEET_FLOATING_BOTTOM_GAP_PX,
        SHEET_FLOATING_MAX_HEIGHT_PX
      );

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');

      // Resting: a floating card, 24px clear of the bottom edge and capped at
      // its ceiling. Unchanged from before this fix, and the thing the
      // property fallbacks exist to preserve exactly.
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight - SHEET_FLOATING_BOTTOM_GAP_PX);
      expect(resting.height).toBe(SHEET_FLOATING_MAX_HEIGHT_PX);

      // Three cycles, because drift is the failure mode of a
      // reposition-on-event fix, not a wrong first answer — and the `sm` path
      // now has two properties to put back rather than none.
      for (let cycle = 0; cycle < 3; cycle++) {
        fake.setVisible(visibleWithKeyboard);
        const raised = await waitForStableGeometry(panel);

        // Lifted by exactly the occluded strip…
        expect(resting.bottom - raised.bottom).toBe(TABLET_KEYBOARD_PX);
        // …and the gap composed with it rather than swallowed by it: the card
        // is still floating, just above a different edge.
        expect(visibleWithKeyboard - raised.bottom).toBe(SHEET_FLOATING_BOTTOM_GAP_PX);

        // Shorter than at rest, and short enough to fit above the gap.
        expect(raised.height).toBe(expectedRaisedHeight);
        expect(raised.height).toBeLessThan(resting.height);
        expect(raised.top).toBeGreaterThanOrEqual(0);

        fake.setVisible(layoutHeight);
        const restored = await waitForStableGeometry(panel);
        expect(restored).toEqual(resting);
        expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-floating-keyboard-inset');
      }

      // Drag-to-dismiss still works from the raised position, which on this
      // variant is a position the drag has never started from before.
      fake.setVisible(visibleWithKeyboard);
      await waitForStableGeometry(panel);

      const handle = panel.querySelector('div[aria-hidden="true"]');
      expect(handle).not.toBeNull();
      const handleRect = handle!.getBoundingClientRect();
      const startY = handleRect.top + handleRect.height / 2;
      const pointer = { bubbles: true, pointerId: 1, isPrimary: true };
      handle!.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, clientY: startY }));
      handle!.dispatchEvent(new PointerEvent('pointermove', { ...pointer, clientY: startY + 220 }));
      handle!.dispatchEvent(new PointerEvent('pointerup', { ...pointer, clientY: startY + 220 }));

      await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    } finally {
      restoreVisualViewport();
      await restoreViewport();
    }
  },
});

/**
 * The Android trap, asked again at tablet width.
 *
 * Android tablets are as much the target of this change as iPads, and Chrome
 * there shrinks the LAYOUT viewport for the keyboard. The residual is what
 * keeps that from lifting a card which is already clear — the same protection
 * the phone variant has, on the variant that now also composes a 24px gap into
 * its answer, where a double lift would show up as the card floating a
 * keyboard's height above the keyboard.
 */
export const BottomOnATabletDoesNotDoubleCompensate = meta.story({
  name: 'Bottom — no double lift at sm where the browser already resized',
  render: () => <SheetDemo side="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreViewport = await enterTabletViewport();
    const fake = new FakeVisualViewport(window.innerWidth, window.innerHeight);
    const restoreVisualViewport = installFakeVisualViewport(fake);
    let restoreLayoutHeight: (() => void) | null = null;

    try {
      expect(window.matchMedia('(min-width: 40rem)').matches).toBe(true);
      const layoutHeight = window.innerHeight;

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight - SHEET_FLOATING_BOTTOM_GAP_PX);

      // Both viewports lose the keyboard's height, together.
      restoreLayoutHeight = installFakeLayoutHeight(layoutHeight - TABLET_KEYBOARD_PX);
      fake.setVisible(layoutHeight - TABLET_KEYBOARD_PX);
      window.dispatchEvent(new Event('resize'));

      expect(await waitForStableGeometry(panel)).toEqual(resting);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-floating-keyboard-inset');
    } finally {
      restoreLayoutHeight?.();
      restoreVisualViewport();
      await restoreViewport();
    }
  },
});

/**
 * The case that escaped 0.85.0 and broke studio's suite.
 *
 * `Sheet` gained a `useIsMobile()` gate, which calls `window.matchMedia` in an
 * effect. jsdom implements neither `matchMedia` nor `visualViewport`, so every
 * consumer test that mounted a sheet — in any environment missing either —
 * threw `window.matchMedia is not a function` on mount. Both APIs are removed
 * here, together, and the only thing being asserted is that the component
 * still renders.
 *
 * `Sheet` no longer calls `useIsMobile` at all: the correction is gated on the
 * viewport reading rather than on a breakpoint, so there is nothing left for
 * it to ask `matchMedia`. That makes this story STRICTLY the consumer's
 * contract — mount a sheet in a host missing both APIs and it must render —
 * rather than a test of one hook through another. The `useMediaQuery` guards
 * themselves keep their own unit tests, and other components still call it.
 */
export const BottomWithoutViewportApis = meta.story({
  name: 'Bottom — renders where matchMedia and visualViewport do not exist',
  // `Sheet` is absent from the tree until the button is clicked. It has to
  // MOUNT after the APIs are gone: `useMediaQuery`'s effect runs once per
  // query, so a sheet that mounted while `matchMedia` still existed has
  // already made its one call and never reaches the crash. That is what a
  // consumer's test does — build a fresh tree containing a sheet — and a
  // first draft of this story that rendered the sheet up front passed against
  // the unguarded code, proving nothing.
  render: () => <LateMountedSheet />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Removed BEFORE the sheet mounts, so the effects that read them are the
    // ones under test.
    const restoreMatchMedia = removeWindowApi('matchMedia');
    const restoreVisualViewport = removeWindowApi('visualViewport');

    try {
      expect(window.matchMedia).toBeUndefined();
      expect(window.visualViewport).toBeUndefined();

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));

      // Rendered, laid out, and carrying its content — not merely mounted.
      const panel = await canvas.findByRole('dialog');
      expect(panel).toBeInTheDocument();
      expect(within(panel).getByText('Player 1')).toBeInTheDocument();
      expect((await waitForStableGeometry(panel)).height).toBeGreaterThan(0);

      // With no `visualViewport` there is nothing to read, so nothing is
      // written — the exact behaviour the sheet had before the keyboard fix
      // existed.
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');

      // And it still closes, so the guard did not cost the component its
      // behaviour.
      await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
    } finally {
      restoreVisualViewport();
      restoreMatchMedia();
    }
  },
});

/**
 * The other half of the same question, asked so the answer is not a guess.
 *
 * `BottomWithoutViewportApis` removes both APIs at once. When that story was
 * written, `matchMedia` being gone sent the sheet down the desktop branch and
 * the visual-viewport code never ran, so it proved nothing about that guard.
 * Here the window is genuinely 390 wide, so the flush variant is the one being
 * measured, and the tracking effect reaches its `visualViewport` read with
 * nothing there.
 *
 * The effect is now enabled for every open bottom sheet regardless of width,
 * so this is no longer the only story that reaches that guard — but it is
 * still the one that reaches it at a width where a correction would otherwise
 * be owed.
 */
export const BottomWithoutVisualViewport = meta.story({
  name: 'Bottom — mobile, with no visualViewport at all',
  render: () => <LateMountedSheet />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const restoreViewport = await enterPhoneViewport();
    const restoreVisualViewport = removeWindowApi('visualViewport');

    try {
      // Below `sm`, so the flush variant is the one on screen.
      expect(window.matchMedia('(max-width: 639px)').matches).toBe(true);
      expect(window.visualViewport).toBeUndefined();

      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');
      expect(within(panel).getByText('Player 1')).toBeInTheDocument();

      // Flush to the bottom of the layout viewport, exactly as it was before
      // the keyboard fix: nothing to read, so nothing is corrected.
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(window.innerHeight);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');
    } finally {
      restoreVisualViewport();
      await restoreViewport();
    }
  },
});

/**
 * Desktop, where the correction must stay a no-op — and now does so by
 * arithmetic rather than by a breakpoint.
 *
 * This story used to shrink the visual viewport by a keyboard's worth at
 * desktop width and assert the sheet did not move. That was a proof of the
 * `sm` GATE, and the gate is precisely what this change removes: a viewport
 * above `sm` reporting a 336px occlusion is an iPad with its keyboard up, and
 * it is now acted on — `BottomOnATabletAboveTheKeyboard` is where that reading
 * is asserted. Keeping the old assertion would have been keeping the bug.
 *
 * What replaces it is the claim the gate was only ever a proxy for, stated
 * directly: a desktop browser reports no occlusion, so nothing is written. The
 * tracking effect really is running here — it is no longer switched off by
 * width — so this is a live path being driven, not an inert one being left
 * alone. The visual viewport is a FAITHFUL desktop one, its height equal to
 * `innerHeight`.
 *
 * Real desktop pinch-zoom is the one thing that can still make a desktop
 * browser report a residual. It is not stubbed here because it is not a
 * keyboard and not what this fixes; see the CHANGELOG for why the correction
 * is the right answer to it anyway.
 */
export const BottomAtDesktopWidthIsUnchanged = meta.story({
  name: 'Bottom — no correction on a desktop viewport',
  render: () => <SheetDemo side="bottom" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(window.matchMedia('(min-width: 40rem)').matches).toBe(true);

    const fake = new FakeVisualViewport(window.innerWidth, window.innerHeight);
    const restoreVisualViewport = installFakeVisualViewport(fake);

    try {
      const layoutHeight = window.innerHeight;
      await userEvent.click(canvas.getByRole('button', { name: 'Open picker' }));
      const panel = await canvas.findByRole('dialog');

      // `sm:bottom-6` — 24px clear of the bottom edge, exactly as before.
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight - SHEET_FLOATING_BOTTOM_GAP_PX);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');

      // Drive the live effect with the events a desktop really fires. The two
      // viewports agree, so every one of them must produce nothing.
      fake.setVisible(layoutHeight);
      window.dispatchEvent(new Event('resize'));
      expect(await waitForStableGeometry(panel)).toEqual(resting);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');

      // The one standing disagreement a desktop browser does produce. Now that
      // desktop is inside the tracked path, the noise floor is what stops a
      // scrollbar's thickness from creeping the sheet upwards — so assert the
      // margin rather than trusting it.
      expect(DESKTOP_SCROLLBAR_PX).toBeLessThan(MIN_TRACKED_INSET_PX);
      fake.setVisible(layoutHeight - DESKTOP_SCROLLBAR_PX);
      expect(await waitForStableGeometry(panel)).toEqual(resting);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');
    } finally {
      restoreVisualViewport();
    }
  },
});
