import { describe, expect, it } from 'vitest';

import { GradeScale } from '../grade-scale';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('GradeScale', () => {
  it('renders six rows in 1→6 order (top to bottom)', () => {
    const markup = render(<GradeScale mode="readout" counts={{ 1: 1, 2: 2, 3: 3 }} />);
    expect(countSlot(markup, 'grade-scale-row')).toBe(6);
    // Row 1 (best) appears before row 6 (worst).
    const r1 = markup.indexOf('data-value="1"');
    const r6 = markup.indexOf('data-value="6"');
    expect(r1).toBeGreaterThan(-1);
    expect(r6).toBeGreaterThan(r1);
  });

  it('exposes the direction invariant', () => {
    const markup = render(<GradeScale mode="composite" />);
    expect(getSlotAttr(markup, 'grade-scale', 'data-direction')).toBe('lower-is-better');
  });

  it('marks the active user grade row', () => {
    const markup = render(<GradeScale mode="composite" userGrade={3} />);
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-value="3"');
    expect(slotText(markup, 'grade-scale-row-marker')).toBe('You');
  });

  it('renders the readout bar + count in readout / composite modes', () => {
    const markup = render(
      <GradeScale mode="readout" counts={{ 1: 4, 2: 8, 3: 12, 4: 6, 5: 2, 6: 1 }} />
    );
    expect(hasSlot(markup, 'grade-scale-row-bar')).toBe(true);
    expect(countSlot(markup, 'grade-scale-row-count')).toBe(6);
  });

  it('omits the readout column in input mode', () => {
    const markup = render(<GradeScale mode="input" />);
    expect(hasSlot(markup, 'grade-scale-row-bar')).toBe(false);
    expect(hasSlot(markup, 'grade-scale-row-count')).toBe(false);
  });

  it('shows the mean indicator between rows when the mean is fractional', () => {
    const markup = render(
      <GradeScale
        mode="composite"
        counts={{ 1: 1, 2: 5, 3: 4 }}
        aggregate={{ mean: 2.4, count: 10 }}
      />
    );
    expect(hasSlot(markup, 'grade-scale-mean-indicator')).toBe(true);
    expect(getSlotAttr(markup, 'grade-scale-mean-indicator', 'data-mean')).toBe('2.4');
    expect(slotText(markup, 'grade-scale-mean-value')).toBe('2.4');
  });

  it('renders the empty caption when total is zero and showReadout is on', () => {
    const markup = render(<GradeScale mode="readout" />);
    expect(hasSlot(markup, 'grade-scale-empty')).toBe(true);
    expect(slotText(markup, 'grade-scale-empty')).toContain('No grades yet');
  });

  it('disables interaction in readout mode (no buttons, no radiogroup)', () => {
    const readoutMarkup = render(<GradeScale mode="readout" />);
    expect(readoutMarkup).not.toContain('<button');
    expect(readoutMarkup).toContain('role="group"');
  });

  it('uses radiogroup + button rows when interactive', () => {
    const markup = render(<GradeScale mode="input" />);
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('role="radio"');
  });
});
