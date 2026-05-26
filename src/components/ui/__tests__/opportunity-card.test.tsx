import { describe, expect, it } from 'vitest';

import { OpportunityCard } from '../opportunity-card';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('OpportunityCard', () => {
  it('writes the kind on the root for analytics', () => {
    const markup = render(<OpportunityCard kind="trending_subject" title="Saka is trending" />);
    expect(getSlotAttr(markup, 'opportunity-card', 'data-kind')).toBe('trending_subject');
  });

  it('renders the canonical kind label in the eyebrow', () => {
    const markup = render(<OpportunityCard kind="rating_spike" title="Spike" />);
    expect(slotText(markup, 'opportunity-card-kind').toLowerCase()).toContain('rating spike');
  });

  it('renders the priority chip with a tone derived from the score', () => {
    const high = render(<OpportunityCard kind="other" title="x" score={92} />);
    expect(getSlotAttr(high, 'opportunity-card', 'data-priority')).toBe('high');
    expect(getSlotAttr(high, 'opportunity-card-priority', 'data-tone')).toBe('high');

    const medium = render(<OpportunityCard kind="other" title="x" score={60} />);
    expect(getSlotAttr(medium, 'opportunity-card', 'data-priority')).toBe('medium');

    const low = render(<OpportunityCard kind="other" title="x" score={10} />);
    expect(getSlotAttr(low, 'opportunity-card', 'data-priority')).toBe('low');
  });

  it('omits the priority chip when score is undefined', () => {
    const markup = render(<OpportunityCard kind="other" title="x" />);
    expect(hasSlot(markup, 'opportunity-card-priority')).toBe(false);
    expect(getSlotAttr(markup, 'opportunity-card', 'data-priority')).toBeUndefined();
  });

  it('renders one signal chip per signal', () => {
    const markup = render(
      <OpportunityCard
        kind="other"
        title="x"
        signals={[
          { id: 's1', label: 'Thoughts +30%', tone: 'positive' },
          { id: 's2', label: 'Stale 24h', tone: 'warning' },
        ]}
      />
    );
    expect(countSlot(markup, 'opportunity-card-signal')).toBe(2);
    expect(markup).toContain('data-id="s1"');
    expect(markup).toContain('data-id="s2"');
  });

  it('renders as a button when onSelect is supplied', () => {
    const markup = render(<OpportunityCard kind="other" title="x" onSelect={() => undefined} />);
    expect(markup.startsWith('<button')).toBe(true);
  });

  it('renders as an article when onSelect is omitted', () => {
    const markup = render(<OpportunityCard kind="other" title="x" />);
    expect(markup.startsWith('<article')).toBe(true);
  });
});
