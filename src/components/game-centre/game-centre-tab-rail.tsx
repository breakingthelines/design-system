'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { TabbedPage, type TabbedPageTab } from '#/components/ui/tabbed-page';

/* ─────────────────────────────────────────────────────────────────────────────
 * GameCentreTabRail
 *
 * Thin, opinionated wrapper around the design-system `TabbedPage` for the
 * 6-tab match rail and the 4-tab entity rail. The host owns panel
 * switching; this primitive only renders the rail.
 *
 * What it adds on top of TabbedPage:
 *   - Generic `TabId` typing so the caller's `onChange` receives a literal
 *     union, not `string`.
 *   - `hidden` flag, tabs the caller never wants to render at all (e.g.
 *     a Studio-only tab not shown to anonymous viewers).
 *   - Uniform badge style, passing a number renders it as a muted pill.
 *
 * Children render the active panel; `GameCentreTabRail` does not switch
 * panels itself, matching the design-system `TabbedPage` contract.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface GameCentreTabItem<TabId extends string = string> {
  id: TabId;
  label: string;
  /** Badge, number rendered as muted pill, or arbitrary node. */
  badge?: number | React.ReactNode;
  disabled?: boolean;
  /** When true, the tab is not rendered. */
  hidden?: boolean;
}

export interface GameCentreTabRailProps<TabId extends string = string> {
  tabs: readonly GameCentreTabItem<TabId>[];
  activeTab: TabId;
  onChange: (next: TabId) => void;
  /** Optional trailing rail content (e.g. a "share" icon button). */
  rail?: React.ReactNode;
  /** Active panel content. */
  children?: React.ReactNode;
  className?: string;
}

export function GameCentreTabRail<TabId extends string = string>({
  tabs,
  activeTab,
  onChange,
  rail,
  children,
  className,
}: GameCentreTabRailProps<TabId>) {
  const visible = tabs.filter((tab) => !tab.hidden);

  const dsTabs: readonly TabbedPageTab[] = visible.map((tab) => ({
    id: tab.id,
    label: tab.label,
    badge: renderBadge(tab.badge),
    disabled: tab.disabled,
  }));

  return (
    <div data-slot="game-centre-tab-rail" className={cn('w-full', className)}>
      <TabbedPage
        tabs={dsTabs}
        value={activeTab}
        onValueChange={(next) => onChange(next as TabId)}
        rail={rail}
      >
        {children ?? null}
      </TabbedPage>
    </div>
  );
}

function renderBadge(badge: number | React.ReactNode | undefined): React.ReactNode {
  if (badge === undefined || badge === null) return undefined;
  if (typeof badge === 'number') {
    if (badge <= 0) return undefined;
    return (
      <span className="ml-1 rounded-sm bg-white/10 px-1.5 py-0.5 text-xs text-white/75">
        {badge}
      </span>
    );
  }
  return badge;
}
