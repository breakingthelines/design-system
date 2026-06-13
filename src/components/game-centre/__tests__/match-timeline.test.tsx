import { describe, expect, it } from 'vitest';

import { MatchTimeline, groupByPhase, type MatchTimelineEvent } from '../match-timeline';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const events: readonly MatchTimelineEvent[] = [
  {
    id: 'ft',
    minute: 'FT',
    minuteNumber: 97,
    kind: 'full_time',
    player: 'Full Time',
    phase: 'Final Time',
  },
  {
    id: 'goal-home',
    minute: "63'",
    minuteNumber: 63,
    kind: 'goal',
    player: 'Harry Kane',
    detail: 'Header from Corner',
    side: 'home',
    phase: 'Second Half',
  },
  {
    id: 'pen-away',
    minute: "85'",
    minuteNumber: 85,
    kind: 'penalty_goal',
    player: 'E. Fernández',
    detail: 'Penalty',
    side: 'away',
    phase: 'Second Half',
  },
  {
    id: '2y-away',
    minute: "75'",
    minuteNumber: 75,
    kind: 'second_yellow_red',
    player: 'Conor Gallagher',
    side: 'away',
    phase: 'Second Half',
  },
];

describe('MatchTimeline', () => {
  it('renders the timeline root (Wave 6.2.1: centre axis dropped — alignment alone conveys side)', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(hasSlot(markup, 'match-timeline')).toBe(true);
    expect(hasSlot(markup, 'match-timeline-axis')).toBe(false);
  });

  it('renders a row per event', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(countSlot(markup, 'match-timeline-row')).toBe(events.length);
  });

  it('falls back to TIMELINE_MISSING when there are no events', () => {
    const markup = render(<MatchTimeline events={[]} />);
    expect(hasSlot(markup, 'match-timeline')).toBe(false);
    // FallbackState renders; the timeline body must not.
    expect(hasSlot(markup, 'match-timeline-row')).toBe(false);
  });

  it('honours a custom fallbackReason when empty', () => {
    const markup = render(<MatchTimeline events={[]} fallbackReason="MATCH_NOT_STARTED" />);
    expect(hasSlot(markup, 'match-timeline-row')).toBe(false);
    // The fallback renders in place of the timeline body.
    expect(slotText(markup, 'game-centre-fallback-state').length).toBeGreaterThan(0);
  });

  it('places home events left and away events right (Wave 6.2.8: flex justify, not grid)', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(markup).toContain('data-side="home"');
    expect(markup).toContain('data-side="away"');
    // The row now uses flex with justify-start (home) / justify-end (away)
    // so the minute sits at the OUTER edge of the panel for both sides.
    expect(markup).toMatch(/data-side="home"[^>]*justify-start/);
    expect(markup).toMatch(/data-side="away"[^>]*justify-end/);
  });

  it('centres unknown-side events across the axis', () => {
    const markup = render(
      <MatchTimeline
        events={[{ id: 'ko', minute: "1'", minuteNumber: 1, kind: 'kickoff', player: 'Kick Off' }]}
      />
    );
    expect(getSlotAttr(markup, 'match-timeline-row', 'data-side')).toBe('unknown');
  });

  it('exposes the event kind on each row and its icon', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(markup).toContain('data-kind="goal"');
    expect(markup).toContain('data-kind="penalty_goal"');
    expect(markup).toContain('data-kind="full_time"');
    // The per-event icon carries the same kind.
    expect(hasSlot(markup, 'match-timeline-icon')).toBe(true);
  });

  it('renders a double-card chip for a second yellow', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(markup).toContain('data-tone="second-yellow"');
  });

  it('renders the player and detail text', () => {
    const markup = render(<MatchTimeline events={events} />);
    expect(markup).toContain('Harry Kane');
    expect(markup).toContain('Header from Corner');
    expect(markup).toContain('E. Fern');
  });

  it('groups consecutive same-phase events under one divider', () => {
    const markup = render(<MatchTimeline events={events} />);
    // Final Time (1 event) + Second Half (3 events) = 2 phase dividers.
    expect(countSlot(markup, 'match-timeline-phase')).toBe(2);
    expect(markup).toContain('data-phase="Final Time"');
    expect(markup).toContain('data-phase="Second Half"');
  });

  it('orders events newest-first (highest minute at the top)', () => {
    const markup = render(<MatchTimeline events={events} />);
    const ftIdx = markup.indexOf('Full Time');
    const kaneIdx = markup.indexOf('Harry Kane');
    expect(ftIdx).toBeGreaterThanOrEqual(0);
    expect(kaneIdx).toBeGreaterThan(ftIdx);
  });

  it('applies the limit', () => {
    const markup = render(<MatchTimeline events={events} limit={2} />);
    expect(countSlot(markup, 'match-timeline-row')).toBe(2);
  });

  it('keeps stoppage time within its half via the order key (no split dividers)', () => {
    // Real-match shape: a first-half 45+5' (minute 50) sits alongside second-half
    // 46' subs. A raw-minute sort hoists 45+5' above 46' and splits the First
    // Half divider into two; the chronological `order` key keeps each half
    // contiguous, so there are exactly two dividers (Second Half then First Half).
    const matchEvents: MatchTimelineEvent[] = [
      {
        id: 'g7',
        kind: 'goal',
        player: 'Bobadilla',
        phase: 'First Half',
        minute: "7'",
        minuteNumber: 7,
        order: 1,
      },
      {
        id: 'g31',
        kind: 'goal',
        player: 'Balogun',
        phase: 'First Half',
        minute: "31'",
        minuteNumber: 31,
        order: 4,
      },
      {
        id: 'g45',
        kind: 'goal',
        player: 'Balogun',
        phase: 'First Half',
        minute: "45+5'",
        minuteNumber: 50,
        order: 5,
      },
      {
        id: 's46a',
        kind: 'goal',
        player: 'Bobadilla',
        phase: 'Second Half',
        minute: "46'",
        minuteNumber: 46,
        order: 6,
      },
      {
        id: 's46b',
        kind: 'goal',
        player: 'Pulisic',
        phase: 'Second Half',
        minute: "46'",
        minuteNumber: 46,
        order: 7,
      },
    ];
    const markup = render(<MatchTimeline events={matchEvents} />);
    expect(countSlot(markup, 'match-timeline-phase')).toBe(2);
    expect(markup.indexOf('data-phase="Second Half"')).toBeLessThan(
      markup.indexOf('data-phase="First Half"')
    );
    expect((markup.match(/data-phase="First Half"/g) || []).length).toBe(1);
  });
});

describe('groupByPhase', () => {
  it('coalesces runs of the same phase but splits when it changes', () => {
    const groups = groupByPhase([
      { kind: 'goal', player: 'A', phase: 'First Half' },
      { kind: 'goal', player: 'B', phase: 'First Half' },
      { kind: 'half_time', player: 'HT', phase: 'Half Time' },
      { kind: 'goal', player: 'C', phase: 'First Half' },
    ]);
    expect(groups).toHaveLength(3);
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].phase).toBe('Half Time');
    expect(groups[2].events).toHaveLength(1);
  });

  it('treats undefined phases as their own group key', () => {
    const groups = groupByPhase([
      { kind: 'goal', player: 'A' },
      { kind: 'goal', player: 'B' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].phase).toBeUndefined();
  });
});
