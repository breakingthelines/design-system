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
  name: 'FixtureFilterBar (segmented control)',
  render: () => {
    // Interactive: clicking a segment GLIDES the prominent active pill to it.
    // Sits in a wide dark panel (matching the "What is happening" surface) to
    // show the control stays condensed + left-grouped (it never swells to fill
    // the row) and that the active pill is a clearly larger, lighter filled pill
    // — not a thin highlight. Playwright drives this story (sampling the active
    // pill's x mid-flight to confirm a smooth glide, not a jump).
    function Demo() {
      const [filter, setFilter] = React.useState<FixtureFilter | null>(null);
      return (
        <div
          data-testid="filter-demo"
          className="w-[640px] rounded-[8px] border border-white/[0.05] bg-[var(--color-grey-200)] p-5"
        >
          <FixtureFilterBar activeFilter={filter} onFilterChange={setFilter} />
        </div>
      );
    }
    return <Demo />;
  },
});

export const FilterBarLiveActive = meta.story({
  name: 'FixtureFilterBar (Live active)',
  render: () => (
    <div className="w-[420px]">
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
