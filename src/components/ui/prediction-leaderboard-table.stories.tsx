import preview from '#.storybook/preview';

import { PredictionLeaderboardTable } from './prediction-leaderboard-table';

const meta = preview.meta({
  title: 'UI/PredictionLeaderboardTable',
  component: PredictionLeaderboardTable,
  tags: ['autodocs'],
});

const rows = [
  {
    id: '1',
    rank: 1,
    rankDelta: 0,
    memberName: 'Editor One',
    memberHandle: 'editor1',
    points: 248,
    secondaryStat: 'GW32 · 18 pts',
  },
  {
    id: '2',
    rank: 2,
    rankDelta: 1,
    memberName: 'Editor Two',
    memberHandle: 'editor2',
    points: 232,
    secondaryStat: 'GW32 · 22 pts',
  },
  {
    id: '3',
    rank: 3,
    rankDelta: -1,
    memberName: 'Reader You',
    memberHandle: 'you',
    points: 198,
    secondaryStat: 'GW32 · 9 pts',
    isViewer: true,
  },
  {
    id: '4',
    rank: 4,
    rankDelta: 2,
    memberName: 'Editor Four',
    memberHandle: 'editor4',
    points: 184,
    secondaryStat: 'GW32 · 12 pts',
  },
];

export const Default = meta.story({
  render: () => (
    <div className="w-[640px]">
      <PredictionLeaderboardTable
        title="Gameweek 32"
        eyebrow="Premier League Predictor"
        rows={rows}
        totalEntrants={528}
      />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no entries yet)',
  render: () => (
    <div className="w-[640px]">
      <PredictionLeaderboardTable
        title="Gameweek 32"
        eyebrow="Premier League Predictor"
        rows={[]}
        totalEntrants={0}
      />
    </div>
  ),
});

export const WithFooter = meta.story({
  name: 'With pagination footer',
  render: () => (
    <div className="w-[640px]">
      <PredictionLeaderboardTable
        title="Season standings"
        eyebrow="Premier League Predictor"
        rows={rows}
        totalEntrants={528}
        footer={
          <button
            type="button"
            className="h-9 rounded border border-white/[0.12] bg-white/[0.04] px-3 text-sm text-white"
          >
            View full standings
          </button>
        }
      />
    </div>
  ),
});
