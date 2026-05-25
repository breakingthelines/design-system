import { describe, expect, it } from 'vitest';

import { RatingScaleSlider } from '../rating-scale-slider';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('RatingScaleSlider', () => {
  it('always exposes the inverse-direction sentinel', () => {
    const markup = render(<RatingScaleSlider />);
    expect(getSlotAttr(markup, 'rating-scale-slider', 'data-direction')).toBe('lower-is-better');
  });

  it('renders six tiles in tiles variant', () => {
    const markup = render(<RatingScaleSlider variant="tiles" />);
    expect(countSlot(markup, 'rating-scale-slider-tile')).toBe(6);
  });

  it('marks the active tile and writes data-value on the root', () => {
    const markup = render(<RatingScaleSlider value={3} />);
    expect(getSlotAttr(markup, 'rating-scale-slider', 'data-value')).toBe('3');
    const active = markup
      .split('data-value="3"')[1]
      ?.split('data-slot="rating-scale-slider-tile"')[0];
    expect(active).toBeDefined();
  });

  it('reports the descriptor for the active value', () => {
    const markup = render(<RatingScaleSlider value={1} />);
    expect(slotText(markup, 'rating-scale-slider-descriptor').toLowerCase()).toContain('excellent');
    expect(slotText(markup, 'rating-scale-slider-descriptor').toLowerCase()).toContain(
      'lower is better'
    );
  });

  it('renders the slider track in slider variant', () => {
    const markup = render(<RatingScaleSlider variant="slider" />);
    expect(hasSlot(markup, 'rating-scale-slider-track')).toBe(true);
    expect(countSlot(markup, 'rating-scale-slider-stop')).toBe(6);
  });

  it('renders the eyebrow when provided', () => {
    const markup = render(<RatingScaleSlider value={2} eyebrow="Bukayo Saka" />);
    expect(slotText(markup, 'rating-scale-slider-eyebrow')).toContain('Bukayo Saka');
    expect(slotText(markup, 'rating-scale-slider-current')).toBe('2');
  });

  it('reports "No rating yet" when value is undefined', () => {
    const markup = render(<RatingScaleSlider />);
    expect(slotText(markup, 'rating-scale-slider-descriptor').toLowerCase()).toContain(
      'no rating yet'
    );
  });
});
