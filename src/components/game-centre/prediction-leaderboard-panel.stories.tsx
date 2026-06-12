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
    pendingNote: 'Picks lock at kickoff in 14:13:29',
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
    pendingNote: 'Picks lock at kickoff in 03:42:18',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

export const PreSettlementTie = meta.story({
  name: 'Pre-settlement · everyone on 1 pick',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: [
      { rank: 1, userHandle: 'ando', userName: 'Thomas Anderson', points: 1 },
      { rank: 2, userHandle: 'cruyff14', userName: 'Johan Cruyff', points: 1 },
      { rank: 3, userHandle: 'tommy', userName: 'Thomas Anderson', points: 1, isViewer: true },
      { rank: 4, userHandle: 'zachlowy', userName: 'Zach Lowy', points: 1 },
      { rank: 5, userHandle: 'bestie', userName: 'George Best', points: 1 },
    ],
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

export const HandleOnly = meta.story({
  name: 'Handle-only · no displayName',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: [
      { rank: 1, userHandle: 'ando', points: 3 },
      { rank: 2, userHandle: 'cruyff14', points: 2 },
      { rank: 3, userHandle: 'tommy', points: 1, isViewer: true },
    ],
    pendingNote: 'Picks lock at kickoff in 14:13:29',
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

/* Wave 6.25h-a: external SectionHeading mode. The Predictions sub-tab
 * lifts the panel's "LEADERBOARD" + league title OUT of the card and
 * renders a section heading above it, matching the "League" + "Kickoff
 * in" rhythm. `hideHeader={true}` suppresses both the internal eyebrow
 * and the league title — the card starts directly with the column
 * header row. */
export const HideHeader = meta.story({
  name: 'hideHeader · external SectionHeading rhythm',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: TOP_ENTRIES,
    viewerEntry: { rank: 12, userHandle: 'tommy', userName: 'Tommy', points: 26 },
    pendingNote: 'Picks lock at kickoff in 14:13:29',
    hideHeader: true,
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-white">Leaderboard</h2>
      </header>
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

/* Wave 6.34o: long leaderboard that overflows the panel's max-height.
 * The list scrolls internally, the column header sticks to the top, and
 * the pendingNote stays anchored OUTSIDE the scroll region. With no
 * `viewerWindowSize` the full list is in the DOM. */
const LONG_ENTRIES = Array.from({ length: 120 }, (_, i) => {
  const rank = i + 1;
  return {
    rank,
    userHandle: `player${rank}`,
    userName: `Player ${rank}`,
    points: Math.max(0, 120 - rank),
    isViewer: rank === 60,
  };
});

export const LongList = meta.story({
  name: 'Long list · bounded panel scrolls internally',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: LONG_ENTRIES,
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

/* Wave 6.34o: viewer-anchored window. With 120 entries and the viewer at
 * rank 60, `viewerWindowSize={50}` slices to ranks 36..85 — 24 above + 25
 * below the viewer (rounded for an even split). The viewer row scrolls
 * to centre on mount so they land looking at their own slot. */
export const ViewerWindowMidPack = meta.story({
  name: 'viewerWindowSize · viewer mid-pack',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: LONG_ENTRIES,
    viewerWindowSize: 50,
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

/* Wave 6.34o: viewer near the top — the window clamps at rank 1. */
export const ViewerWindowTop = meta.story({
  name: 'viewerWindowSize · viewer in top 5',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: LONG_ENTRIES.map((entry) => ({
      ...entry,
      isViewer: entry.rank === 3,
    })),
    viewerWindowSize: 50,
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

/* Wave 6.34o: viewer near the bottom — the window clamps at the tail so
 * the viewer still gets context rows above them. */
export const ViewerWindowBottom = meta.story({
  name: 'viewerWindowSize · viewer near bottom',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: LONG_ENTRIES.map((entry) => ({
      ...entry,
      isViewer: entry.rank === 118,
    })),
    viewerWindowSize: 50,
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});

/* Wave 6.34o: viewer not enrolled (signed-out / non-member) — falls back
 * to the top `viewerWindowSize` rows so the panel still truncates to the
 * same predictable shape. */
export const ViewerWindowSignedOut = meta.story({
  name: 'viewerWindowSize · no viewer (signed-out)',
  args: {
    leagueLabel: 'BTL World Cup',
    squadHandle: 'breakingthelines',
    entries: LONG_ENTRIES.map((entry) => ({ ...entry, isViewer: false })),
    viewerWindowSize: 50,
    pendingNote: 'Picks lock at kickoff in 14:13:29',
  },
  render: (args) => (
    <div className="w-[640px] bg-black p-6">
      <PredictionLeaderboardPanel {...args} />
    </div>
  ),
});
