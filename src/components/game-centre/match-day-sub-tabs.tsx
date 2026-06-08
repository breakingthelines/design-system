// MatchDaySubTabs — rounded-pill segmented control used UNDER the top-level
// match-page tabs ("Game Day / Stats / Thoughts / Lineups") to split the Game
// Day body into mode-specific panels (Timeline / Ratings / Predictions).
//
// Render-only; the host owns URL state. Mirrors the platform-local
// `FixtureStateTabs` shape (already deployed in Arena's office panel — see
// `platform/app/components/arena/fixture-state-tabs.tsx`); lifted into ds so
// the match page can reuse the same pill row without copying classNames.
//
// Heights and tone are intentionally one tier below the top tabs so the
// hierarchy reads visually: top tabs = section (Game Day vs Stats), pills =
// mode within the section.
//
// To bind to a search param, mirror the `?tab=` pattern used by GameCentreTabRail:
//   readSubTabFromSearch(searchString)   // ⇒ MatchDaySubTabId | null
//   pushSubTabToSearch(id, { router })   // ⇒ navigate({ search: { gd: id } })
// (Implement at the host; this component stays presentational.)

import * as React from 'react';

import { cn } from '#/lib/utils';

/**
 * One pill in the sub-tab row. `count` is optional — render a small muted
 * count after the label if the host wants to surface "12 ratings" etc.
 */
export interface MatchDaySubTabItem<TabId extends string = string> {
  id: TabId;
  label: string;
  /** Optional quiet count rendered after the label. */
  count?: number;
}

export interface MatchDaySubTabsProps<TabId extends string = string> {
  /** The tabs to render, left-to-right. */
  tabs: ReadonlyArray<MatchDaySubTabItem<TabId>>;
  /** Currently active tab id. */
  activeTab: TabId;
  /** Called when the viewer picks a different tab. */
  onChange: (next: TabId) => void;
  /** Optional aria-label for the tablist (defaults to "Match-day sub-tabs"). */
  ariaLabel?: string;
  className?: string;
}

export function MatchDaySubTabs<TabId extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Match-day sub-tabs',
  className,
}: MatchDaySubTabsProps<TabId>): React.JSX.Element {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-slot="match-day-sub-tabs"
      className={cn('flex items-center gap-1', className)}
    >
      {tabs.map(({ id, label, count }) => {
        const active = id === activeTab;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active || undefined}
            data-tab-id={id}
            onClick={() => onChange(id)}
            className={
              active
                ? 'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white'
                : 'inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white'
            }
          >
            {label}
            {count !== undefined && count > 0 ? (
              <span className="text-[10px] text-white/45">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
