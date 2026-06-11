import preview from '#.storybook/preview';

import { PredictionLeaderboardPanel } from './prediction-leaderboard-panel';

const meta = preview.meta({
  title: 'GameCentre/PredictionLeaderboardPanel',
  component: PredictionLeaderboardPanel,
  tags: ['autodocs'],
});

const TOP_ENTRIES = [
  { rank: 1, userHandle: 'jamieg', userName: 'Jamie Goodall', points: 102 },
  { rank: 2, userHandle: 'priya', userName: 'Priya Khan', points: 97 },
  { rank: 3, userHandle: 'mira', userName: 'Mira Park', points: 92 },
  { rank: 4, userHandle: 'tomr', userName: 'Tom Rowland', points: 88 },
  { rank: 5, userHandle: 'leah', userName: 'Leah Singh', points: 81 },
];

export const Populated = meta.story({
  name: 'Populated · viewer out of top 5',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: TOP_ENTRIES,
    viewerEntry: { rank: 12, userHandle: 'tommy', userName: 'Tommy', points: 26 },
    pendingNote: 'Pending GW7 · Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

export const ViewerInTop = meta.story({
  name: 'Viewer is rank 3',
  args: {
    leagueLabel: 'Premier League Round 38',
    squadHandle: 'breakingthelines',
    entries: [
      TOP_ENTRIES[0],
      TOP_ENTRIES[1],
      { ...TOP_ENTRIES[2], isViewer: true },
      TOP_ENTRIES[3],
      TOP_ENTRIES[4],
    ],
    pendingNote: 'Pending GW38 · Picks lock at kickoff in 03:42:18',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

export const StandingsGap = meta.story({
  name: 'No standings yet · degrades honestly',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: [],
    emptyMessage: 'Standings appear once the first gameweek closes.',
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

export const ColdStart = meta.story({
  name: 'Cold start · be the first',
  args: {
    leagueLabel: 'Athletic Sweep',
    squadHandle: 'theathletic',
    entries: [],
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});
