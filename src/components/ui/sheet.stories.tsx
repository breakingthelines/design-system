import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import preview from '#.storybook/preview';
import { Sheet } from './sheet';
import { Button } from './button';
import { Input } from './input';
import { SHEET_VISIBLE_HEIGHT_RATIO } from './sheet-viewport';

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
 * Puts the page at phone dimensions and hands back a restore.
 *
 * Under vitest the browser window itself is resized, which is the faithful
 * thing: a real 390x844 layout viewport, a real `window.innerHeight`, and a
 * real `(max-width: 639px)` match driving `useIsMobile` — nothing about the
 * breakpoint gate is mocked. Outside vitest (a human opening this story in
 * Storybook at desktop width) there is no way to resize the window, so the
 * phone media query is reported instead, and the same assertions run.
 */
async function enterPhoneViewport(): Promise<() => Promise<void>> {
  const before = { width: window.innerWidth, height: window.innerHeight };

  const context = await import('vitest/browser').catch(() => null);
  const viewport = context?.page?.viewport as
    | ((width: number, height: number) => Promise<void>)
    | undefined;

  if (typeof viewport === 'function') {
    await viewport(390, 844);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    return async () => {
      await viewport(before.width, before.height);
    };
  }

  const originalMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string) =>
    originalMatchMedia.call(window, query.replace('639px', '99999px'))) as typeof window.matchMedia;
  return async () => {
    window.matchMedia = originalMatchMedia;
  };
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
 * The other half of the contract: at `sm` and up the sheet is a floating card
 * at `bottom-6` on a viewport with no on-screen keyboard, and none of this
 * applies. Nothing is stubbed here except the visual viewport itself — the
 * breakpoint gate is the real one, evaluated against the real window.
 */
export const BottomAtDesktopWidthIsUnchanged = meta.story({
  name: 'Bottom — untouched at sm and up',
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

      // `sm:bottom-6` — 24px clear of the bottom edge.
      const resting = await waitForStableGeometry(panel);
      expect(resting.bottom).toBe(layoutHeight - 24);

      // Shrink the visual viewport as hard as a keyboard would. Nothing may
      // move, and nothing may be written to the panel's inline style.
      fake.setVisible(layoutHeight - KEYBOARD_PX);
      const after = await waitForStableGeometry(panel);

      expect(after).toEqual(resting);
      expect(panel.getAttribute('style') ?? '').not.toContain('--sheet-keyboard-inset');
    } finally {
      restoreVisualViewport();
    }
  },
});
