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

export const Result = meta.story({
  name: '+1 pt (Result)',
  args: { points: 1, modifier: 'pt' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-center justify-between rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase">
        Outcome
      </span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const ExactScore = meta.story({
  name: '+3 pts (Exact score)',
  args: { points: 3, modifier: 'pts' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-center justify-between rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase">
        Exact score
      </span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const Each = meta.story({
  name: '+1 each (Goalscorers)',
  args: { points: 1, modifier: 'each' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-center justify-between rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase">
        Goalscorers
      </span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});

export const TotalBanner = meta.story({
  name: 'Total (stakes banner)',
  args: { points: 8, modifier: 'pts', tone: 'total' },
  render: (args) => (
    <div className="bg-grey-200 flex w-[480px] items-center gap-3 rounded-[4px] border border-white/5 p-5">
      <PredictionStakesBadge {...args} />
      <span className="font-content text-xs text-white/55">on offer this match</span>
    </div>
  ),
});

export const Muted = meta.story({
  args: { points: 1, modifier: 'pt', tone: 'muted' },
  render: (args) => (
    <div className="bg-grey-200 inline-flex w-[320px] items-center justify-between rounded-[4px] border border-white/5 p-5">
      <span className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase">
        Bookings (hidden)
      </span>
      <PredictionStakesBadge {...args} />
    </div>
  ),
});
