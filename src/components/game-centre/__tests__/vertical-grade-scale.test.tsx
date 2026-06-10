import { describe, expect, it } from 'vitest';

import { VerticalGradeScale } from '../vertical-grade-scale';
import { countSlot, getSlotAttr, render, slotText } from './test-utils';

describe('VerticalGradeScale', () => {
  it('renders six rows in 1→6 order (top to bottom)', () => {
    const markup = render(<VerticalGradeScale />);
    expect(countSlot(markup, 'vertical-grade-row')).toBe(6);
    const r1 = markup.indexOf('data-value="1"');
    const r6 = markup.indexOf('data-value="6"');
    expect(r1).toBeGreaterThan(-1);
    expect(r6).toBeGreaterThan(r1);
  });

  it('exposes the direction invariant', () => {
    const markup = render(<VerticalGradeScale />);
    expect(getSlotAttr(markup, 'vertical-grade-scale', 'data-direction')).toBe('lower-is-better');
  });

  it('renders anchor labels for row 1 (Excellent) and row 6 (Poor)', () => {
    const markup = render(<VerticalGradeScale />);
    expect(markup).toContain('Excellent');
    expect(markup).toContain('Poor');
  });

  it('marks the active row when value is provided', () => {
    const markup = render(<VerticalGradeScale value={3} onSelect={() => {}} />);
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('data-value="3"');
  });

  it('uses radiogroup + radio rows when interactive', () => {
    const markup = render(<VerticalGradeScale onSelect={() => {}} />);
    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('role="radio"');
    expect(markup).toContain('<button');
  });

  it('renders a static group when no onSelect is provided', () => {
    const markup = render(<VerticalGradeScale />);
    expect(markup).toContain('role="group"');
    expect(markup).not.toContain('<button');
  });

  it('renders all six rows even when disabled', () => {
    const markup = render(<VerticalGradeScale value={2} disabled onSelect={() => {}} />);
    expect(countSlot(markup, 'vertical-grade-row')).toBe(6);
    // Disabled means non-interactive, so the group falls back to role="group".
    expect(markup).toContain('role="group"');
  });

  it('renders a tile slot per row', () => {
    const markup = render(<VerticalGradeScale />);
    expect(countSlot(markup, 'vertical-grade-row-tile')).toBe(6);
  });

  it('renders a label slot per row', () => {
    const markup = render(<VerticalGradeScale />);
    expect(countSlot(markup, 'vertical-grade-row-label')).toBe(6);
    // Anchor labels for rows 1 and 6 are the visible defaults.
    expect(slotText(markup, 'vertical-grade-row-label')).toBe('Excellent');
  });
});
