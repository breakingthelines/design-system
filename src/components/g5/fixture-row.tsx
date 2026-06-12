'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChatCircle, Clock, Star, Target } from '@phosphor-icons/react';

import { useLinkComponent } from '#/components/ui/link-context';
import { formatCount } from '#/lib/format';
import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';

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
 *                          The row is laid out as a 3-column CSS GRID
 *                          (`[lead][teams][trailing]`) with fixed-width outer
 *                          cells, so the team block starts and ends at the same
 *                          x-position regardless of which lead variant renders
 *                          ("6'" vs "8 PM" vs "FT"). Pre-grid, a narrower minute
 *                          label let the row collapse, sliding the team names
 *                          inward on result/live rows relative to scheduled
 *                          ones (Wave 6.34e fix).
 *                          When the row carries an `href` it links via the
 *                          `useLinkComponent` context (deep-link into the rich
 *                          Match Centre); otherwise it is a static row.
 *   - `FixtureGroup`     — a date-header section ("Tuesday, May 19") wrapping a
 *                          run of `FixtureRow`s.
 *   - `FixtureFilterBar` — a width-bounded segmented control
 *                          (All / Live / Results / Upcoming) where the ACTIVE
 *                          segment is an ELONGATED `grey-300` pill (`flex-1`,
 *                          absorbs the leftover width) and the inactive ones HUG
 *                          their label; the elongated pill MORPHS between
 *                          segments on switch (framer-motion `layout` +
 *                          shared-element `layoutId`, `glide` spring).
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
  // Teams flex to fill the row so full names expand into the available width
  // rather than truncating inside a fixed cell — compact panels have the room.
  const sideWidth = 'min-w-0 flex-1';

  // Row is a 3-column CSS grid: [lead][teams][trailing]. Reserving fixed widths
  // on the outer cells (lead/trailing) means the team block always starts and
  // ends at the same x-position, REGARDLESS of which lead variant renders
  // ("6'" vs "8 PM" vs "FT" vs "90+2'"). Before this, a flex row let the
  // narrower minute label collapse, sliding the teams left on result/live rows
  // relative to scheduled rows. The score column inside the teams block stays
  // a fixed 39px slot (FixtureScore / FixtureScorePlaceholder), so the home and
  // away names also align horizontally across rows.
  const leadColumn = density === 'compact' ? '36px' : '48px';
  const trailingColumn = density === 'compact' ? '24px' : '32px';

  const body = (
    <>
      <FixtureLeadCell data={data} />
      <div
        data-slot="fixture-row-teams"
        className={cn(
          'flex min-w-0 items-center justify-center',
          density === 'compact' ? 'gap-3' : 'gap-4'
        )}
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
    'group/fixture-row relative grid w-full items-center gap-2.5 rounded-[4px]',
    padding,
    'text-left text-white',
    isHighlighted
      ? 'border border-white/[0.05] bg-gradient-to-r from-[rgba(25,25,25,0.5)] to-[rgba(38,37,37,0.5)] backdrop-blur-[15px]'
      : 'border border-transparent',
    isInteractive &&
      'cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] focus-visible:border-[var(--color-red-100)] focus-visible:outline-none',
    className
  );

  // Inline grid template — Tailwind can't express dynamic per-density column
  // widths from string concatenation safely (purge), so plumb them as a style.
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `${leadColumn} minmax(0, 1fr) ${trailingColumn}`,
  };

  if (isInteractive) {
    return (
      <Link
        href={data.href as string}
        data-slot="fixture-row"
        data-status={data.status}
        data-highlighted={isHighlighted || undefined}
        className={baseClass}
        style={gridStyle}
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
      style={gridStyle}
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
        <span className="text-[12px] tabular-nums tracking-[-0.36px]">{time}</span>
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
        'shrink-0 text-[12px] tabular-nums tracking-[-0.36px]',
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
  // No badges: render an empty spacer so the row's grid template still has a
  // child for the trailing column. The grid column reserves the width (see
  // `FixtureRow`'s gridTemplateColumns), so the span itself just needs to exist
  // — the earlier `min-w-*` reservation now lives at the grid level instead,
  // which keeps the team-block end x-position constant across rows.
  return (
    <span
      data-slot="fixture-row-trailing"
      aria-hidden="true"
      data-density={density}
      className="pointer-events-none select-none"
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
          <span className="text-[11px] tabular-nums tracking-[-0.33px] text-white/80">
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
        'flex min-w-0 items-center gap-1',
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
      className="flex w-[39px] shrink-0 items-center justify-between text-[14px] font-semibold tabular-nums tracking-[-0.42px] text-white"
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
    <span
      data-slot="fixture-row-score"
      data-empty="true"
      aria-hidden="true"
      className="w-[39px] shrink-0"
    />
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

// ─── FixtureFilterBar (animated segmented control) ────────────────────────────

export type FixtureFilter = 'live' | 'results' | 'upcoming';

export interface FixtureFilterBarProps {
  /** Active status filter, or `null` for the default ("All") view. */
  activeFilter?: FixtureFilter | null;
  onFilterChange?: (filter: FixtureFilter | null) => void;
  /**
   * Optional league selector. When `onLeaguePress` is supplied, a trailing
   * league pill renders after the segmented control (opens a selector
   * upstream); with no handler the control stands alone. `leagueLabel` is the
   * pill text. Kept for back-compat; most consumers run their own league
   * control beside the bar.
   */
  leagueLabel?: string;
  onLeaguePress?: () => void;
  className?: string;
}

/**
 * The four segments of the control. `key: null` is the "All" segment — it sits
 * first and is active by default, mirroring the Figma (2150:10938) where "All"
 * is the elongated lead pill. The ACTIVE segment stretches (`flex-1`) to absorb
 * the leftover width; the inactive ones hug their own label.
 */
const FILTER_SEGMENTS: ReadonlyArray<{ key: FixtureFilter | null; label: string }> = [
  { key: null, label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'results', label: 'Results' },
  { key: 'upcoming', label: 'Upcoming' },
];

/** Shared-element id for the morphing active fill. `React.useId` keeps each
 * mounted bar's `layoutId` scope isolated, so two bars on one page (the Thoughts
 * widget + a Home shell) animate independently. */
function highlightLayoutId(scope: string): string {
  return `${scope}-fixture-filter-active`;
}

/** Max width the segmented control is allowed to grow to. In the ~560px
 * "What is happening" panel the group is narrower than this, so it FILLS the
 * panel (active pill elongates to the reference proportions). On a wide page
 * (e.g. /game/football) the group CAPS here instead of stretching the active
 * pill across the whole row — it sits left, search to its right. ~36rem matches
 * the compact panel's natural width. */
const FILTER_GROUP_MAX_WIDTH = '36rem';

/**
 * Segmented control: All / Live / Results / Upcoming, where the ACTIVE segment
 * is an ELONGATED filled pill that absorbs the leftover width (`flex-1`) and the
 * inactive segments HUG their own label (Figma 2150:10938). Active fill is the
 * lighter `grey-300` (plus a white/5 hairline) with white text; inactive pills
 * rest on the darker `grey-100` with muted `#ccc4c4` text. `px-4 py-2` →
 * ~34px-tall pills, `rounded-[4px]`, `backdrop-blur-[15px]`, in a gap-2 row.
 *
 * The group is `w-full` but bounded by `max-width` (`FILTER_GROUP_MAX_WIDTH`):
 * in the narrow panel it fills the panel and looks like the owner's reference;
 * on a wide page it caps at the max-width (active stays ~proportional, NOT
 * page-spanning); on very narrow/mobile the inactive pills shrink/hug so nothing
 * overflows.
 *
 * On switch the elongated pill MORPHS to the newly-active segment — the old one
 * shrinks to hug, the new one grows to `flex-1`. framer-motion `layout` on each
 * button interpolates the widths (no jump) and a shared-element `layoutId` on
 * the active fill slides/morphs it across, both gliding with the `glide` motion
 * spring (stiffness 340 / damping 32). Under `prefers-reduced-motion` the layout
 * snaps instantly (no morph). Every segment shows `cursor-pointer`.
 *
 * Each segment is a real `<button>` with `aria-pressed` reflecting its active
 * state. Filter semantics are unchanged: pressing a segment selects it; pressing
 * the active non-"All" segment again clears back to "All" (null).
 */
export function FixtureFilterBar({
  activeFilter = null,
  onFilterChange,
  leagueLabel = 'All',
  onLeaguePress,
  className,
}: FixtureFilterBarProps) {
  const prefersReduced = useReducedMotion();
  // `glide` morph for the layout + fill; under reduced-motion we snap (and skip
  // the `layout` prop entirely so widths jump instead of interpolating).
  const morphTransition = prefersReduced ? { duration: 0 } : motionTokens.spring.glide;
  const animateLayout = !prefersReduced;
  const scope = React.useId();

  return (
    <div
      data-slot="fixture-filter-bar"
      className={cn('flex w-full flex-wrap items-center gap-2', className)}
    >
      <div
        data-slot="fixture-filter-segments"
        role="group"
        aria-label="Filter fixtures by status"
        // `w-full` so it fills the narrow panel; `max-w` so it caps on wide
        // pages (the active pill never spans the whole row). `flex` (not
        // inline-flex) lets the children's `flex-1` claim the leftover width.
        className="flex w-full min-w-0 items-center gap-2"
        style={{ maxWidth: FILTER_GROUP_MAX_WIDTH }}
      >
        {FILTER_SEGMENTS.map((segment) => {
          const isActive = activeFilter === segment.key;
          // "All" is a pure selection (never toggles to null); the three status
          // segments toggle off back to "All" when re-pressed.
          const next: FixtureFilter | null =
            segment.key === null ? null : isActive ? null : segment.key;
          return (
            <motion.button
              key={segment.label}
              type="button"
              layout={animateLayout}
              transition={morphTransition}
              data-slot="fixture-filter-pill"
              data-filter={segment.key ?? 'all'}
              data-active={isActive || undefined}
              aria-pressed={isActive}
              onClick={() => onFilterChange?.(next)}
              className={cn(
                'relative flex min-w-0 cursor-pointer items-center justify-center rounded-[4px] px-4 py-2 backdrop-blur-[15px]',
                'text-[12px] leading-[18px] font-medium whitespace-nowrap tracking-[-0.36px]',
                'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
                // Active = elongated: claim the leftover width. Inactive = hug
                // its own label (shrink-0 so it never stretches). The active
                // fill is the shared layoutId pill below, so the active button
                // stays transparent here to avoid double-painting.
                isActive
                  ? 'flex-1 text-white'
                  : 'shrink-0 bg-[var(--color-grey-100)] text-[#ccc4c4] hover:text-white'
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId={highlightLayoutId(scope)}
                  data-slot="fixture-filter-active-pill"
                  aria-hidden="true"
                  transition={morphTransition}
                  className="absolute inset-0 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-300)] shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                />
              ) : null}
              <span className="relative truncate">{segment.label}</span>
            </motion.button>
          );
        })}
      </div>

      {onLeaguePress ? (
        <button
          type="button"
          data-slot="fixture-filter-league"
          onClick={onLeaguePress}
          className={cn(
            'flex min-w-0 shrink-0 items-center justify-center rounded-[4px] px-4 py-2',
            'border border-white/[0.05] bg-[var(--color-grey-300)] backdrop-blur-[15px]',
            'text-[12px] leading-[18px] tracking-[-0.36px] text-[#ccc4c4]',
            'cursor-pointer transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30'
          )}
        >
          <span className="truncate">{leagueLabel}</span>
        </button>
      ) : null}
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
