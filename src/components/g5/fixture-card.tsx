'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import type { G5FixtureCardData, G5FixtureStatus } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
 * FixtureCard
 *
 * A render-only matchday tile. Editorial-modernist register: dark surface,
 * 1px hairlines, brand-red live dot, tabular-nums score. Two layouts:
 *
 *   - `compact` (default) — single row, ideal for the Matchday strip.
 *   - `full` — adds competition, venue, and provisional reasons block.
 *
 * No fetching, no routing. `onClick` is optional and never navigates.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FixtureCardProps {
  data: G5FixtureCardData;
  variant?: 'compact' | 'full';
  /** Optional click target. The card itself becomes a button when provided. */
  onClick?: () => void;
  className?: string;
}

export function FixtureCard({ data, variant = 'compact', onClick, className }: FixtureCardProps) {
  const status: G5FixtureStatus = data.status ?? 'scheduled';
  const isProvisional = (data.fallbackReasons?.length ?? 0) > 0;
  const isInteractive = Boolean(onClick);

  const Element = isInteractive ? 'button' : 'article';
  const interactiveProps = isInteractive
    ? ({
        type: 'button' as const,
        onClick,
      } satisfies React.ButtonHTMLAttributes<HTMLButtonElement>)
    : null;

  return (
    <Element
      data-slot="fixture-card"
      data-variant={variant}
      data-status={status}
      data-provisional={isProvisional || undefined}
      {...(interactiveProps ?? {})}
      className={cn(
        'group/fixture relative flex w-full flex-col text-left',
        'border border-[var(--color-grey-300)] bg-[var(--color-grey-200)]',
        'rounded-[8px] px-4 py-3.5',
        'text-white',
        'transition-colors duration-150',
        isInteractive &&
          'cursor-pointer hover:border-white/20 focus-visible:border-[var(--color-red-100)] focus-visible:outline-none',
        className
      )}
    >
      <FixtureEyebrow data={data} status={status} />

      <div className="mt-3 flex items-center gap-3">
        <FixtureSide
          align="end"
          label={data.home.label}
          imageUrl={data.home.imageUrl}
          accent={data.home.accentColor}
        />
        <FixtureCentrepiece data={data} status={status} />
        <FixtureSide
          align="start"
          label={data.away.label}
          imageUrl={data.away.imageUrl}
          accent={data.away.accentColor}
        />
      </div>

      {variant === 'full' && (data.venueLabel || isProvisional) ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/[0.06] pt-3 text-[11px] text-[var(--color-grey-500)]">
          {data.venueLabel ? (
            <span data-slot="fixture-venue" className="tracking-[0.04em] uppercase">
              {data.venueLabel}
            </span>
          ) : null}
          {isProvisional ? (
            <span
              data-slot="fixture-provisional"
              className={cn(
                'inline-flex items-center gap-1.5 border border-[var(--color-red-100)]/30',
                'px-1.5 py-0.5 text-[10px] tracking-[0.1em] uppercase',
                'text-[var(--color-red-100)]'
              )}
            >
              <span aria-hidden="true" className="size-1 rounded-full bg-[var(--color-red-100)]" />
              Provisional
            </span>
          ) : null}
        </div>
      ) : null}
    </Element>
  );
}

// ─── eyebrow ─────────────────────────────────────────────────────────────────

function FixtureEyebrow({ data, status }: { data: G5FixtureCardData; status: G5FixtureStatus }) {
  return (
    <header className="flex items-center justify-between gap-2 text-[10px] tracking-[0.16em] uppercase">
      <p data-slot="fixture-competition" className="truncate text-[var(--color-grey-500)]">
        {data.competitionLabel ?? 'Fixture'}
      </p>
      <StatusPill status={status} />
    </header>
  );
}

