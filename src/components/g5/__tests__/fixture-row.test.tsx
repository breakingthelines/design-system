import { describe, expect, it } from 'vitest';

import {
  FixtureEngagementBadges,
  FixtureFilterBar,
  FixtureGroup,
  FixtureRow,
  formatFixtureTime,
  initialsFromFixtureLabel,
  isLateLive,
  type FixtureRowData,
} from '../fixture-row';
import {
  rowLiveManUtdCity,
  rowLiveRealBarca,
  rowResultBayernDortmund,
  rowUpcomingFlamengoVasco,
} from '../fixtures';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

describe('FixtureRow status branches', () => {
  it('renders a live row with a white minute label and a visible score', () => {
    const markup = render(<FixtureRow data={rowLiveRealBarca} />);
    expect(getSlotAttr(markup, 'fixture-row', 'data-status')).toBe('live');
    expect(getSlotAttr(markup, 'fixture-row-lead', 'data-kind')).toBe('minute');
    expect(slotText(markup, 'fixture-row-lead')).toContain('85');
    // Live scores render real digits (not an empty placeholder).
    expect(getSlotAttr(markup, 'fixture-row-score', 'data-empty')).toBeUndefined();
    expect(slotText(markup, 'fixture-row-score')).toContain('1');
    expect(slotText(markup, 'fixture-row-score')).toContain('2');
  });

  it('tints the minute red for a late-live (added-time) row', () => {
    const markup = render(<FixtureRow data={rowLiveManUtdCity} />);
    expect(getSlotAttr(markup, 'fixture-row-lead', 'data-late')).toBe('true');
    expect(slotText(markup, 'fixture-row-lead')).toContain('90+2');
    expect(markup).toContain('text-[var(--color-red-100)]');
  });

  it('renders a result row with a finished minute and a visible score', () => {
    const markup = render(<FixtureRow data={rowResultBayernDortmund} />);
    expect(getSlotAttr(markup, 'fixture-row', 'data-status')).toBe('result');
    expect(getSlotAttr(markup, 'fixture-row-lead', 'data-kind')).toBe('minute');
    expect(slotText(markup, 'fixture-row-lead')).toBe('FT');
    // Result scores render real digits (not an empty placeholder).
    expect(getSlotAttr(markup, 'fixture-row-score', 'data-empty')).toBeUndefined();
    expect(slotText(markup, 'fixture-row-score')).toContain('1');
  });

  it('renders an upcoming row with a clock + kickoff time and NO score', () => {
    const markup = render(<FixtureRow data={rowUpcomingFlamengoVasco} />);
    expect(getSlotAttr(markup, 'fixture-row', 'data-status')).toBe('upcoming');
    expect(getSlotAttr(markup, 'fixture-row-lead', 'data-kind')).toBe('kickoff');
    expect(slotText(markup, 'fixture-row-lead')).toContain('9 PM');
    // The centre column is an empty placeholder (holds alignment), never a score:
    // no "0 - 0" glyph leaks even where the compiled CSS drops text-transparent.
    expect(getSlotAttr(markup, 'fixture-row-score', 'data-empty')).toBe('true');
    expect(slotText(markup, 'fixture-row-score')).toBe('');
  });

  it('suppresses the score for an upcoming row even when score values are present', () => {
    // A scheduled fixture whose summary still carries a zeroed score (the staging
    // bug): the row must show the kickoff time only, with no "0 - 0".
    const upcomingWithScore: FixtureRowData = {
      ...rowUpcomingFlamengoVasco,
      scoreHome: 0,
      scoreAway: 0,
    };
    const markup = render(<FixtureRow data={upcomingWithScore} />);
    expect(getSlotAttr(markup, 'fixture-row-score', 'data-empty')).toBe('true');
    expect(slotText(markup, 'fixture-row-score')).toBe('');
  });

  it('does not leak a "00" trailing-spacer glyph on a row without engagement', () => {
    const markup = render(<FixtureRow data={rowUpcomingFlamengoVasco} />);
    expect(hasSlot(markup, 'fixture-row-trailing')).toBe(true);
    expect(slotText(markup, 'fixture-row-trailing')).toBe('');
  });
});

describe('FixtureRow highlight + linking', () => {
  it('highlights live rows by default and not result/upcoming rows', () => {
    expect(
      getSlotAttr(render(<FixtureRow data={rowLiveRealBarca} />), 'fixture-row', 'data-highlighted')
    ).toBe('true');
    expect(
      getSlotAttr(
        render(<FixtureRow data={rowResultBayernDortmund} />),
        'fixture-row',
        'data-highlighted'
      )
    ).toBeUndefined();
    expect(
      getSlotAttr(
        render(<FixtureRow data={rowUpcomingFlamengoVasco} />),
        'fixture-row',
        'data-highlighted'
      )
    ).toBeUndefined();
  });

  it('honours an explicit highlighted override', () => {
    const markup = render(<FixtureRow data={rowResultBayernDortmund} highlighted />);
    expect(getSlotAttr(markup, 'fixture-row', 'data-highlighted')).toBe('true');
  });

  it('renders an anchor when the fixture has an href', () => {
    const markup = render(<FixtureRow data={rowLiveRealBarca} />);
    // The default Link component is <a>; the row carries its href.
    expect(markup).toContain(`href="${rowLiveRealBarca.href as string}"`);
  });

  it('renders a non-interactive div when there is no href', () => {
    const noHref: FixtureRowData = { ...rowResultBayernDortmund, href: undefined };
    const markup = render(<FixtureRow data={noHref} />);
    expect(hasSlot(markup, 'fixture-row')).toBe(true);
    expect(markup).not.toContain('href=');
  });
});

