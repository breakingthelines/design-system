import * as React from 'react';

import preview from '#.storybook/preview';

import { MatchDaySubTabs, type MatchDaySubTabItem } from './match-day-sub-tabs';

const meta = preview.meta({
  title: 'GameCentre/MatchDaySubTabs',
  component: MatchDaySubTabs,
  tags: ['autodocs'],
});

type SubTabId = 'timeline' | 'ratings' | 'predictions';

const subTabs: ReadonlyArray<MatchDaySubTabItem<SubTabId>> = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'predictions', label: 'Predictions' },
];

export const Default = meta.story({
  name: 'Match-day sub-tabs (3 modes)',
  render: function Render() {
    const [active, setActive] = React.useState<SubTabId>('timeline');
    return (
      <div className="w-[640px] space-y-3">
        <MatchDaySubTabs tabs={subTabs} activeTab={active} onChange={setActive} />
        <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/80">
          Active sub-tab: <strong>{active}</strong>
        </div>
      </div>
    );
  },
});

export const WithCounts = meta.story({
  name: 'With counts',
  render: function Render() {
    const tabsWithCounts: ReadonlyArray<MatchDaySubTabItem<SubTabId>> = [
      { id: 'timeline', label: 'Timeline' },
      { id: 'ratings', label: 'Ratings', count: 124 },
      { id: 'predictions', label: 'Predictions', count: 42 },
    ];
    const [active, setActive] = React.useState<SubTabId>('ratings');
    return (
      <div className="w-[640px]">
        <MatchDaySubTabs tabs={tabsWithCounts} activeTab={active} onChange={setActive} />
      </div>
    );
  },
});

export const ScheduledMatch = meta.story({
  name: 'Pre-match (Predictions default)',
  render: function Render() {
    // Lifecycle-aware default: a SCHEDULED match opens on Predictions.
    const [active, setActive] = React.useState<SubTabId>('predictions');
    return (
      <div className="w-[640px]">
        <MatchDaySubTabs tabs={subTabs} activeTab={active} onChange={setActive} />
      </div>
    );
  },
});
