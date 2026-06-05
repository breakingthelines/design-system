'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { ScoreboardChip, type ScoreboardChipStatus } from '#/components/ui/scoreboard-chip';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchHeader
 *
 * The masthead of a Match (Game Centre) page. Renders the two teams, the
 * score (or kickoff time), the competition, the venue, the date, each side's
 * league standing, and an optional team-xG row. The score column always
 * reflects status: for SCHEDULED games we show the kickoff date+time; for
 * LIVE / FINISHED we show the live score.
 *
 * Two visual treatments, selected by `variant`:
 *   - `flat` (default) — a solid grey-200 card. Close to the original masthead.
 *   - `photo` — a stadium photo bleed behind the scoreboard. The image is
 *     blurred (20px) and darkened with an rgba(0,0,0,0.5) scrim so the white
 *     team names, score and captions stay legible. Mirrors Figma 2177-9474 /
 *     2177-9283. Falls back to the flat surface when no `backgroundImageUrl`
 *     is supplied, so `variant="photo"` is always safe.
 *
 * Like every other G6 primitive, MatchHeader is render-only. Consumers map
 * their proto/REST data to the props.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchHeaderSide {
  label: string;
  shortLabel?: string;
  imageUrl?: string;
  accentColor?: string;
  /** League standing caption, e.g. "1st in Premier League". */
  standingLabel?: string;
}

export type MatchHeaderVariant = 'flat' | 'photo';

export interface MatchHeaderProps {
  home: MatchHeaderSide;
  away: MatchHeaderSide;
  status: ScoreboardChipStatus;
  /** Visual treatment. Default: `flat`. */
  variant?: MatchHeaderVariant;
  /**
   * Stadium / atmosphere image rendered behind the scoreboard when
   * `variant="photo"`. Ignored for the flat variant. When the photo variant
   * is requested without an image, the header degrades to the flat surface.
   */
  backgroundImageUrl?: string;
  /** Score (rendered when status ≠ scheduled). */
  scoreHome?: number;
  scoreAway?: number;
  /** Kickoff ISO datetime (rendered when status === scheduled). */
  kickoffIso?: string;
  /** Optional clock label for in-play games ("78'", "HT"). */
  clockLabel?: string;
  competitionLabel?: string;
  venueLabel?: string;
  /** Team xG. The row renders only when at least one value is supplied. */
  xgHome?: number;
  xgAway?: number;
  /** IANA timezone for kickoff rendering (e.g., "America/New_York"). Defaults to "Europe/London". */
  timeZone?: string;
  className?: string;
}

export function MatchHeader({
  home,
  away,
  status,
  variant = 'flat',
  backgroundImageUrl,
  scoreHome,
  scoreAway,
  kickoffIso,
  clockLabel,
  competitionLabel,
  venueLabel,
  xgHome,
  xgAway,
  timeZone,
  className,
}: MatchHeaderProps) {
  const isScheduled = status === 'scheduled' || status === 'postponed' || status === 'cancelled';
  const kickoff = formatMatchKickoff(kickoffIso, timeZone);
  // The photo treatment only engages when there is actually an image to show.
  const isPhoto = variant === 'photo' && Boolean(backgroundImageUrl);
  const showXg = xgHome !== undefined || xgAway !== undefined;

  return (
    <header
      data-slot="match-header"
      data-status={status}
      data-variant={isPhoto ? 'photo' : 'flat'}
      className={cn(
        'relative isolate flex w-full flex-col gap-4 overflow-hidden border border-white/10 text-white',
        'px-5 py-5',
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
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : null}

      <div
        data-slot="match-header-eyebrow"
        className="flex items-center justify-between gap-3 text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        <span data-slot="match-header-competition" className="truncate">
          {competitionLabel ?? 'Match'}
        </span>
        <ScoreboardChip status={status} clockLabel={clockLabel} />
      </div>

      <div className="flex items-center gap-4">
        <MatchHeaderSideBlock align="end" side={home} />
        <div
          data-slot="match-header-centre"
          className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-1"
        >
          {isScheduled ? (
            <>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[var(--color-grey-500)]">
                {kickoff.dateLabel}
              </span>
              <span
                data-slot="match-header-kickoff"
                className={cn(
                  'font-mono text-2xl font-semibold tabular-nums text-white',
                  isPhoto &&
                    'rounded-[4px] border border-white/10 bg-white/20 px-3 py-1 backdrop-blur-md'
                )}
              >
                {kickoff.timeLabel}
              </span>
            </>
          ) : (
            <div
              data-slot="match-header-score"
              className={cn(
                'flex items-baseline gap-2 font-mono text-3xl font-bold tabular-nums',
                isPhoto &&
                  'rounded-[4px] border border-white/10 bg-white/15 px-3 py-1.5 backdrop-blur-md'
              )}
            >
              <span>{scoreHome ?? 0}</span>
              <span className="text-[var(--color-grey-500)]">:</span>
              <span>{scoreAway ?? 0}</span>
            </div>
          )}
        </div>
        <MatchHeaderSideBlock align="start" side={away} />
      </div>

      {showXg ? (
        <div
          data-slot="match-header-xg"
          className={cn(
            'flex items-center justify-between gap-3',
            'border-t border-white/[0.06] pt-3'
          )}
        >
          <span
            data-slot="match-header-xg-home"
            className="font-mono text-[13px] font-semibold tabular-nums text-white"
          >
            {formatXg(xgHome)}
          </span>
          <span className="text-[10px] tracking-[0.16em] text-[var(--color-grey-500)] uppercase">
            xG
          </span>
          <span
            data-slot="match-header-xg-away"
            className="font-mono text-[13px] font-semibold tabular-nums text-white"
          >
            {formatXg(xgAway)}
          </span>
        </div>
      ) : null}

      {venueLabel || kickoffIso ? (
        <footer
          data-slot="match-header-footer"
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-[11px] text-[var(--color-grey-500)]',
            // The xG row already drew a divider; avoid stacking two rules.
            !showXg && 'border-t border-white/[0.06]'
          )}
        >
          {kickoffIso ? (
            <span data-slot="match-header-date" className="tracking-[0.04em] uppercase">
              {kickoff.fullDateLabel}
            </span>
          ) : null}
          {venueLabel ? (
            <span data-slot="match-header-venue" className="tracking-[0.04em] uppercase">
              {venueLabel}
            </span>
          ) : null}
        </footer>
      ) : null}
    </header>
  );
}

