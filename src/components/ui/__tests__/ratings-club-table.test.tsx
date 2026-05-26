import { describe, expect, it } from 'vitest';

import { RatingsClubTable } from '../ratings-club-table';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('RatingsClubTable', () => {
  const rows = [
    {
      id: 'p1',
      rank: 1,
      subjectLabel: 'Bukayo Saka',
      subjectSecondary: 'Forward, Arsenal',
      meanValue: 1.8,
      counts: { 1: 4, 2: 6, 3: 2, 4: 0, 5: 0, 6: 0 } as const,
    },
    {
      id: 'p2',
      rank: 2,
      subjectLabel: 'Martin Ødegaard',
      meanValue: 2.3,
      counts: { 1: 2, 2: 5, 3: 3, 4: 1, 5: 0, 6: 0 } as const,
    },
  ];

  it('always exposes the inverse-direction sentinel', () => {
    const markup = render(<RatingsClubTable title="GW32" rows={rows} />);
    expect(getSlotAttr(markup, 'ratings-club-table', 'data-direction')).toBe('lower-is-better');
  });

  it('renders one row per entry with rank metadata', () => {
    const markup = render(<RatingsClubTable title="GW32" rows={rows} />);
    expect(countSlot(markup, 'ratings-club-table-row')).toBe(2);
    expect(markup).toContain('data-id="p1"');
    expect(markup).toContain('data-rank="1"');
    expect(markup).toContain('data-id="p2"');
  });

  it('renders an honest empty state', () => {
    const markup = render(<RatingsClubTable title="GW32" rows={[]} />);
    expect(hasSlot(markup, 'ratings-club-table-empty')).toBe(true);
    expect(slotText(markup, 'ratings-club-table-empty').toLowerCase()).toContain('no ratings yet');
  });

  it('renders the "Lower is better" reminder in the header', () => {
    const markup = render(<RatingsClubTable title="GW32" rows={rows} />);
    expect(markup.toLowerCase()).toContain('lower is better');
  });

  it('shows the total subject count when supplied', () => {
    const markup = render(<RatingsClubTable title="GW32" rows={rows} totalSubjects={14} />);
    expect(slotText(markup, 'ratings-club-table-total')).toContain('14');
  });

  it('does not invent a mean when none is provided', () => {
    const noMeanRows = [
      {
        id: 'q1',
        rank: 1,
        subjectLabel: 'X',
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as const,
      },
    ];
    const markup = render(<RatingsClubTable title="GW32" rows={noMeanRows} />);
    expect(markup).toContain('—');
  });
});
