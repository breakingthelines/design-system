'use client';

import * as React from 'react';
import {
  ArrowsLeftRight,
  Clock,
  Flag,
  FlagCheckered,
  Prohibit,
  SoccerBall,
  VideoCamera,
  Warning,
} from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchTimeline (Match page — Game Day rich timeline module)
 *
 * The full, phase-grouped match timeline shown on the Match Centre Game Day
 * tab (Figma 2177-9474). It is deliberately richer than `TimelinePulse`:
 *
 *   - Events run down a centre axis. Home events sit to the LEFT of the axis,
 *     away events to the RIGHT. (`unknown`-side events centre.)
 *   - Phases ("Final Time", "Additional Time +7", "Half Time", "Kick Off") are
 *     rendered as centred divider chips with a hairline rule, splitting the
 *     run of events into blocks. The consumer supplies the phase per event;
 *     the timeline groups consecutive events under the same phase.
 *   - Each row is `minute · icon · player · detail`, with a per-event-type
 *     icon (goal / own-goal / penalty / card / sub / VAR …).
 *
 * `TimelinePulse` is intentionally left untouched — it remains the compact
 * list/strip used in Arena cards, feeds and headers. `MatchTimeline` is the
 * page-level module. Both consume the SAME event-kind union so a consumer's
 * proto→event projection feeds either component.
 *
 * Render-only: props in, JSX out. No fetching, no router awareness. Honest by
 * default — with no events it renders a tight `FallbackState`.
 *
 * MatchTimelineEventKind reconciliation
 * ─────────────────────────────────────
 * Mirrors `btl.game.v1.types.football.FootballTimelineEventType` plus a few
 * render-only synthetics the consumer can synthesise for clock markers.
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

export type MatchTimelineEventKind =
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

export type MatchTimelineSide = 'home' | 'away' | 'unknown';

export interface MatchTimelineEvent {
  /** Stable key for React; falls back to index. */
  id?: string;
  /** Display minute ("78'", "45+2", "FT"). */
  minute?: string;
  /** Numeric minute (when known), used for ordering when the label is fuzzy. */
  minuteNumber?: number;
  kind: MatchTimelineEventKind;
  /** Primary line, usually the player name ("Saka", "E. Fernández"). */
  player: string;
  /** Optional href for the primary player line. When present, the name renders as a link. */
  playerHref?: string;
  /** Optional secondary line ("Header from Corner", "K. Havertz" off). */
  detail?: string;
  /** Optional href for the secondary line (e.g. the player coming off in a sub). */
  detailHref?: string;
  /** Which side the event belongs to. Drives left/right placement. */
  side?: MatchTimelineSide;
  /**
   * Phase label this event falls under ("Final Time", "Additional Time +7",
   * "Half Time", "Kick Off"). Consecutive events sharing a phase are grouped
   * under a single divider chip. Omit for ungrouped events.
   */
  phase?: string;
}

export interface MatchTimelineProps {
  events: readonly MatchTimelineEvent[];
  /** Fallback when no events. Defaults to `TIMELINE_MISSING`. */
  fallbackReason?: FallbackReason;
  /** Max events to render. Default: no cap. */
  limit?: number;
  className?: string;
}

interface PhaseGroup {
  phase?: string;
  events: MatchTimelineEvent[];
}

