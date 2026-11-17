import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';

import {
  MatchEventList,
  MatchStrip,
  MatchTimelineStack,
  type MatchStripEvent,
} from './match-strip';
import {
  BUSY_GAME,
  EXTRA_TIME_GAME,
  OWN_GOAL_GAME,
  QUIET_GAME,
  RED_CARDS_GAME,
} from './match-strip.fixtures';

const meta = preview.meta({
  title: 'GameCentre/MatchStrip',
  component: MatchTimelineStack,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
});

/** A plain disc for a crest, so the stories need no network. */
const crest = (letter: string) => (
  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-semibold text-white">
    {letter}
  </span>
);

/** Initials on a disc for a headshot. */
const headshot = (e: MatchStripEvent) => (
  <span className="flex items-center justify-center bg-white/15 text-[11px] font-semibold text-white">
    {(e.playerName ?? '?')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')}
  </span>
);

const frame = (children: ReactNode, width = 680) => (
  <div className="max-w-full bg-[#0d0d0d] p-4" style={{ width }}>
    {children}
  </div>
);

const stack = (events: MatchStripEvent[], width = 680, extraTime?: boolean) =>
  frame(
    <MatchTimelineStack
      events={events}
      extraTime={extraTime}
      homeCrest={crest('H')}
      awayCrest={crest('A')}
      homeLabel="Home"
      awayLabel="Away"
      renderHeadshot={headshot}
      playerHref={(e) => (e.playerId ? `#${e.playerId}` : undefined)}
    />,
    width
  );

/** Everton 1-0 Ipswich Town: one goal and a second yellow. Yellows and subs stay off. */
export const QuietGame = meta.story({
  args: { events: QUIET_GAME },
  render: () => stack(QUIET_GAME),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Second yellow')).toBeTruthy();
    await expect(canvasElement.querySelectorAll('[data-slot="match-event-row"]')).toHaveLength(2);
  },
});

/** Manchester United 4-4 Aston Villa: 90+2' and 90+6' sit apart on the stoppage run-on. */
export const BusyFourFour = meta.story({
  args: { events: BUSY_GAME },
  render: () => stack(BUSY_GAME),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dot = canvas.getByRole('button', { name: "Dorgu 90+6', 4-4" });
    await userEvent.click(dot);
    await expect(dot.getAttribute('aria-pressed')).toBe('true');
    const row = canvasElement.querySelector('[data-selected="true"]');
    await expect(row?.textContent).toContain('Dorgu');
  },
});

/** The 4-4 at phone width. */
export const BusyFourFourPhone = meta.story({
  args: { events: BUSY_GAME },
  render: () => stack(BUSY_GAME, 358),
});

/** Brighton 4-0 Aston Villa: the own goal is a hollow ring with no assist; 30' and 31' nudge apart. */
export const OwnGoal = meta.story({
  args: { events: OWN_GOAL_GAME },
  render: () => stack(OWN_GOAL_GAME, 358),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Own goal')).toBeTruthy();
  },
});

/** Brentford 1-2 Liverpool: a red at 45+8' in the first half's stoppage, a second yellow at 90+2'. */
export const RedCards = meta.story({
  args: { events: RED_CARDS_GAME },
  render: () => stack(RED_CARDS_GAME, 358),
});

/** Stoppage time on both halves, read off the events. */
export const StoppageTime = meta.story({
  args: { events: RED_CARDS_GAME },
  render: () =>
    frame(
      <MatchStrip
        events={[...RED_CARDS_GAME, ...BUSY_GAME.filter((e) => e.minuteLabel.startsWith('90+'))]}
        homeCrest={crest('H')}
        awayCrest={crest('A')}
      />
    ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('[data-slot="match-strip-stoppage"]')).toHaveLength(
      2
    );
  },
});

/** A tie that went to extra time: two more segments, each with its own run-on. */
export const ExtraTime = meta.story({
  args: { events: EXTRA_TIME_GAME, extraTime: true },
  render: () => stack(EXTRA_TIME_GAME, 680, true),
});

/** The list alone, with no links. */
export const ListOnly = meta.story({
  args: { events: BUSY_GAME },
  render: () => frame(<MatchEventList events={BUSY_GAME} renderHeadshot={headshot} />, 358),
});
