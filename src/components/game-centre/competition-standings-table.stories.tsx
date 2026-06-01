import preview from '#.storybook/preview';

import {
  CompetitionStandingsTable,
  type CompetitionStandingsRow,
} from './competition-standings-table';

const meta = preview.meta({
  title: 'GameCentre/CompetitionStandingsTable',
  component: CompetitionStandingsTable,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['ready', 'empty', 'loading'],
    },
  },
});

const rows: readonly CompetitionStandingsRow[] = [
  {
    rank: 1,
    team: { id: 'ars', name: 'Arsenal', href: '/@arsenal' },
    played: 12,
    won: 9,
    drawn: 2,
    lost: 1,
    goalsFor: 28,
    goalsAgainst: 9,
    goalDifference: 19,
    points: 29,
    form: 'WWDWW',
  },
  {
    rank: 2,
    team: { id: 'mci', name: 'Manchester City', href: '/@man-city' },
    played: 12,
    won: 9,
    drawn: 1,
    lost: 2,
    goalsFor: 31,
    goalsAgainst: 12,
    goalDifference: 19,
    points: 28,
    form: 'WLWWW',
  },
  {
    rank: 3,
    team: { id: 'liv', name: 'Liverpool', href: '/@liverpool' },
    played: 12,
    won: 8,
    drawn: 2,
    lost: 2,
    goalsFor: 26,
    goalsAgainst: 13,
    goalDifference: 13,
    points: 26,
    form: 'WDWLW',
  },
  {
    rank: 4,
    team: { id: 'che', name: 'Chelsea', href: '/@chelsea' },
    played: 12,
    won: 6,
    drawn: 4,
    lost: 2,
    goalsFor: 22,
    goalsAgainst: 14,
    goalDifference: 8,
    points: 22,
    form: 'DDWWL',
  },
  {
    rank: 5,
    team: { id: 'new', name: 'Newcastle United', href: '/@newcastle' },
    played: 12,
    won: 5,
    drawn: 3,
    lost: 4,
    goalsFor: 18,
    goalsAgainst: 16,
    goalDifference: 2,
    points: 18,
    form: 'LWDLW',
  },
];

export const Default = meta.story({
  name: 'Ready (with form)',
  args: {
    rows,
    caption: 'Premier League standings',
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[640px]">
      <CompetitionStandingsTable {...args} />
    </div>
  ),
});

export const Highlighted = meta.story({
  name: 'Ready (highlighted team)',
  args: {
    rows,
    caption: 'Premier League standings',
    highlightTeamId: 'che',
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[640px]">
      <CompetitionStandingsTable {...args} />
    </div>
  ),
});

export const NoForm = meta.story({
  name: 'Ready (no form column)',
  args: {
    rows: rows.map((row) => ({ ...row, form: undefined })),
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[560px]">
      <CompetitionStandingsTable {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no data for season)',
  args: {
    rows: [],
    state: 'empty',
  },
  render: (args) => (
    <div className="w-[640px]">
      <CompetitionStandingsTable {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: {
    rows: [],
    state: 'loading',
  },
  render: (args) => (
    <div className="w-[640px]">
      <CompetitionStandingsTable {...args} />
    </div>
  ),
});
