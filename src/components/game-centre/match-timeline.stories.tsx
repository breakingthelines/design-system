import preview from '#.storybook/preview';

import { MatchTimeline, type MatchTimelineEvent } from './match-timeline';

const meta = preview.meta({
  title: 'GameCentre/MatchTimeline',
  component: MatchTimeline,
  tags: ['autodocs'],
});

/* Chelsea (away) 2 — 1 Arsenal (home), mirroring the Figma Game Day timeline:
 * phase-grouped, home events left of the axis, away events right. */
const sampleEvents: readonly MatchTimelineEvent[] = [
  {
    id: 'ft',
    minute: 'FT',
    minuteNumber: 97,
    kind: 'full_time',
    player: 'Full Time',
    detail: '1 — 2',
    phase: 'Final Time',
  },
  {
    id: '95-y',
    minute: "95'",
    minuteNumber: 95,
    kind: 'yellow_card',
    player: 'G. Magalhães',
    detail: 'Argument',
    side: 'home',
    phase: 'Additional Time +7',
  },
  {
    id: '92-sub',
    minute: "92'",
    minuteNumber: 92,
    kind: 'substitution',
    player: 'Gyökeres',
    detail: 'K. Havertz off',
    side: 'home',
    phase: 'Additional Time +7',
  },
  {
    id: '85-pen',
    minute: "85'",
    minuteNumber: 85,
    kind: 'penalty_goal',
    player: 'E. Fernández',
    detail: 'Penalty',
    side: 'away',
    phase: 'Additional Time +7',
  },
  {
    id: '83-sub',
    minute: "83'",
    minuteNumber: 83,
    kind: 'substitution',
    player: 'Estêvão',
    detail: 'C. Palmer off',
    side: 'away',
    phase: 'Additional Time +7',
  },
  {
    id: '81-miss',
    minute: "81'",
    minuteNumber: 81,
    kind: 'penalty_missed',
    player: 'C. Palmer',
    detail: 'Saved',
    side: 'away',
    phase: 'Additional Time +7',
  },
  {
    id: '75-2y',
    minute: "75'",
    minuteNumber: 75,
    kind: 'second_yellow_red',
    player: 'Conor Gallagher',
    detail: 'Second Yellow Card',
    side: 'away',
    phase: 'Additional Time +7',
  },
  {
    id: '63-goal',
    minute: "63'",
    minuteNumber: 63,
    kind: 'goal',
    player: 'Harry Kane',
    detail: 'Header from Corner',
    side: 'home',
    phase: 'Additional Time +7',
  },
  {
    id: '55-goal',
    minute: "55'",
    minuteNumber: 55,
    kind: 'goal',
    player: 'C. Palmer',
    side: 'away',
    phase: 'Additional Time +7',
  },
  {
    id: '54-sub',
    minute: "54'",
    minuteNumber: 54,
    kind: 'substitution',
    player: 'Ben White',
    detail: 'Calafiori off',
    side: 'home',
    phase: 'Additional Time +7',
  },
  {
    id: 'ht',
    minute: 'HT',
    minuteNumber: 46,
    kind: 'half_time',
    player: 'Half Time',
    detail: '1 — 0',
    phase: 'Half Time',
  },
  {
    id: '42-sub',
    minute: "42'",
    minuteNumber: 42,
    kind: 'substitution',
    player: 'L. Trossard',
    detail: 'Saka off',
    side: 'home',
    phase: 'First Half',
  },
  {
    id: '38-foul',
    minute: "38'",
    minuteNumber: 38,
    kind: 'yellow_card',
    player: 'E. Fernández',
    detail: 'Foul',
    side: 'away',
    phase: 'First Half',
  },
  {
    id: '35-goal',
    minute: "35'",
    minuteNumber: 35,
    kind: 'goal',
    player: 'B. Saka',
    side: 'home',
    phase: 'First Half',
  },
  {
    id: '19-y',
    minute: "19'",
    minuteNumber: 19,
    kind: 'yellow_card',
    player: 'Ben White',
    detail: 'Argument',
    side: 'home',
    phase: 'First Half',
  },
  {
    id: 'ko',
    minute: "1'",
    minuteNumber: 1,
    kind: 'kickoff',
    player: 'Kick Off',
    phase: 'Kick Off',
  },
];

export const Default = meta.story({
  name: 'Full match (phase-grouped)',
  args: { events: sampleEvents },
  render: (args) => (
    <div className="w-[611px] rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5">
      <MatchTimeline {...args} />
    </div>
  ),
});

export const FirstHalfOnly = meta.story({
  name: 'In play (first half so far)',
  args: { events: sampleEvents.filter((e) => (e.minuteNumber ?? 0) <= 46) },
  render: (args) => (
    <div className="w-[611px] rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5">
      <MatchTimeline {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no events)',
  args: { events: [] },
  render: (args) => (
    <div className="w-[611px] rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5">
      <MatchTimeline {...args} />
    </div>
  ),
});

export const NotStarted = meta.story({
  name: 'Empty (match not started)',
  args: { events: [], fallbackReason: 'MATCH_NOT_STARTED' },
  render: (args) => (
    <div className="w-[611px] rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5">
      <MatchTimeline {...args} />
    </div>
  ),
});
