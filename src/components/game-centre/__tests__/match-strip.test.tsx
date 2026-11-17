import { describe, expect, it } from 'vitest';

import {
  MatchEventList,
  MatchStrip,
  MatchTimelineStack,
  matchEventListRows,
  matchStripDotLabel,
  matchStripEnd,
  matchStripLayout,
  matchStripMinute,
  matchStripOffset,
  matchStripPhase,
  sortMatchStripEvents,
  type MatchStripEvent,
} from '../match-strip';
import {
  BUSY_GAME,
  EXTRA_TIME_GAME,
  OWN_GOAL_GAME,
  QUIET_GAME,
  RED_CARDS_GAME,
} from '../match-strip.fixtures';
import { countSlot, getSlotAttr, render, slotText } from './test-utils';

const ev = (minuteLabel: string, minute = 0): MatchStripEvent => ({
  id: minuteLabel,
  kind: 'goal',
  side: 'home',
  minute,
  minuteLabel,
});

describe('minutes', () => {
  it('reads the minute and stoppage minute from the label', () => {
    expect(matchStripMinute(ev('90+6'))).toEqual({ base: 90, added: 6 });
    expect(matchStripMinute(ev('61'))).toEqual({ base: 61, added: 0 });
    expect(matchStripMinute(ev('', 33))).toEqual({ base: 33, added: 0 });
  });

  it('puts 45+5 in the first half and 90+6 in the second', () => {
    expect(matchStripPhase(ev('45+5'))).toBe(1);
    expect(matchStripPhase(ev('46'))).toBe(2);
    expect(matchStripPhase(ev('90+6'))).toBe(2);
    expect(matchStripPhase(ev('98'))).toBe(3);
    expect(matchStripPhase(ev('120+1'))).toBe(4);
    expect(matchStripPhase(ev('92'), false)).toBe(2);
  });

  it('sorts by minute, then stoppage minute', () => {
    const sorted = sortMatchStripEvents([ev('90+6'), ev('45+8'), ev('90+2'), ev('45+5'), ev('46')]);
    expect(sorted.map((e) => e.minuteLabel)).toEqual(['45+5', '45+8', '46', '90+2', '90+6']);
  });

  it('keeps a 90+6 goal in normal time', () => {
    expect(matchStripEnd([ev('90+6', 96)])).toBe(90);
    expect(matchStripEnd([ev('105', 105)])).toBe(120);
    expect(matchStripEnd([ev('90+6', 96)], true)).toBe(120);
  });
});

describe('matchStripLayout', () => {
  it('runs each half on by its stoppage time', () => {
    const layout = matchStripLayout(BUSY_GAME);
    expect(layout.segments.map((s) => [s.phase, s.length, s.stoppage])).toEqual([
      [1, 45, 0],
      [2, 45, 7],
    ]);
    expect(layout.total).toBe(97);
  });

  it('keeps 90+2 and 90+6 apart, in order, after 90', () => {
    const layout = matchStripLayout(BUSY_GAME);
    const at = (label: string) =>
      matchStripOffset(BUSY_GAME.find((e) => e.minuteLabel === label)!, layout).at;
    expect(at('90+2')).toBe(92);
    expect(at('90+6')).toBe(96);
    expect(at('53')).toBe(53);
  });

  it('keeps 45+8 in the first half, after 45+5', () => {
    const layout = matchStripLayout(RED_CARDS_GAME);
    expect(layout.segments[0]!.stoppage).toBe(8);
    const red = RED_CARDS_GAME.find((e) => e.minuteLabel === '45+8')!;
    expect(matchStripOffset(red, layout)).toEqual({ segment: 0, at: 53 });
    const second = RED_CARDS_GAME.find((e) => e.minuteLabel === '62')!;
    expect(matchStripOffset(second, layout)).toEqual({ segment: 1, at: 53 + 17 });
  });

  it('adds the extra time segments', () => {
    const layout = matchStripLayout(EXTRA_TIME_GAME);
    expect(layout.segments.map((s) => s.phase)).toEqual([1, 2, 3, 4]);
    expect(layout.segments[1]!.stoppage).toBe(4);
    expect(layout.segments[3]!.stoppage).toBe(1);
  });
});

