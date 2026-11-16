import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';

import { MatchStrip, type MatchStripEvent } from './match-strip';

const meta = preview.meta({
  title: 'GameCentre/MatchStrip',
  component: MatchStrip,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
});

const normalTime: MatchStripEvent[] = [
  {
    id: 'y1',
    kind: 'yellow',
    side: 'away',
    minute: 13,
    minuteLabel: '13',
    playerName: 'Moises Caicedo',
    reason: 'Foul',
  },
  {
    id: 'g1',
    kind: 'goal',
    side: 'home',
    minute: 27,
    minuteLabel: '27',
    playerName: 'Declan Rice',
    otherName: 'Bukayo Saka',
    scoreAfter: [1, 0],
  },
  {
    id: 'v1',
    kind: 'var',
    side: 'away',
    minute: 47,
    minuteLabel: '45+2',
    playerName: 'Nicolas Jackson',
    reason: 'Goal cancelled',
  },
  {
    id: 'g2',
    kind: 'own_goal',
    side: 'away',
    minute: 55,
    minuteLabel: '55',
    playerName: 'William Saliba',
    scoreAfter: [1, 1],
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
    id: 's2',
    kind: 'sub',
    side: 'home',
    minute: 68,
    minuteLabel: '68',
    playerName: 'Leandro Trossard',
    otherName: 'Gabriel Martinelli',
  },
  {
    id: 'r1',
    kind: 'red',
    side: 'away',
    minute: 81,
    minuteLabel: '81',
    playerName: 'Wesley Fofana',
    reason: 'Second yellow',
  },
  {
    id: 'pm',
    kind: 'penalty_missed',
    side: 'away',
    minute: 84,
    minuteLabel: '84',
    playerName: 'Cole Palmer',
  },
  {
    id: 'g3',
    kind: 'penalty',
    side: 'home',
    minute: 96,
    minuteLabel: '90+6',
    playerName: 'Bukayo Saka',
    scoreAfter: [2, 1],
  },
];

const extraTime: MatchStripEvent[] = [
  {
    id: 'g1',
    kind: 'goal',
    side: 'home',
    minute: 34,
    minuteLabel: '34',
    playerName: 'Lautaro Martinez',
    scoreAfter: [1, 0],
  },
  {
    id: 'g2',
    kind: 'goal',
    side: 'away',
    minute: 79,
    minuteLabel: '79',
    playerName: 'Robert Lewandowski',
    scoreAfter: [1, 1],
  },
  {
    id: 'y1',
    kind: 'yellow',
    side: 'home',
    minute: 98,
    minuteLabel: '98',
    playerName: 'Nicolo Barella',
  },
  {
    id: 'g3',
    kind: 'penalty',
    side: 'home',
    minute: 121,
    minuteLabel: '120+1',
    playerName: 'Lautaro Martinez',
    scoreAfter: [2, 1],
  },
];

const frame = (children: ReactNode) => (
  <div className="w-[720px] max-w-full bg-[#0d0d0d] p-4">{children}</div>
);

/** A normal-time match whose winner came in stoppage: the strip stays at 90'. */
export const Default = meta.story({
  args: { events: normalTime },
  render: (args) => frame(<MatchStrip {...args} />),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("90'")).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: "13' Yellow card, Moises Caicedo" }));
    await expect(canvas.getByText('Yellow card, Foul')).toBeTruthy();
  },
});

/** Extra time, read from the match: the strip runs to 120'. */
export const ExtraTime = meta.story({
  args: { events: extraTime, extraTime: true },
  render: (args) => frame(<MatchStrip {...args} />),
});

/** A block has no page header, so it names the teams at the strip's ends. */
export const WithTeamNames = meta.story({
  args: { events: normalTime, homeLabel: 'Arsenal', awayLabel: 'Chelsea' },
  render: (args) => frame(<MatchStrip {...args} />),
});

/** For image export: spans instead of buttons, the latest goal fixed open. */
export const Static = meta.story({
  args: { events: normalTime, interactive: false, homeLabel: 'Arsenal', awayLabel: 'Chelsea' },
  render: (args) => frame(<MatchStrip {...args} />),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('button')).toBeNull();
  },
});

/** At phone width the marks crowd, and a second click steps through them. */
export const Phone = meta.story({
  args: { events: normalTime },
  render: (args) => (
    <div className="w-[358px] bg-[#0d0d0d] p-4">
      <MatchStrip {...args} />
    </div>
  ),
});

const crowded: MatchStripEvent[] = [
  {
    id: 'a',
    kind: 'goal',
    side: 'away',
    minute: 42,
    minuteLabel: '42',
    playerName: 'Gabriel Jesus',
    scoreAfter: [0, 1],
  },
  {
    id: 'b',
    kind: 'goal',
    side: 'away',
    minute: 48,
    minuteLabel: '48',
    playerName: 'Noni Madueke',
    scoreAfter: [0, 2],
  },
  {
    id: 'c',
    kind: 'goal',
    side: 'home',
    minute: 6,
    minuteLabel: '6',
    playerName: 'Matheus Cunha',
    scoreAfter: [1, 2],
  },
  {
    id: 'd',
    kind: 'goal',
    side: 'home',
    minute: 9,
    minuteLabel: '9',
    playerName: 'Benjamin Sesko',
    scoreAfter: [2, 2],
  },
  {
    id: 'e',
    kind: 'goal',
    side: 'home',
    minute: 89,
    minuteLabel: '89',
    playerName: 'Jean-Philippe Mateta',
    scoreAfter: [3, 2],
  },
];

/** Goals a few minutes apart stagger, and edge labels stay inside the strip. */
export const CrowdedPhone = meta.story({
  args: { events: crowded },
  render: (args) => (
    <div className="w-[358px] bg-[#0d0d0d]">
      <MatchStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const strip = canvasElement.querySelector('[data-slot="match-strip"]')!.getBoundingClientRect();
    const labels = [...canvasElement.querySelectorAll('[data-slot="match-strip-goal-label"]')];
    for (const label of labels) {
      const box = label.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(strip.left - 0.5);
      await expect(box.right).toBeLessThanOrEqual(strip.right + 0.5);
    }
    const rects = labels.map((l) => l.getBoundingClientRect());
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const [p, q] = [rects[i]!, rects[j]!];
        const overlap =
          p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom;
        await expect(overlap).toBe(false);
      }
    }
  },
});
