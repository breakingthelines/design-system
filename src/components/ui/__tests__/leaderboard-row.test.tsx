import { describe, expect, it } from 'vitest';

import { LeaderboardRow, initialsForMember } from '../leaderboard-row';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('LeaderboardRow', () => {
  it('writes the rank and viewer flag to data-attributes', () => {
    const markup = render(<LeaderboardRow rank={3} memberName="A. Member" points={42} isViewer />);
    expect(getSlotAttr(markup, 'leaderboard-row', 'data-rank')).toBe('3');
    expect(getSlotAttr(markup, 'leaderboard-row', 'data-viewer')).toBe('true');
  });

  it('renders points as font-mono tabular digits with a "pts" suffix', () => {
    const markup = render(<LeaderboardRow rank={1} memberName="A" points={123} />);
    expect(slotText(markup, 'leaderboard-row-points')).toContain('123');
    expect(slotText(markup, 'leaderboard-row-points').toLowerCase()).toContain('pts');
  });

  it('renders an upward delta with a ▲ glyph', () => {
    const markup = render(<LeaderboardRow rank={1} memberName="A" points={1} rankDelta={3} />);
    expect(getSlotAttr(markup, 'leaderboard-row-delta', 'data-direction')).toBe('up');
    expect(markup).toContain('▲');
    expect(markup).toContain('aria-label="Up 3"');
  });

  it('renders a downward delta with a ▼ glyph', () => {
    const markup = render(<LeaderboardRow rank={4} memberName="A" points={1} rankDelta={-2} />);
    expect(getSlotAttr(markup, 'leaderboard-row-delta', 'data-direction')).toBe('down');
    expect(markup).toContain('▼');
    expect(markup).toContain('aria-label="Down 2"');
  });

  it('renders a flat delta when rankDelta is exactly zero', () => {
    const markup = render(<LeaderboardRow rank={4} memberName="A" points={1} rankDelta={0} />);
    expect(getSlotAttr(markup, 'leaderboard-row-delta', 'data-direction')).toBe('flat');
  });

  it('omits the delta entirely when rankDelta is undefined', () => {
    const markup = render(<LeaderboardRow rank={4} memberName="A" points={1} />);
    expect(hasSlot(markup, 'leaderboard-row-delta')).toBe(false);
  });

  it('renders the member handle and secondary stat when provided', () => {
    const markup = render(
      <LeaderboardRow
        rank={1}
        memberName="Alex Smith"
        memberHandle="alex"
        points={42}
        secondaryStat="GW32 · 24 pts"
      />
    );
    expect(slotText(markup, 'leaderboard-row-handle')).toBe('@alex');
    expect(slotText(markup, 'leaderboard-row-secondary')).toContain('GW32');
  });

  it('renders as a button when onClick is supplied', () => {
    const markup = render(
      <LeaderboardRow rank={1} memberName="x" points={1} onClick={() => undefined} />
    );
    expect(markup.startsWith('<button')).toBe(true);
    expect(/<button[^>]*\stype="button"/.test(markup)).toBe(true);
  });

  it('renders as a div when no onClick is supplied', () => {
    const markup = render(<LeaderboardRow rank={1} memberName="x" points={1} />);
    expect(markup.startsWith('<div')).toBe(true);
  });
});

describe('initialsForMember', () => {
  it('returns the padded sentinel for empty input', () => {
    expect(initialsForMember('')).toBe('··');
  });

  it('handles single-word and multi-word labels', () => {
    expect(initialsForMember('Arsenal')).toBe('AR');
    expect(initialsForMember('Alex Smith')).toBe('AS');
  });
});
