import preview from '#.storybook/preview';

import { RatingsClubTable } from './ratings-club-table';

const meta = preview.meta({
  title: 'UI/RatingsClubTable',
  component: RatingsClubTable,
  tags: ['autodocs'],
});

const rows = [
  {
    id: 'saka',
    rank: 1,
    subjectLabel: 'Bukayo Saka',
    subjectSecondary: 'Right wing',
    meanValue: 1.8,
    counts: { 1: 14, 2: 8, 3: 3, 4: 1, 5: 0, 6: 0 },
  },
  {
    id: 'odegaard',
    rank: 2,
    subjectLabel: 'Martin Odegaard',
    subjectSecondary: 'Captain',
    meanValue: 2.1,
    counts: { 1: 10, 2: 11, 3: 4, 4: 1, 5: 0, 6: 0 },
  },
  {
    id: 'rice',
    rank: 3,
    subjectLabel: 'Declan Rice',
    subjectSecondary: 'Defensive mid',
    meanValue: 2.6,
    counts: { 1: 6, 2: 9, 3: 7, 4: 3, 5: 1, 6: 0 },
  },
];

export const Default = meta.story({
  render: () => (
    <div className="w-[640px]">
      <RatingsClubTable
        title="Arsenal player ratings"
        eyebrow="Gameweek 32"
        rows={rows}
        totalSubjects={18}
      />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no rated subjects yet)',
  render: () => (
    <div className="w-[640px]">
      <RatingsClubTable
        title="Arsenal player ratings"
        eyebrow="Gameweek 32"
        rows={[]}
        totalSubjects={0}
      />
    </div>
  ),
});
