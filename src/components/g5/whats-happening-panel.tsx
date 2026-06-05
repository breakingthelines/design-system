'use client';

import * as React from 'react';
import { ArrowRight } from '@phosphor-icons/react';

import { useLinkComponent } from '#/components/ui/link-context';
import { cn } from '#/lib/utils';

import {
  FixtureFilterBar,
  FixtureGroup,
  FixtureRow,
  type FixtureFilter,
  type FixtureRowData,
} from './fixture-row';

/* ─────────────────────────────────────────────────────────────────────────────
 * WhatsHappeningPanel (fixtures-hub — compact "What's Happening" widget)
 *
 * The sidebar composition from Figma 713-4119: a blurred dark card titled
 * "What is happening" with a `FixtureFilterBar`, date-grouped `FixtureRow`s,
 * and a "View all matches" CTA. It is the COMPACT density of the same family
 * the full Football Home uses at comfortable density — one component, two
 * mounts (Thoughts + Arena per the plan).
 *
 * Composition only: it lays out the parts and owns the card chrome + empty
 * state. The consumer supplies the already-grouped fixtures (use the exported
 * `groupFixturesByDate` to turn a flat, date-ordered list into groups) and the
 * filter state, so this stays render-only with no fetching and no router
 * awareness beyond the swappable CTA Link.
 *
 * Honest by default: with no groups it renders a fixed empty line rather than
 * letting a consumer soften the gap into marketing copy.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface WhatsHappeningGroup {
  /** Stable key for the group (typically the ISO date). Falls back to the label. */
  id?: string;
  /** Date header ("Tuesday, May 19"). */
  dateLabel: string;
  fixtures: readonly FixtureRowData[];
}

export interface WhatsHappeningPanelProps {
  /** Date-grouped fixtures. Empty → the honest empty state renders. */
  groups: readonly WhatsHappeningGroup[];
  /** Panel title. Defaults to the design's "What is happening". */
  title?: string;
  /** Active status filter (null = "All"). Forwarded to `FixtureFilterBar`. */
  activeFilter?: FixtureFilter | null;
  onFilterChange?: (filter: FixtureFilter | null) => void;
  /** League pill label + handler (opens a league selector upstream). */
  leagueLabel?: string;
  onLeaguePress?: () => void;
  /** Hide the filter bar (e.g. when the host renders its own). Default: shown. */
  showFilters?: boolean;
  /** "View all matches" CTA target. Omit to hide the CTA. */
  viewAllHref?: string;
  /** CTA label. Defaults to "View all matches". */
  viewAllLabel?: string;
  className?: string;
}

export const WHATS_HAPPENING_EMPTY_LINE = 'No matches in this window yet.';

export function WhatsHappeningPanel({
  groups,
  title = 'What is happening',
  activeFilter = null,
  onFilterChange,
  leagueLabel,
  onLeaguePress,
  showFilters = true,
  viewAllHref,
  viewAllLabel = 'View all matches',
  className,
}: WhatsHappeningPanelProps) {
  const Link = useLinkComponent();
  const hasFixtures = groups.some((group) => group.fixtures.length > 0);

  return (
    <section
      data-slot="whats-happening-panel"
      aria-label={title}
      className={cn(
        'flex w-full flex-col gap-6 rounded-[4px] p-4',
        'border border-[var(--color-grey-300)] bg-[var(--color-grey-200)] backdrop-blur-[15px]',
        className
      )}
    >
      <div data-slot="whats-happening-header" className="flex w-full flex-col gap-4">
        <h2
          data-slot="whats-happening-title"
          className="text-[16px] font-semibold tracking-[-0.48px] text-white"
        >
          {title}
        </h2>
        {showFilters ? (
          <FixtureFilterBar
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            leagueLabel={leagueLabel}
            onLeaguePress={onLeaguePress}
          />
        ) : null}
      </div>

      <div data-slot="whats-happening-body" className="flex w-full flex-col gap-4">
        {hasFixtures ? (
          groups
            .filter((group) => group.fixtures.length > 0)
            .map((group, idx) => (
              <FixtureGroup
                key={group.id ?? `${group.dateLabel}-${idx}`}
                dateLabel={group.dateLabel}
                density="compact"
              >
                {group.fixtures.map((fixture) => (
                  <FixtureRow key={fixture.id} data={fixture} density="compact" />
                ))}
              </FixtureGroup>
            ))
        ) : (
          <div
            data-slot="whats-happening-empty"
            className="flex items-center gap-3 rounded-[4px] border border-dashed border-[var(--color-grey-300)] bg-[var(--color-grey-100)] px-4 py-5 text-[13px] text-[var(--color-grey-500)]"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-[var(--color-grey-300)]"
            />
            <p>{WHATS_HAPPENING_EMPTY_LINE}</p>
          </div>
        )}

        {viewAllHref ? (
          <Link
            href={viewAllHref}
            data-slot="whats-happening-view-all"
            className={cn(
              'flex w-full items-center justify-between rounded-[4px] px-4 py-3',
              'border border-white/[0.05] bg-[var(--color-grey-300)] backdrop-blur-[15px]',
              'text-[14px] font-medium leading-[24px] tracking-[-0.42px] text-white',
              'transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30'
            )}
          >
            <span>{viewAllLabel}</span>
            <ArrowRight weight="regular" aria-hidden="true" className="size-3.5 shrink-0" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

// ─── helper (pure, exported) ─────────────────────────────────────────────────

/**
 * Group a flat list of fixtures into date-headed groups, preserving input
 * order both across groups and within them. The consumer supplies the bucket
 * key + display label per fixture (so date formatting stays at the edge, where
 * the viewer's timezone is known — see the hydration-tz memory). Fixtures that
 * resolve to the same `key` in adjacent positions coalesce under one header.
 */
export function groupFixturesByDate(
  fixtures: readonly FixtureRowData[],
  bucket: (fixture: FixtureRowData) => { key: string; label: string }
): WhatsHappeningGroup[] {
  const groups: WhatsHappeningGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const fixture of fixtures) {
    const { key, label } = bucket(fixture);
    const existing = indexByKey.get(key);
    if (existing !== undefined) {
      (groups[existing].fixtures as FixtureRowData[]).push(fixture);
    } else {
      indexByKey.set(key, groups.length);
      groups.push({ id: key, dateLabel: label, fixtures: [fixture] });
    }
  }
  return groups;
}
