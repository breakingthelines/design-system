import preview from '#.storybook/preview';

import { PredictionLifecycleRecap, type PredictionRecapRow } from './prediction-lifecycle-recap';

const meta = preview.meta({
  title: 'GameCentre/PredictionLifecycleRecap',
  component: PredictionLifecycleRecap,
  tags: ['autodocs'],
});

const correctRows: readonly PredictionRecapRow[] = [
  {
    id: 'outcome',
    label: 'Outcome',
    pickValue: 'Home',
    actualValue: 'Home',
    pointsEarned: 1,
    pointsAvailable: 1,
    status: 'correct',
  },
  {
    id: 'exact',
    label: 'Exact score',
    pickValue: '2 — 0',
    actualValue: '2 — 1',
    pointsEarned: 0,
    pointsAvailable: 3,
    status: 'incorrect',
  },
  {
    id: 'scorers',
    label: 'Goalscorers',
    pickValue: 'Saka, Ødegaard',
    pointsEarned: 2,
    pointsAvailable: 3,
    status: 'partial',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    pickValue: 'Rice',
    pointsEarned: 1,
    pointsAvailable: 3,
    status: 'partial',
  },
];

export const Default = meta.story({
  name: 'Partial settlement · with crowd',
  args: {
    rows: correctRows,
    crowd: { total: 1247, resultHitPct: 41 },
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLifecycleRecap {...args} />
    </div>
  ),
});

export const NoCrowd = meta.story({
  name: 'No crowd data',
  args: {
    rows: correctRows,
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLifecycleRecap {...args} />
    </div>
  ),
});

export const NoPick = meta.story({
  name: "Viewer didn't pick",
  args: {
    rows: [],
    crowd: { total: 1247, resultHitPct: 41 },
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLifecycleRecap {...args} />
    </div>
  ),
});

export const AllCorrect = meta.story({
  name: 'Nailed everything',
  args: {
    rows: correctRows.map((row) => ({
      ...row,
      pointsEarned: row.pointsAvailable,
      status: 'correct' as const,
    })),
    crowd: { total: 1247, resultHitPct: 41 },
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLifecycleRecap {...args} />
    </div>
  ),
});
