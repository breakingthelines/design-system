import { describe, expect, it } from 'vitest';

import { ComposerFromSourceCard } from '../composer-from-source-card';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('ComposerFromSourceCard', () => {
  it('writes the kind on the root', () => {
    const markup = render(
      <ComposerFromSourceCard kind="opportunity" title="Saka is trending" sourceId="op_123" />
    );
    expect(getSlotAttr(markup, 'composer-from-source-card', 'data-kind')).toBe('opportunity');
    expect(getSlotAttr(markup, 'composer-from-source-card', 'data-source-id')).toBe('op_123');
  });

  it('renders the canonical kind label in the eyebrow', () => {
    const markup = render(<ComposerFromSourceCard kind="thought" title="x" />);
    expect(slotText(markup, 'composer-from-source-card-eyebrow').toLowerCase()).toContain(
      'compose from thought'
    );
  });

  it('renders the summary when supplied', () => {
    const markup = render(<ComposerFromSourceCard kind="other" title="x" summary="A short note" />);
    expect(hasSlot(markup, 'composer-from-source-card-summary')).toBe(true);
    expect(slotText(markup, 'composer-from-source-card-summary')).toContain('A short note');
  });

  it('omits the summary when undefined', () => {
    const markup = render(<ComposerFromSourceCard kind="other" title="x" />);
    expect(hasSlot(markup, 'composer-from-source-card-summary')).toBe(false);
  });

  it('renders signals as chips', () => {
    const markup = render(
      <ComposerFromSourceCard
        kind="other"
        title="x"
        signals={[
          { id: 's1', label: '+30% thoughts', tone: 'positive' },
          { id: 's2', label: 'Audience: Arsenal', tone: 'neutral' },
        ]}
      />
    );
    expect(countSlot(markup, 'composer-from-source-card-signal')).toBe(2);
    expect(markup).toContain('data-id="s1"');
    expect(markup).toContain('data-id="s2"');
  });

  it('renders preview, actions, and secondary actions when supplied', () => {
    const markup = render(
      <ComposerFromSourceCard
        kind="other"
        title="x"
        previewNode={<span>preview</span>}
        actions={<button>Compose draft</button>}
        secondaryActions={<button>Dismiss</button>}
      />
    );
    expect(hasSlot(markup, 'composer-from-source-card-preview')).toBe(true);
    expect(hasSlot(markup, 'composer-from-source-card-actions')).toBe(true);
    expect(markup).toContain('Compose draft');
    expect(markup).toContain('Dismiss');
  });

  it('omits the avatar slot entirely when no image or accent colour is supplied', () => {
    const markup = render(<ComposerFromSourceCard kind="other" title="x" />);
    expect(hasSlot(markup, 'composer-from-source-card-avatar')).toBe(false);
  });
});
