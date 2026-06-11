import { describe, expect, it } from 'vitest';

import { MatchHeader, formatMatchKickoff, initialsFromMatchLabel } from '../match-header';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const baseHome = { label: 'Arsenal', shortLabel: 'ARS' };
const baseAway = { label: 'Manchester United', shortLabel: 'MUN' };

describe('MatchHeader', () => {
  it('renders kickoff time + date in the eyebrow for scheduled fixtures', () => {
    const markup = render(
      <MatchHeader
        home={baseHome}
        away={baseAway}
        status="scheduled"
        kickoffIso="2026-08-15T19:30:00Z"
        competitionLabel="Premier League"
        venueLabel="Emirates Stadium"
        variant="flat"
      />
    );
    expect(getSlotAttr(markup, 'match-header', 'data-status')).toBe('scheduled');
    // Score plaque renders the kickoff time when scheduled (no scoreboard chip).
    expect(hasSlot(markup, 'match-header-score')).toBe(true);
    expect(slotText(markup, 'match-header-eyebrow')).toContain('Premier League');
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
    const scoreText = slotText(markup, 'match-header-score');
    expect(scoreText).toContain('2');
    expect(scoreText).toContain('1');
    // Wave 6.27: the clock/status now lives in its own separate pill below the
    // score panel, not inside the score plaque.
    expect(scoreText).not.toContain("78'");
    expect(slotText(markup, 'match-header-status')).toContain("78'");
  });

  it('renders the final score for finished fixtures', () => {
    const markup = render(
      <MatchHeader home={baseHome} away={baseAway} status="finished" scoreHome={1} scoreAway={3} />
    );
    // Score sits in the score panel; "FT" sits in the separate status pill.
    expect(slotText(markup, 'match-header-score')).toMatch(/1.*3/);
    expect(slotText(markup, 'match-header-status')).toMatch(/FT/i);
  });

  it('omits the status pill for a scheduled fixture (no status label)', () => {
    const markup = render(
      <MatchHeader
        home={baseHome}
        away={baseAway}
        status="scheduled"
        kickoffIso="2026-08-15T19:30:00Z"
      />
    );
    expect(hasSlot(markup, 'match-header-status')).toBe(false);
  });

  it('renders the date line in its own bold slot', () => {
    const markup = render(
      <MatchHeader
        home={baseHome}
        away={baseAway}
        status="finished"
        kickoffIso="2026-05-19T19:00:00Z"
        scoreHome={1}
        scoreAway={2}
      />
    );
    expect(hasSlot(markup, 'match-header-date')).toBe(true);
    expect(slotText(markup, 'match-header-date')).toContain('May');
  });

  it('renders one side block per team, in home/away order', () => {
    const markup = render(<MatchHeader home={baseHome} away={baseAway} status="scheduled" />);
    expect(slotText(markup, 'match-header')).toMatch(/Arsenal.*Manchester United/);
  });
});

