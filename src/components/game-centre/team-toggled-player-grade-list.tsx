'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { GradeBox } from '#/components/ui/grade-box';
import { useLinkComponent } from '#/components/ui/link-context';
import { ratingDescriptor, type RatingScaleValue } from '#/components/ui/rating-scale';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * TeamToggledPlayerGradeList (Wave 6.4)
 *
 * Vertical player grade list with an internal home/away pill toggle.
 * Replaces the Wave 6 formation-pitch readout on the Match Centre Ratings
 * sub-tab. Sorted by grade ASC (best grade first — 1 sits above 6).
 *
 * Row anatomy:
 *
 *   [avatar] [abbreviated name] [qualitative label] [GradeBox]
 *
 * The pill toggle defaults to `home`. Default render caps the list at 11
 * rows (the starting XI). A "Show subs" / "Hide subs" link appears when
 * either side has more than 11 entries; toggling reveals the remaining
 * rows in the same sorted order.
 *
 * The component is render-only. The host owns the source data (lineups +
 * BTL averages projected per-side, abbreviated names already cut) and
 * passes the resolved props. With no rows on a side the component renders
 * a tight `FallbackState` (`NO_RATINGS_YET` by default) inside that side.
 *
 * Naming note: per Wave 6.4 the user-facing noun is 'grade' — the slot
 * data-attrs and aria-labels read 'grade'.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerGradeRow {
  /** Stable id for React keys + selectors. */
  id: string;
  /** Display name (already abbreviated by the host, e.g. "B. Saka"). */
  name: string;
  /** Optional avatar image URL; falls back to initials. */
  avatarUrl?: string;
  /** Optional route to the player page. When set, the name becomes a link. */
  href?: string;
  /** BTL grade, 1 (best) to 6 (worst). Omit for "not graded" rows. */
  grade?: RatingScaleValue;
  /** Optional explicit qualitative label override. Defaults to `ratingDescriptor(grade).shortLabel`. */
  qualitative?: string;
  /** Mark as a substitute (renders behind the "Show subs" toggle). */
  isSub?: boolean;
}

export interface TeamToggledPlayerGradeListProps
  extends React.ComponentProps<'div'> {
  /** Lineups, split by side. Each list is sorted internally by grade ASC. */
  teams: {
    home: readonly PlayerGradeRow[];
    away: readonly PlayerGradeRow[];
  };
  /** Display label for the home team's pill (e.g. "Arsenal"). */
  homeLabel?: string;
  /** Display label for the away team's pill (e.g. "Chelsea"). */
  awayLabel?: string;
  /** Default active side. Defaults to `home`. */
  defaultSide?: 'home' | 'away';
  /** Controlled active side. Overrides `defaultSide`. */
  side?: 'home' | 'away';
  /** Side-change callback for controlled mode. */
  onSideChange?: (side: 'home' | 'away') => void;
  /**
   * Number of starting players to show before the "Show subs" affordance
   * kicks in. Defaults to 11 (the football starting XI).
   */
  startersCap?: number;
  /** Fallback reason for an empty side. Defaults to `NO_RATINGS_YET`. */
  emptyReason?: FallbackReason;
}

function sortRows(rows: readonly PlayerGradeRow[]): PlayerGradeRow[] {
  return rows.toSorted((a, b) => {
    const ag = a.grade ?? Number.POSITIVE_INFINITY;
    const bg = b.grade ?? Number.POSITIVE_INFINITY;
    if (ag !== bg) return ag - bg;
    return a.name.localeCompare(b.name);
  });
}

