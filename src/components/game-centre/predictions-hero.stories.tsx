import preview from '#.storybook/preview';

import { PredictionsHero } from './predictions-hero';

const meta = preview.meta({
  title: 'GameCentre/PredictionsHero',
  component: PredictionsHero,
  tags: ['autodocs'],
  argTypes: {
    state: { control: 'select', options: ['scheduled', 'live', 'finished'] },
    countdownPhase: {
      control: 'select',
      options: ['far', 'days', 'hours', 'imminent', 'live', 'finished'],
    },
  },
});

const cta = (
  <button
    type="button"
    className="inline-flex items-center gap-2 rounded-md border border-[var(--color-red-100)]/35 bg-[var(--color-red-100)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-red-100)] transition-colors hover:border-[var(--color-red-100)]/55"
  >
    Make your pick
  </button>
);

export const ScheduledFar = meta.story({
  name: 'Scheduled · 6d out',
  args: {
    state: 'scheduled',
    caption: 'Premier League · Matchday 12',
    countdownLabel: '6d 2h',
    countdownPhase: 'days',
    stakesTotal: 8,
    cta,
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionsHero {...args} />
    </div>
  ),
});

export const ScheduledImminent = meta.story({
  name: 'Scheduled · T-12 minutes (imminent)',
  args: {
    state: 'scheduled',
    caption: 'Premier League · Matchday 12',
    countdownLabel: '12m',
    countdownPhase: 'imminent',
    stakesTotal: 8,
    cta,
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionsHero {...args} />
    </div>
  ),
});

export const Live = meta.story({
  name: 'Live · 67th minute',
  args: {
    state: 'live',
    caption: 'Premier League · Matchday 12',
    liveClock: "67'",
    scoreLine: '1 — 0',
    matchLabel: 'Arsenal v Spurs',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionsHero {...args} />
    </div>
  ),
});

export const FinishedWithPick = meta.story({
  name: 'Finished · 4 of 8 pts earned',
  args: {
    state: 'finished',
    caption: 'Premier League · Matchday 12',
    matchLabel: 'Arsenal v Spurs',
    scoreLine: '2 — 1',
    pointsEarned: 4,
    pointsAvailable: 8,
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionsHero {...args} />
    </div>
  ),
});

export const FinishedNoPick = meta.story({
  name: "Finished · viewer didn't pick",
  args: {
    state: 'finished',
    caption: 'Premier League · Matchday 12',
    matchLabel: 'Arsenal v Spurs',
    scoreLine: '2 — 1',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionsHero {...args} />
    </div>
  ),
});
