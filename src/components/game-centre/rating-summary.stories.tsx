import preview from '#.storybook/preview';

import { RatingSummary, type RatingClubAverage } from './rating-summary';

const meta = preview.meta({
  title: 'GameCentre/RatingSummary',
  component: RatingSummary,
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

const clubs: readonly RatingClubAverage[] = [
  {
    squadHandle: 'theathletic',
    label: 'The Athletic Player Ratings',
    average: 2.4,
    count: 1840,
    route: '/@theathletic/ratings/saka-2026-05-20',
  },
  {
    squadHandle: 'breakingthelines',
    label: 'Breaking The Lines',
    average: 2.1,
    count: 920,
    route: '/@breakingthelines/ratings/saka-2026-05-20',
  },
];

export const Default = meta.story({
  name: 'Ready (full)',
  args: {
    state: 'ready',
    myRating: 2,
    btlAverage: { average: 2.3, count: 412 },
    distribution: { 1: 60, 2: 180, 3: 110, 4: 40, 5: 15, 6: 7 },
    clubAverages: clubs,
    thoughtCount: 36,
    variant: 'full',
  },
  render: (args) => (
    <div className="w-[680px]">
      <RatingSummary {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  args: { state: 'empty' },
  render: (args) => (
    <div className="w-[680px]">
      <RatingSummary {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Empty (List ratings RPC pending)',
  args: {
    state: 'empty',
    fallbackReason: 'LIST_RATINGS_RPC_PENDING',
  },
  render: (args) => (
    <div className="w-[680px]">
      <RatingSummary {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: { state: 'loading' },
  render: (args) => (
    <div className="w-[680px]">
      <RatingSummary {...args} />
    </div>
  ),
});

export const Compact = meta.story({
  name: 'Compact (Arena card)',
  args: {
    state: 'ready',
    btlAverage: { average: 2.5, count: 412 },
    variant: 'compact',
  },
  render: (args) => (
    <div className="w-[340px]">
      <RatingSummary {...args} />
    </div>
  ),
});
