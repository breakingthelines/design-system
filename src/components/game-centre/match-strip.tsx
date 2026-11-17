'use client';

import * as React from 'react';

import { useLinkComponent } from '#/components/ui/link-context';
import { cn } from '#/lib/utils';

import { playerShortName } from './player-short-name';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchStrip and MatchEventList
 *
 * The match timeline: a minimal strip, then the goals and red cards as a
 * list under it ("strip plus stack").
 *
 * MatchStrip draws dots only, no names. Goals are filled dots, an own goal is
 * a hollow ring and a red card is a red card; yellow cards, substitutions, VAR
 * checks and missed penalties stay off it. Home sits above the line and away
 * below, and a crest at the start of each lane names the side. Each half is its
 * own segment and runs on past 45' and 90' by its stoppage time as a dotted
 * line, so 45+5' sits in the first half and 90+2' and 90+6' sit apart and in
 * order. A match that went to extra time adds two 15 minute segments.
 *
 * MatchEventList is the list: "First half", "Second half" (and the extra time
 * halves), one row per goal or red card with the minute, the player's headshot,
 * the name, a quiet second line ("Assist Rice", "Penalty", "Own goal", "Second
 * yellow", "Red card") and, for goals, the running score ("2-2").
 *
 * A match decided on penalties adds a "Penalty shootout" section after the
 * last phase: one row per kick in order, with the taker, "Scored" or "Missed"
 * and the running shootout score. Kicks are `shootout_scored` and
 * `shootout_missed` events; they are never on the strip, never in the match
 * score and never stretch the extra time segments.
 *
 * Names are the event's stored short name (`playerShortName` on the event,
 * identity's: "Kolo Muani", "Rodri") when it carries one, else
 * `playerShortName` ("Di María", "Mac Allister"), from the provider's short
 * form when the event carries one.
 *
 * Both take the same `MatchStripEvent`s, in any order: they sort by minute and
 * stoppage minute. The running score is counted in that order, so it does not
 * depend on `scoreAfter`. An own goal's `side` is the side it counts for.
 * Cleaning the feed (duplicates, a yellow and a red folded into a second
 * yellow, bench cards, goals ruled out) is the consumer's job.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MatchStripEventKind =
  | 'goal'
  | 'penalty'
  | 'own_goal'
  | 'penalty_missed'
  | 'yellow'
  | 'red'
  | 'sub'
  | 'var'
  | 'shootout_scored'
  | 'shootout_missed';

export type MatchStripSide = 'home' | 'away';

export interface MatchStripEvent {
  id: string;
  kind: MatchStripEventKind;
  /** The side the event belongs to. An own goal: the side it counts for. */
  side: MatchStripSide;
  /** Absolute minute (91 for 90+1). Used when `minuteLabel` cannot be read. */
  minute: number;
  /** "45+2", "61". The minute and its stoppage minute. */
  minuteLabel: string;
  /** The scorer, the booked player, or the player coming on. */
  playerId?: string;
  playerName?: string;
  /**
   * The provider's short form of `playerName` ("R. Kolo Muani"). Preferred
   * for the short name when it is abbreviated.
   */
  playerShort?: string;
  /**
   * The player's stored short name (identity's, "Kolo Muani", "Bruno
   * Fernandes", "Rodri"). Wins over `playerShort` and the rule when given.
   */
  playerShortName?: string;
  /** The assist provider, or the player going off. */
  otherId?: string;
  otherName?: string;
  /** The provider's short form of `otherName`. */
  otherShort?: string;
  /** The stored short name of `otherName`. */
  otherShortName?: string;
  /** Goals only: the score after this goal, home first. */
  scoreAfter?: readonly [number, number];
  /** The provider's reason, for a VAR check or a card ("Goal cancelled", "Foul"). */
  reason?: string;
  /** A red card: the player's second yellow. */
  secondYellow?: boolean;
}

/** @deprecated The strip has no detail line since 0.115.0. */
export interface MatchStripPlayer {
  id?: string;
  name?: string;
  muted: boolean;
}

export interface MatchStripProps {
  events: readonly MatchStripEvent[];
  /**
   * The match went to extra time (its period or status says so): adds the
   * two extra time segments. When left out, an event labelled past 90 that is
   * not 90+ stoppage (a 105' or 120+1' goal) counts as extra time.
   */
  extraTime?: boolean;
  /** The home crest at the start of the upper lane. */
  homeCrest?: React.ReactNode;
  /** The away crest at the start of the lower lane. */
  awayCrest?: React.ReactNode;
  /** The team names, read to screen readers with each lane. */
  homeLabel?: string;
  awayLabel?: string;
  /**
   * Called with a dot's event when it is clicked or tapped, so the host can
   * scroll to its row. With this or `onHighlightEvent` the dots are buttons.
   */
  onSelectEvent?: (event: MatchStripEvent) => void;
  /** Called on hover and focus with the dot's event, and with undefined on leave. */
  onHighlightEvent?: (event: MatchStripEvent | undefined) => void;
  /** The event whose dot is ringed. */
  selectedId?: string;
  /** False draws spans instead of buttons, whatever the handlers say. */
  interactive?: boolean;
  className?: string;
  /** @deprecated Ignored since 0.115.0: the strip has no detail line. */
  showDetail?: boolean;
  /** @deprecated Ignored since 0.115.0: the strip has no side colours. */
  homeColor?: string;
  /** @deprecated Ignored since 0.115.0: the strip has no side colours. */
  awayColor?: string;
  /** @deprecated Ignored since 0.115.0: names are in `MatchEventList`. */
  renderPlayerName?: (player: MatchStripPlayer) => React.ReactNode;
  /** @deprecated Ignored since 0.115.0: headshots are in `MatchEventList`. */
  renderHeadshot?: (playerId: string | undefined) => React.ReactNode;
}

/** @deprecated The strip no longer uses side colours. */
export const MATCH_STRIP_HOME_COLOR = '#eb0000';
/** @deprecated The strip no longer uses side colours. */
export const MATCH_STRIP_AWAY_COLOR = '#0091eb';

const CARD_RED = '#e5322d';

export function isMatchStripGoal(event: MatchStripEvent): boolean {
  return event.kind === 'goal' || event.kind === 'penalty' || event.kind === 'own_goal';
}

/** A penalty shootout kick, scored or missed. Never a goal and never on the strip. */
export function isMatchStripShootout(event: MatchStripEvent): boolean {
  return event.kind === 'shootout_scored' || event.kind === 'shootout_missed';
}

/* ── minutes ─────────────────────────────────────────────────────────────── */

export interface MatchStripMinute {
  /** The minute before stoppage: 90 for "90+6". */
  base: number;
  /** The stoppage minute: 6 for "90+6", 0 for "61". */
  added: number;
}

/** An event's minute and stoppage minute, from its label ("90+6"). */
export function matchStripMinute(event: MatchStripEvent): MatchStripMinute {
  const match = /^\s*(\d+)(?:\s*\+\s*(\d+))?/.exec(event.minuteLabel ?? '');
  if (!match) return { base: Math.max(0, event.minute), added: 0 };
  return { base: Number(match[1]), added: match[2] ? Number(match[2]) : 0 };
}

/**
 * Whether the strip runs to 120': `extraTime` when given, else an event
 * labelled past 90 before its stoppage ("105", "120+1"). A 90+6' goal is
 * still normal time.
 */
export function matchStripEnd(events: readonly MatchStripEvent[], extraTime?: boolean): number {
  if (extraTime !== undefined) return extraTime ? 120 : 90;
  return events.some((e) => !isMatchStripShootout(e) && matchStripMinute(e).base > 90) ? 120 : 90;
}

/** 1 and 2 are the halves, 3 and 4 the halves of extra time. */
export type MatchStripPhase = 1 | 2 | 3 | 4;

const PHASES: readonly { phase: MatchStripPhase; start: number; length: number }[] = [
  { phase: 1, start: 0, length: 45 },
  { phase: 2, start: 45, length: 45 },
  { phase: 3, start: 90, length: 15 },
  { phase: 4, start: 105, length: 15 },
];

/** The heading over each phase in `MatchEventList`. */
export const MATCH_STRIP_PHASE_LABEL: Record<MatchStripPhase, string> = {
  1: 'First half',
  2: 'Second half',
  3: 'Extra time, first half',
  4: 'Extra time, second half',
};

/**
 * The phase an event belongs to. 45+5' is the first half. Without extra time,
 * a minute past 90 is second half stoppage.
 */
export function matchStripPhase(event: MatchStripEvent, extraTime = true): MatchStripPhase {
  const { base } = matchStripMinute(event);
  if (base <= 45) return 1;
  if (base <= 90 || !extraTime) return 2;
  return base <= 105 ? 3 : 4;
}

/** The events in match order: minute, then stoppage minute, then as given. */
export function sortMatchStripEvents(events: readonly MatchStripEvent[]): MatchStripEvent[] {
  return (
    events
      .map((event, index) => ({ event, index, ...matchStripMinute(event) }))
      // A fresh array, so sorting in place is safe; the ES2022 lib has no toSorted.
      // oxlint-disable-next-line unicorn/no-array-sort
      .sort((a, b) => a.base - b.base || a.added - b.added || a.index - b.index)
      .map((e) => e.event)
  );
}

/* ── strip layout ────────────────────────────────────────────────────────── */

export interface MatchStripSegment {
  phase: MatchStripPhase;
  /** The minute it starts at: 0, 45, 90, 105. */
  start: number;
  /** 45 for a half, 15 for a half of extra time. */
  length: number;
  /** Its longest stoppage time among the events, drawn as a dotted run-on. */
  stoppage: number;
  /** Where it starts, in minutes along the strip (stoppage counted). */
  offset: number;
}

export interface MatchStripLayout {
  segments: MatchStripSegment[];
  /** The strip's length in minutes, stoppage counted. */
  total: number;
}

/**
 * The strip's segments. Each half runs on by the longest stoppage time any
 * event shows (substitutions and yellow cards count, though they are not
 * drawn), so the dots in stoppage keep their order and spacing.
 */
export function matchStripLayout(
  events: readonly MatchStripEvent[],
  extraTime?: boolean
): MatchStripLayout {
  const et = matchStripEnd(events, extraTime) === 120;
  const segments: MatchStripSegment[] = [];
  let offset = 0;
  for (const p of PHASES.slice(0, et ? 4 : 2)) {
    const end = p.start + p.length;
    let stoppage = 0;
    for (const e of events) {
      if (isMatchStripShootout(e) || matchStripPhase(e, et) !== p.phase) continue;
      const { base, added } = matchStripMinute(e);
      stoppage = Math.max(stoppage, base - end + added);
    }
    segments.push({ ...p, stoppage, offset });
    offset += p.length + stoppage;
  }
  return { segments, total: offset };
}

/** Where an event sits, in minutes along the strip with stoppage counted. */
export function matchStripOffset(
  event: MatchStripEvent,
  layout: MatchStripLayout,
  extraTime = layout.segments.length > 2
): { segment: number; at: number } {
  const phase = matchStripPhase(event, extraTime);
  const index = Math.max(
    0,
    layout.segments.findIndex((s) => s.phase === phase)
  );
  const seg = layout.segments[index]!;
  const { base, added } = matchStripMinute(event);
  const into = Math.max(0, base - seg.start) + added;
  return { segment: index, at: seg.offset + Math.min(into, seg.length + seg.stoppage) };
}

/**
 * Where an event sits on a plain 0' to `end` line: stoppage on its boundary.
 * @deprecated The strip draws stoppage time since 0.115.0; use `matchStripOffset`.
 */
export function matchStripPosition(event: MatchStripEvent, end: number): number {
  const { base, added } = matchStripMinute(event);
  const minute = added > 0 ? base : event.minute;
  return Math.max(0, Math.min(minute, end));
}

/** Drawn on the strip: goals and red cards. */
export function isMatchStripDot(event: MatchStripEvent): boolean {
  return isMatchStripGoal(event) || event.kind === 'red';
}

/** The crest column, the gap between segments and the room after the last dot. */
const LEAD = 28;
const GAP = 8;
const TAIL = 6;
/** Dots on one side closer than this nudge apart, worked out at a 300px strip. */
const DOT_SPACING = 11;
const BASE_WIDTH = 300;
const LINE_Y = 22;
const LANE = 10;
const HEIGHT = 50;

function stripX(at: number, segment: number, layout: MatchStripLayout, nudge = 0): string {
  const gaps = (layout.segments.length - 1) * GAP;
  const share = layout.total > 0 ? at / layout.total : 0;
  return `calc(${LEAD + segment * GAP + nudge}px + (100% - ${LEAD + gaps + TAIL}px) * ${share.toFixed(5)})`;
}

/**
 * px each dot moves right so dots on one side stay `DOT_SPACING` apart at a
 * 300px strip. Wider strips only spread them further.
 */
function dotNudges(
  dots: readonly MatchStripEvent[],
  layout: MatchStripLayout
): Map<string, number> {
  const width = BASE_WIDTH - LEAD - (layout.segments.length - 1) * GAP - TAIL;
  const nudges = new Map<string, number>();
  for (const side of ['home', 'away'] as const) {
    let last = -Infinity;
    for (const e of dots) {
      if (e.side !== side) continue;
      const { segment, at } = matchStripOffset(e, layout);
      const x = segment * GAP + (width * at) / Math.max(1, layout.total);
      const placed = Math.max(x, last + DOT_SPACING);
      nudges.set(e.id, placed - x);
      last = placed;
    }
  }
  return nudges;
}

/** A dot's name for screen readers: "Dorgu 90+6', 4-4", "Janelt 90+2', Second yellow". */
export function matchStripDotLabel(row: MatchEventListRow): string {
  const e = row.event;
  const who = matchEventPlayer(e) || 'Goal';
  const how = row.how && !row.how.startsWith('Assist') ? row.how : undefined;
  return [`${who} ${e.minuteLabel}'`, how, row.score].filter(Boolean).join(', ');
}

function Dot({ event, selected }: { event: MatchStripEvent; selected: boolean }) {
  const ring = selected
    ? '0 0 0 2px var(--color-background, #0d0d0d), 0 0 0 3.5px currentColor'
    : undefined;
  if (event.kind === 'red') {
    return (
      <span
        className="block h-[9px] w-1.5 rounded-[1px]"
        style={{ background: CARD_RED, boxShadow: ring }}
      />
    );
  }
  if (event.kind === 'own_goal') {
    return (
      <span
        className="block h-2 w-2 rounded-full border-[1.5px] border-current"
        style={{ boxShadow: ring }}
      />
    );
  }
  return (
    <span className="block h-[9px] w-[9px] rounded-full bg-current" style={{ boxShadow: ring }} />
  );
}

export function MatchStrip({
  events,
  extraTime,
  homeCrest,
  awayCrest,
  homeLabel,
  awayLabel,
  onSelectEvent,
  onHighlightEvent,
  selectedId,
  interactive = true,
  className,
}: MatchStripProps) {
  if (events.length === 0) return null;
  const layout = matchStripLayout(events, extraTime);
  const et = layout.segments.length > 2;
  const rows = matchEventListRows(events, extraTime);
  const dots = rows.map((r) => r.event);
  const nudges = dotNudges(dots, layout);
  const clickable = interactive && Boolean(onSelectEvent || onHighlightEvent);
  const lineX = (at: number, segment: number) => stripX(at, segment, layout);
  return (
    <section
      data-slot="match-strip"
      data-end={et ? 120 : 90}
      data-interactive={clickable ? undefined : 'false'}
      aria-label={homeLabel && awayLabel ? `${homeLabel} v ${awayLabel}` : undefined}
      className={cn('relative text-foreground', className)}
      style={{ height: HEIGHT }}
    >
      {homeCrest ? (
        <span
          data-slot="match-strip-home"
          aria-label={homeLabel}
          className="absolute left-0 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
          style={{ top: LINE_Y - LANE }}
        >
          {homeCrest}
        </span>
      ) : null}
      {awayCrest ? (
        <span
          data-slot="match-strip-away"
          aria-label={awayLabel}
          className="absolute left-0 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
          style={{ top: LINE_Y + LANE }}
        >
          {awayCrest}
        </span>
      ) : null}
      {layout.segments.map((s, i) => {
        const end = s.start + s.length;
        const from = lineX(s.offset, i);
        const mid = lineX(s.offset + s.length, i);
        const to = lineX(s.offset + s.length + s.stoppage, i);
        return (
          <React.Fragment key={s.phase}>
            <span
              data-slot="match-strip-segment"
              data-phase={s.phase}
              aria-hidden
              className="absolute h-px bg-white/25"
              style={{ left: from, width: `calc(${mid} - ${from})`, top: LINE_Y }}
            />
            {s.stoppage > 0 ? (
              <span
                data-slot="match-strip-stoppage"
                aria-hidden
                className="absolute h-0 border-t border-dotted border-white/35"
                style={{ left: mid, width: `calc(${to} - ${mid})`, top: LINE_Y }}
              />
            ) : null}
            <span
              aria-hidden
              className="absolute h-[7px] w-px bg-white/35"
              style={{ left: mid, top: LINE_Y - 3 }}
            />
            <span
              data-slot="match-strip-tick"
              aria-hidden
              className="absolute -translate-x-1/2 text-[11px] leading-none text-muted-foreground tabular-nums"
              style={{ left: mid, top: HEIGHT - 11 }}
            >
              {end}&apos;
            </span>
          </React.Fragment>
        );
      })}
      {rows.map((row) => {
        const e = row.event;
        const { segment, at } = matchStripOffset(e, layout, et);
        const on = e.id === selectedId;
        const style = {
          left: stripX(at, segment, layout, nudges.get(e.id) ?? 0),
          top: e.side === 'home' ? LINE_Y - LANE : LINE_Y + LANE,
        };
        const common = {
          'data-slot': 'match-strip-mark',
          'data-kind': e.kind,
          'data-side': e.side,
          'aria-label': matchStripDotLabel(row),
          style,
        };
        const box =
          'absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center';
        if (!clickable) {
          return (
            <span key={e.id} role="img" className={box} {...common}>
              <Dot event={e} selected={on} />
            </span>
          );
        }
        return (
          <button
            key={e.id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelectEvent?.(e)}
            onMouseEnter={() => onHighlightEvent?.(e)}
            onMouseLeave={() => onHighlightEvent?.(undefined)}
            onFocus={() => onHighlightEvent?.(e)}
            onBlur={() => onHighlightEvent?.(undefined)}
            className={cn(
              box,
              'cursor-pointer rounded-full border-0 bg-transparent p-0 text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70'
            )}
            {...common}
          >
            <Dot event={e} selected={on} />
          </button>
        );
      })}
    </section>
  );
}

/* ── the list ────────────────────────────────────────────────────────────── */

function isSecondYellow(e: MatchStripEvent): boolean {
  return Boolean(e.secondYellow) || /second yellow/i.test(e.reason ?? '');
}

/**
 * A player's short name: the stored one when given ("Bruno Fernandes",
 * "Kolo Muani"), else `playerShortName` ("Fernandes" for "Bruno Fernandes",
 * "Di María" for "Ángel Di María").
 */
export function matchStripSurname(
  name: string | undefined,
  providerShort?: string,
  shortName?: string
): string {
  return shortName?.trim() || playerShortName(name, providerShort);
}

/** The event's player as a row prints him, or empty when there is none. */
export function matchEventPlayer(e: MatchStripEvent): string {
  return matchStripSurname(e.playerName, e.playerShort, e.playerShortName);
}

/** The event's other player (assist, player going off), or empty. */
export function matchEventOther(e: MatchStripEvent): string {
  return matchStripSurname(e.otherName, e.otherShort, e.otherShortName);
}

export interface MatchEventListRow {
  event: MatchStripEvent;
  phase: MatchStripPhase;
  /** The quiet second line: "Assist Rice", "Penalty", "Own goal", "Second yellow", "Red card". */
  how?: string;
  /** Goals: the running score, "2-2". */
  score?: string;
}

/**
 * The list's rows in match order: goals and red cards, with the second line
 * and the running score. Substitutions, yellow cards, VAR checks and missed
 * penalties are left out.
 */
export function matchEventListRows(
  events: readonly MatchStripEvent[],
  extraTime?: boolean
): MatchEventListRow[] {
  const et = matchStripEnd(events, extraTime) === 120;
  let home = 0;
  let away = 0;
  const rows: MatchEventListRow[] = [];
  for (const event of sortMatchStripEvents(events)) {
    if (!isMatchStripDot(event)) continue;
    const phase = matchStripPhase(event, et);
    if (event.kind === 'red') {
      rows.push({ event, phase, how: isSecondYellow(event) ? 'Second yellow' : 'Red card' });
      continue;
    }
    if (event.side === 'home') home += 1;
    else away += 1;
    const assist =
      event.kind === 'goal' && event.otherName && event.otherName !== event.playerName
        ? `Assist ${matchEventOther(event)}`
        : undefined;
    const how =
      event.kind === 'penalty' ? 'Penalty' : event.kind === 'own_goal' ? 'Own goal' : assist;
    rows.push({ event, phase, how, score: `${home}-${away}` });
  }
  return rows;
}

export interface MatchShootoutRow {
  event: MatchStripEvent;
  /** The kick's place in the shootout: 1 for the first. */
  order: number;
  scored: boolean;
  /** The shootout score after this kick, home first: "4-2". */
  score: string;
}

/** The heading over the shootout in `MatchEventList`. */
export const MATCH_STRIP_SHOOTOUT_LABEL = 'Penalty shootout';

/**
 * The shootout kicks in order (minute, stoppage minute, then as given), each
 * with the running shootout score. Only kicks count; the match score is not
 * touched.
 */
export function matchShootoutRows(events: readonly MatchStripEvent[]): MatchShootoutRow[] {
  let home = 0;
  let away = 0;
  return sortMatchStripEvents(events.filter(isMatchStripShootout)).map((event, index) => {
    const scored = event.kind === 'shootout_scored';
    if (scored && event.side === 'home') home += 1;
    else if (scored) away += 1;
    return { event, order: index + 1, scored, score: `${home}-${away}` };
  });
}

export interface MatchEventListProps {
  events: readonly MatchStripEvent[];
  /** As `MatchStrip`'s `extraTime`. */
  extraTime?: boolean;
  /**
   * The player's round headshot, drawn in a 28px circle (32px from a 512px
   * wide container). The host fills it and brings its own fallback, such as
   * the crest. Default: an empty circle.
   */
  renderHeadshot?: (event: MatchStripEvent) => React.ReactNode;
  /** The player's page. A row with an href is one link, through `LinkProvider`. */
  playerHref?: (event: MatchStripEvent) => string | undefined;
  /** The highlighted row, as from a dot on the strip. */
  selectedId?: string;
  /** Called on a row's hover and focus, and with undefined on leave. */
  onHighlightEvent?: (event: MatchStripEvent | undefined) => void;
  className?: string;
}

const ROW_GRID =
  'grid grid-cols-[44px_28px_minmax(0,1fr)_auto] items-center gap-x-2.5 py-2 @lg:grid-cols-[56px_32px_minmax(0,1fr)_auto] @lg:gap-x-3';

function EventRowBody({
  row,
  lead,
  renderHeadshot,
}: {
  row: Pick<MatchEventListRow, 'event' | 'how' | 'score'>;
  /** The first column: the minute, or a shootout kick's number. */
  lead: string;
  renderHeadshot?: (event: MatchStripEvent) => React.ReactNode;
}) {
  const { event, how, score } = row;
  return (
    <>
      <span
        data-slot="match-event-lead"
        className="text-[13px] whitespace-nowrap text-muted-foreground tabular-nums @lg:text-[14px]"
      >
        {lead}
      </span>
      <span
        data-slot="match-event-headshot"
        aria-hidden
        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] @lg:h-8 @lg:w-8 [&>*]:!h-full [&>*]:!w-full"
      >
        {renderHeadshot ? renderHeadshot(event) : null}
      </span>
      <span className="flex min-w-0 flex-col @lg:flex-row @lg:items-baseline @lg:gap-3">
        <span className="flex min-w-0 items-center text-[15px] leading-snug font-medium text-foreground @lg:text-[16px]">
          <span data-slot="match-event-name" className="truncate">
            {matchEventPlayer(event) || 'Goal'}
          </span>
          {event.kind === 'red' ? (
            <span
              aria-hidden
              className="ml-2 inline-block h-2.5 w-[7px] flex-none rounded-[1px]"
              style={{ background: CARD_RED }}
            />
          ) : null}
        </span>
        {how ? (
          <span
            data-slot="match-event-how"
            className="truncate text-[12px] leading-snug text-muted-foreground @lg:text-[13px]"
          >
            {how}
          </span>
        ) : null}
      </span>
      <span
        data-slot="match-event-score"
        className="text-right text-[15px] font-semibold whitespace-nowrap text-foreground tabular-nums @lg:text-[16px]"
      >
        {score ?? ''}
      </span>
    </>
  );
}

