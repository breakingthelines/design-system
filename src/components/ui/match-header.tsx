'use client';

import * as React from 'react';
import { Prohibit, SoccerBall } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchHeader (Wave 6.1 redesign)
 *
 * The masthead of a Match (Game Centre) page. Photo-hero by default with a
 * stadium image bleed; flat fallback when no image is available.
 *
 * Anatomy (Wave 6.28 central-stack + responsive refresh):
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │  [stadium photo, blurred + scrim]                                       │
 *   │                                                                         │
 *   │           Tue 19 May 2026   (bold)                                       │
 *   │            Premier League   (lighter)                                    │
 *   │                                                                         │
 *   │  ARSENAL  [crest] ┌ 1 – 2 ┐ [crest]  CHELSEA                             │
 *   │  2nd in PL        │( dark )│         1st in PL                           │
 *   │  B. Saka 35' ⚽   └  FT   ┘    ⚽ C. Palmer 55'                          │
 *   │                  (same width)  ⚽ E. Fernández 85'                       │
 *   │                                                                         │
 *   │              xG (bold) ·  0.25   1.25 (grey)                             │
 *   │                                                                         │
 *   │  Emirates Stadium                                                        │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * The date line is bold; the competition sits lighter beneath it. The central
 * column is a STACKED two-panel unit of equal width: a dark score panel over a
 * lighter-grey status panel ("FT"/clock) of the SAME width — they read as one
 * scoreboard, not a panel plus a detached pill. Scorers sit UNDER each team's
 * name + standing block (home left-aligned, away right-aligned), reading
 * "Name - Time" with a goal icon. Each side may render an optional standings
 * caption ("2nd in Premier League"), which links to the competition when
 * `standingHref` is supplied and omits entirely when absent (knockout phases /
 * standings unavailable). The xG row labels itself with a prominent white "xG"
 * and muted-grey values; it renders only when either side supplies a value.
 *
 * Responsive: the three-column grid (team · scoreboard · team) holds at every
 * width. Team names never clip — the side columns collapse to zero (`min-w-0`)
 * and names wrap (`text-balance` + `break-words`) rather than truncate, while
 * the crest, type, gaps and scoreboard shrink on narrow viewports.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchHeaderScorer {
  /** Full or abbreviated player name. */
  name: string;
  /** Minute as string, e.g. "35'" or "85' (pen)". */
  minute: string;
  /** Goal kind. Defaults to 'goal'. */
  kind?: 'goal' | 'own_goal' | 'penalty' | 'penalty_missed';
  /** Optional href — when present the scorer's name renders as a link. */
  href?: string;
}

export interface MatchHeaderSide {
  label: string;
  shortLabel?: string;
  imageUrl?: string;
  accentColor?: string;
  /** League standing caption, e.g. "2nd in Premier League". */
  standingLabel?: string;
  /** Optional href for the standing caption (typically the competition page). */
  standingHref?: string;
  /** Scorers rendered inline below the score plaque (home left, away right). */
  scorers?: readonly MatchHeaderScorer[];
  /** Optional href — when present the team label + crest become a link. */
  href?: string;
}

export type MatchHeaderVariant = 'flat' | 'photo';

export type MatchHeaderStatus =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'finished'
  | 'postponed'
  | 'cancelled';

export interface MatchHeaderProps {
  home: MatchHeaderSide;
  away: MatchHeaderSide;
  status: MatchHeaderStatus;
  /** Visual treatment. Default: `photo`. */
  variant?: MatchHeaderVariant;
  /** Stadium photo. */
  backgroundImageUrl?: string;
  /** Score (renders when status ≠ scheduled). */
  scoreHome?: number;
  scoreAway?: number;
  /** Kickoff ISO. Drives both pre-match clock display and "Tue 19 May 2026" caption. */
  kickoffIso?: string;
  /** Optional clock label for in-play games ("78'", "HT"). */
  clockLabel?: string;
  competitionLabel?: string;
  /** Optional href for the competition eyebrow. */
  competitionHref?: string;
  venueLabel?: string;
  /** Team xG. Row renders only when either is supplied. */
  xgHome?: number;
  xgAway?: number;
  /** IANA timezone. Defaults to "Europe/London". */
  timeZone?: string;
  className?: string;
}

const STATUS_LABEL: Record<MatchHeaderStatus, string> = {
  scheduled: '',
  live: 'LIVE',
  half_time: 'HT',
  finished: 'FT',
  postponed: 'POSTPONED',
  cancelled: 'CANCELLED',
};

