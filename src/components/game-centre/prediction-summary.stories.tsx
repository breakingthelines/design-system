import preview from '#.storybook/preview';

import { PredictionSummary, type ActivePredictionLeagueRef } from './prediction-summary';

const meta = preview.meta({
  title: 'GameCentre/PredictionSummary',
  component: PredictionSummary,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['empty', 'loading', 'partial', 'ready'],
    },
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
  },
});

const leagues: readonly ActivePredictionLeagueRef[] = [
  {
    squadHandle: 'breakingthelines',
    name: 'PL Round 38 League',
    route: '/@breakingthelines/leagues/pl-round-38',
    viewerEligible: true,
  },
  {
    squadHandle: 'theathletic',
    name: 'Athletic Sweep',
    route: '/@theathletic/leagues/sweep',
    viewerEligible: false,
  },
];

export const Default = meta.story({
  name: 'Ready (full)',
  args: {
    state: 'ready',
    myPick: 'Arsenal 2 — 0',
    pulse: { home: 412, draw: 188, away: 198, total: 798 },
    activeLeagues: leagues,
    variant: 'full',
  },
  render: (args) => (
    <div className="w-[680px]">
      <PredictionSummary {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  args: { state: 'empty' },
  render: (args) => (
    <div className="w-[680px]">
      <PredictionSummary {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'No active league',
  args: {
    state: 'empty',
    fallbackReason: 'NO_ACTIVE_PREDICTION_LEAGUE',
  },
  render: (args) => (
    <div className="w-[680px]">
      <PredictionSummary {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: { state: 'loading' },
  render: (args) => (
    <div className="w-[680px]">
      <PredictionSummary {...args} />
    </div>
  ),
});

export const Compact = meta.story({
  name: 'Compact (Arena card)',
  args: {
    state: 'ready',
    myPick: 'Arsenal 2 — 0',
    pulse: { home: 412, draw: 188, away: 198, total: 798 },
    variant: 'compact',
  },
  render: (args) => (
    <div className="w-[340px]">
      <PredictionSummary {...args} />
    </div>
  ),
});
