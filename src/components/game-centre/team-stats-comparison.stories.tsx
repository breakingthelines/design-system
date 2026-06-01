import preview from '#.storybook/preview';

import { TeamStatsComparison, type TeamStatRow } from './team-stats-comparison';

const meta = preview.meta({
  title: 'GameCentre/TeamStatsComparison',
  component: TeamStatsComparison,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['ready', 'empty', 'loading'],
    },
  },
});

const rows: readonly TeamStatRow[] = [
  { label: 'Possession %', home: 54.2, away: 45.8, format: 'percent' },
  { label: 'Shots', home: 13, away: 9 },
  { label: 'Shots on Target', home: 2, away: 8 },
  { label: 'Open-Play xT', home: 3.7, away: 5.7, format: 'decimal' },
  { label: 'Pass Completion %', home: 83.9, away: 88.2, format: 'percent' },
  { label: 'Progressive Passes', home: 28, away: 42 },
  { label: 'Progressive Carries', home: 15, away: 28 },
  { label: 'Take-Ons (Won/Att)', home: 6, away: 15, homeText: '6/16', awayText: '15/24' },
  { label: 'Box Entries', home: 6, away: 12 },
  { label: 'Defensive Actions', home: 53, away: 40 },
];

export const Default = meta.story({
  name: 'Ready (Arsenal vs Chelsea)',
  args: {
    homeName: 'Arsenal',
    awayName: 'Chelsea',
    rows,
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[480px]">
      <TeamStatsComparison {...args} />
    </div>
  ),
});

export const BrandColors = meta.story({
  name: 'Ready (custom brand colours)',
  args: {
    homeName: 'Arsenal',
    awayName: 'Chelsea',
    homeColor: '#ef0107',
    awayColor: '#034694',
    rows,
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[480px]">
      <TeamStatsComparison {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no stats contract yet)',
  args: {
    homeName: 'Arsenal',
    awayName: 'Chelsea',
    rows: [],
    state: 'empty',
  },
  render: (args) => (
    <div className="w-[480px]">
      <TeamStatsComparison {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Empty (provider outage)',
  args: {
    homeName: 'Arsenal',
    awayName: 'Chelsea',
    rows: [],
    state: 'empty',
    fallbackReason: 'PROVIDER_OUTAGE',
  },
  render: (args) => (
    <div className="w-[480px]">
      <TeamStatsComparison {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: {
    homeName: 'Arsenal',
    awayName: 'Chelsea',
    rows: [],
    state: 'loading',
  },
  render: (args) => (
    <div className="w-[480px]">
      <TeamStatsComparison {...args} />
    </div>
  ),
});
