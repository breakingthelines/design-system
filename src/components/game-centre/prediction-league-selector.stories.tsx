import preview from '#.storybook/preview';

import { PredictionLeagueSelector } from './prediction-league-selector';

const meta = preview.meta({
  title: 'GameCentre/PredictionLeagueSelector',
  component: PredictionLeagueSelector,
  tags: ['autodocs'],
});

const SINGLE = [
  {
    leagueInstanceId: 'btl-world-cup',
    label: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    joined: true,
  },
];

const MULTI = [
  ...SINGLE,
  {
    leagueInstanceId: 'pl-round-38',
    label: 'Premier League Round 38',
    squadHandle: 'breakingthelines',
    joined: true,
  },
  {
    leagueInstanceId: 'athletic-sweep',
    label: 'Athletic Sweep',
    squadHandle: 'theathletic',
    joined: true,
  },
];

const WITH_OPEN = [
  ...MULTI,
  {
    leagueInstanceId: 'sky-sports-saturday',
    label: 'Sky Sports Saturday',
    squadHandle: 'skysports',
    joined: false,
  },
];

export const SingleLeague = meta.story({
  name: 'Single league · only one to scope to',
  args: {
    value: SINGLE[0].leagueInstanceId,
    options: SINGLE,
    onSelect: () => {},
  },
  render: (args) => (
    <div className="w-[480px] bg-black p-6">
      <PredictionLeagueSelector {...args} />
    </div>
  ),
});

export const MultipleLeagues = meta.story({
  name: 'Multiple leagues · two enrolments',
  args: {
    value: MULTI[1].leagueInstanceId,
    options: MULTI,
    onSelect: () => {},
  },
  render: (args) => (
    <div className="w-[480px] bg-black p-6">
      <PredictionLeagueSelector {...args} />
    </div>
  ),
});

export const WithBrowseAffordance = meta.story({
  name: 'With browse · joined + open leagues',
  args: {
    value: WITH_OPEN[0].leagueInstanceId,
    options: WITH_OPEN,
    onSelect: () => {},
    browse: { route: '/predictions', label: 'Browse leagues' },
  },
  render: (args) => (
    <div className="w-[480px] bg-black p-6">
      <PredictionLeagueSelector {...args} />
    </div>
  ),
});

export const NoLeagues = meta.story({
  name: 'No leagues · disabled trigger',
  args: {
    value: undefined,
    options: [],
    onSelect: () => {},
  },
  render: (args) => (
    <div className="w-[480px] bg-black p-6">
      <PredictionLeagueSelector {...args} />
    </div>
  ),
});
