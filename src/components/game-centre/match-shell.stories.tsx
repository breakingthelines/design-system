import preview from '#.storybook/preview';

import { MatchAdRail, MatchAdSlot, MatchRecapStrip, MatchShell } from './match-shell';

const meta = preview.meta({
  title: 'GameCentre/MatchShell',
  component: MatchShell,
  tags: ['autodocs'],
  argTypes: {
    columns: {
      control: 'select',
      options: ['two', 'three'],
    },
  },
});

function Block({ label, height = 200 }: { label: string; height?: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] text-[13px] tracking-tight text-[var(--color-grey-500)]"
    >
      {label}
    </div>
  );
}

const recap = {
  statusLabel: 'FT',
  home: { label: 'Arsenal', shortLabel: 'ARS' },
  away: { label: 'Chelsea', shortLabel: 'CHE' },
  scoreHome: 1,
  scoreAway: 2,
};

export const GameDayThreeColumn = meta.story({
  name: 'Game Day (3-col, AD rail)',
  args: { columns: 'three' },
  render: (args) => (
    <div className="w-[920px]">
      <MatchShell
        {...args}
        aside={
          <MatchAdRail>
            <MatchAdSlot height={400} />
            <MatchAdSlot height={339} />
          </MatchAdRail>
        }
      >
        <MatchRecapStrip {...recap} />
        <div className="grid grid-cols-[283px_1fr] gap-4">
          <Block label="Player of the Match" height={160} />
          <Block label="Match Timeline" height={420} />
        </div>
      </MatchShell>
    </div>
  ),
});

export const StatsTwoColumn = meta.story({
  name: 'Stats (2-col)',
  args: { columns: 'two' },
  render: (args) => (
    <div className="w-[920px]">
      <MatchShell {...args}>
        <div className="grid grid-cols-2 gap-4">
          <Block label="Shot Map" height={449} />
          <Block label="Team Stats Comparison" height={449} />
        </div>
      </MatchShell>
    </div>
  ),
});

export const RecapStrip = meta.story({
  name: 'FT recap strip',
  render: () => (
    <div className="w-[640px]">
      <MatchRecapStrip {...recap} />
    </div>
  ),
});

export const AdSlot = meta.story({
  name: 'AD slot placeholder',
  render: () => (
    <div className="w-[227px]">
      <MatchAdSlot height={339} />
    </div>
  ),
});
