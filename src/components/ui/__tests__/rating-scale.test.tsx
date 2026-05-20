import { describe, expect, it } from 'vitest';

import { RATING_SCALE, RatingScale, ratingDescriptor } from '../rating-scale';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('RatingScale compact variant', () => {
  it('renders all six tiles in canonical order', () => {
    const markup = render(<RatingScale />);
    expect(countSlot(markup, 'rating-scale-tile')).toBe(6);
  });

  it('declares lower-is-better via data attribute', () => {
    const markup = render(<RatingScale value={1} />);
    expect(getSlotAttr(markup, 'rating-scale', 'data-direction')).toBe('lower-is-better');
  });

  it('marks the active tile with data-active', () => {
    const markup = render(<RatingScale value={3} />);
    // We can't easily target a specific tile attribute via getSlotAttr — but
    // we *can* assert that data-active="true" only appears on a single tile.
    const matches = markup.match(/data-active="true"/g);
    expect(matches?.length).toBe(1);
  });

  it('renders accessible labels for screen readers', () => {
    const markup = render(<RatingScale value={1} />);
    expect(markup).toContain('aria-label="1, Excellent"');
    expect(markup).toContain('aria-label="6, Poor"');
  });

  it('renders tiles as buttons when interactive', () => {
    const markup = render(<RatingScale value={2} onSelect={() => undefined} />);
    // Tiles should be <button> when an onSelect is provided.
    expect(markup).toContain('<button');
    expect(markup).toContain('aria-pressed="true"');
  });
});

describe('RatingScale legend variant', () => {
  it('renders a row per descriptor with the descriptor label', () => {
    const markup = render(<RatingScale value={2} variant="legend" />);
    expect(getSlotAttr(markup, 'rating-scale', 'data-variant')).toBe('legend');
    expect(countSlot(markup, 'rating-scale-entry')).toBe(6);
    expect(slotText(markup, 'rating-scale-eyebrow').toLowerCase()).toContain('lower is better');
    // The legend body contains every long label.
    expect(markup).toContain('Excellent');
    expect(markup).toContain('Very Good');
    expect(markup).toContain('Below Standard');
    expect(markup).toContain('Poor');
  });
});

describe('RatingScale descriptor helpers', () => {
  it('exposes a canonical six-entry constant in 1..6 order', () => {
    expect(RATING_SCALE.map((entry) => entry.value)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('ratingDescriptor(value) returns the matching descriptor', () => {
    expect(ratingDescriptor(1).label).toBe('Excellent');
    expect(ratingDescriptor(6).label).toBe('Poor');
  });
});

describe('RatingScale honesty', () => {
  it('does not render data-active when value is omitted', () => {
    const markup = render(<RatingScale />);
    expect(hasSlot(markup, 'rating-scale')).toBe(true);
    const matches = markup.match(/data-active="true"/g);
    expect(matches).toBeNull();
  });
});