describe('MatchHeader photo-hero variant', () => {
  const home = { label: 'Arsenal', shortLabel: 'ARS', standingLabel: '2nd in Premier League' };
  const away = { label: 'Chelsea', shortLabel: 'CHE', standingLabel: '1st in Premier League' };

  it('renders the flat variant when no image is supplied', () => {
    const markup = render(<MatchHeader home={home} away={away} status="finished" variant="flat" />);
    expect(getSlotAttr(markup, 'match-header', 'data-variant')).toBe('flat');
    expect(hasSlot(markup, 'match-header-backdrop')).toBe(false);
  });

  it('renders a blurred photo backdrop + scrim when variant=photo with an image', () => {
    const markup = render(
      <MatchHeader
        home={home}
        away={away}
        status="finished"
        variant="photo"
        backgroundImageUrl="https://example.com/stadium.jpg"
        scoreHome={1}
        scoreAway={2}
      />
    );
    expect(getSlotAttr(markup, 'match-header', 'data-variant')).toBe('photo');
    expect(hasSlot(markup, 'match-header-backdrop')).toBe(true);
    expect(markup).toContain('https://example.com/stadium.jpg');
    expect(markup).toContain('blur-[20px]');
    // Photo variant uses bg-black/60 (darker scrim than previous bg-black/50)
    // to keep the white scoreboard text legible on busy stadium photos.
    expect(markup).toContain('bg-black/60');
  });

  it('degrades to flat when variant=photo but no image is supplied', () => {
    const markup = render(
      <MatchHeader home={home} away={away} status="finished" variant="photo" />
    );
    expect(getSlotAttr(markup, 'match-header', 'data-variant')).toBe('flat');
    expect(hasSlot(markup, 'match-header-backdrop')).toBe(false);
  });

  it('renders each side standing caption, and omits it when absent', () => {
    const withStanding = render(<MatchHeader home={home} away={away} status="finished" />);
    expect(slotText(withStanding, 'match-header')).toContain('2nd in Premier League');
    expect(slotText(withStanding, 'match-header')).toContain('1st in Premier League');

    const without = render(
      <MatchHeader home={{ label: 'Arsenal' }} away={{ label: 'Chelsea' }} status="finished" />
    );
    expect(hasSlot(without, 'match-header-side-standing')).toBe(false);
  });

  it('links the standing caption to the competition when standingHref is supplied', () => {
    const markup = render(
      <MatchHeader
        home={{
          label: 'Arsenal',
          standingLabel: '2nd in Premier League',
          standingHref: '/comp/pl',
        }}
        away={{ label: 'Chelsea', standingLabel: '1st in Premier League' }}
        status="finished"
      />
    );
    expect(markup).toContain('/comp/pl');
    expect(slotText(markup, 'match-header-side-standing')).toContain('2nd in Premier League');
  });

  it('renders the xG row only when an xG value is supplied', () => {
    const withXg = render(
      <MatchHeader home={home} away={away} status="finished" xgHome={0.25} xgAway={1.25} />
    );
    expect(hasSlot(withXg, 'match-header-xg')).toBe(true);
    expect(slotText(withXg, 'match-header-xg-home')).toContain('0.25');
    expect(slotText(withXg, 'match-header-xg-away')).toContain('1.25');

    const withoutXg = render(<MatchHeader home={home} away={away} status="finished" />);
    expect(hasSlot(withoutXg, 'match-header-xg')).toBe(false);
  });

  it('renders scorers under each team (Wave 6.28: home + away side lists)', () => {
    const markup = render(
      <MatchHeader
        home={{
          ...home,
          scorers: [{ name: 'B. Saka', minute: "35'", kind: 'goal' }],
        }}
        away={{
          ...away,
          scorers: [
            { name: 'C. Palmer', minute: "55'", kind: 'goal' },
            { name: 'E. Fernández', minute: "85'", kind: 'penalty' },
          ],
        }}
        status="finished"
        scoreHome={1}
        scoreAway={2}
      />
    );
    // Wave 6.28: scorers no longer live in one central strip — each side renders
    // its own list under the team, so both sides produce a `match-header-scorers`
    // slot (home first in DOM order).
    expect(countSlot(markup, 'match-header-scorers')).toBe(2);
    expect(getSlotAttr(markup, 'match-header-scorers', 'data-side')).toBe('home');
    // The home slice (the first slot) carries the home scorer in "Name - Time"
    // form; the away names live in the second, away-side list.
    const homeScorers = slotText(markup, 'match-header-scorers');
    expect(homeScorers).toContain('B. Saka');
    expect(homeScorers).toMatch(/B\. Saka\s*-\s*35'/);
    expect(homeScorers).not.toContain('C. Palmer');

    const all = slotText(markup, 'match-header');
    expect(all).toContain('C. Palmer');
    expect(all).toContain('E. Fernández');
  });

  it('renders only the scoring side when one team is goalless (Wave 6.28)', () => {
    const markup = render(
      <MatchHeader
        home={{ ...home, scorers: [{ name: 'B. Saka', minute: "35'", kind: 'goal' }] }}
        away={away}
        status="finished"
        scoreHome={1}
        scoreAway={0}
      />
    );
    // Away has no goals, so only the home side list renders.
    expect(countSlot(markup, 'match-header-scorers')).toBe(1);
    expect(getSlotAttr(markup, 'match-header-scorers', 'data-side')).toBe('home');
  });

  it('omits the scorers lists when neither side has scorers', () => {
    const markup = render(<MatchHeader home={home} away={away} status="finished" />);
    expect(hasSlot(markup, 'match-header-scorers')).toBe(false);
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

  it('formatMatchKickoff returns padded HH:MM and a title-case dateLabel (Wave 6.1)', () => {
    const result = formatMatchKickoff('2026-05-19T19:30:00Z');
    expect(result.timeLabel).toMatch(/^\d{2}:\d{2}$/);
    // Wave 6.1 drops the ALL-CAPS shouting in the eyebrow; dateLabel is now
    // title case ("Tue 19 May") to match Image #1.
    expect(result.dateLabel).toContain('Tue');
    expect(result.dateLabel).toContain('May');
  });
});
