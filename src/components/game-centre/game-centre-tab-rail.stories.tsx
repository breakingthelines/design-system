import * as React from 'react';

import preview from '#.storybook/preview';

import { GameCentreTabRail, type GameCentreTabItem } from './game-centre-tab-rail';

const meta = preview.meta({
  title: 'GameCentre/GameCentreTabRail',
  component: GameCentreTabRail,
  tags: ['autodocs'],
});

type MatchTabId = 'overview' | 'lineups' | 'timeline' | 'ratings' | 'predictions' | 'thoughts';

const matchTabs: readonly GameCentreTabItem<MatchTabId>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'lineups', label: 'Lineups' },
  { id: 'timeline', label: 'Timeline', badge: 5 },
  { id: 'ratings', label: 'Ratings', badge: 124 },
  { id: 'predictions', label: 'Predictions', badge: 42 },
  { id: 'thoughts', label: 'Thoughts', badge: 18 },
];

export const Default = meta.story({
  name: 'Match rail (6 tabs)',
  render: function Render() {
    const [active, setActive] = React.useState<MatchTabId>('overview');
    return (
      <div className="w-[720px]">
        <GameCentreTabRail tabs={matchTabs} activeTab={active} onChange={setActive}>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/80">
            Active panel: <strong>{active}</strong>
          </div>
        </GameCentreTabRail>
      </div>
    );
  },
});

export const Empty = meta.story({
  name: 'Entity rail (4 tabs, no badges)',
  render: function Render() {
    type EntityTabId = 'overview' | 'rated_in' | 'predicted_in' | 'thoughts';
    const tabs: readonly GameCentreTabItem<EntityTabId>[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'rated_in', label: 'Rated in' },
      { id: 'predicted_in', label: 'Predicted in' },
      { id: 'thoughts', label: 'Thoughts' },
    ];
    const [active, setActive] = React.useState<EntityTabId>('overview');
    return (
      <div className="w-[640px]">
        <GameCentreTabRail tabs={tabs} activeTab={active} onChange={setActive}>
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/80">
            Active panel: <strong>{active}</strong>
          </div>
        </GameCentreTabRail>
      </div>
    );
  },
});

export const Fallback = meta.story({
  name: 'Disabled + hidden tabs',
  render: function Render() {
    type MixedTabId = 'overview' | 'lineups' | 'studio' | 'admin';
    const tabs: readonly GameCentreTabItem<MixedTabId>[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'lineups', label: 'Lineups', disabled: true },
      { id: 'studio', label: 'Studio', hidden: true },
      { id: 'admin', label: 'Admin' },
    ];
    const [active, setActive] = React.useState<MixedTabId>('overview');
    return (
      <div className="w-[640px]">
        <GameCentreTabRail
          tabs={tabs}
          activeTab={active}
          onChange={setActive}
          rail={
            <button
              type="button"
              className="rounded bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 hover:bg-white/15"
            >
              Share
            </button>
          }
        >
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-white/80">
            Active panel: <strong>{active}</strong>
          </div>
        </GameCentreTabRail>
      </div>
    );
  },
});

export const Loading = meta.story({
  name: 'Loading rail',
  render: () => (
    <div className="w-[720px] space-y-3">
      <div className="flex gap-3 border-b border-white/10 pb-2">
        <div className="h-3 w-16 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="h-32 animate-pulse rounded-md bg-white/[0.04]" />
    </div>
  ),
});