export function MatchTimeline({ events, fallbackReason, limit, className }: MatchTimelineProps) {
  if (!events || events.length === 0) {
    return <FallbackState reason={fallbackReason ?? 'TIMELINE_MISSING'} className={className} />;
  }

  const ordered = events.toSorted(orderByMinuteDescending);
  const sliced = limit && limit > 0 ? ordered.slice(0, limit) : ordered;
  const groups = groupByPhase(sliced);

  return (
    <div
      data-slot="match-timeline"
      className={cn('relative flex w-full flex-col gap-5', className)}
    >
      {groups.map((group, groupIdx) => (
        <div
          key={group.phase ? `phase-${group.phase}-${groupIdx}` : `group-${groupIdx}`}
          data-slot="match-timeline-phase-group"
          className="relative flex flex-col gap-4"
        >
          {group.phase ? <PhaseDivider phase={group.phase} /> : null}
          <ol data-slot="match-timeline-events" className="flex flex-col gap-4">
            {group.events.map((event, idx) => (
              <TimelineRow key={event.id ?? `event-${groupIdx}-${idx}`} event={event} />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function PhaseDivider({ phase }: { phase: string }) {
  return (
    <div
      data-slot="match-timeline-phase"
      data-phase={phase}
      className="relative flex items-center gap-3"
    >
      <span className="relative z-10 shrink-0 rounded-[4px] border border-white/10 bg-[var(--color-grey-300)] px-2.5 py-1 text-[12px] tracking-tight text-white">
        {phase}
      </span>
      <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
    </div>
  );
}

function TimelineRow({ event }: { event: MatchTimelineEvent }) {
  const side = event.side ?? 'unknown';

  // Unknown-side events (kickoff / FT marker / unattributed) render centred,
  // spanning the axis, rather than being forced onto one half.
  if (side === 'unknown') {
    return (
      <li
        data-slot="match-timeline-row"
        data-kind={event.kind}
        data-side={side}
        className="relative z-10 flex items-center justify-center"
      >
        <div className="flex items-center gap-3 rounded-[4px] bg-[var(--color-grey-200)] px-2">
          <Minute minute={event.minute} />
          <EventIcon kind={event.kind} />
          <EventText
            player={event.player}
            playerHref={event.playerHref}
            detail={event.detail}
            detailHref={event.detailHref}
            align="start"
          />
        </div>
      </li>
    );
  }

  const isHome = side === 'home';

  return (
    <li
      data-slot="match-timeline-row"
      data-kind={event.kind}
      data-side={side}
      className="relative z-10 grid grid-cols-2 items-center gap-x-8"
    >
      {isHome ? (
        <div className="col-start-1 flex items-center justify-start gap-3">
          <Minute minute={event.minute} />
          <EventIcon kind={event.kind} />
          <EventText
            player={event.player}
            playerHref={event.playerHref}
            detail={event.detail}
            detailHref={event.detailHref}
            align="start"
          />
        </div>
      ) : (
        <div className="col-start-2 flex flex-row-reverse items-center justify-start gap-3">
          <Minute minute={event.minute} />
          <EventIcon kind={event.kind} />
          <EventText
            player={event.player}
            playerHref={event.playerHref}
            detail={event.detail}
            detailHref={event.detailHref}
            align="end"
          />
        </div>
      )}
    </li>
  );
}

function Minute({ minute }: { minute?: string }) {
  return (
    <span
      data-slot="match-timeline-minute"
      className="shrink-0 text-[12px] tabular-nums text-[var(--color-grey-500)]"
    >
      {minute || '--'}
    </span>
  );
}

function EventText({
  player,
  playerHref,
  detail,
  detailHref,
  align,
}: {
  player: string;
  playerHref?: string;
  detail?: string;
  detailHref?: string;
  align: 'start' | 'end';
}) {
  const LinkComponent = useLinkComponent();
  return (
    <span
      data-slot="match-timeline-event-text"
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'end' && 'flex-row-reverse text-right'
      )}
    >
      {playerHref ? (
        <LinkComponent
          href={playerHref}
          data-slot="match-timeline-event-player-link"
          className="min-w-0 truncate text-[14px] font-semibold tracking-tight text-white hover:underline"
        >
          {player}
        </LinkComponent>
      ) : (
        <span className="min-w-0 truncate text-[14px] font-semibold tracking-tight text-white">
          {player}
        </span>
      )}
      {detail ? (
        detailHref ? (
          <LinkComponent
            href={detailHref}
            data-slot="match-timeline-event-detail"
            className="min-w-0 truncate text-[12px] text-[var(--color-grey-500)] hover:underline"
          >
            {detail}
          </LinkComponent>
        ) : (
          <span
            data-slot="match-timeline-event-detail"
            className="min-w-0 truncate text-[12px] text-[var(--color-grey-500)]"
          >
            {detail}
          </span>
        )
      ) : null}
    </span>
  );
}

/* Per-event-type icon. Goals use the filled ball; cards use coloured chips so a
 * yellow/red/second-yellow reads at a glance even in greyscale. */
function EventIcon({ kind }: { kind: MatchTimelineEventKind }) {
  const wrap = (node: React.ReactNode) => (
    <span
      data-slot="match-timeline-icon"
      data-kind={kind}
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center"
    >
      {node}
    </span>
  );

  switch (kind) {
    case 'goal':
    case 'penalty_goal':
      return wrap(<SoccerBall weight="fill" className="size-4 text-white" />);
    case 'own_goal':
      // Own goal: ball tinted with the home-accent red so it is never confused
      // with a normal goal.
      return wrap(<SoccerBall weight="fill" className="size-4 text-[var(--color-red-300)]" />);
    case 'penalty_missed':
      return wrap(<Prohibit weight="bold" className="size-4 text-[var(--color-grey-500)]" />);
    case 'yellow_card':
      return wrap(<CardChip tone="yellow" />);
    case 'red_card':
      return wrap(<CardChip tone="red" />);
    case 'second_yellow_red':
      return wrap(<DoubleCardChip />);
    case 'substitution':
      return wrap(
        <ArrowsLeftRight weight="bold" className="size-4 text-[var(--color-grey-500)]" />
      );
    case 'var':
      return wrap(<VideoCamera weight="fill" className="size-4 text-[var(--color-grey-500)]" />);
    case 'kickoff':
      return wrap(<Flag weight="fill" className="size-4 text-[var(--color-grey-500)]" />);
    case 'half_time':
      return wrap(<Clock weight="fill" className="size-4 text-[var(--color-grey-500)]" />);
    case 'full_time':
      return wrap(<FlagCheckered weight="fill" className="size-4 text-[var(--color-grey-500)]" />);
    case 'other':
    default:
      return wrap(<Warning weight="fill" className="size-4 text-[var(--color-grey-500)]" />);
  }
}

/* Disciplinary cards are drawn as small bordered rectangles (matching the Figma
 * card glyphs) rather than an icon-font glyph, so the yellow/red colour reads
 * exactly. The home-accent red token doubles as the red-card fill. */
function CardChip({ tone }: { tone: 'yellow' | 'red' }) {
  return (
    <span
      data-slot="match-timeline-card"
      data-tone={tone}
      className={cn(
        'block h-3 w-2 rounded-[1px] border border-white',
        tone === 'yellow' ? 'bg-[#ebb400]' : 'bg-[var(--color-red-300)]'
      )}
    />
  );
}

/* Second-yellow-as-red: a red card overlapping a yellow card, matching the
 * Figma double-chip glyph (yellow behind, red in front). */
function DoubleCardChip() {
  return (
    <span data-slot="match-timeline-card" data-tone="second-yellow" className="relative size-4">
      <span className="absolute top-[4px] left-[3px] h-2.5 w-2 rounded-[1px] border border-white bg-[#ebb400]" />
      <span className="absolute top-[2px] left-[6px] h-2.5 w-2 rounded-[1px] border border-white bg-[var(--color-red-300)]" />
    </span>
  );
}

/** Order newest-first (highest minute at the top), matching the Figma layout. */
function orderByMinuteDescending(a: MatchTimelineEvent, b: MatchTimelineEvent): number {
  const am = a.minuteNumber ?? Number.MIN_SAFE_INTEGER;
  const bm = b.minuteNumber ?? Number.MIN_SAFE_INTEGER;
  return bm - am;
}

/** Group consecutive events that share the same phase under one divider. */
export function groupByPhase(events: readonly MatchTimelineEvent[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last && last.phase === event.phase) {
      last.events.push(event);
    } else {
      groups.push({ phase: event.phase, events: [event] });
    }
  }
  return groups;
}
