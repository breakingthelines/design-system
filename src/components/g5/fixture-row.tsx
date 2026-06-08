'use client';

import * as React from 'react';
import { ChatCircle, Clock, Star, Target } from '@phosphor-icons/react';

import { useLinkComponent } from '#/components/ui/link-context';
import { formatCount } from '#/lib/format';
import { cn } from '#/lib/utils';

import type { G5FixtureSide } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
 * FixtureRow + FixtureGroup + FixtureFilterBar (fixtures-hub family)
 *
 * The shared, dark-token fixtures family that powers both the full Football
 * Home and the compact "What's Happening" widget (Figma 713-4119). It EXTENDS
 * the g5 `FixtureCard`/`MatchdayFixtureStrip` family rather than duplicating it:
 * the same `G5FixtureSide` shape feeds both. `FixtureCard` stays the boxed
 * matchday TILE (Issue #1, Matchday strip); `FixtureRow` is the dense,
 * single-line SCORE ROW used in date-grouped lists and the sidebar widget.
 *
 *   - `FixtureRow`       — one fixture as a row. `status` ('live' | 'result' |
 *                          'upcoming') drives the LEFT cell and the score
 *                          visibility:
 *                            • live     — minute label (red when late-live,
 *                              e.g. 90+2'; white otherwise) + visible score.
 *                              A live row can be `highlighted` for the gradient
 *                              treatment the design gives the lead fixture.
 *                            • result   — finished minute / "FT" + visible score.
 *                            • upcoming — clock icon + kickoff time (grey) and NO
 *                              score; an empty same-width cell holds the centre
 *                              column's place so every row aligns (Figma 713-3848).
 *                          Anatomy mirrors the mock: minute · [home name+crest]
 *                          · score · [away crest+name] · (engagement badges).
 *                          When the row carries an `href` it links via the
 *                          `useLinkComponent` context (deep-link into the rich
 *                          Match Centre); otherwise it is a static row.
 *   - `FixtureGroup`     — a date-header section ("Tuesday, May 19") wrapping a
 *                          run of `FixtureRow`s.
 *   - `FixtureFilterBar` — the league filter ('All', flex-1) + Live / Results /
 *                          Upcoming status pills.
 *   - `FixtureEngagementBadges` — the optional per-fixture engagement slot
 *                          (thought-pulse count / ratings / predictions).
 *
 * Render-only: props in, JSX out. No fetching, no router awareness beyond the
 * swappable Link. Two densities via `density` ('comfortable' | 'compact').
 * ──────────────────────────────────────────────────────────────────────────── */

export type FixtureRowStatus = 'live' | 'result' | 'upcoming';

export type FixtureRowDensity = 'comfortable' | 'compact';

/** Per-fixture engagement counters. Any field may be omitted; a badge renders
 * only when its value is a finite number (0 is shown — an honest "no thoughts
 * yet" reads differently from "feature absent", which is `undefined`). */
export interface FixtureEngagement {
  /** Thought-pulse count for the fixture's Game context. */
  thoughts?: number;
  /** Number of player/manager ratings submitted. */
  ratings?: number;
  /** Number of predictions made on the fixture. */
  predictions?: number;
}

export interface FixtureRowData {
  /** Stable id (also the React key when rendered in a group). */
  id: string;
  status: FixtureRowStatus;
  home: G5FixtureSide;
  away: G5FixtureSide;
  /**
   * Live / result minute label as shown ("85'", "90+2'", "FT"). For live games
   * a label containing "90+" (or `lateLive`) tints the cell red.
   */
  minuteLabel?: string;
  /** Force the red late-live tint regardless of the label text. */
  lateLive?: boolean;
  /** ISO kickoff datetime — used to derive the upcoming time label. */
  kickoffIso?: string;
  /** Explicit upcoming time label ("9 PM"); overrides the derived one. */
  kickoffLabel?: string;
  /** Score — shown for live/result; not rendered for upcoming (kickoff time only). */
  scoreHome?: number;
  scoreAway?: number;
  /** Optional engagement counters rendered in the trailing badge slot. */
  engagement?: FixtureEngagement;
  /** Deep-link target (Match Centre). When set, the row links via LinkProvider. */
  href?: string;
}

export interface FixtureRowProps {
  data: FixtureRowData;
  /** Row density. `comfortable` (default) for the full Home; `compact` for the widget. */
  density?: FixtureRowDensity;
  /**
   * Highlight treatment for the lead/live row (gradient surface + hairline).
   * Defaults to `true` for live rows, `false` otherwise; pass explicitly to override.
   */
  highlighted?: boolean;
  className?: string;
}

export function FixtureRow({
  data,
  density = 'comfortable',
  highlighted,
  className,
}: FixtureRowProps) {
  const Link = useLinkComponent();
  const isHighlighted = highlighted ?? data.status === 'live';
  const isUpcoming = data.status === 'upcoming';
  const isInteractive = Boolean(data.href);

  const padding = density === 'compact' ? 'px-2 py-1' : 'px-3 py-2';
  const sideWidth = density === 'compact' ? 'w-[80px]' : 'w-[104px]';

  const body = (
    <>
      <FixtureLeadCell data={data} />
      <div
        data-slot="fixture-row-teams"
        className={cn('flex shrink-0 items-center', density === 'compact' ? 'gap-3' : 'gap-4')}
      >
        <FixtureTeam side={data.home} align="end" widthClass={sideWidth} />
        {isUpcoming ? (
          <FixtureScorePlaceholder />
        ) : (
          <FixtureScore scoreHome={data.scoreHome} scoreAway={data.scoreAway} />
        )}
        <FixtureTeam side={data.away} align="start" widthClass={sideWidth} />
      </div>
      <FixtureTrailingCell data={data} density={density} />
    </>
  );

  const baseClass = cn(
    'group/fixture-row relative flex w-full items-center justify-between rounded-[4px]',
    padding,
    'text-left text-white',
    isHighlighted
      ? 'border border-white/[0.05] bg-gradient-to-r from-[rgba(25,25,25,0.5)] to-[rgba(38,37,37,0.5)] backdrop-blur-[15px]'
      : 'border border-transparent',
    isInteractive &&
      'cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] focus-visible:border-[var(--color-red-100)] focus-visible:outline-none',
    className
  );

  if (isInteractive) {
    return (
      <Link
        href={data.href as string}
        data-slot="fixture-row"
        data-status={data.status}
        data-highlighted={isHighlighted || undefined}
        className={baseClass}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      data-slot="fixture-row"
      data-status={data.status}
      data-highlighted={isHighlighted || undefined}
      className={baseClass}
    >
      {body}
    </div>
  );
}

// ─── lead cell (minute / clock+time) ─────────────────────────────────────────

function FixtureLeadCell({ data }: { data: FixtureRowData }) {
  if (data.status === 'upcoming') {
    const time = data.kickoffLabel ?? formatFixtureTime(data.kickoffIso);
    return (
      <div
        data-slot="fixture-row-lead"
        data-kind="kickoff"
        className="flex shrink-0 items-center gap-1 text-[var(--color-grey-500)]"
      >
        <Clock weight="regular" aria-hidden="true" className="size-4 shrink-0" />
        <span className="font-mono text-[12px] tabular-nums tracking-[-0.36px]">{time}</span>
      </div>
    );
  }

  const isLate = isLateLive(data);
  return (
    <span
      data-slot="fixture-row-lead"
      data-kind="minute"
      data-late={isLate || undefined}
      className={cn(
        'shrink-0 font-mono text-[12px] tabular-nums tracking-[-0.36px]',
        isLate ? 'text-[var(--color-red-100)]' : 'text-white'
      )}
    >
      {data.minuteLabel ?? (data.status === 'result' ? 'FT' : "0'")}
    </span>
  );
}

// ─── trailing cell (engagement badges / symmetric spacer) ────────────────────

function FixtureTrailingCell({
  data,
  density,
}: {
  data: FixtureRowData;
  density: FixtureRowDensity;
}) {
  const hasBadges = data.engagement ? hasAnyEngagement(data.engagement) : false;
  if (hasBadges) {
    return <FixtureEngagementBadges engagement={data.engagement as FixtureEngagement} />;
  }
  // No badges: mirror the lead cell width with an empty spacer so the teams
  // block stays optically centred. The `min-w-*` classes carry the width, so the
  // span holds no text — an earlier "00" filler leaked as a visible glyph
  // wherever the consumer's compiled CSS dropped `opacity-0`.
  return (
    <span
      data-slot="fixture-row-trailing"
      aria-hidden="true"
      className={cn(
        'pointer-events-none shrink-0 select-none',
        density === 'compact' ? 'min-w-[24px]' : 'min-w-[32px]'
      )}
    />
  );
}

/** Per-fixture engagement counters: thought-pulse, ratings, predictions. */
export function FixtureEngagementBadges({
  engagement,
  className,
}: {
  engagement: FixtureEngagement;
  className?: string;
}) {
  const items: Array<{ key: string; icon: React.ReactNode; value: number; label: string }> = [];
  if (Number.isFinite(engagement.thoughts)) {
    items.push({
      key: 'thoughts',
      icon: <ChatCircle weight="fill" aria-hidden="true" className="size-3" />,
      value: engagement.thoughts as number,
      label: 'thoughts',
    });
  }
  if (Number.isFinite(engagement.ratings)) {
    items.push({
      key: 'ratings',
      icon: <Star weight="fill" aria-hidden="true" className="size-3" />,
      value: engagement.ratings as number,
      label: 'ratings',
    });
  }
  if (Number.isFinite(engagement.predictions)) {
    items.push({
      key: 'predictions',
      icon: <Target weight="fill" aria-hidden="true" className="size-3" />,
      value: engagement.predictions as number,
      label: 'predictions',
    });
  }
  if (items.length === 0) return null;

  return (
    <span
      data-slot="fixture-row-engagement"
      className={cn('flex shrink-0 items-center gap-2.5', className)}
    >
      {items.map((item) => (
        <span
          key={item.key}
          data-slot="fixture-engagement-badge"
          data-kind={item.key}
          className="inline-flex items-center gap-1 text-[var(--color-grey-500)]"
        >
          <span className="text-[var(--color-grey-500)]">{item.icon}</span>
          <span className="font-mono text-[11px] tabular-nums tracking-[-0.33px] text-white/80">
            {formatCount(item.value)}
          </span>
          <span className="sr-only">{item.label}</span>
        </span>
      ))}
    </span>
  );
}

// ─── team + score ────────────────────────────────────────────────────────────

function FixtureTeam({
  side,
  align,
  widthClass,
}: {
  side: G5FixtureSide;
  align: 'start' | 'end';
  widthClass: string;
}) {
  const crest = (
    <FixtureRowCrest label={side.label} imageUrl={side.imageUrl} accent={side.accentColor} />
  );
  const name = (
    <span className="min-w-0 truncate text-[12px] tracking-[-0.36px] text-white">{side.label}</span>
  );
  return (
    <div
      data-slot="fixture-row-team"
      data-align={align}
      className={cn(
        'flex shrink-0 items-center gap-1',
        widthClass,
        align === 'end' ? 'justify-end' : 'justify-start'
      )}
    >
      {align === 'end' ? (
        <>
          {name}
          {crest}
        </>
      ) : (
        <>
          {crest}
          {name}
        </>
      )}
    </div>
  );
}

function FixtureRowCrest({
  label,
  imageUrl,
  accent,
}: {
  label: string;
  imageUrl?: string;
  accent?: string;
}) {
  return (
    <span
      data-slot="fixture-row-crest"
      aria-hidden="true"
      style={imageUrl ? undefined : { backgroundColor: accent ?? 'var(--color-grey-300)' }}
      className={cn(
        'relative inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full',
        !imageUrl && 'border border-white/10 text-[7px] font-bold text-white'
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-contain"
        />
      ) : (
        <span>{initialsFromFixtureLabel(label)}</span>
      )}
    </span>
  );
}

function FixtureScore({ scoreHome, scoreAway }: { scoreHome?: number; scoreAway?: number }) {
  return (
    <span
      data-slot="fixture-row-score"
      className="flex w-[39px] shrink-0 items-center justify-between font-mono text-[14px] font-semibold tabular-nums tracking-[-0.42px] text-white"
    >
      <span>{scoreHome ?? 0}</span>
      <span>-</span>
      <span>{scoreAway ?? 0}</span>
    </span>
  );
}

/**
 * Upcoming rows show the kickoff time, NOT a score (Figma 713-3848). This is the
 * same-width empty cell that holds the centre column's place so the two team
 * blocks stay optically centred — it renders no digits and no dash (an earlier
 * "transparent score" approach leaked a literal "0 - 0" wherever the consumer's
 * compiled CSS dropped `text-transparent`).
 */
function FixtureScorePlaceholder() {
  return (
    <span data-slot="fixture-row-score" data-empty="true" aria-hidden="true" className="w-[39px] shrink-0" />
  );
}

// ─── FixtureGroup (date header) ───────────────────────────────────────────────

export interface FixtureGroupProps {
  /** Date header, already formatted ("Tuesday, May 19"). */
  dateLabel: string;
  children: React.ReactNode;
  /** Row density passed through to the group's heading rhythm. */
  density?: FixtureRowDensity;
  className?: string;
}

export function FixtureGroup({
  dateLabel,
  children,
  density = 'comfortable',
  className,
}: FixtureGroupProps) {
  return (
    <section
      data-slot="fixture-group"
      className={cn('flex w-full flex-col', density === 'compact' ? 'gap-4' : 'gap-3', className)}
    >
      <h3
        data-slot="fixture-group-date"
        className="text-[12px] leading-[18px] tracking-[-0.36px] text-white"
      >
        {dateLabel}
      </h3>
      <div data-slot="fixture-group-rows" className="flex w-full flex-col">
        {children}
      </div>
    </section>
  );
}

// ─── FixtureFilterBar (league + status pills) ─────────────────────────────────

export type FixtureFilter = 'live' | 'results' | 'upcoming';

export interface FixtureFilterBarProps {
  /** Active status filter, or `null` for the default ("All") view. */
  activeFilter?: FixtureFilter | null;
  onFilterChange?: (filter: FixtureFilter | null) => void;
  /** League selector label (the flex-1 "All" pill). Defaults to "All". */
  leagueLabel?: string;
  /** Fired when the league pill is pressed (opens a league selector upstream). */
  onLeaguePress?: () => void;
  className?: string;
}

const FILTER_PILLS: ReadonlyArray<{ key: FixtureFilter; label: string }> = [
  { key: 'live', label: 'Live' },
  { key: 'results', label: 'Results' },
  { key: 'upcoming', label: 'Upcoming' },
];

export function FixtureFilterBar({
  activeFilter = null,
  onFilterChange,
  leagueLabel = 'All',
  onLeaguePress,
  className,
}: FixtureFilterBarProps) {
  return (
    <div data-slot="fixture-filter-bar" className={cn('flex w-full items-center gap-2', className)}>
      <button
        type="button"
        data-slot="fixture-filter-league"
        onClick={onLeaguePress}
        className={cn(
          'flex min-w-0 flex-1 items-center justify-center rounded-[4px] px-4 py-2',
          'border border-white/[0.05] bg-[var(--color-grey-300)] backdrop-blur-[15px]',
          'text-[12px] leading-[18px] tracking-[-0.36px] text-[#ccc4c4]',
          onLeaguePress
            ? 'cursor-pointer transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30'
            : 'cursor-default'
        )}
      >
        <span className="truncate">{leagueLabel}</span>
      </button>
      {FILTER_PILLS.map((pill) => {
        const isActive = activeFilter === pill.key;
        return (
          <button
            key={pill.key}
            type="button"
            data-slot="fixture-filter-pill"
            data-filter={pill.key}
            data-active={isActive || undefined}
            aria-pressed={isActive}
            onClick={() => onFilterChange?.(isActive ? null : pill.key)}
            className={cn(
              'shrink-0 rounded-[4px] px-4 py-2 backdrop-blur-[15px]',
              'text-[12px] leading-[18px] tracking-[-0.36px]',
              'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
              isActive
                ? 'border border-white/[0.05] bg-[var(--color-grey-300)] text-white'
                : 'bg-[var(--color-grey-100)] text-[#ccc4c4] hover:text-white'
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── helpers (pure, exported for tests + reuse) ──────────────────────────────

export function initialsFromFixtureLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A live fixture is "late-live" when flagged or its minute label crosses into
 * added time (contains a "+"), which the design tints red. */
export function isLateLive(
  data: Pick<FixtureRowData, 'status' | 'lateLive' | 'minuteLabel'>
): boolean {
  if (data.status !== 'live') return false;
  if (data.lateLive) return true;
  return Boolean(data.minuteLabel && data.minuteLabel.includes('+'));
}

/** Format an ISO datetime as a short kickoff time ("9 PM", "7:30 PM"). On an
 * unparseable input returns the honest "TBC". Mirrors the Bun/V8 ICU caution in
 * memory by reading parts manually rather than trusting the localized join. */
export function formatFixtureTime(iso?: string): string {
  if (!iso) return 'TBC';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBC';
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = lookup('hour');
  const minute = lookup('minute');
  const dayPeriod = lookup('dayPeriod').toUpperCase();
  // Drop ":00" so on-the-hour kickoffs read "9 PM" not "9:00 PM" (matches mock).
  const time = minute === '00' ? hour : `${hour}:${minute}`;
  return dayPeriod ? `${time} ${dayPeriod}` : time;
}

function hasAnyEngagement(engagement: FixtureEngagement): boolean {
  return (
    Number.isFinite(engagement.thoughts) ||
    Number.isFinite(engagement.ratings) ||
    Number.isFinite(engagement.predictions)
  );
}
