import { describe, expect, it } from 'vitest';

import { MatchHeader, formatMatchKickoff, initialsFromMatchLabel } from '../match-header';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

const baseHome = { label: 'Arsenal', shortLabel: 'ARS' };
const baseAway = { label: 'Manchester United', shortLabel: 'MUN' };

describe('MatchHeader', () => {
  it('renders kickoff date+time for scheduled fixtures', () => {
    const markup = render(
      <MatchHeader
        home={baseHome}
        away={baseAway}
        status="scheduled"
        kickoffIso="2026-08-15T19:30:00Z"
        competitionLabel="Premier League"
        venueLabel="Emirates Stadium"
      />
    );
    expect(getSlotAttr(markup, 'match-header', 'data-status')).toBe('scheduled');
    expect(hasSlot(markup, 'match-header-kickoff')).toBe(true);
    expect(hasSlot(markup, 'match-header-score')).toBe(false);
    expect(slotText(markup, 'match-header-competition')).toBe('Premier League');
    expect(slotText(markup, 'match-header-venue').toLowerCase()).toContain('emirates');
  });

  it('renders the live score for live fixtures', () => {
    const markup = render(
      <MatchHeader
        home={baseHome}
        away={baseAway}
        status="live"
        scoreHome={2}
        scoreAway={1}
        clockLabel="78'"
      />
    );
    expect(hasSlot(markup, 'match-header-score')).toBe(true);
    expect(hasSlot(markup, 'match-header-kickoff')).toBe(false);
    const scoreText = slotText(markup, 'match-header-score');
    expect(scoreText).toContain('2');
    expect(scoreText).toContain('1');
    // The chip text reflects status; the clock label flows through to the chip.
    expect(slotText(markup, 'scoreboard-chip')).toMatch(/Live/i);
    expect(slotText(markup, 'scoreboard-chip-clock')).toContain("78'");
  });

  it('renders the final score for finished fixtures', () => {
    const markup = render(
      <MatchHeader home={baseHome} away={baseAway} status="finished" scoreHome={1} scoreAway={3} />
    );
    expect(slotText(markup, 'scoreboard-chip')).toMatch(/Full time/i);
  });

  it('renders one side block per team, in home/away order', () => {
    const markup = render(<MatchHeader home={baseHome} away={baseAway} status="scheduled" />);
    expect(slotText(markup, 'match-header')).toMatch(/Arsenal.*Manchester United/);
  });
});

describe('MatchHeader helpers', () => {
  it('initialsFromMatchLabel returns the padded sentinel for empty input', () => {
    expect(initialsFromMatchLabel('')).toBe('··');
    expect(initialsFromMatchLabel('   ')).toBe('··');
  });

  it('initialsFromMatchLabel returns first+last initials for multi-word labels', () => {
    expect(initialsFromMatchLabel('Real Madrid')).toBe('RM');
  });

  it('formatMatchKickoff returns TBD for empty / invalid input', () => {
    expect(formatMatchKickoff()).toEqual({
      dateLabel: 'TBD',
      timeLabel: '—',
      fullDateLabel: 'Date TBD',
    });
    expect(formatMatchKickoff('not-a-date')).toEqual({
      dateLabel: 'TBD',
      timeLabel: '—',
      fullDateLabel: 'Date TBD',
    });
  });

  it('formatMatchKickoff returns padded HH:MM and upper-case dateLabel', () => {
    const result = formatMatchKickoff('2026-05-19T19:30:00Z');
    expect(result.timeLabel).toMatch(/^\d{2}:\d{2}$/);
    expect(result.dateLabel).toBe(result.dateLabel.toUpperCase());
  });
});