/**
 * Goals and red cards under "First half" and "Second half". Each row carries
 * `data-event-id`, so a host can scroll to the row a strip dot names. A row
 * whose player has a page is one link to it.
 */
export function MatchEventList({
  events,
  extraTime,
  renderHeadshot,
  playerHref,
  selectedId,
  onHighlightEvent,
  className,
}: MatchEventListProps) {
  const Link = useLinkComponent();
  const rows = matchEventListRows(events, extraTime);
  const kicks = matchShootoutRows(events);
  if (rows.length === 0 && kicks.length === 0) return null;
  const phases = [...new Set(rows.map((r) => r.phase))];
  const renderRow = (row: Pick<MatchEventListRow, 'event' | 'how' | 'score'>, lead: string) => {
    const { event } = row;
    const on = event.id === selectedId;
    const href = playerHref?.(event);
    const hover = {
      onMouseEnter: () => onHighlightEvent?.(event),
      onMouseLeave: () => onHighlightEvent?.(undefined),
    };
    const tone = cn(
      ROW_GRID,
      '-mx-2 rounded-[6px] px-2 transition-colors motion-reduce:transition-none',
      on && 'bg-white/[0.06]'
    );
    const body = <EventRowBody row={row} lead={lead} renderHeadshot={renderHeadshot} />;
    return (
      <li
        key={event.id}
        data-slot="match-event-row"
        data-event-id={event.id}
        data-kind={event.kind}
        data-selected={on ? 'true' : undefined}
        className="scroll-mt-24 border-b border-white/10 py-px last:border-b-0"
      >
        {href ? (
          <Link
            href={href}
            data-slot="match-event-link"
            className={cn(
              tone,
              'text-inherit no-underline hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none'
            )}
            onFocus={() => onHighlightEvent?.(event)}
            onBlur={() => onHighlightEvent?.(undefined)}
            {...hover}
          >
            {body}
          </Link>
        ) : (
          <div className={tone} {...hover}>
            {body}
          </div>
        )}
      </li>
    );
  };
  const heading =
    'm-0 border-b border-white/25 pb-2 text-[13px] font-normal text-muted-foreground @lg:text-[14px]';
  return (
    <div data-slot="match-event-list" className={cn('@container flex flex-col gap-7', className)}>
      {phases.map((phase) => (
        <section key={phase} data-slot="match-event-phase" data-phase={phase}>
          <h3 className={heading}>{MATCH_STRIP_PHASE_LABEL[phase]}</h3>
          <ol className="m-0 list-none p-0">
            {rows
              .filter((r) => r.phase === phase)
              .map((row) => renderRow(row, `${row.event.minuteLabel}'`))}
          </ol>
        </section>
      ))}
      {kicks.length > 0 ? (
        <section data-slot="match-event-shootout">
          <h3 className={heading}>{MATCH_STRIP_SHOOTOUT_LABEL}</h3>
          <ol className="m-0 list-none p-0">
            {kicks.map((kick) =>
              renderRow(
                { event: kick.event, how: kick.scored ? 'Scored' : 'Missed', score: kick.score },
                String(kick.order)
              )
            )}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

/* ── strip plus stack ────────────────────────────────────────────────────── */

export interface MatchTimelineStackProps
  extends
    Omit<
      MatchStripProps,
      | 'onSelectEvent'
      | 'onHighlightEvent'
      | 'selectedId'
      | 'className'
      | 'renderHeadshot'
      | 'renderPlayerName'
      | 'showDetail'
      | 'homeColor'
      | 'awayColor'
    >,
    Pick<MatchEventListProps, 'renderHeadshot' | 'playerHref'> {
  className?: string;
  /** Classes for the list, such as a width cap on a wide page. */
  listClassName?: string;
}

/**
 * The strip over the list, linked: hovering or focusing a dot highlights its
 * row and the other way round, and tapping a dot scrolls its row into view
 * when it is off screen (at once under reduced motion).
 */
export function MatchTimelineStack({
  className,
  listClassName,
  renderHeadshot,
  playerHref,
  ...strip
}: MatchTimelineStackProps) {
  // A tapped dot stays highlighted; hover and focus show over it meanwhile.
  const [pinned, setPinned] = React.useState<string | undefined>(undefined);
  const [hovered, setHovered] = React.useState<string | undefined>(undefined);
  const highlighted = hovered ?? pinned;
  const listRef = React.useRef<HTMLDivElement>(null);
  if (strip.events.length === 0) return null;
  const select = (event: MatchStripEvent) => {
    setPinned(event.id);
    const row = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-event-id]') ?? [])].find(
      (el) => el.dataset.eventId === event.id
    );
    if (!row) return;
    const box = row.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  };
  return (
    <div data-slot="match-timeline-stack" className={cn('flex flex-col gap-6', className)}>
      <MatchStrip
        {...strip}
        selectedId={highlighted}
        onSelectEvent={select}
        onHighlightEvent={(e) => setHovered(e?.id)}
      />
      <div ref={listRef} className={listClassName}>
        <MatchEventList
          events={strip.events}
          extraTime={strip.extraTime}
          renderHeadshot={renderHeadshot}
          playerHref={playerHref}
          selectedId={highlighted}
          onHighlightEvent={(e) => setHovered(e?.id)}
        />
      </div>
    </div>
  );
}