function MatchHeaderSideBlock({ align, side }: { align: 'start' | 'end'; side: MatchHeaderSide }) {
  return (
    <div
      data-slot="match-header-side"
      data-align={align}
      className={cn(
        'flex min-w-0 flex-1 items-center gap-3',
        align === 'end' ? 'justify-end text-right' : 'justify-start text-left'
      )}
    >
      {align === 'end' ? (
        <>
          <MatchHeaderLabel side={side} align={align} />
          <MatchHeaderCrest side={side} />
        </>
      ) : (
        <>
          <MatchHeaderCrest side={side} />
          <MatchHeaderLabel side={side} align={align} />
        </>
      )}
    </div>
  );
}

function MatchHeaderLabel({ side, align }: { side: MatchHeaderSide; align: 'start' | 'end' }) {
  return (
    <div
      className={cn('flex min-w-0 flex-col gap-1.5', align === 'end' ? 'items-end' : 'items-start')}
    >
      <p
        data-slot="match-header-side-label"
        className="min-w-0 truncate text-xl font-bold tracking-tight text-white"
      >
        {side.label}
      </p>
      {side.standingLabel ? (
        <p
          data-slot="match-header-side-standing"
          className="min-w-0 truncate text-[12px] font-medium tracking-tight text-white/75"
        >
          {side.standingLabel}
        </p>
      ) : null}
    </div>
  );
}

function MatchHeaderCrest({ side }: { side: MatchHeaderSide }) {
  const initials = initialsFromMatchLabel(side.shortLabel ?? side.label);
  return (
    <span
      data-slot="match-header-crest"
      aria-hidden="true"
      style={{ backgroundColor: side.accentColor ?? 'var(--color-grey-300)' }}
      className={cn(
        'relative inline-flex size-12 shrink-0 items-center justify-center',
        'rounded-full border border-white/10 text-xs font-bold tracking-tight text-white',
        'overflow-hidden'
      )}
    >
      {side.imageUrl ? (
        <img
          src={side.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
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

/**
 * Read individual date parts from `formatToParts` so we can assemble strings
 * with explicit separators. Different ICU implementations (Bun vs V8 vs Node)
 * emit slightly different separator characters for `en-GB` weekday formats —
 * sometimes "FRIDAY, 8 AUGUST 2025", sometimes "FRIDAY 8 AUGUST 2025". For
 * SSR + client hydration the bytes must match exactly, so we control the
 * separators ourselves rather than letting locale punctuation decide.
 */
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
  const dateLabel = `${shortParts.weekday ?? ''} ${shortParts.day ?? ''} ${shortParts.month ?? ''}`
    .trim()
    .toUpperCase();
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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone,
    }).formatToParts(date)
  );
  const fullDateLabel =
    `${longParts.weekday ?? ''} ${longParts.day ?? ''} ${longParts.month ?? ''} ${longParts.year ?? ''}`
      .trim()
      .toUpperCase();
  return { dateLabel, timeLabel, fullDateLabel };
}
