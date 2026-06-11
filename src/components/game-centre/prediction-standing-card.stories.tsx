import preview from '#.storybook/preview';

import { PredictionStandingCard } from './prediction-standing-card';

const meta = preview.meta({
  title: 'GameCentre/PredictionStandingCard',
  component: PredictionStandingCard,
  tags: ['autodocs'],
  argTypes: {
    state: { control: 'select', options: ['ready', 'membership', 'not-joined'] },
    gwStatus: {
      control: 'select',
      options: [undefined, 'pending', 'submitted', 'locked', 'settled'],
    },
  },
});

export const Ready = meta.story({
  name: 'Ready · ranked',
  args: {
    state: 'ready',
    leagueName: 'Premier League Predictor',
    squadHandle: 'breakingthelines',
    route: '/@breakingthelines/predictions/pl-predictor',
    rank: 12,
    totalEntrants: 847,
    seasonPoints: 86,
    gwStatus: 'pending',
    gwNumber: 12,
  },
  render: (args) => (
    <div className="w-[320px] bg-black p-6">
      <PredictionStandingCard {...args} />
    </div>
  ),
});

export const Membership = meta.story({
  name: 'Membership · rank wiring pending',
  args: {
    state: 'membership',
    leagueName: 'PL Round 38 League',
    squadHandle: 'breakingthelines',
    route: '/@breakingthelines/predictions/pl-round-38',
    gwStatus: 'pending',
    gwNumber: 38,
  },
  render: (args) => (
    <div className="w-[320px] bg-black p-6">
      <PredictionStandingCard {...args} />
    </div>
  ),
});

export const NotJoined = meta.story({
  name: 'Not joined',
  args: {
    state: 'not-joined',
    leagueName: 'Athletic Sweep',
    squadHandle: 'theathletic',
    route: '/@theathletic/predictions/sweep',
  },
  render: (args) => (
    <div className="w-[320px] bg-black p-6">
      <PredictionStandingCard {...args} />
    </div>
  ),
});

export const Submitted = meta.story({
  name: 'Ready · pick locked in',
  args: {
    state: 'ready',
    leagueName: 'Premier League Predictor',
    squadHandle: 'breakingthelines',
    rank: 12,
    totalEntrants: 847,
    seasonPoints: 86,
    gwStatus: 'submitted',
    gwNumber: 12,
  },
  render: (args) => (
    <div className="w-[320px] bg-black p-6">
      <PredictionStandingCard {...args} />
    </div>
  ),
});
