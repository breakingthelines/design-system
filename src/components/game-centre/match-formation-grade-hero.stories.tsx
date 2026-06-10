import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  MatchFormationGradeHero,
  type MatchFormationGradeHeroTeam,
  type PlayerGradeMarker,
} from './match-formation-grade-hero';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchFormationGradeHero stories
 *
 * Top-of-Gradings-tab hero (Wave 6.4.5). Mini formation pitch with the
 * top-graded player visually emphasised via a red ring + GradeBox overlay.
 * Replaces the single-player "best grade" / PotM block at the top of the
 * Match Centre Gradings sub-tab.
 * ──────────────────────────────────────────────────────────────────────────── */

const arsenal: MatchFormationGradeHeroTeam = {
  name: 'Arsenal',
  formation: '4-3-3',
  players: [
    { id: 'gk', name: 'Raya', jerseyNumber: 22, positionSlot: 1, grade: 3 },
    { id: 'rb', name: 'White', jerseyNumber: 4, positionSlot: 2, grade: 2 },
    { id: 'rcb', name: 'Saliba', jerseyNumber: 12, positionSlot: 3, grade: 1 },
    { id: 'lcb', name: 'Magalhães', jerseyNumber: 6, positionSlot: 4, grade: 2 },
    { id: 'lb', name: 'Lewis', jerseyNumber: 15, positionSlot: 5, grade: 3 },
    { id: 'dm', name: 'Rice', jerseyNumber: 41, positionSlot: 6, grade: 1 },
    { id: 'cm', name: 'Ødegaard', jerseyNumber: 8, positionSlot: 7, grade: 2 },
    { id: 'lm', name: 'Havertz', jerseyNumber: 29, positionSlot: 8, grade: 4 },
    { id: 'rw', name: 'Saka', jerseyNumber: 7, positionSlot: 9, grade: 1 },
    { id: 'cf', name: 'Martinelli', jerseyNumber: 11, positionSlot: 10, grade: 3 },
    { id: 'lw', name: 'Trossard', jerseyNumber: 19, positionSlot: 11, grade: 2 },
  ] satisfies PlayerGradeMarker[],
};

const chelsea: MatchFormationGradeHeroTeam = {
  name: 'Chelsea',
  formation: '4-2-3-1',
  players: [
    { id: 'cgk', name: 'Sánchez', jerseyNumber: 1, positionSlot: 1, grade: 4 },
    { id: 'crb', name: 'Gusto', jerseyNumber: 27, positionSlot: 2, grade: 5 },
    { id: 'crcb', name: 'Disasi', jerseyNumber: 2, positionSlot: 3, grade: 4 },
    { id: 'clcb', name: 'Colwill', jerseyNumber: 26, positionSlot: 4, grade: 3 },
    { id: 'clb', name: 'Cucurella', jerseyNumber: 3, positionSlot: 5, grade: 4 },
    { id: 'cdm1', name: 'Caicedo', jerseyNumber: 25, positionSlot: 6, grade: 2 },
    { id: 'cdm2', name: 'Enzo', jerseyNumber: 8, positionSlot: 7, grade: 3 },
    { id: 'cam1', name: 'Mudryk', jerseyNumber: 15, positionSlot: 8, grade: 4 },
    { id: 'cam2', name: 'Palmer', jerseyNumber: 20, positionSlot: 9, grade: 2 },
    { id: 'cam3', name: 'Sterling', jerseyNumber: 7, positionSlot: 10, grade: 3 },
    { id: 'cs', name: 'Jackson', jerseyNumber: 15, positionSlot: 11, grade: 5 },
  ] satisfies PlayerGradeMarker[],
};

const meta: Meta<typeof MatchFormationGradeHero> = {
  title: 'Game Centre / MatchFormationGradeHero',
  component: MatchFormationGradeHero,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Top-of-Gradings-tab hero. Mini formation pitch with the top-graded marker ringed in BTL red and a GradeBox overlay. Home/away switcher uses the glass-pill pattern.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minWidth: 480, width: 640 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MatchFormationGradeHero>;

export const Default: Story = {
  args: {
    teams: { home: arsenal, away: chelsea },
  },
};

export const StartingOnAway: Story = {
  args: {
    teams: { home: arsenal, away: chelsea },
    defaultSide: 'away',
  },
};

export const NoGradesYet: Story = {
  args: {
    teams: {
      home: {
        ...arsenal,
        players: arsenal.players.map((p) => ({ ...p, grade: undefined })),
      },
      away: {
        ...chelsea,
        players: chelsea.players.map((p) => ({ ...p, grade: undefined })),
      },
    },
  },
};

export const EmptyLineup: Story = {
  args: {
    teams: {
      home: { name: 'Arsenal', players: [] },
      away: { name: 'Chelsea', players: [] },
    },
  },
};
