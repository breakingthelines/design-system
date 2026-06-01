import preview from '#.storybook/preview';

import { MatchScorersStrip } from './match-scorers-strip';

const meta = preview.meta({
  title: 'GameCentre/MatchScorersStrip',
  component: MatchScorersStrip,
  tags: ['autodocs'],
});

export const Default = meta.story({
  name: 'Scorers + xG',
  args: {
    home: {
      scorers: [{ name: 'Saka', minute: 12 }],
      xg: 1.84,
    },
    away: {
      scorers: [
        { name: 'Palmer', minute: 31, isPenalty: true },
        { name: 'Jackson', minute: 67 },
      ],
      xg: 2.31,
    },
  },
  render: (args) => (
    <div className="w-[520px]">
      <MatchScorersStrip {...args} />
    </div>
  ),
});

export const ScorersOnly = meta.story({
  name: 'Scorers only (no xG)',
  args: {
    home: {
      scorers: [
        { name: 'Ødegaard', minute: 23 },
        { name: 'Gabriel', minute: 78, isOwnGoal: true },
      ],
    },
    away: {
      scorers: [{ name: 'Sterling', minute: 54 }],
    },
  },
  render: (args) => (
    <div className="w-[520px]">
      <MatchScorersStrip {...args} />
    </div>
  ),
});

export const OneSidedAndXg = meta.story({
  name: 'One side scored + xG',
  args: {
    home: {
      scorers: [{ name: 'Havertz', minute: 9 }],
      xg: 1.12,
    },
    away: {
      scorers: [],
      xg: 0.74,
    },
  },
  render: (args) => (
    <div className="w-[520px]">
      <MatchScorersStrip {...args} />
    </div>
  ),
});

export const XgOnly = meta.story({
  name: 'xG only (goalless)',
  args: {
    home: { scorers: [], xg: 0.95 },
    away: { scorers: [], xg: 0.41 },
  },
  render: (args) => (
    <div className="w-[520px]">
      <MatchScorersStrip {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (renders nothing)',
  args: {
    home: { scorers: [] },
    away: { scorers: [] },
  },
  render: (args) => (
    <div className="w-[520px] border border-dashed border-white/15 p-4 text-center text-xs text-white/40">
      <MatchScorersStrip {...args} />
      Strip is empty, so it renders nothing. This dashed box is only here to show the absence.
    </div>
  ),
});
