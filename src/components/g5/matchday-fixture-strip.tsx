'use client';

import { cn } from '#/lib/utils';
import { FixtureCard } from './fixture-card';
import type { G5FixtureCardData } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchdayFixtureStrip
 *
 * A horizontal list of FixtureCards for the Matchday slot. When the list is
 * empty, renders the deterministic "No matches lined up yet" fallback — the
 * copy is fixed here on purpose so consumers can't soften the honest empty
 * state into marketing.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchdayFixtureStripProps {
  fixtures: readonly G5FixtureCardData[];
  /** Optional click handler, fired with the fixture data on selection. */
  onSelect?: (fixture: G5FixtureCardData) => void;
  /** Card variant for each fixture. Defaults to `compact`. */
  cardVariant?: 'compact' | 'full';
  className?: string;
}

export const MATCHDAY_FIXTURE_STRIP_EMPTY_LINE = 'No matches lined up yet.';

export function MatchdayFixtureStrip({
  fixtures,
  onSelect,
  cardVariant = 'compact',
  className,
}: MatchdayFixtureStripProps) {
  if (fixtures.length === 0) {
    return (
      <div
        data-slot="matchday-strip-empty"
        className={cn(
          'flex items-center gap-3 border border-dashed border-[var(--color-grey-300)]',
          'rounded-[8px] bg-[var(--color-grey-200)] px-4 py-5 text-[13px] text-[var(--color-grey-500)]',
          className
        )}
      >
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-[var(--color-grey-300)]"
        />
        <p>{MATCHDAY_FIXTURE_STRIP_EMPTY_LINE}</p>
      </div>
    );
  }

  return (
    <ul
      data-slot="matchday-strip"
      className={cn(
        'flex w-full gap-3 overflow-x-auto pb-1',
        '[-ms-overflow-style:none] [scrollbar-width:none]',
        '[&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {fixtures.map((fixture) => (
        <li
          key={fixture.id}
          className={cn(cardVariant === 'compact' ? 'min-w-[280px]' : 'min-w-[320px]')}
        >
          <FixtureCard
            data={fixture}
            variant={cardVariant}
            onClick={onSelect ? () => onSelect(fixture) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
