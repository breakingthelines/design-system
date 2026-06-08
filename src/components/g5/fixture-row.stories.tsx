import * as React from 'react';

import preview from '#.storybook/preview';

import { FixtureFilterBar, FixtureGroup, FixtureRow, type FixtureFilter } from './fixture-row';
import {
  rowLiveArsSheff,
  rowLiveManUtdCity,
  rowLiveRealBarca,
  rowResultBayernDortmund,
  rowResultLivEverton,
  rowUpcomingFlamengoVasco,
} from './fixtures';

const meta = preview.meta({
  title: 'G5/FixtureRow',
  component: FixtureRow,
  tags: ['autodocs'],
  argTypes: {
    density: {
      control: 'select',
      options: ['comfortable', 'compact'],
    },
  },
});

export const Live = meta.story({
  name: 'Live (highlighted)',
  render: () => (
    <div className="w-[420px]">
      <FixtureRow data={rowLiveRealBarca} />
    </div>
  ),
});

export const LateLive = meta.story({
  name: 'Late-live (red minute)',
  render: () => (
    <div className="w-[420px]">
      <FixtureRow data={rowLiveManUtdCity} />
    </div>
  ),
});

export const Result = meta.story({
  render: () => (
    <div className="w-[420px]">
      <FixtureRow data={rowResultBayernDortmund} />
    </div>
  ),
});

export const Upcoming = meta.story({
  name: 'Upcoming (clock + kickoff time, no score)',
  render: () => (
    <div className="w-[420px]">
      <FixtureRow data={rowUpcomingFlamengoVasco} />
    </div>
  ),
});

export const Compact = meta.story({
  name: 'Compact density (widget)',
  render: () => (
    <div className="flex w-[361px] flex-col rounded-[4px] bg-[var(--color-grey-200)] p-2">
      <FixtureRow data={rowLiveRealBarca} density="compact" />
      <FixtureRow data={rowLiveArsSheff} density="compact" />
      <FixtureRow data={rowLiveManUtdCity} density="compact" />
      <FixtureRow data={rowResultLivEverton} density="compact" />
      <FixtureRow data={rowUpcomingFlamengoVasco} density="compact" />
    </div>
  ),
});

export const WithEngagement = meta.story({
  name: 'With engagement badges',
  render: () => (
    <div className="flex w-[480px] flex-col gap-1">
      <FixtureRow data={rowLiveRealBarca} />
      <FixtureRow data={rowLiveManUtdCity} />
    </div>
  ),
});

export const Group = meta.story({
  name: 'FixtureGroup (date header)',
  render: () => (
    <div className="w-[420px]">
      <FixtureGroup dateLabel="Tuesday, May 19">
        <FixtureRow data={rowLiveRealBarca} />
        <FixtureRow data={rowLiveArsSheff} />
        <FixtureRow data={rowResultBayernDortmund} />
      </FixtureGroup>
    </div>
  ),
});

export const FilterBar = meta.story({
  name: 'FixtureFilterBar (panel — active elongated)',
  render: () => {
    // Interactive, in the ~560px "What is happening" panel. The ACTIVE segment
    // is an elongated filled pill (flex-1, absorbs the leftover width) and the
    // inactive ones hug their label — the group fills the panel like the owner's
    // reference. Clicking a segment MORPHS the elongated pill to it (the old one
    // shrinks to hug, the new one grows). Playwright drives this story (sampling
    // the active pill's width mid-flight to confirm a smooth morph, not a jump).
    function Demo() {
      const [filter, setFilter] = React.useState<FixtureFilter | null>(null);
      return (
        <div
          data-testid="filter-demo"
          className="w-[560px] rounded-[8px] border border-white/[0.05] bg-[var(--color-grey-200)] p-4"
        >
          <FixtureFilterBar activeFilter={filter} onFilterChange={setFilter} />
        </div>
      );
    }
    return <Demo />;
  },
});

export const FilterBarWide = meta.story({
  name: 'FixtureFilterBar (wide page — capped, left-aligned)',
  render: () => {
    // The /game/football case: a very wide row. The control must NOT stretch the
    // active pill across the whole page — it caps at its max-width and sits left,
    // with the search to its right (mirroring the platform row layout). Playwright
    // asserts the active pill width here stays bounded (not page-spanning).
    function Demo() {
      const [filter, setFilter] = React.useState<FixtureFilter | null>(null);
      return (
        <div
          data-testid="filter-demo-wide"
          className="flex w-[1400px] items-center gap-4 rounded-[8px] border border-white/[0.05] bg-[var(--color-grey-200)] p-4"
        >
          <FixtureFilterBar activeFilter={filter} onFilterChange={setFilter} />
          <div className="flex h-[34px] flex-1 items-center rounded-[4px] bg-[var(--color-grey-100)] px-4 text-[12px] text-[#ccc4c4]">
            Search teams, players…
          </div>
        </div>
      );
    }
    return <Demo />;
  },
});

export const FilterBarLiveActive = meta.story({
  name: 'FixtureFilterBar (Live active — elongated)',
  render: () => (
    <div className="w-[560px] rounded-[8px] border border-white/[0.05] bg-[var(--color-grey-200)] p-4">
      <FixtureFilterBar activeFilter="live" />
    </div>
  ),
});

export const FilterBarWithLeague = meta.story({
  name: 'FixtureFilterBar (with league pill)',
  render: () => {
    function Demo() {
      const [filter, setFilter] = React.useState<FixtureFilter | null>('results');
      return (
        <div className="w-[480px]">
          <FixtureFilterBar
            activeFilter={filter}
            onFilterChange={setFilter}
            leagueLabel="Premier League"
            onLeaguePress={() => undefined}
          />
        </div>
      );
    }
    return <Demo />;
  },
});
