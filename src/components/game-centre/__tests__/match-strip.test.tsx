import { describe, expect, it } from 'vitest';

import {
  MatchStrip,
  matchStripEnd,
  matchStripLabelRows,
  matchStripPosition,
  type MatchStripEvent,
} from '../match-strip';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const events: readonly MatchStripEvent[] = [
  {
    id: 'y1',
    kind: 'yellow',
    side: 'away',
    minute: 13,
    minuteLabel: '13',
    playerId: 'p1',
    playerName: 'Kai Havertz',
    reason: 'Foul',
  },
  {
    id: 'g1',
    kind: 'goal',
    side: 'home',
    minute: 27,
    minuteLabel: '27',
    playerId: 'p2',
    playerName: 'Declan Rice',
    otherId: 'p3',
    otherName: 'Viktor Gyokeres',
    scoreAfter: [1, 0],
  },
  {
    id: 's1',
    kind: 'sub',
    side: 'home',
    minute: 68,
    minuteLabel: '68',
    playerName: 'Ethan Nwaneri',
    otherName: 'Bukayo Saka',
  },
  {
    id: 'g2',
    kind: 'penalty',
    side: 'away',
    minute: 96,
    minuteLabel: '90+6',
    playerId: 'p4',
    playerName: 'Cole Palmer',
    scoreAfter: [1, 1],
  },
];

const ev = (minute: number, minuteLabel: string): MatchStripEvent => ({
  id: minuteLabel,
  kind: 'goal',
  side: 'home',
  minute,
  minuteLabel,
});

describe('matchStripEnd', () => {
  it('keeps a 90+6 goal on a 90 minute strip', () => {
    expect(matchStripEnd([ev(96, '90+6')])).toBe(90);
  });

  it('reads extra time from a label past 90', () => {
    expect(matchStripEnd([ev(105, '105')])).toBe(120);
    expect(matchStripEnd([ev(121, '120+1')])).toBe(120);
  });

  it('takes the match signal over the labels', () => {
    expect(matchStripEnd([ev(96, '90+6')], true)).toBe(120);
    expect(matchStripEnd([ev(105, '105')], false)).toBe(90);
  });
});

describe('matchStripPosition', () => {
  it('puts stoppage time on its boundary', () => {
    expect(matchStripPosition(ev(96, '90+6'), 90)).toBe(90);
    expect(matchStripPosition(ev(47, '45+2'), 90)).toBe(45);
    expect(matchStripPosition(ev(121, '120+1'), 120)).toBe(120);
    expect(matchStripPosition(ev(96, '90+6'), 120)).toBe(90);
  });

  it('keeps a plain minute and clamps past the end', () => {
    expect(matchStripPosition(ev(61, '61'), 90)).toBe(61);
    expect(matchStripPosition(ev(97, '97'), 90)).toBe(90);
  });
});