export function MatchHeader({
  home,
  away,
  status,
  variant = 'photo',
  backgroundImageUrl,
  scoreHome,
  scoreAway,
  kickoffIso,
  clockLabel,
  competitionLabel,
  competitionHref,
  venueLabel,
  xgHome,
  xgAway,
  timeZone,
  className,
}: MatchHeaderProps) {
  const LinkComponent = useLinkComponent();
  const isScheduled = status === 'scheduled' || status === 'postponed' || status === 'cancelled';
  const kickoff = formatMatchKickoff(kickoffIso, timeZone);
  const isPhoto = variant === 'photo' && Boolean(backgroundImageUrl);
  const showXg = xgHome !== undefined || xgAway !== undefined;
  const statusLabel = clockLabel ?? STATUS_LABEL[status];

  return (
    <header
      data-slot="match-header"
      data-status={status}
      data-variant={isPhoto ? 'photo' : 'flat'}
      className={cn(
        'relative isolate flex w-full flex-col gap-5 overflow-hidden text-white',
        'rounded-[4px] border border-white/10',
        'px-6 py-7 sm:px-8 sm:py-8',
        isPhoto ? 'bg-[var(--color-black)]' : 'bg-[var(--color-grey-200)]',
        className
      )}
    >
      {isPhoto ? (
        <div
          data-slot="match-header-backdrop"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <img
            src={backgroundImageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full scale-110 object-cover blur-[20px]"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      ) : null}

      <div
        data-slot="match-header-eyebrow"
        className="flex flex-col items-center gap-0.5 text-center"
      >
        <span
          data-slot="match-header-date"
          className="text-sm font-semibold tracking-[0.02em] text-white"
        >
          {isScheduled ? kickoff.dateLabel : kickoff.fullDateLabel}
        </span>
        {competitionLabel ? (
          competitionHref ? (
            <LinkComponent
              href={competitionHref}
              data-slot="match-header-competition-link"
              className="text-xs tracking-[0.04em] text-white/55 transition-colors hover:text-[var(--color-red-100)]"
            >
              {competitionLabel}
            </LinkComponent>
          ) : (
            <span className="text-xs tracking-[0.04em] text-white/55">{competitionLabel}</span>
          )
        ) : null}
      </div>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-2.5 gap-y-3 sm:gap-x-6">
        <SideBlock side={home} align="end" />
        <ScoreStack
          isScheduled={isScheduled}
          kickoffTime={kickoff.timeLabel}
          scoreHome={scoreHome}
          scoreAway={scoreAway}
          statusLabel={statusLabel}
          status={status}
          variant={isPhoto ? 'photo' : 'flat'}
        />
        <SideBlock side={away} align="start" />
      </div>

      {showXg ? (
        <div
          data-slot="match-header-xg"
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2.5"
        >
          <span
            data-slot="match-header-xg-home"
            className="text-right text-sm tabular-nums text-white/55"
          >
            {formatXg(xgHome)}
          </span>
          <span className="text-[11px] font-bold text-white">xG</span>
          <span
            data-slot="match-header-xg-away"
            className="text-left text-sm tabular-nums text-white/55"
          >
            {formatXg(xgAway)}
          </span>
        </div>
      ) : null}

      {venueLabel ? (
        <div
          data-slot="match-header-venue"
          className="-mt-4 text-center text-xs font-semibold text-white/55"
        >
          {venueLabel}
        </div>
      ) : null}
    </header>
  );
}

function SideBlock({ side, align }: { side: MatchHeaderSide; align: 'start' | 'end' }) {
  // Mobile: crest stacks above the name (centered) so the name gets the full
  // column width and breaks on its spaces, not mid-word. From `sm` up it returns
  // to the desktop row — name beside crest, mirrored per side (home: text · crest,
  // away: crest · text). One DOM order (crest first) + `sm:flex-row-reverse` on
  // the home side keeps the markup single-branch.
  return (
    <div
      data-slot="match-header-side"
      data-align={align}
      className={cn(
        'flex min-w-0 flex-col gap-2',
        align === 'end' ? 'items-center sm:items-end' : 'items-center sm:items-start'
      )}
    >
      <div
        className={cn(
          'flex w-full min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-4',
          align === 'end' ? 'sm:flex-row-reverse sm:justify-start' : 'sm:justify-start'
        )}
      >
        <SideCrest side={side} />
        <SideText side={side} align={align} />
      </div>
      <SideScorers scorers={side.scorers ?? []} align={align} />
    </div>
  );
}

function SideText({ side, align }: { side: MatchHeaderSide; align: 'start' | 'end' }) {
  const LinkComponent = useLinkComponent();
  // Names must never clip: the column collapses to zero (`min-w-0`) so the score
  // panel keeps its width, the name takes the full column (`w-full`) and breaks
  // on its spaces (`break-words`); `[overflow-wrap:anywhere]` is the last-resort
  // hard break for a single word longer than the column. Centered on mobile
  // (under the crest), end/start-aligned from `sm` up (beside the crest).
  const labelClass =
    'w-full text-base font-bold tracking-tight break-words [overflow-wrap:anywhere] text-white sm:text-2xl';
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5 text-center',
        align === 'end'
          ? 'items-center sm:items-end sm:text-right'
          : 'items-center sm:items-start sm:text-left'
      )}
    >
      {side.href ? (
        <LinkComponent
          href={side.href}
          data-slot="match-header-side-label"
          className={cn(labelClass, 'transition-colors hover:text-[var(--color-red-100)]')}
        >
          {side.label}
        </LinkComponent>
      ) : (
        <span data-slot="match-header-side-label" className={labelClass}>
          {side.label}
        </span>
      )}
      {side.standingLabel ? (
        side.standingHref ? (
          <LinkComponent
            href={side.standingHref}
            data-slot="match-header-side-standing"
            className="text-[11px] tracking-tight text-white/60 transition-colors hover:text-[var(--color-red-100)] sm:text-xs"
          >
            {side.standingLabel}
          </LinkComponent>
        ) : (
          <span
            data-slot="match-header-side-standing"
            className="text-[11px] tracking-tight text-white/60 sm:text-xs"
          >
            {side.standingLabel}
          </span>
        )
      ) : null}
    </div>
  );
}