describe('FixtureRow engagement slot', () => {
  it('renders engagement badges when counts are present', () => {
    const markup = render(<FixtureRow data={rowLiveRealBarca} />);
    expect(hasSlot(markup, 'fixture-row-engagement')).toBe(true);
    expect(countSlot(markup, 'fixture-engagement-badge')).toBe(3);
    expect(markup).toContain('data-kind="thoughts"');
    expect(markup).toContain('data-kind="ratings"');
    expect(markup).toContain('data-kind="predictions"');
  });

  it('renders an invisible trailing spacer (not badges) when engagement is absent', () => {
    const markup = render(<FixtureRow data={rowResultBayernDortmund} />);
    expect(hasSlot(markup, 'fixture-row-engagement')).toBe(false);
    expect(hasSlot(markup, 'fixture-row-trailing')).toBe(true);
  });

  it('shows a zero count (honest) but hides absent metrics', () => {
    const markup = render(
      <FixtureEngagementBadges engagement={{ thoughts: 0, predictions: 12 }} />
    );
    expect(countSlot(markup, 'fixture-engagement-badge')).toBe(2);
    expect(markup).toContain('data-kind="thoughts"');
    expect(markup).toContain('data-kind="predictions"');
    expect(markup).not.toContain('data-kind="ratings"');
  });

  it('renders nothing when every engagement metric is undefined', () => {
    const markup = render(<FixtureEngagementBadges engagement={{}} />);
    expect(hasSlot(markup, 'fixture-row-engagement')).toBe(false);
  });
});

describe('FixtureGroup', () => {
  it('renders the date header and wraps its rows', () => {
    const markup = render(
      <FixtureGroup dateLabel="Tuesday, May 19">
        <FixtureRow data={rowLiveRealBarca} />
        <FixtureRow data={rowResultBayernDortmund} />
      </FixtureGroup>
    );
    expect(slotText(markup, 'fixture-group-date')).toBe('Tuesday, May 19');
    expect(hasSlot(markup, 'fixture-group-rows')).toBe(true);
    expect(countSlot(markup, 'fixture-row')).toBe(2);
  });
});

describe('FixtureFilterBar', () => {
  it('renders four segments — All + the three status filters', () => {
    const markup = render(<FixtureFilterBar />);
    expect(hasSlot(markup, 'fixture-filter-bar')).toBe(true);
    expect(countSlot(markup, 'fixture-filter-pill')).toBe(4);
    expect(markup).toContain('data-filter="all"');
    expect(markup).toContain('data-filter="live"');
    expect(markup).toContain('data-filter="results"');
    expect(markup).toContain('data-filter="upcoming"');
  });

  it('omits the standalone league pill unless onLeaguePress is supplied', () => {
    // The condensed control no longer carries an always-on league pill; the
    // league control lives beside the bar in the host. It renders only when a
    // press handler is passed (back-compat).
    expect(hasSlot(render(<FixtureFilterBar />), 'fixture-filter-league')).toBe(false);
    const withLeague = render(<FixtureFilterBar leagueLabel="Premier League" onLeaguePress={() => undefined} />);
    expect(hasSlot(withLeague, 'fixture-filter-league')).toBe(true);
    expect(slotText(withLeague, 'fixture-filter-league')).toBe('Premier League');
  });

  it('marks "All" active by default and slides a single highlight pill there', () => {
    const markup = render(<FixtureFilterBar />);
    // Exactly one active segment + one highlight pill, on "All".
    expect(countSlot(markup, 'fixture-filter-active-pill')).toBe(1);
    const allPill = sliceSlot(markup, 'fixture-filter-pill');
    expect(allPill).toContain('data-filter="all"');
    expect(allPill).toContain('aria-pressed="true"');
    expect(allPill).toContain('data-slot="fixture-filter-active-pill"');
  });

  it('moves the highlight to the active status filter', () => {
    const markup = render(<FixtureFilterBar activeFilter="live" />);
    expect(countSlot(markup, 'fixture-filter-active-pill')).toBe(1);
    expect(markup).toContain('data-filter="live"');
    // The active pill carries data-active + aria-pressed.
    expect(markup).toContain('data-active="true"');
    expect(markup).toContain('aria-pressed="true"');
  });
});

describe('fixture-row pure helpers', () => {
  it('initialsFromFixtureLabel builds 2-letter monograms', () => {
    expect(initialsFromFixtureLabel('Real Madrid')).toBe('RM');
    expect(initialsFromFixtureLabel('Arsenal')).toBe('AR');
    expect(initialsFromFixtureLabel('')).toBe('··');
  });

  it('isLateLive is true only for live rows in added time', () => {
    expect(isLateLive({ status: 'live', minuteLabel: "90+2'" })).toBe(true);
    expect(isLateLive({ status: 'live', lateLive: true, minuteLabel: "46'" })).toBe(true);
    expect(isLateLive({ status: 'live', minuteLabel: "85'" })).toBe(false);
    expect(isLateLive({ status: 'result', minuteLabel: "90+5'" })).toBe(false);
  });

  it('formatFixtureTime drops :00 and returns TBC on bad input', () => {
    expect(formatFixtureTime(undefined)).toBe('TBC');
    expect(formatFixtureTime('not-a-date')).toBe('TBC');
    // On-the-hour kickoff has no minutes shown.
    expect(formatFixtureTime('2026-05-20T21:00:00Z')).not.toContain(':00');
  });
});