describe('MatchStrip', () => {
  it('renders nothing without events', () => {
    expect(render(<MatchStrip events={[]} />)).toBe('');
  });

  it('draws a 90 minute strip for a stoppage-time goal', () => {
    const markup = render(<MatchStrip events={events} />);
    expect(getSlotAttr(markup, 'match-strip', 'data-end')).toBe('90');
    expect(markup).toContain('90&#x27;</span>');
    expect(markup).not.toContain('120&#x27;');
    expect(markup).toContain('Palmer 90+6&#x27; pen');
  });

  it('draws to 120 when the match went to extra time', () => {
    const markup = render(<MatchStrip events={events} extraTime />);
    expect(getSlotAttr(markup, 'match-strip', 'data-end')).toBe('120');
  });

  it('opens the latest goal with the score in hyphens', () => {
    const markup = render(<MatchStrip events={events} />);
    expect(getSlotAttr(markup, 'match-strip-detail', 'data-kind')).toBe('penalty');
    expect(slotText(markup, 'match-strip-detail')).toContain('1-0 to 1-1');
  });

  it('names the assist through renderPlayerName', () => {
    const markup = render(
      <MatchStrip
        events={events.slice(0, 2)}
        renderPlayerName={({ id, name, muted }) => (
          <a href={`/p/${id}`} data-muted={muted}>
            {name}
          </a>
        )}
      />
    );
    expect(markup).toContain('<a href="/p/p2" data-muted="false">Declan Rice</a>');
    expect(markup).toContain('<a href="/p/p3" data-muted="true">Viktor Gyokeres</a>');
    expect(slotText(markup, 'match-strip-detail')).toContain('Goal, assist');
  });

  it('draws one button per event, labelled for screen readers', () => {
    const markup = render(<MatchStrip events={events} />);
    expect(countSlot(markup, 'match-strip-mark')).toBe(4);
    expect(markup.match(/<button/g)).toHaveLength(4);
    expect(markup).toContain('aria-label="13&#x27; Yellow card, Kai Havertz"');
  });

  it('draws no buttons when not interactive', () => {
    const markup = render(<MatchStrip events={events} interactive={false} />);
    expect(markup).not.toContain('<button');
    expect(countSlot(markup, 'match-strip-mark')).toBe(4);
    expect(getSlotAttr(markup, 'match-strip', 'data-interactive')).toBe('false');
  });

  it('leaves the detail line out on request', () => {
    const markup = render(<MatchStrip events={events} showDetail={false} />);
    expect(hasSlot(markup, 'match-strip-detail')).toBe(false);
  });

  it('names the teams at the ends only when given', () => {
    expect(hasSlot(render(<MatchStrip events={events} />), 'match-strip-home')).toBe(false);
    const markup = render(<MatchStrip events={events} homeLabel="Arsenal" awayLabel="Chelsea" />);
    expect(slotText(markup, 'match-strip-home')).toBe('Arsenal');
    expect(slotText(markup, 'match-strip-away')).toBe('Chelsea');
  });
});

const goal = (id: string, side: 'home' | 'away', minute: number, playerName: string) =>
  ({ id, kind: 'goal', side, minute, minuteLabel: `${minute}`, playerName }) as const;

describe('matchStripLabelRows', () => {
  it('staggers labels a few minutes apart on a phone, not on a large strip', () => {
    const rows = matchStripLabelRows(
      [goal('a', 'away', 42, 'Gabriel Jesus'), goal('b', 'away', 52, 'Noni Madueke')],
      90
    );
    expect(rows.narrow).toEqual({ a: 0, b: 1 });
    expect(rows.large).toEqual({ a: 0, b: 0 });
  });

  it('keeps sides apart and labels far apart by the line', () => {
    const rows = matchStripLabelRows(
      [
        goal('a', 'home', 10, 'Bukayo Saka'),
        goal('b', 'away', 12, 'Cole Palmer'),
        goal('c', 'home', 70, 'Declan Rice'),
      ],
      90
    );
    expect(rows.narrow).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('returns to the first row once it is clear', () => {
    const rows = matchStripLabelRows(
      [
        goal('a', 'home', 20, 'Cunha'),
        goal('b', 'home', 24, 'Sesko'),
        goal('c', 'home', 60, 'Mainoo'),
      ],
      90
    );
    expect(rows.narrow).toEqual({ a: 0, b: 1, c: 0 });
  });
});

describe('goal labels', () => {
  it('clamps a late goal label inside the strip', () => {
    const markup = render(
      <MatchStrip
        events={[
          {
            id: 'g',
            kind: 'goal',
            side: 'home',
            minute: 89,
            minuteLabel: '89',
            playerName: 'Mateta',
          },
        ]}
      />
    );
    const left = getSlotAttr(markup, 'match-strip-goal-label', 'style') ?? '';
    expect(left).toContain('clamp(0px,');
    expect(left).toContain('calc(100% - ');
  });

  it('puts a staggered label one row out', () => {
    const markup = render(
      <MatchStrip
        events={[
          {
            id: 'a',
            kind: 'goal',
            side: 'away',
            minute: 42,
            minuteLabel: '42',
            playerName: 'Jesus',
          },
          {
            id: 'b',
            kind: 'goal',
            side: 'away',
            minute: 48,
            minuteLabel: '48',
            playerName: 'Madueke',
          },
        ]}
      />
    );
    expect(markup).toContain('data-row="1"');
    expect(markup).toContain('top-[100px]');
  });
});