function TeamToggledPlayerGradeList({
  teams,
  homeLabel = 'Home',
  awayLabel = 'Away',
  defaultSide = 'home',
  side,
  onSideChange,
  startersCap = 11,
  emptyReason = 'NO_RATINGS_YET',
  className,
  ...props
}: TeamToggledPlayerGradeListProps) {
  const [internalSide, setInternalSide] = React.useState<'home' | 'away'>(
    defaultSide
  );
  const [showSubs, setShowSubs] = React.useState(false);

  const activeSide = side ?? internalSide;
  const handleSideChange = (next: 'home' | 'away') => {
    if (side === undefined) setInternalSide(next);
    onSideChange?.(next);
  };

  const sortedHome = React.useMemo(() => sortRows(teams.home), [teams.home]);
  const sortedAway = React.useMemo(() => sortRows(teams.away), [teams.away]);
  const rows = activeSide === 'home' ? sortedHome : sortedAway;

  const starters = rows.slice(0, startersCap);
  const subs = rows.slice(startersCap);
  const hasSubs = subs.length > 0;
  const visibleRows = showSubs ? rows : starters;

  return (
    <div
      data-slot="team-toggled-player-grade-list"
      data-active-side={activeSide}
      className={cn(
        'flex flex-col gap-3 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-4',
        className
      )}
      {...props}
    >
      <div
        data-slot="team-toggled-player-grade-list-toggle"
        role="tablist"
        aria-label="Team grade list"
        className="inline-flex w-fit gap-1 rounded-full border border-white/10 bg-[var(--color-grey-300)] p-0.5"
      >
        <SideToggleButton
          label={homeLabel}
          active={activeSide === 'home'}
          onClick={() => handleSideChange('home')}
          side="home"
        />
        <SideToggleButton
          label={awayLabel}
          active={activeSide === 'away'}
          onClick={() => handleSideChange('away')}
          side="away"
        />
      </div>

      {visibleRows.length === 0 ? (
        <FallbackState reason={emptyReason} />
      ) : (
        <ol
          data-slot="team-toggled-player-grade-list-rows"
          className="flex flex-col gap-0.5"
        >
          {visibleRows.map((row) => (
            <PlayerGradeListRow key={row.id} row={row} />
          ))}
        </ol>
      )}

      {hasSubs ? (
        <button
          type="button"
          data-slot="team-toggled-player-grade-list-subs-toggle"
          data-expanded={showSubs}
          onClick={() => setShowSubs((s) => !s)}
          className={cn(
            'inline-flex w-fit items-center gap-1 self-start rounded-full px-2 py-1',
            'text-[11px] font-semibold tracking-[0.12em] text-white/60 uppercase',
            'transition-colors hover:text-white focus-visible:outline-none',
            'focus-visible:text-[var(--color-red-100)]'
          )}
          aria-expanded={showSubs}
        >
          {showSubs ? 'Hide subs' : `Show subs (${subs.length})`}
        </button>
      ) : null}
    </div>
  );
}

function SideToggleButton({
  label,
  active,
  onClick,
  side,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  side: 'home' | 'away';
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-slot="team-toggled-player-grade-list-toggle-button"
      data-side={side}
      data-active={active || undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold tracking-tight transition-colors',
        active
          ? 'bg-[var(--color-red-100)] text-white'
          : 'text-white/70 hover:text-white'
      )}
    >
      {label}
    </button>
  );
}

function PlayerGradeListRow({ row }: { row: PlayerGradeRow }) {
  const Link = useLinkComponent();
  const initials = initialsFromName(row.name);
  const qualitative =
    row.qualitative ??
    (row.grade !== undefined ? ratingDescriptor(row.grade).shortLabel : '—');

  return (
    <li
      data-slot="team-toggled-player-grade-list-row"
      data-player-id={row.id}
      data-grade={row.grade ?? 'ungraded'}
      data-sub={row.isSub || undefined}
      className="flex items-center gap-3 rounded-[4px] px-2 py-2 hover:bg-white/[0.03]"
    >
      <Avatar size="sm" className="shrink-0 border border-white/10">
        {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-[10px] font-semibold tracking-tight">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col">
        {row.href ? (
          <Link
            href={row.href}
            data-slot="team-toggled-player-grade-list-name"
            className="truncate text-[13px] font-semibold tracking-tight text-white hover:text-[var(--color-red-100)]"
          >
            {row.name}
          </Link>
        ) : (
          <span
            data-slot="team-toggled-player-grade-list-name"
            className="truncate text-[13px] font-semibold tracking-tight text-white"
          >
            {row.name}
          </span>
        )}
        <span
          data-slot="team-toggled-player-grade-list-qualitative"
          className="truncate text-[11px] text-white/55"
        >
          {qualitative}
        </span>
      </div>

      {row.grade !== undefined ? (
        <GradeBox value={row.grade} size="sm" showLabel={false} />
      ) : (
        <span
          data-slot="team-toggled-player-grade-list-ungraded"
          aria-label="Not graded yet"
          className="inline-flex size-7 items-center justify-center rounded-[4px] border border-white/10 text-[10px] text-white/40"
        >
          —
        </span>
      )}
    </li>
  );
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}

export { TeamToggledPlayerGradeList };
