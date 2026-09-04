import { describe, expect, it } from 'vitest';

import { LoadingOverlay } from '../loading-overlay';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('LoadingOverlay', () => {
  it('covers its panel rather than taking a place in the flow', () => {
    const overlayClass = getSlotAttr(render(<LoadingOverlay />), 'loading-overlay', 'class') ?? '';

    expect(overlayClass).toContain('absolute');
    expect(overlayClass).toContain('inset-0');
    expect(overlayClass).toContain('z-10');
  });

  it('announces the wait, and the label with it', () => {
    // Several of the eleven local copies were a silent div around a spinner, so
    // a screen-reader user got no signal that a wait had started or ended.
    const markup = render(<LoadingOverlay label="Loading flags..." />);

    expect(getSlotAttr(markup, 'loading-overlay', 'role')).toBe('status');
    expect(getSlotAttr(markup, 'loading-overlay', 'aria-live')).toBe('polite');
    expect(slotText(markup, 'loading-overlay-label')).toBe('Loading flags...');
  });

  it('draws no label when it was given none', () => {
    const markup = render(<LoadingOverlay />);

    expect(hasSlot(markup, 'loading-overlay-label')).toBe(false);
    expect(hasSlot(markup, 'loading-overlay-spinner')).toBe(true);
  });

  it('keeps the spinner out of the accessible name', () => {
    const markup = render(<LoadingOverlay label="Loading users..." />);

    expect(getSlotAttr(markup, 'loading-overlay-spinner', 'aria-hidden')).toBe('true');
    expect(slotText(markup, 'loading-overlay')).toBe('Loading users...');
  });

  it('uses the system loading idiom rather than a hand-written keyframe', () => {
    const markup = render(<LoadingOverlay />);

    expect(getSlotAttr(markup, 'loading-overlay-spinner', 'class')).toContain('animate-spin');
  });

  it('matches the radius of the panel underneath', () => {
    // The eleven local copies had drifted to two radii, 4px and 12px.
    const small = render(<LoadingOverlay />);
    const medium = render(<LoadingOverlay radius="md" />);
    const square = render(<LoadingOverlay radius="none" />);

    expect(getSlotAttr(small, 'loading-overlay', 'class')).toContain('rounded-btl-sm');
    expect(getSlotAttr(medium, 'loading-overlay', 'class')).toContain('rounded-btl-md');
    expect(getSlotAttr(square, 'loading-overlay', 'class')).toContain('rounded-none');
  });

  it('themes from tokens only, so it dims a light panel as well as a dark one', () => {
    // The local copies scrimmed with rgba(0, 0, 0, 0.4) and rgba(13, 13, 13,
    // 0.65), neither of which dims a light surface: they black it out.
    const markup = render(<LoadingOverlay label="Loading..." />);
    const overlayClass = getSlotAttr(markup, 'loading-overlay', 'class') ?? '';

    expect(overlayClass).toContain('var(--color-background)');
    expect(overlayClass).toContain('backdrop-blur-[2px]');
    expect(getSlotAttr(markup, 'loading-overlay-label', 'class')).toContain(
      'text-muted-foreground'
    );
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });

  it('takes a className without losing the scrim', () => {
    const markup = render(<LoadingOverlay className="z-50" />);
    const overlayClass = getSlotAttr(markup, 'loading-overlay', 'class') ?? '';

    expect(overlayClass).toContain('absolute');
    expect(overlayClass).toContain('z-50');
    expect(overlayClass).not.toContain('z-10');
  });
});