function StatusPill({ status }: { status: G5FixtureStatus }) {
  if (status === 'live') {
    return (
      <span
        data-slot="fixture-status"
        data-status="live"
        className="inline-flex items-center gap-1.5 text-[var(--color-red-100)]"
      >
        <span
          aria-hidden="true"
          className="size-1.5 animate-pulse-ring rounded-full bg-[var(--color-red-100)]"
        />
        Live
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span data-slot="fixture-status" data-status="finished" className="text-white/70">
        Full time
      </span>
    );
  }
  if (status === 'postponed') {
    return (
      <span data-slot="fixture-status" data-status="postponed" className="text-amber-200/80">
        Postponed
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span
        data-slot="fixture-status"
        data-status="cancelled"
        className="text-[var(--color-grey-500)] line-through"
      >
        Cancelled
      </span>
    );
  }
  return (
    <span data-slot="fixture-status" data-status="scheduled" className="text-white/70">
      Kick-off
    </span>
  );
}

// ─── sides + centrepiece ─────────────────────────────────────────────────────

function FixtureSide({
  align,
  label,
  imageUrl,
  accent,
}: {
  align: 'start' | 'end';
  label: string;
  imageUrl?: string;
  accent?: string;
}) {
  return (
    <div
      data-slot="fixture-side"
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2.5',
        align === 'end' ? 'justify-end text-right' : 'justify-start text-left'
      )}
    >
      {align === 'end' ? (
        <>
          <FixtureSideLabel label={label} />
          <FixtureCrest label={label} imageUrl={imageUrl} accent={accent} />
        </>
      ) : (
        <>
          <FixtureCrest label={label} imageUrl={imageUrl} accent={accent} />
          <FixtureSideLabel label={label} />
        </>
      )}
    </div>
  );
}

function FixtureSideLabel({ label }: { label: string }) {
  return (
    <p
      data-slot="fixture-side-label"
      className="min-w-0 truncate text-[13px] font-semibold tracking-tight text-white"
    >
      {label}
    </p>
  );
}

function FixtureCrest({
  label,
  imageUrl,
  accent,
}: {
  label: string;
  imageUrl?: string;
  accent?: string;
}) {
  const initials = initialsFromLabel(label);
  return (
    <span
      data-slot="fixture-crest"
      aria-hidden="true"
      style={{
        backgroundColor: accent ?? 'var(--color-grey-300)',
      }}
      className={cn(
        'relative inline-flex size-8 shrink-0 items-center justify-center',
        'rounded-full border border-white/10 text-[10px] font-bold tracking-tight text-white',
        'overflow-hidden'
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
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

function FixtureCentrepiece({
  data,
  status,
}: {
  data: G5FixtureCardData;
  status: G5FixtureStatus;
}) {
  if (status === 'scheduled' || status === 'postponed' || status === 'cancelled') {
    const kickoff = formatKickoff(data.kickoffIso);
    return (
      <div
        data-slot="fixture-kickoff"
        className="flex w-[88px] shrink-0 flex-col items-center justify-center px-1 text-center"
      >
        <span className="text-[10px] tracking-[0.18em] text-[var(--color-grey-500)] uppercase">
          {kickoff.dateLabel}
        </span>
        <span className="text-base font-semibold tabular-nums text-white">
          {kickoff.timeLabel}
        </span>
      </div>
    );
  }

  const home = data.scoreHome ?? 0;
  const away = data.scoreAway ?? 0;
  return (
    <div
      data-slot="fixture-score"
      className="flex w-[88px] shrink-0 items-center justify-center gap-2 px-1 text-center text-xl font-bold tabular-nums text-white"
    >
      <span>{home}</span>
      <span className="text-[var(--color-grey-500)]">:</span>
      <span>{away}</span>
    </div>
  );
}

// ─── helpers (pure) ─────────────────────────────────────────────────────────

export function initialsFromLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function formatKickoff(iso?: string): { dateLabel: string; timeLabel: string } {
  if (!iso) return { dateLabel: 'TBD', timeLabel: '—' };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { dateLabel: 'TBD', timeLabel: '—' };
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
  return { dateLabel, timeLabel };
}
