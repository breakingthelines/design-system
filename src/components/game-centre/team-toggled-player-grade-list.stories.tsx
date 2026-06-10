import preview from '#.storybook/preview';

import { TeamToggledPlayerGradeList, type PlayerGradeRow } from './team-toggled-player-grade-list';

const meta = preview.meta({
  title: 'GameCentre/TeamToggledPlayerGradeList',
  component: TeamToggledPlayerGradeList,
  tags: ['autodocs'],
});

const home: readonly PlayerGradeRow[] = [
  { id: 'h1', name: 'D. Raya', grade: 3 },
  { id: 'h2', name: 'B. White', grade: 2 },
  { id: 'h3', name: 'G. Magalhães', grade: 2 },
  { id: 'h4', name: 'W. Saliba', grade: 1 },
  { id: 'h5', name: 'M. Lewis', grade: 3 },
  { id: 'h6', name: 'D. Rice', grade: 1 },
  { id: 'h7', name: 'M. Ødegaard', grade: 2 },
  { id: 'h8', name: 'K. Havertz', grade: 4 },
  { id: 'h9', name: 'B. Saka', grade: 1 },
  { id: 'h10', name: 'G. Martinelli', grade: 3 },
  { id: 'h11', name: 'L. Trossard', grade: 2 },
  { id: 'h12', name: 'F. Vieira', grade: 4, isSub: true },
  { id: 'h13', name: 'J. Timber', grade: 3, isSub: true },
];

const away: readonly PlayerGradeRow[] = [
  { id: 'a1', name: 'R. Sánchez', grade: 4 },
  { id: 'a2', name: 'M. Gusto', grade: 5 },
  { id: 'a3', name: 'A. Disasi', grade: 4 },
  { id: 'a4', name: 'L. Colwill', grade: 3 },
  { id: 'a5', name: 'B. Chilwell', grade: 4 },
  { id: 'a6', name: 'E. Fernández', grade: 3 },
  { id: 'a7', name: 'M. Caicedo', grade: 2 },
  { id: 'a8', name: 'C. Palmer', grade: 1 },
  { id: 'a9', name: 'N. Jackson', grade: 4 },
  { id: 'a10', name: 'C. Sterling', grade: 5 },
  { id: 'a11', name: 'M. Mudryk', grade: 5 },
  { id: 'a12', name: 'C. Gallagher', grade: 6, isSub: true },
];

export const Default = meta.story({
  name: 'Default (home)',
  args: {
    teams: { home, away },
    homeLabel: 'Arsenal',
    awayLabel: 'Chelsea',
  },
  render: (args) => (
    <div className="w-[460px]">
      <TeamToggledPlayerGradeList {...args} />
    </div>
  ),
});

export const AwayDefault = meta.story({
  name: 'Default (away)',
  args: {
    teams: { home, away },
    homeLabel: 'Arsenal',
    awayLabel: 'Chelsea',
    defaultSide: 'away',
  },
  render: (args) => (
    <div className="w-[460px]">
      <TeamToggledPlayerGradeList {...args} />
    </div>
  ),
});

export const EmptySide = meta.story({
  name: 'Empty side',
  args: {
    teams: { home: [], away },
    homeLabel: 'Arsenal',
    awayLabel: 'Chelsea',
  },
  render: (args) => (
    <div className="w-[460px]">
      <TeamToggledPlayerGradeList {...args} />
    </div>
  ),
});
