'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * TimelinePulse
 *
 * Pulse-style render of timeline occurrences. Two variants:
 *   - `vertical` (default), a vertical list with minute + headline + side.
 *   - `horizontal`, a thin compressed strip suitable for header chips
 *     and Arena cards.
 *
 * The primitive is intentionally loose about the event shape: the caller
 * adapts proto `GameOccurrence` (or whatever the read-model gives) into
 * the `TimelinePulseEvent` shape. This keeps the primitive composable
 * across surfaces that already have their own timeline projections.
 *
 * TimelinePulseEventKind reconciliation
 * ─────────────────────────────────────
 * The kind union mirrors `btl.game.v1.types.football.FootballTimelineEventType`
 * plus a few render-only synthetics (kickoff / half_time / full_time / other)
 * the consumer can synthesise for clock markers.
 *
 *   Proto enum                                       → Kind union
 *   ──────────────────────────────────────────────────────────────────
 *   FOOTBALL_TIMELINE_EVENT_TYPE_GOAL                → goal
 *   FOOTBALL_TIMELINE_EVENT_TYPE_OWN_GOAL            → own_goal
 *   FOOTBALL_TIMELINE_EVENT_TYPE_PENALTY_SCORED      → penalty_goal
 *   FOOTBALL_TIMELINE_EVENT_TYPE_PENALTY_MISSED      → penalty_missed
 *   FOOTBALL_TIMELINE_EVENT_TYPE_YELLOW_CARD         → yellow_card
 *   FOOTBALL_TIMELINE_EVENT_TYPE_SECOND_YELLOW_CARD  → second_yellow_red
 *   FOOTBALL_TIMELINE_EVENT_TYPE_RED_CARD            → red_card
 *   FOOTBALL_TIMELINE_EVENT_TYPE_SUBSTITUTION        → substitution
 *   FOOTBALL_TIMELINE_EVENT_TYPE_VAR                 → var
 *   (synthetic)                                      → kickoff
 *   (synthetic)                                      → half_time
 *   (synthetic)                                      → full_time
 *   (synthetic)                                      → other
 * ──────────────────────────────────────────────────────────────────────────── */

export type TimelinePulseEventKind =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_missed'
  | 'yellow_card'
  | 'red_card'
  | 'second_yellow_red'
  | 'substitution'
  | 'var'
  | 'kickoff'
  | 'half_time'
  | 'full_time'
  | 'other';

export type TimelinePulseSide = 'home' | 'away' | 'unknown';

export interface TimelinePulseEvent {
  /** Stable key for React; falls back to index. */
  id?: string;
  /** Display minute ("78'", "45+2", "FT"). */
  minute?: string;
  /** Numeric minute (when known), used for ordering when minute label is fuzzy. */
  minuteNumber?: number;
  kind: TimelinePulseEventKind;
  /** Headline (e.g. "Saka 78'"). */
  label: string;
  /** Optional secondary line. */
  detail?: string;
  side?: TimelinePulseSide;
}

export interface TimelinePulseProps {
  events: readonly TimelinePulseEvent[];
  /** Layout. Default: vertical. */
  variant?: 'vertical' | 'horizontal';
  /** Fallback when no events. Defaults to `TIMELINE_MISSING`. */
  fallbackReason?: FallbackReason;
  /** Max events to render (vertical only). Default: no cap. */
  limit?: number;
  className?: string;
}

export function TimelinePulse({
  events,
  variant = 'vertical',
  fallbackReason,
  limit,
  className,
}: TimelinePulseProps) {
  if (!events || events.length === 0) {
    return <FallbackState reason={fallbackReason ?? 'TIMELINE_MISSING'} className={className} />;
  }

  const ordered = events.toSorted(orderByMinute);
  const sliced = limit && limit > 0 ? ordered.slice(0, limit) : ordered;

  if (variant === 'horizontal') {
    return (
      <ol
        data-slot="timeline-pulse"
        data-variant="horizontal"
        className={cn('flex w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-2', className)}
      >
        {sliced.map((event, idx) => (
          <li
            key={event.id ?? `event-${idx}`}
            data-slot="timeline-pulse-event"
            data-kind={event.kind}
            data-side={event.side ?? 'unknown'}
            className="flex w-32 shrink-0 snap-start flex-col rounded-md border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="text-[10px] tracking-wide text-white/45 uppercase">
              {event.minute || '--'}
            </span>
            <span className="mt-1 truncate text-sm font-medium text-white">{event.label}</span>
            {event.detail ? (
              <span className="mt-0.5 truncate text-xs text-white/55">{event.detail}</span>
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol data-slot="timeline-pulse" data-variant="vertical" className={cn('space-y-2', className)}>
      {sliced.map((event, idx) => (
        <li
          key={event.id ?? `event-${idx}`}
          data-slot="timeline-pulse-event"
          data-kind={event.kind}
          data-side={event.side ?? 'unknown'}
          className="flex items-baseline gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
        >
          <span className="w-12 shrink-0 text-xs text-white/55">{event.minute || '--'}</span>
          <span aria-hidden className="text-base" data-slot="timeline-pulse-glyph">
            {glyph(event.kind)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-white/85">{event.label}</span>
          {event.detail ? (
            <span className="hidden text-xs text-white/55 sm:inline">{event.detail}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function orderByMinute(a: TimelinePulseEvent, b: TimelinePulseEvent): number {
  const am = a.minuteNumber ?? Number.MAX_SAFE_INTEGER;
  const bm = b.minuteNumber ?? Number.MAX_SAFE_INTEGER;
  return am - bm;
}

function glyph(kind: TimelinePulseEventKind): string {
  switch (kind) {
    case 'goal':
    case 'penalty_goal':
      return 'G';
    case 'own_goal':
      return 'OG';
    case 'penalty_missed':
      return 'Pm';
    case 'yellow_card':
      return 'Y';
    case 'red_card':
    case 'second_yellow_red':
      return 'R';
    case 'substitution':
      return 'S';
    case 'var':
      return 'V';
    case 'kickoff':
      return 'KO';
    case 'half_time':
      return 'HT';
    case 'full_time':
      return 'FT';
    case 'other':
    default:
      return '-';
  }
}
