import preview from '#.storybook/preview';

import { PredictionStakesBadge } from './prediction-stakes-badge';

const meta = preview.meta({
  title: 'GameCentre/PredictionStakesBadge',
  component: PredictionStakesBadge,
  tags: ['autodocs'],
  argTypes: {
    tone: { control: 'select', options: ['default', 'muted', 'total'] },
    modifier: { control: 'select', options: ['pt', 'pts', 'each'] },
  },
});

export const ResultSingular = meta.story({
  name: '+1 pt (Result)',
  args: { points: 1, modifier: 'pt' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white">Outcome</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const ResultPlural = meta.story({
  name: '+3 pts (Result)',
  args: { points: 3, modifier: 'pts' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white">Outcome</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const ExactScore = meta.story({
  name: '+5 pts (Exact score)',
  args: { points: 5, modifier: 'pts' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white">Exact score</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const EachSingular = meta.story({
  name: '+1 pt each (per-pick)',
  args: { points: 1, modifier: 'each' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white">Bookings</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const EachPlural = meta.story({
  name: '+2 pts each (Goalscorers)',
  args: { points: 2, modifier: 'each' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white">Goalscorers</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const TotalBanner = meta.story({
  name: 'Total (stakes banner)',
  args: { points: 20, modifier: 'pts', tone: 'total' },
  render: (args) => (
    <div className="bg-grey-200 flex w-[480px] items-center gap-3 rounded-[4px] border border-white/5 p-5">
      <PredictionStakesBadge {...args} />
      <span className="font-content text-xs text-white/55">on the table this match</span>
    </div>
  ),
});

export const Muted = meta.story({
  args: { points: 1, modifier: 'pt', tone: 'muted' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-baseline gap-2 rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-sm font-semibold text-white/55">Bookings (hidden)</span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});
