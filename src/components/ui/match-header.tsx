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
 * Anatomy (matches Wave 6.1 spec):
 *
 *   ┌─────────────────────────────────────────────────────────────────────────┐
 *   │  [stadium photo, blurred + scrim]                                       │
 *   │                                                                         │
 *   │           Tue 19 May 2026                                                │
 *   │            Premier League                                                │
 *   │                                                                         │
 *   │  ARSENAL  [crest] [ 1 – 2 ]  [crest]  CHELSEA                            │
 *   │  2nd in PL          FT                1st in PL                          │
 *   │                                                                         │
 *   │  B. Saka 35'  ⚽          xG          ⚽ C. Palmer 55'                   │
 *   │              0.25                1.25 ⚽ E. Fernández 85'                │
 *   │                                                                         │
 *   │  Emirates Stadium                                                        │
 *   └─────────────────────────────────────────────────────────────────────────┘
 *
 * Each side may render an optional standings caption ("2nd in Premier League")
 * and an array of `scorers` with goal icons inline. xG row renders only when
 * either side supplies a value. Score plaque sits centered with a darker
 * backdrop for contrast against the photo.
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
        <span className="text-xs tracking-[0.04em] text-white/85">
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

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-6 gap-y-3">
        <SideBlock side={home} align="end" />
        <ScorePlaque
          isScheduled={isScheduled}
          kickoffTime={kickoff.timeLabel}
          scoreHome={scoreHome}
          scoreAway={scoreAway}
          statusLabel={statusLabel}
          variant={isPhoto ? 'photo' : 'flat'}
        />
        <SideBlock side={away} align="start" />
      </div>

      {showXg ? (
        <div
          data-slot="match-header-xg"
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-6"
        >
          <span
            data-slot="match-header-xg-home"
            className="text-right text-sm font-semibold tabular-nums text-white"
          >
            {formatXg(xgHome)}
          </span>
          <span className="text-[10px] tracking-[0.18em] uppercase text-white/55">xG</span>
          <span
            data-slot="match-header-xg-away"
            className="text-left text-sm font-semibold tabular-nums text-white"
          >
            {formatXg(xgAway)}
          </span>
        </div>
      ) : null}

      <ScorersRow home={home.scorers ?? []} away={away.scorers ?? []} />

      {venueLabel ? (
        <div data-slot="match-header-venue" className="text-center text-xs text-white/55">
          {venueLabel}
        </div>
      ) : null}
    </header>
  );
}

function SideBlock({ side, align }: { side: MatchHeaderSide; align: 'start' | 'end' }) {
  return (
    <div
      data-slot="match-header-side"
      data-align={align}
      className={cn(
        'flex min-w-0 items-center gap-3 sm:gap-4',
        align === 'end' ? 'justify-end' : 'justify-start'
      )}
    >
      {align === 'end' ? (
        <>
          <SideText side={side} align={align} />
          <SideCrest side={side} />
        </>
      ) : (
        <>
          <SideCrest side={side} />
          <SideText side={side} align={align} />
        </>
      )}
    </div>
  );
}

function SideText({ side, align }: { side: MatchHeaderSide; align: 'start' | 'end' }) {
  const LinkComponent = useLinkComponent();
  const labelClass = 'text-xl font-bold tracking-tight text-white sm:text-2xl';
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-0.5',
        align === 'end' ? 'items-end text-right' : 'items-start text-left'
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
        <span
          data-slot="match-header-side-standing"
          className="text-xs tracking-tight text-white/65"
        >
          {side.standingLabel}
        </span>
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
        'relative inline-flex size-14 shrink-0 items-center justify-center sm:size-16',
        'rounded-full text-sm font-bold tracking-tight text-white',
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

function ScorePlaque({
  isScheduled,
  kickoffTime,
  scoreHome,
  scoreAway,
  statusLabel,
  variant,
}: {
  isScheduled: boolean;
  kickoffTime: string;
  scoreHome?: number;
  scoreAway?: number;
  statusLabel: string;
  variant: 'photo' | 'flat';
}) {
  return (
    <div
      data-slot="match-header-score"
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-[4px] px-4 py-2',
        'min-w-[120px]',
        variant === 'photo'
          ? 'border border-white/10 bg-black/45 backdrop-blur-md'
          : 'border border-white/10 bg-black/40'
      )}
    >
      {isScheduled ? (
        <span className="text-2xl font-bold tabular-nums text-white">{kickoffTime}</span>
      ) : (
        <div className="flex items-baseline gap-2 text-3xl font-bold tabular-nums sm:text-4xl">
          <span>{scoreHome ?? 0}</span>
          <span className="text-white/55">–</span>
          <span>{scoreAway ?? 0}</span>
        </div>
      )}
      {statusLabel ? (
        <span className="text-[10px] tracking-[0.18em] uppercase text-white/65">{statusLabel}</span>
      ) : null}
    </div>
  );
}

function ScorersRow({
  home,
  away,
}: {
  home: readonly MatchHeaderScorer[];
  away: readonly MatchHeaderScorer[];
}) {
  if (home.length === 0 && away.length === 0) return null;
  return (
    <div
      data-slot="match-header-scorers"
      className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-6 gap-y-1"
    >
      <ul data-side="home" className="flex min-w-0 flex-col items-end gap-1 text-right">
        {home.map((scorer, idx) => (
          <ScorerEntry key={`h-${idx}-${scorer.name}`} scorer={scorer} align="end" />
        ))}
      </ul>
      <span aria-hidden="true" className="size-1" />
      <ul data-side="away" className="flex min-w-0 flex-col items-start gap-1 text-left">
        {away.map((scorer, idx) => (
          <ScorerEntry key={`a-${idx}-${scorer.name}`} scorer={scorer} align="start" />
        ))}
      </ul>
    </div>
  );
}

function ScorerEntry({ scorer, align }: { scorer: MatchHeaderScorer; align: 'start' | 'end' }) {
  const LinkComponent = useLinkComponent();
  const inner = (
    <>
      {scorer.name} <span className="tabular-nums text-white/65">{scorer.minute}</span>
    </>
  );
  return (
    <li
      data-slot="match-header-scorer"
      data-kind={scorer.kind ?? 'goal'}
      className={cn(
        'flex items-center gap-1.5 text-xs text-white/85',
        align === 'end' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <ScorerIcon kind={scorer.kind ?? 'goal'} />
      {scorer.href ? (
        <LinkComponent
          href={scorer.href}
          data-slot="match-header-scorer-link"
          className="tracking-tight transition-colors hover:text-[var(--color-red-100)]"
        >
          {inner}
        </LinkComponent>
      ) : (
        <span className="tracking-tight">{inner}</span>
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
