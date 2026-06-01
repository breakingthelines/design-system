import preview from '#.storybook/preview';

import { PlayerOfTheMatchCard } from './player-of-the-match-card';

const meta = preview.meta({
  title: 'GameCentre/PlayerOfTheMatchCard',
  component: PlayerOfTheMatchCard,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['ready', 'empty', 'loading'],
    },
    rating: {
      control: { type: 'number', min: 1, max: 6, step: 0.1 },
    },
  },
});

export const Default = meta.story({
  name: 'Ready (with crest + link)',
  args: {
    name: 'Cole Palmer',
    clubName: 'Chelsea',
    rating: 1.2,
    href: '/@cole-palmer',
  },
  render: (args) => (
    <div className="w-[340px]">
      <PlayerOfTheMatchCard {...args} />
    </div>
  ),
});

export const AggregateRating = meta.story({
  name: 'Ready (fractional aggregate)',
  args: {
    name: 'Bukayo Saka',
    clubName: 'Arsenal',
    rating: 5.2,
  },
  render: (args) => (
    <div className="w-[340px]">
      <PlayerOfTheMatchCard {...args} />
    </div>
  ),
});

export const NoClub = meta.story({
  name: 'Ready (name only)',
  args: {
    name: 'Declan Rice',
    rating: 2,
  },
  render: (args) => (
    <div className="w-[340px]">
      <PlayerOfTheMatchCard {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (POTM not reported)',
  args: {
    name: '',
    state: 'empty',
  },
  render: (args) => (
    <div className="w-[340px]">
      <PlayerOfTheMatchCard {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: {
    name: '',
    state: 'loading',
  },
  render: (args) => (
    <div className="w-[340px]">
      <PlayerOfTheMatchCard {...args} />
    </div>
  ),
});