function SideCrest({ side }: { side: MatchHeaderSide }) {
  const initials = initialsFromMatchLabel(side.shortLabel ?? side.label);
  return (
    <span
      data-slot="match-header-crest"
      aria-hidden="true"
      style={{ backgroundColor: side.accentColor ?? 'transparent' }}
      className={cn(
        'relative inline-flex size-11 shrink-0 items-center justify-center sm:size-16',
        'rounded-full text-xs font-bold tracking-tight text-white sm:text-sm',
        'overflow-hidden',
        !side.imageUrl && 'border border-white/15'
      )}
    >
      {side.imageUrl ? (
        <img
          src={side.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-contain"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

/**
 * The central scoreboard column: a dark score panel stacked over a status panel
 * of the SAME WIDTH (lighter grey). The two read as one unit — score on top,
 * "FT"/clock beneath — rather than a panel plus a detached pill. Both children
 * are `w-full`, so the shared `min-w` on the column governs their common width.
 */
function ScoreStack({
  isScheduled,
  kickoffTime,
  scoreHome,
  scoreAway,
  statusLabel,
  status,
  variant,
}: {
  isScheduled: boolean;
  kickoffTime: string;
  scoreHome?: number;
  scoreAway?: number;
  statusLabel: string;
  status: MatchHeaderStatus;
  variant: 'photo' | 'flat';
}) {
  return (
    <div className="flex w-[88px] flex-col items-stretch gap-1.5 sm:w-[120px]">
      <div
        data-slot="match-header-score"
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-lg px-3 py-2.5 sm:px-5',
          variant === 'photo'
            ? 'border border-white/10 bg-[var(--color-grey-100)]/85 backdrop-blur-md'
            : 'border border-white/5 bg-[var(--color-grey-100)]'
        )}
      >
        {isScheduled ? (
          <span className="text-xl font-bold tabular-nums text-white sm:text-2xl">
            {kickoffTime}
          </span>
        ) : (
          <div className="flex items-baseline gap-2 text-3xl font-bold tabular-nums sm:gap-2.5 sm:text-4xl">
            <span>{scoreHome ?? 0}</span>
            <span className="text-white/45">–</span>
            <span>{scoreAway ?? 0}</span>
          </div>
        )}
      </div>
      {statusLabel ? (
        <span
          data-slot="match-header-status"
          data-status={status}
          className={cn(
            'flex w-full items-center justify-center rounded-lg px-3 py-1',
            'text-[10px] font-semibold tracking-[0.18em] text-white/80 uppercase',
            variant === 'photo'
              ? 'bg-[var(--color-grey-300)]/80 backdrop-blur-md'
              : 'bg-[var(--color-grey-300)]'
          )}
        >
          {statusLabel}
        </span>
      ) : null}
    </div>
  );
}

/**
 * One side's scorers, sitting directly under that team's name + standing block
 * (home left-aligned, away right-aligned). Renders nothing when the side has no
 * goals, so the unit collapses cleanly for goalless / knockout fixtures.
 */
function SideScorers({
  scorers,
  align,
}: {
  scorers: readonly MatchHeaderScorer[];
  align: 'start' | 'end';
}) {
  if (scorers.length === 0) return null;
  return (
    <ul
      data-slot="match-header-scorers"
      data-side={align === 'end' ? 'home' : 'away'}
      className={cn(
        'flex min-w-0 flex-col gap-1 text-center sm:text-left',
        align === 'end' ? 'items-center sm:items-end sm:text-right' : 'items-center sm:items-start'
      )}
    >
      {scorers.map((scorer, idx) => (
        <ScorerEntry key={`${idx}-${scorer.name}`} scorer={scorer} align={align} />
      ))}
    </ul>
  );
}

function ScorerEntry({ scorer, align }: { scorer: MatchHeaderScorer; align: 'start' | 'end' }) {
  const LinkComponent = useLinkComponent();
  // "Name - Time" reads as one labelled line; the separator stays muted so the
  // name + minute carry the emphasis.
  const inner = (
    <>
      {scorer.name}
      <span aria-hidden="true" className="px-1 text-white/40">
        -
      </span>
      <span className="tabular-nums text-white/65">{scorer.minute}</span>
    </>
  );
  return (
    <li
      data-slot="match-header-scorer"
      data-kind={scorer.kind ?? 'goal'}
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-[11px] text-white/85 sm:gap-2 sm:text-xs',
        align === 'end' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <ScorerIcon kind={scorer.kind ?? 'goal'} />
      {scorer.href ? (
        <LinkComponent
          href={scorer.href}
          data-slot="match-header-scorer-link"
          className="tracking-tight break-words transition-colors hover:text-[var(--color-red-100)]"
        >
          {inner}
        </LinkComponent>
      ) : (
        <span className="tracking-tight break-words">{inner}</span>
      )}
    </li>
  );
}

/**
 * Hero scorer icon. Goals + penalties render Phosphor SoccerBall (filled
 * white). Own goals render the same ball tinted BTL red so they sit visually
 * apart from a regular goal but never read as "blocked" or "cancelled".
 * Penalty-missed keeps a Prohibit glyph (the timeline convention).
 */
function ScorerIcon({ kind }: { kind: NonNullable<MatchHeaderScorer['kind']> }) {
  switch (kind) {
    case 'own_goal':
      return (
        <SoccerBall
          aria-hidden="true"
          weight="fill"
          className="size-3 shrink-0 text-[var(--color-red-100)]"
        />
      );
    case 'penalty_missed':
      return (
        <Prohibit
          aria-hidden="true"
          weight="bold"
          className="size-3 shrink-0 text-[var(--color-grey-500)]"
        />
      );
    case 'goal':
    case 'penalty':
    default:
      return <SoccerBall aria-hidden="true" weight="fill" className="size-3 shrink-0 text-white" />;
  }
}

export function initialsFromMatchLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function formatXg(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

function intlPartsLookup(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') result[part.type] = part.value;
  }
  return result;
}

export function formatMatchKickoff(
  iso?: string,
  timeZone: string = 'Europe/London'
): {
  dateLabel: string;
  timeLabel: string;
  fullDateLabel: string;
} {
  if (!iso) {
    return { dateLabel: 'TBD', timeLabel: '—', fullDateLabel: 'Date TBD' };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: 'TBD', timeLabel: '—', fullDateLabel: 'Date TBD' };
  }
  const shortParts = intlPartsLookup(
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone,
    }).formatToParts(date)
  );
  const dateLabel =
    `${shortParts.weekday ?? ''} ${shortParts.day ?? ''} ${shortParts.month ?? ''}`.trim();
  const timeParts = intlPartsLookup(
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).formatToParts(date)
  );
  const timeLabel = `${timeParts.hour ?? '00'}:${timeParts.minute ?? '00'}`;
  const longParts = intlPartsLookup(
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone,
    }).formatToParts(date)
  );
  const fullDateLabel =
    `${longParts.weekday ?? ''} ${longParts.day ?? ''} ${longParts.month ?? ''} ${longParts.year ?? ''}`.trim();
  return { dateLabel, timeLabel, fullDateLabel };
}