describe('MatchStrip', () => {
  it('renders nothing without events', () => {
    expect(render(<MatchStrip events={[]} />)).toBe('');
  });

  it('draws goals and red cards only, with no names', () => {
    const markup = render(<MatchStrip events={QUIET_GAME} />);
    expect(countSlot(markup, 'match-strip-mark')).toBe(2);
    expect(markup).not.toContain('Barry</');
    expect(getSlotAttr(markup, 'match-strip', 'data-end')).toBe('90');
  });

  it('draws the half ticks and the stoppage run-on', () => {
    const markup = render(<MatchStrip events={BUSY_GAME} />);
    expect(countSlot(markup, 'match-strip-segment')).toBe(2);
    expect(countSlot(markup, 'match-strip-stoppage')).toBe(1);
    expect(markup).toContain('45&#x27;');
    expect(markup).toContain('90&#x27;');
    expect(markup).not.toContain('120&#x27;');
  });

  it('draws the crests at the start of each lane', () => {
    const markup = render(
      <MatchStrip
        events={BUSY_GAME}
        homeCrest={<img alt="" src="/h.png" />}
        awayCrest={<img alt="" src="/a.png" />}
        homeLabel="Manchester United"
        awayLabel="Aston Villa"
      />
    );
    expect(getSlotAttr(markup, 'match-strip-home', 'aria-label')).toBe('Manchester United');
    expect(markup).toContain('src="/a.png"');
  });

  it('draws buttons only with a handler', () => {
    expect(render(<MatchStrip events={BUSY_GAME} />)).not.toContain('<button');
    const markup = render(<MatchStrip events={BUSY_GAME} onSelectEvent={() => {}} />);
    expect(markup.match(/<button/g)).toHaveLength(8);
    expect(markup).toContain('aria-label="Dorgu 90+6&#x27;, 4-4"');
    expect(markup).toContain('aria-label="Fernandes 16&#x27;, Penalty, 1-2"');
  });

  it('still takes the 0.114 props', () => {
    const markup = render(
      <MatchStrip
        events={BUSY_GAME}
        showDetail={false}
        homeColor="#f00"
        renderHeadshot={() => null}
      />
    );
    expect(countSlot(markup, 'match-strip-mark')).toBe(8);
  });
});

describe('matchEventListRows', () => {
  it('lists goals and reds in order with the running score', () => {
    const rows = matchEventListRows(BUSY_GAME);
    expect(rows.map((r) => `${r.event.minuteLabel} ${r.score} ${r.how ?? ''}`)).toEqual([
      '1 0-1 Assist McGinn',
      '4 0-2 ',
      '16 1-2 Penalty',
      '44 2-2 Assist Mazraoui',
      '48 2-3 Penalty',
      '53 2-4 Assist Jackson',
      '90+2 3-4 Assist Dorgu',
      '90+6 4-4 Assist Fernandes',
    ]);
  });

  it('reads an own goal with no assist, and red cards without a score', () => {
    const rows = matchEventListRows(OWN_GOAL_GAME);
    expect(rows[0]).toMatchObject({ how: 'Own goal', score: '1-0' });
    expect(rows.at(-1)!.how).toBe('Red card');
    expect(rows.at(-1)!.score).toBeUndefined();
    const quiet = matchEventListRows(QUIET_GAME);
    expect(quiet.map((r) => r.how)).toEqual(['Assist Tarkowski', 'Second yellow']);
  });

  it('counts the score in match order, whatever the feed order', () => {
    const rows = matchEventListRows(BUSY_GAME.map((_, i) => BUSY_GAME[BUSY_GAME.length - 1 - i]!));
    expect(rows.map((r) => r.score)).toEqual([
      '0-1',
      '0-2',
      '1-2',
      '2-2',
      '2-3',
      '2-4',
      '3-4',
      '4-4',
    ]);
  });

  it('labels a dot', () => {
    const rows = matchEventListRows(RED_CARDS_GAME);
    expect(rows.map(matchStripDotLabel)).toEqual([
      "Lewis-Potter 44', 1-0",
      "Yarmolyuk 45+8', Red card",
      "Villanueva 62', 1-1",
      "Isak 70', 1-2",
      "Janelt 90+2', Second yellow",
    ]);
  });
});

describe('MatchEventList', () => {
  it('heads each half and leaves out subs and yellows', () => {
    const markup = render(<MatchEventList events={RED_CARDS_GAME} />);
    expect(countSlot(markup, 'match-event-phase')).toBe(2);
    expect(markup).toContain('First half');
    expect(markup).toContain('Second half');
    expect(countSlot(markup, 'match-event-row')).toBe(5);
    expect(markup).not.toContain('match-event-name" class="truncate">Barcola');
  });

  it('heads only the phases with rows, extra time included', () => {
    const markup = render(<MatchEventList events={EXTRA_TIME_GAME} />);
    expect(markup).not.toContain('Extra time, first half');
    expect(markup).toContain('Extra time, second half');
  });

  it('links rows with a player page and leaves the rest plain', () => {
    const markup = render(
      <MatchEventList
        events={QUIET_GAME}
        playerHref={(e) => (e.kind === 'goal' ? `/p/${e.playerId}` : undefined)}
        renderHeadshot={(e) => <img alt="" src={`/h/${e.playerId}.png`} />}
      />
    );
    expect(countSlot(markup, 'match-event-link')).toBe(1);
    expect(markup).toContain('href="/p/p-thierno-barry"');
    expect(markup).toContain('src="/h/p-thierno-barry.png"');
    expect(slotText(markup, 'match-event-score')).toBe('1-0');
  });

  it('marks the selected row', () => {
    const markup = render(<MatchEventList events={QUIET_GAME} selectedId={QUIET_GAME[0]!.id} />);
    expect(markup).toContain('data-selected="true"');
  });

  it('uses hyphens and no dashes', () => {
    const markup = render(<MatchTimelineStack events={BUSY_GAME} />);
    expect(markup).not.toMatch(/[–—]/);
    expect(markup).toContain('4-4');
  });
});
