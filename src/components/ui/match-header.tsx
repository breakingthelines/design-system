'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { ScoreboardChip, type ScoreboardChipStatus } from '#/components/ui/scoreboard-chip';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchHeader
 *
 * The masthead of a Match (Game Centre) page. Renders the two teams, the
 * score (or kickoff time), the competition, the venue, and the date. The
 * score column always reflects status: for SCHEDULED games we show the
 * kickoff date+time; for LIVE / FINISHED we show the live score.
 *
 * Like every other G6 primitive, MatchHeader is render-only. Consumers map
 * their proto/REST data to the props.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchHeaderSide {
  label: string;
  shortLabel?: string;
  imageUrl?: string;
  accentColor?: string;
}

export interface MatchHeaderProps {
  home: MatchHeaderSide;
  away: MatchHeaderSide;
  status: ScoreboardChipStatus;
  /** Score (rendered when status ≠ scheduled). */
  scoreHome?: number;
  scoreAway?: number;
  /** Kickoff ISO datetime (rendered when status === scheduled). */
  kickoffIso?: string;
  /** Optional clock label for in-play games ("78'", "HT"). */
  clockLabel?: string;
  competitionLabel?: string;
  venueLabel?: string;
  className?: string;
}

export function MatchHeader({
  home,
  away,
  status,
  scoreHome,
  scoreAway,
  kickoffIso,
  clockLabel,
  competitionLabel,
  venueLabel,
  className,
}: MatchHeaderProps) {
  const isScheduled = status === 'scheduled' || status === 'postponed' || status === 'cancelled';
  const kickoff = formatMatchKickoff(kickoffIso);

  return (
    <header
      data-slot="match-header"
      data-status={status}
      className={cn(
        'flex w-full flex-col gap-4 border border-white/10 bg-[var(--color-grey-200)]',
        'px-5 py-5 text-white',
        className
      )}
    >
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
          className="flex w-[120px] shrink-0 flex-col items-center justify-center"
        >
          {isScheduled ? (
            <>
              <span className="text-[10px] tracking-[0.18em] uppercase text-[var(--color-grey-500)]">
                {kickoff.dateLabel}
              </span>
              <span
                data-slot="match-header-kickoff"
                className="font-mono text-2xl font-semibold tabular-nums text-white"
              >
                {kickoff.timeLabel}
              </span>
            </>
          ) : (
            <div
              data-slot="match-header-score"
              className="flex items-baseline gap-2 font-mono text-3xl font-bold tabular-nums"
            >
              <span>{scoreHome ?? 0}</span>
              <span className="text-[var(--color-grey-500)]">:</span>
              <span>{scoreAway ?? 0}</span>
            </div>
          )}
        </div>
        <MatchHeaderSideBlock align="start" side={away} />
      </div>

      {venueLabel || kickoffIso ? (
        <footer
          data-slot="match-header-footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 text-[11px] text-[var(--color-grey-500)]"
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
          <MatchHeaderLabel side={side} />
          <MatchHeaderCrest side={side} />
        </>
      ) : (
        <>
          <MatchHeaderCrest side={side} />
          <MatchHeaderLabel side={side} />
        </>
      )}
    </div>
  );
}

function MatchHeaderLabel({ side }: { side: MatchHeaderSide }) {
  return (
    <p
      data-slot="match-header-side-label"
      className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-white"
    >
      {side.label}
    </p>
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

export function formatMatchKickoff(iso?: string): {
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
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
    .format(date)
    .toUpperCase();
  const timeLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  const fullDateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
  return { dateLabel, timeLabel, fullDateLabel };
}
