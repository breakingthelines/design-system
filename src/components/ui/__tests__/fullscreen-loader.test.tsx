import { describe, expect, it } from 'vitest';

import { FullscreenLoader } from '../fullscreen-loader';
import { getSlotAttr, render, slotText } from './test-utils';

describe('FullscreenLoader', () => {
  it('fills the viewport and centres the wait', () => {
    const markup = render(<FullscreenLoader />);
    const root = getSlotAttr(markup, 'fullscreen-loader', 'class') ?? '';

    expect(root).toContain('min-h-screen');
    expect(root).toContain('items-center');
    expect(root).toContain('justify-center');
  });

  it('announces itself politely', () => {
    // The local version was a silent div, so a screen-reader user got no
    // signal that a wait had started or ended.
    const markup = render(<FullscreenLoader label="Loading session" />);

    expect(getSlotAttr(markup, 'fullscreen-loader', 'role')).toBe('status');
    expect(getSlotAttr(markup, 'fullscreen-loader', 'aria-live')).toBe('polite');
    expect(slotText(markup, 'fullscreen-loader-label')).toBe('Loading session');
  });

  it('defaults the label rather than waiting silently', () => {
    expect(slotText(render(<FullscreenLoader />), 'fullscreen-loader-label')).toBe('Loading...');
  });

  it('uses the system spinner idiom, not a stylesheet of its own', () => {
    // SpinnerGap + animate-spin is what AudioPlayer, ThoughtComposer,
    // ThoughtsPanel and ThoughtComment already draw. The local version shipped
    // a global @keyframes rotate and an unscoped .spin class with it.
    const markup = render(<FullscreenLoader />);

    expect(getSlotAttr(markup, 'fullscreen-loader-spinner', 'class')).toContain('animate-spin');
    expect(markup).not.toContain('@keyframes');
    expect(markup).toContain('<svg');
  });

  it('keeps the spinner out of the accessibility tree', () => {
    // The label is the announcement; the icon repeating it would be noise.
    expect(
      getSlotAttr(render(<FullscreenLoader />), 'fullscreen-loader-spinner', 'aria-hidden')
    ).toBe('true');
  });

  it('sizes the spinner on request', () => {
    expect(
      getSlotAttr(render(<FullscreenLoader size={24} />), 'fullscreen-loader-spinner', 'width')
    ).toBe('24');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(<FullscreenLoader />);
    const root = getSlotAttr(markup, 'fullscreen-loader', 'class') ?? '';

    expect(root).toContain('bg-background');
    expect(root).toContain('text-foreground');
    expect(getSlotAttr(markup, 'fullscreen-loader-label', 'class')).toContain(
      'text-muted-foreground'
    );
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});
