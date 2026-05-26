import { describe, expect, it } from 'vitest';

import { RatingDistributionBar } from '../rating-distribution-bar';
import { EMPTY_RATING_COUNTS } from '../rating-distribution';
import { countSlot, getSlotAttr, render, slotText } from './test-utils';

describe('RatingDistributionBar', () => {
  it('always exposes the inverse-direction sentinel', () => {
    const markup = render(<RatingDistributionBar counts={EMPTY_RATING_COUNTS} />);
    expect(getSlotAttr(markup, 'rating-distribution-bar', 'data-direction')).toBe(
      'lower-is-better'
    );
  });

  it('reports the total on the root', () => {
    const counts = { 1: 2, 2: 5, 3: 8, 4: 3, 5: 1, 6: 0 } as const;
    const markup = render(<RatingDistributionBar counts={counts} />);
    expect(getSlotAttr(markup, 'rating-distribution-bar', 'data-total')).toBe('19');
  });

  it('flags empty state when total is zero', () => {
    const markup = render(<RatingDistributionBar counts={EMPTY_RATING_COUNTS} />);
    expect(getSlotAttr(markup, 'rating-distribution-bar', 'data-empty')).toBe('true');
    expect(slotText(markup, 'rating-distribution-bar-readout').toLowerCase()).toContain(
      'no ratings'
    );
  });

  it('renders one segment per non-zero bucket in stacked mode', () => {
    const counts = { 1: 2, 2: 0, 3: 5, 4: 0, 5: 1, 6: 0 } as const;
    const markup = render(<RatingDistributionBar counts={counts} variant="stacked" />);
    expect(countSlot(markup, 'rating-distribution-bar-segment')).toBe(3);
  });

  it('renders all six columns in grouped mode regardless of zeros', () => {
    const counts = { 1: 0, 2: 0, 3: 4, 4: 0, 5: 0, 6: 0 } as const;
    const markup = render(<RatingDistributionBar counts={counts} variant="grouped" />);
    expect(countSlot(markup, 'rating-distribution-bar-segment')).toBe(6);
  });

  it('renders the mean to one decimal when provided', () => {
    const markup = render(
      <RatingDistributionBar counts={EMPTY_RATING_COUNTS} meanValue={2.6} totalOverride={10} />
    );
    expect(slotText(markup, 'rating-distribution-bar-readout')).toContain('2.6');
  });

  it('renders an em-dash readout when mean is undefined', () => {
    const counts = { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as const;
    const markup = render(<RatingDistributionBar counts={counts} />);
    expect(slotText(markup, 'rating-distribution-bar-readout')).toContain('—');
  });
});
