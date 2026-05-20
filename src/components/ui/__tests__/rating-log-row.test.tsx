import { describe, expect, it } from 'vitest';

import { RatingLogRow, formatLogDate, initialsForLogSubject } from '../rating-log-row';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('RatingLogRow', () => {
  it('writes the rating value and lower-is-better direction to data-attributes', () => {
    const markup = render(
      <RatingLogRow
        subjectLabel="Mohamed Salah"
        matchLabel="LIV v MAN"
        matchDateIso="2026-05-10T16:30:00Z"
        value={2}
      />
    );
    expect(getSlotAttr(markup, 'rating-log-row', 'data-value')).toBe('2');
    expect(getSlotAttr(markup, 'rating-log-row', 'data-direction')).toBe('lower-is-better');
  });

  it('renders the descriptor short-label for the supplied rating', () => {
    const markup = render(<RatingLogRow subjectLabel="x" matchLabel="ARS v MUN" value={5} />);
    expect(slotText(markup, 'rating-log-row-descriptor')).toBe('Below standard');
  });

  it('renders the match label and (when supplied) a date', () => {
    const markup = render(
      <RatingLogRow
        subjectLabel="x"
        matchLabel="ARS v MUN"
        matchDateIso="2026-05-10T00:00:00Z"
        value={3}
      />
    );
    expect(slotText(markup, 'rating-log-row-context')).toContain('ARS v MUN');
    // Date label is upper-cased.
    expect(slotText(markup, 'rating-log-row-context')).toMatch(/MAY/);
  });

  it('renders the rationale slot only when supplied', () => {
    const withRationale = render(
      <RatingLogRow
        subjectLabel="x"
        matchLabel="m"
        value={1}
        rationale="Two assists, masterclass."
      />
    );
    expect(hasSlot(withRationale, 'rating-log-row-rationale')).toBe(true);
    const withoutRationale = render(<RatingLogRow subjectLabel="x" matchLabel="m" value={1} />);
    expect(hasSlot(withoutRationale, 'rating-log-row-rationale')).toBe(false);
  });

  it('renders accessible aria-label for the rating cell', () => {
    const markup = render(<RatingLogRow subjectLabel="x" matchLabel="m" value={1} />);
    expect(markup).toContain('aria-label="Rating 1, Excellent"');
  });
});

describe('RatingLogRow helpers', () => {
  it('initialsForLogSubject handles empty / single / multi-word labels', () => {
    expect(initialsForLogSubject('')).toBe('··');
    expect(initialsForLogSubject('Arsenal')).toBe('AR');
    expect(initialsForLogSubject('Mohamed Salah')).toBe('MS');
  });

  it('formatLogDate returns undefined for invalid input', () => {
    expect(formatLogDate(undefined)).toBeUndefined();
    expect(formatLogDate('not-a-date')).toBeUndefined();
  });

  it('formatLogDate returns an upper-case label for valid input', () => {
    const label = formatLogDate('2026-05-10T00:00:00Z');
    expect(label).toBeTruthy();
    expect(label).toBe(label?.toUpperCase());
  });
});
