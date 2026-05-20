import { describe, expect, it } from 'vitest';

import {
  EMPTY_RATING_COUNTS,
  RatingDistribution,
  ratingTotal,
  type RatingCounts,
} from '../rating-distribution';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const evenCounts: RatingCounts = { 1: 2, 2: 3, 3: 4, 4: 4, 5: 2, 6: 1 };
const sparseCounts: RatingCounts = { 1: 0, 2: 0, 3: 5, 4: 0, 5: 0, 6: 0 };

describe('RatingDistribution rendering', () => {
  it('renders one column per rating value, in 1..6 order', () => {
    const markup = render(<RatingDistribution counts={evenCounts} />);
    expect(countSlot(markup, 'rating-distribution-column')).toBe(6);
  });

  it('writes the total count to a data-attribute and footer', () => {
    const markup = render(<RatingDistribution counts={evenCounts} />);
    expect(getSlotAttr(markup, 'rating-distribution', 'data-total')).toBe('16');
    expect(slotText(markup, 'rating-distribution-total')).toContain('16 ratings');
  });

  it('renders an honest "0 ratings" total for empty counts', () => {
    const markup = render(<RatingDistribution counts={EMPTY_RATING_COUNTS} />);
    expect(getSlotAttr(markup, 'rating-distribution', 'data-total')).toBe('0');
    expect(slotText(markup, 'rating-distribution-total')).toContain('0 ratings');
  });

  it('renders the rated count next to each column when showCounts is set', () => {
    const markup = render(<RatingDistribution counts={evenCounts} showCounts />);
    expect(countSlot(markup, 'rating-distribution-count')).toBe(6);
  });

  it('does not render counts when showCounts is omitted', () => {
    const markup = render(<RatingDistribution counts={evenCounts} />);
    expect(hasSlot(markup, 'rating-distribution-count')).toBe(false);
  });

  it('renders the mean line when meanValue is supplied, with lower-is-better copy', () => {
    const markup = render(<RatingDistribution counts={evenCounts} meanValue={3.2} />);
    expect(hasSlot(markup, 'rating-distribution-mean')).toBe(true);
    expect(slotText(markup, 'rating-distribution-mean').toLowerCase()).toContain('lower is better');
    expect(slotText(markup, 'rating-distribution-mean')).toContain('3.2');
  });

  it('renders columns even when only one bucket has values', () => {
    const markup = render(<RatingDistribution counts={sparseCounts} />);
    expect(countSlot(markup, 'rating-distribution-column')).toBe(6);
  });
});

describe('ratingTotal helper', () => {
  it('sums every bucket', () => {
    expect(ratingTotal(evenCounts)).toBe(16);
  });

  it('returns 0 for the canonical empty record', () => {
    expect(ratingTotal(EMPTY_RATING_COUNTS)).toBe(0);
  });
});
