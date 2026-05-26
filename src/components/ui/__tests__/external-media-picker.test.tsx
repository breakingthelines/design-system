import { describe, expect, it } from 'vitest';

import { ExternalMediaPicker } from '../external-media-picker';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('ExternalMediaPicker', () => {
  it('writes the current kind to the root', () => {
    const markup = render(<ExternalMediaPicker kind="video" url="" />);
    expect(getSlotAttr(markup, 'external-media-picker', 'data-kind')).toBe('video');
  });

  it('flags the idle state when no preview or error is supplied', () => {
    const markup = render(<ExternalMediaPicker kind="publisher_url" url="" />);
    expect(getSlotAttr(markup, 'external-media-picker', 'data-state')).toBe('idle');
  });

  it('flips to resolved when previewNode is supplied', () => {
    const markup = render(
      <ExternalMediaPicker kind="video" url="https://x" previewNode={<span>preview</span>} />
    );
    expect(getSlotAttr(markup, 'external-media-picker', 'data-state')).toBe('resolved');
    expect(hasSlot(markup, 'external-media-picker-preview')).toBe(true);
  });

  it('flips to error when errorNode is supplied', () => {
    const markup = render(
      <ExternalMediaPicker kind="podcast" url="https://x" errorNode={<span>FallbackState</span>} />
    );
    expect(getSlotAttr(markup, 'external-media-picker', 'data-state')).toBe('error');
    expect(hasSlot(markup, 'external-media-picker-error')).toBe(true);
  });

  it('renders four kind tabs and marks the active one', () => {
    const markup = render(<ExternalMediaPicker kind="podcast" url="" />);
    expect(countSlot(markup, 'external-media-picker-kind')).toBe(4);
    const podcastSlice = markup.split('data-id="podcast"')[1] ?? '';
    expect(podcastSlice).toContain('data-active="true"');
    expect(podcastSlice).toContain('aria-selected="true"');
  });

  it('shows the kind-specific description', () => {
    const markup = render(<ExternalMediaPicker kind="visual" url="" />);
    expect(markup.toLowerCase()).toContain('viz subtype');
  });

  it('renders the resolve CTA when supplied', () => {
    const markup = render(
      <ExternalMediaPicker kind="publisher_url" url="" resolveCta={<button>Resolve</button>} />
    );
    expect(hasSlot(markup, 'external-media-picker-cta')).toBe(true);
    expect(markup).toContain('Resolve');
  });

  it('renders the footer when supplied', () => {
    const markup = render(
      <ExternalMediaPicker kind="publisher_url" url="" footer={<span>help</span>} />
    );
    expect(hasSlot(markup, 'external-media-picker-footer')).toBe(true);
    expect(slotText(markup, 'external-media-picker-footer')).toContain('help');
  });
});
