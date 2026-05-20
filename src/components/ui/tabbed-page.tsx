'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * TabbedPage
 *
 * Render-only wrapper that drives a tabbed page from a URL `?tab=<name>`
 * search parameter. The design-system stays router-agnostic: TabbedPage does
 * not depend on TanStack Router (or Next, or React Router). The platform host
 * wires a router-bound `value` + `onValueChange` pair and that's it.
 *
 * The component is built as a self-contained tab bar. It uses native buttons
 * instead of the base-ui Tabs primitive because the value lives in the URL,
 * not in local state, and we want consumers to be free to swap tabs from the
 * outside (e.g. a deep-link).
 *
 * Helpers `readTabFromSearch` and `pushTabToSearch` are exported so platform
 * code can stitch the search-param contract with whichever router it uses.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface TabbedPageTab {
  /** Stable URL key — appears as `?tab=<id>`. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional badge / count next to the label. */
  badge?: React.ReactNode;
  /** Optional disabled flag (greys out but stays focusable for ARIA). */
  disabled?: boolean;
}

export interface TabbedPageProps {
  /** Ordered list of tabs. */
  tabs: readonly TabbedPageTab[];
  /** Current tab id (URL-bound). */
  value: string;
  /** Called when the user selects a tab — the host should push to the URL. */
  onValueChange: (next: string) => void;
  /** Tabs rail extras (e.g. trailing actions). */
  rail?: React.ReactNode;
  /** Children render the active panel — TabbedPage does no panel switching. */
  children: React.ReactNode;
  className?: string;
}

export function TabbedPage({
  tabs,
  value,
  onValueChange,
  rail,
  children,
  className,
}: TabbedPageProps) {
  return (
    <div
      data-slot="tabbed-page"
      data-active-tab={value}
      className={cn('flex flex-col gap-4', className)}
    >
      <div
        data-slot="tabbed-page-rail"
        className="flex items-center justify-between gap-3 border-b border-white/10"
      >
        <nav
          data-slot="tabbed-page-tabs"
          role="tablist"
          aria-label="Page sections"
          className="flex items-center"
        >
          {tabs.map((tab) => {
            const active = tab.id === value;
            return (
              <button
                key={tab.id}
                data-slot="tabbed-page-tab"
                data-active={active || undefined}
                data-disabled={tab.disabled || undefined}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`tabbed-page-panel-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => {
                  if (tab.disabled || active) return;
                  onValueChange(tab.id);
                }}
                className={cn(
                  'relative inline-flex items-center gap-2 border-0 bg-transparent px-3 py-2',
                  'text-xs font-medium tracking-wide outline-none transition-colors',
                  'cursor-pointer',
                  active ? 'text-white' : 'text-white/60 hover:text-white/80',
                  'focus-visible:text-white',
                  'disabled:cursor-not-allowed disabled:opacity-40'
                )}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null ? (
                  <span
                    data-slot="tabbed-page-tab-badge"
                    className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-mono tabular-nums text-white/80"
                  >
                    {tab.badge}
                  </span>
                ) : null}
                {active ? (
                  <span
                    aria-hidden="true"
                    data-slot="tabbed-page-tab-indicator"
                    className="absolute -bottom-px left-0 right-0 h-px bg-white"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>
        {rail ? (
          <div data-slot="tabbed-page-rail-actions" className="flex items-center gap-2">
            {rail}
          </div>
        ) : null}
      </div>

      <div
        data-slot="tabbed-page-panel"
        id={`tabbed-page-panel-${value}`}
        role="tabpanel"
        aria-labelledby={`tabbed-page-tab-${value}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Read the active tab id from a URL search string. Returns `fallback` when
 * the `tab` parameter is absent or empty.
 *
 * Designed for TanStack Router's `search` validator pattern, but works with
 * any string-keyed map (URLSearchParams.toString() output, location.search,
 * etc.).
 */
export function readTabFromSearch(
  search: string | URLSearchParams | Record<string, string | undefined> | undefined,
  fallback: string
): string {
  if (!search) return fallback;
  if (typeof search === 'string') {
    const value = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');
    return value && value.length > 0 ? value : fallback;
  }
  if (search instanceof URLSearchParams) {
    const value = search.get('tab');
    return value && value.length > 0 ? value : fallback;
  }
  const value = search.tab;
  return value && value.length > 0 ? value : fallback;
}

/**
 * Produce the search-param object the host router should push when a tab is
 * selected. Hosts using TanStack Router can spread this onto their
 * `navigate({ search: { ... } })` call.
 */
export function pushTabToSearch<T extends Record<string, unknown>>(
  current: T,
  next: string,
  defaultTab: string
): T & { tab?: string } {
  // Strip the param when the user lands back on the default tab — keeps URLs
  // clean and shareable.
  if (next === defaultTab) {
    const { tab: _omit, ...rest } = current as T & { tab?: string };
    return rest as T & { tab?: string };
  }
  return { ...current, tab: next };
}
