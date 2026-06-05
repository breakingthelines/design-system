import * as React from 'react';

import preview from '#.storybook/preview';

import { type FixtureFilter } from './fixture-row';
import { whatsHappeningGroups } from './fixtures';
import { WhatsHappeningPanel } from './whats-happening-panel';

const meta = preview.meta({
  title: 'G5/WhatsHappeningPanel',
  component: WhatsHappeningPanel,
  tags: ['autodocs'],
});

export const Default = meta.story({
  name: 'Default (Figma 713-4119)',
  render: () => (
    <div className="w-[393px]">
      <WhatsHappeningPanel groups={whatsHappeningGroups} viewAllHref="/game/football" />
    </div>
  ),
});

export const Interactive = meta.story({
  name: 'Interactive filters',
  render: () => {
    function Demo() {
      const [filter, setFilter] = React.useState<FixtureFilter | null>(null);
      const groups = whatsHappeningGroups
        .map((group) => ({
          ...group,
          fixtures: group.fixtures.filter((fixture) => {
            if (filter === null) return true;
            if (filter === 'results') return fixture.status === 'result';
            return fixture.status === filter;
          }),
        }))
        .filter((group) => group.fixtures.length > 0);
      return (
        <div className="w-[393px]">
          <WhatsHappeningPanel
            groups={groups}
            activeFilter={filter}
            onFilterChange={setFilter}
            onLeaguePress={() => undefined}
            viewAllHref="/game/football"
          />
        </div>
      );
    }
    return <Demo />;
  },
});

export const Empty = meta.story({
  name: 'Empty (honest fallback)',
  render: () => (
    <div className="w-[393px]">
      <WhatsHappeningPanel groups={[]} viewAllHref="/game/football" />
    </div>
  ),
});

export const NoCta = meta.story({
  name: 'No View-all CTA',
  render: () => (
    <div className="w-[393px]">
      <WhatsHappeningPanel groups={whatsHappeningGroups} />
    </div>
  ),
});
