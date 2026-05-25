import { describe, expect, it } from 'vitest';

import { PredictionLeaderboardTable } from '../prediction-leaderboard-table';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('PredictionLeaderboardTable', () => {
  const rows = [
    { id: 'a', rank: 1, memberName: 'Alex', points: 142 },
    { id: 'b', rank: 2, memberName: 'Sam', points: 138, isViewer: true },
    { id: 'c', rank: 3, memberName: 'Jordan', points: 130, rankDelta: -1 },
  ];

  it('writes the row count to data-attributes', () => {
    const markup = render(<PredictionLeaderboardTable title="GW32" rows={rows} />);
    expect(getSlotAttr(markup, 'prediction-leaderboard-table', 'data-row-count')).toBe('3');
  });

  it('renders one row slot per entry', () => {
    const markup = render(<PredictionLeaderboardTable title="GW32" rows={rows} />);
    expect(countSlot(markup, 'prediction-leaderboard-table-row')).toBe(3);
    expect(markup).toContain('data-id="a"');
    expect(markup).toContain('data-id="b"');
    expect(markup).toContain('data-id="c"');
  });

  it('renders the column eyebrow', () => {
    const markup = render(<PredictionLeaderboardTable title="GW32" rows={rows} />);
    expect(hasSlot(markup, 'prediction-leaderboard-table-column-eyebrow')).toBe(true);
    expect(slotText(markup, 'prediction-leaderboard-table-column-eyebrow').toLowerCase()).toContain(
      'rank'
    );
  });

  it('anchors the viewer row with id="leaderboard-viewer-row"', () => {
    const markup = render(<PredictionLeaderboardTable title="GW32" rows={rows} />);
    expect(markup).toContain('id="leaderboard-viewer-row"');
  });

  it('renders an honest empty state when there are no rows', () => {
    const markup = render(<PredictionLeaderboardTable title="GW32" rows={[]} />);
    expect(hasSlot(markup, 'prediction-leaderboard-table-empty')).toBe(true);
    expect(slotText(markup, 'prediction-leaderboard-table-empty').toLowerCase()).toContain(
      'no standings yet'
    );
  });

  it('renders the total entrants when provided', () => {
    const markup = render(
      <PredictionLeaderboardTable title="GW32" rows={rows} totalEntrants={120} />
    );
    expect(slotText(markup, 'prediction-leaderboard-table-total')).toContain('120');
  });
});
