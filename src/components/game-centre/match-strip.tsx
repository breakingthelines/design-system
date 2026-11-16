'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchStrip
 *
 * Goals, cards, substitutions and VAR checks as marks on one line from 0' to
 * the end of the match, home above and away below in the side colours. Goals
 * carry the scorer's surname and minute. Every mark is a button with a 24px
 * hit area; the line under the strip names the player and what happened. The
 * latest goal is open to start with.
 *
 * Moved from platform's match page (platform#1096) at 0.114.0. The consumer
 * projects its timeline into `MatchStripEvent`s; player links and headshots
 * come in through `renderPlayerName` and `renderHeadshot`, so the strip has no
 * router or image-chain knowledge.
 *
 * Length: 90' unless `extraTime` says the match went to extra time, then 120'.
 * Stoppage time sits on its period's boundary with its own label: a 90+6' goal
 * is drawn at 90' and reads "90+6'", a 45+2' card at 45'.
 *
 * `interactive={false}` draws the marks without buttons or selection, for an
 * image export or any surface that cannot take a click.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MatchStripEventKind =
  | 'goal'
  | 'penalty'
  | 'own_goal'
  | 'penalty_missed'
  | 'yellow'
  | 'red'
  | 'sub'
  | 'var';

export type MatchStripSide = 'home' | 'away';

export interface MatchStripEvent {
  id: string;
  kind: MatchStripEventKind;
  side: MatchStripSide;
  /** Absolute minute (91 for 90+1). */
  minute: number;
  /** "45+2", "61". A "+" label places the mark on its period's boundary. */
  minuteLabel: string;
  /** The scorer, the booked player, or the player coming on. */
  playerId?: string;
  playerName?: string;
  /** The assist provider, or the player going off. */
  otherId?: string;
  otherName?: string;
  /** Goals only: the score after this goal, home first. */
  scoreAfter?: readonly [number, number];
  /** The provider's reason, for a VAR check or a card ("Goal cancelled", "Foul"). */
  reason?: string;
}

export interface MatchStripPlayer {
  id?: string;
  name?: string;
  /** The secondary name on the detail line (assist, player going off). */
  muted: boolean;
}

export interface MatchStripProps {
  events: readonly MatchStripEvent[];
  /**
   * The match went to extra time (its period or status says so). Draws the
   * strip to 120'. When left out, an event labelled past 90 that is not
   * 90+ stoppage (a 105' or 120+1' goal) counts as extra time.
   */
  extraTime?: boolean;
  /** False draws spans instead of buttons and fixes the detail line. Default true. */
  interactive?: boolean;
  /** Show the detail line under the strip. Default true. */
  showDetail?: boolean;
  /** Team names at the strip's ends, home over the line and away under it. */
  homeLabel?: string;
  awayLabel?: string;
  homeColor?: string;
  awayColor?: string;
  /** A player's name on the detail line. Default: plain text. */
  renderPlayerName?: (player: MatchStripPlayer) => React.ReactNode;
  /** The 24px headshot on the detail line. Default: an empty circle. */
  renderHeadshot?: (playerId: string | undefined) => React.ReactNode;
  className?: string;
}

export const MATCH_STRIP_HOME_COLOR = '#eb0000';
export const MATCH_STRIP_AWAY_COLOR = '#0091eb';
const MUTED = '#a29e9e';
const LINE = 'rgba(255,255,255,0.08)';
const LINE_Y = 60;

const KIND_LABEL: Record<MatchStripEventKind, string> = {
  goal: 'Goal',
  penalty: 'Penalty',
  own_goal: 'Own goal',
  penalty_missed: 'Penalty missed',
  yellow: 'Yellow card',
  red: 'Red card',
  sub: 'Substitution',
  var: 'VAR',
};

export function isMatchStripGoal(event: MatchStripEvent): boolean {
  return event.kind === 'goal' || event.kind === 'penalty' || event.kind === 'own_goal';
}

/** The boundary a "45+2" label sits on, or undefined for a plain minute. */
function stoppageBoundary(label: string): number | undefined {
  const match = /^(\d+)\+/.exec(label.trim());
  return match ? Number(match[1]) : undefined;
}

/** The minute a label names before any stoppage: 105 for "105+1", 67 for "67". */
function labelMinute(label: string): number | undefined {
  const match = /^(\d+)/.exec(label.trim());
  return match ? Number(match[1]) : undefined;
}

/**
 * The strip's last minute: 120 for a match that went to extra time, else 90.
 * With `extraTime` left out, an event whose label is past 90 before its
 * stoppage ("105", "120+1") is the evidence. Elapsed-seconds minutes alone are
 * not: a 90+6' goal has minute 96 and is still normal time.
 */
export function matchStripEnd(events: readonly MatchStripEvent[], extraTime?: boolean): number {
  if (extraTime !== undefined) return extraTime ? 120 : 90;
  return events.some((e) => (labelMinute(e.minuteLabel) ?? 0) > 90) ? 120 : 90;
}

/**
 * Where an event sits on the strip, in minutes. Stoppage time sits on its
 * boundary (45 for 45+2, 90 for 90+6), and nothing runs past the end.
 */
export function matchStripPosition(event: MatchStripEvent, end: number): number {
  const boundary = stoppageBoundary(event.minuteLabel);
  const minute = boundary ?? event.minute;
  return Math.max(0, Math.min(minute, end));
}

function stripLeft(minute: number, end: number): string {
  return `calc(24px + (100% - 48px) * ${(Math.min(minute, end) / end).toFixed(4)})`;
}

/** The text on a goal's label: "Saka 90+6' pen". */
export function matchStripGoalLabel(event: MatchStripEvent): string {
  const suffix = event.kind === 'penalty' ? ' pen' : event.kind === 'own_goal' ? ' og' : '';
  return `${surname(event.playerName)} ${event.minuteLabel}'${suffix}`;
}

/**
 * A goal label's box width in px, estimated from its text at 12px semibold.
 * Generous on purpose: the text is centred in the box, so a box a little wide
 * only moves an edge label a few px further in.
 */
export function matchStripLabelWidth(label: string): number {
  return Math.ceil(label.length * 6.6) + 4;
}

/**
 * Container sizes the label rows are worked out for, each at its narrowest
 * width: below `@xl` a strip is taken as 300px, then each size's own floor.
 * The strip is its own container, so the rows follow the strip's width
 * whether it fills a page or sits in a narrow block on a wide screen.
 */
export const MATCH_STRIP_LABEL_TIERS = [
  { tier: 'base', width: 300 },
  { tier: '@xl', width: 576 },
  { tier: '@2xl', width: 672 },
  { tier: '@3xl', width: 768 },
  { tier: '@4xl', width: 896 },
  { tier: '@5xl', width: 1024 },
  { tier: '@6xl', width: 1152 },
] as const;
export type MatchStripLabelTier = (typeof MATCH_STRIP_LABEL_TIERS)[number]['tier'];
const LABEL_GAP = 6;

/** Row per goal id (0 by the line, 1 further out), per container size. */
export type MatchStripLabelRows = Record<MatchStripLabelTier, Record<string, 0 | 1>>;

/**
 * Staggers goal labels that would collide. Labels on one side are laid left
 * to right, each clamped inside the strip, and a label that would overlap the
 * one before it in the row by the line moves one row out. Rows are worked
 * out for the narrowest width of each container size, so they hold at any width
 * in that size without measuring the page.
 */
export function matchStripLabelRows(
  goals: readonly MatchStripEvent[],
  end: number
): MatchStripLabelRows {
  const rowsAt = (width: number): Record<string, 0 | 1> => {
    const rows: Record<string, 0 | 1> = {};
    for (const side of ['home', 'away'] as const) {
      const laid = goals
        .filter((g) => g.side === side)
        .map((g) => {
          const w = matchStripLabelWidth(matchStripGoalLabel(g));
          const x = 24 + ((width - 48) * matchStripPosition(g, end)) / end;
          const left = Math.max(0, Math.min(x - w / 2, width - w));
          return { id: g.id, left, right: left + w };
        })
        // A fresh array, so sorting in place is safe; the ES2022 lib has no toSorted.
        // oxlint-disable-next-line unicorn/no-array-sort
        .sort((a, b) => a.left - b.left);
      const rowEnds = [-Infinity, -Infinity];
      for (const label of laid) {
        const free = rowEnds.findIndex((r) => label.left >= r + LABEL_GAP);
        const row = (free >= 0 ? free : rowEnds[0]! <= rowEnds[1]! ? 0 : 1) as 0 | 1;
        rows[label.id] = row;
        rowEnds[row] = label.right;
      }
    }
    return rows;
  };
  const out = {} as MatchStripLabelRows;
  for (const { tier, width } of MATCH_STRIP_LABEL_TIERS) out[tier] = rowsAt(width);
  return out;
}

/** Literal classes, so the host's Tailwind build finds them. Row 0, row 1. */
const LABEL_TOP: Record<MatchStripSide, Record<MatchStripLabelTier, readonly [string, string]>> = {
  home: {
    base: ['top-[20px]', 'top-[2px]'],
    '@xl': ['@xl:top-[20px]', '@xl:top-[2px]'],
    '@2xl': ['@2xl:top-[20px]', '@2xl:top-[2px]'],
    '@3xl': ['@3xl:top-[20px]', '@3xl:top-[2px]'],
    '@4xl': ['@4xl:top-[20px]', '@4xl:top-[2px]'],
    '@5xl': ['@5xl:top-[20px]', '@5xl:top-[2px]'],
    '@6xl': ['@6xl:top-[20px]', '@6xl:top-[2px]'],
  },
  away: {
    base: ['top-[82px]', 'top-[100px]'],
    '@xl': ['@xl:top-[82px]', '@xl:top-[100px]'],
    '@2xl': ['@2xl:top-[82px]', '@2xl:top-[100px]'],
    '@3xl': ['@3xl:top-[82px]', '@3xl:top-[100px]'],
    '@4xl': ['@4xl:top-[82px]', '@4xl:top-[100px]'],
    '@5xl': ['@5xl:top-[82px]', '@5xl:top-[100px]'],
    '@6xl': ['@6xl:top-[82px]', '@6xl:top-[100px]'],
  },
};

/** A label box centred on its mark and clamped inside the strip. */
function labelLeft(minute: number, end: number, width: number): string {
  const centre = `24px + (100% - 48px) * ${(Math.min(minute, end) / end).toFixed(4)}`;
  return `clamp(0px, calc(${centre} - ${width / 2}px), calc(100% - ${width}px))`;
}

function surname(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

/** The visible mark of an event, drawn inside its 24px hit area. */
function StripMark({
  event,
  selected,
  color,
}: {
  event: MatchStripEvent;
  selected: boolean;
  color: string;
}) {
  const ring = selected ? '0 0 0 2px #0d0d0d, 0 0 0 3.5px #fff' : undefined;
  if (isMatchStripGoal(event) || event.kind === 'penalty_missed') {
    return (
      <span
        className="block h-2.5 w-2.5 rounded-full"
        style={{
          background: event.kind === 'penalty_missed' ? 'transparent' : color,
          border: event.kind === 'penalty_missed' ? `2px solid ${color}` : undefined,
          boxShadow: ring,
        }}
      />
    );
  }
  if (event.kind === 'yellow' || event.kind === 'red') {
    return (
      <span
        className="block h-[9px] w-1.5 rounded-[1px]"
        style={{ background: event.kind === 'red' ? '#e5322d' : '#f5c518', boxShadow: ring }}
      />
    );
  }
  if (event.kind === 'var') {
    return (
      <span
        className="block h-2 w-2 rotate-45 rounded-[1px] border border-white/70"
        style={{ boxShadow: ring }}
      />
    );
  }
  return <span className="block h-[7px] w-0.5 bg-white/45" style={{ boxShadow: ring }} />;
}

/** Where each kind sits off the line, home above and away below. */
function markTop(event: MatchStripEvent): number {
  const home = event.side === 'home';
  if (isMatchStripGoal(event) || event.kind === 'penalty_missed')
    return home ? LINE_Y - 12 : LINE_Y + 12;
  if (event.kind === 'yellow' || event.kind === 'red') return home ? LINE_Y - 10 : LINE_Y + 10;
  return home ? LINE_Y - 7 : LINE_Y + 7;
}

function defaultPlayerName({ name, muted }: MatchStripPlayer): React.ReactNode {
  if (!name) return null;
  return <span className={cn(!muted && 'font-semibold', 'whitespace-nowrap')}>{name}</span>;
}

function defaultHeadshot(): React.ReactNode {
  return (
    <span
      aria-hidden
      className="inline-flex flex-none overflow-hidden rounded-full bg-white/[0.06]"
      style={{ width: 24, height: 24 }}
    />
  );
}

function StripDetail({
  event,
  renderPlayerName,
  renderHeadshot,
}: {
  event: MatchStripEvent;
  renderPlayerName: (player: MatchStripPlayer) => React.ReactNode;
  renderHeadshot: (playerId: string | undefined) => React.ReactNode;
}) {
  const before = (() => {
    if (!event.scoreAfter) return undefined;
    const [h, a] = event.scoreAfter;
    return event.side === 'home' ? [h - 1, a] : [h, a - 1];
  })();
  const other = (prefix: string, fallback: string): React.ReactNode =>
    event.otherName ? (
      <>
        {prefix} {renderPlayerName({ id: event.otherId, name: event.otherName, muted: true })}
      </>
    ) : (
      fallback
    );
  let what: React.ReactNode;
  switch (event.kind) {
    case 'goal':
      what = other('Goal, assist', 'Goal');
      break;
    case 'sub':
      what = other('On for', 'On');
      break;
    case 'yellow':
    case 'red':
    case 'var':
      what = event.reason ? `${KIND_LABEL[event.kind]}, ${event.reason}` : KIND_LABEL[event.kind];
      break;
    default:
      what = KIND_LABEL[event.kind];
  }
  return (
    <div
      data-slot="match-strip-detail"
      data-kind={event.kind}
      className="flex items-center gap-2.5 border-t pt-2.5 text-[13px] text-white"
      style={{ borderTopColor: LINE }}
    >
      <span className="w-[30px] shrink-0 tabular-nums" style={{ color: MUTED }}>
        {event.minuteLabel}&apos;
      </span>
      {renderHeadshot(event.playerId)}
      {renderPlayerName({ id: event.playerId, name: event.playerName, muted: false })}
      <span className="min-w-0 truncate" style={{ color: MUTED }}>
        {what}
      </span>
      {before && event.scoreAfter ? (
        <span
          className="ml-auto hidden whitespace-nowrap tabular-nums sm:inline"
          style={{ color: MUTED }}
        >
          {before[0]}-{before[1]} to {event.scoreAfter[0]}-{event.scoreAfter[1]}
        </span>
      ) : null}
    </div>
  );
}

function SideLabel({ name, color, slot }: { name: string; color: string; slot: string }) {
  return (
    <span
      data-slot={slot}
      className="flex items-center gap-1.5 px-6 text-[12px] font-semibold text-white"
    >
      <span aria-hidden className="h-2.5 w-[3px] rounded-[1px]" style={{ background: color }} />
      {name}
    </span>
  );
}

export function MatchStrip({
  events,
  extraTime,
  interactive = true,
  showDetail = true,
  homeLabel,
  awayLabel,
  homeColor = MATCH_STRIP_HOME_COLOR,
  awayColor = MATCH_STRIP_AWAY_COLOR,
  renderPlayerName = defaultPlayerName,
  renderHeadshot = defaultHeadshot,
  className,
}: MatchStripProps) {
  const goals = events.filter(isMatchStripGoal);
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const selected =
    (interactive ? events.find((e) => e.id === selectedId) : undefined) ??
    goals[goals.length - 1] ??
    events[events.length - 1];
  if (events.length === 0) return null;
  const end = matchStripEnd(events, extraTime);
  const at = (e: MatchStripEvent) => matchStripPosition(e, end);
  const labelRows = matchStripLabelRows(goals, end);
  const colorOf = (e: MatchStripEvent) => (e.side === 'home' ? homeColor : awayColor);
  return (
    <section
      data-slot="match-strip"
      data-end={end}
      data-interactive={interactive ? undefined : 'false'}
      className={cn('@container flex flex-col gap-2', className)}
    >
      {homeLabel ? <SideLabel name={homeLabel} color={homeColor} slot="match-strip-home" /> : null}
      <div className="relative h-[124px] sm:h-[118px]">
        <span
          className="absolute right-6 left-6 h-px bg-white/[0.18]"
          style={{ top: LINE_Y }}
          aria-hidden
        />
        <span
          className="absolute h-[11px] w-px bg-white/35"
          style={{ left: stripLeft(45, end), top: LINE_Y - 5 }}
          aria-hidden
        />
        <span className="absolute left-0 text-[11px]" style={{ top: LINE_Y - 8, color: MUTED }}>
          0&apos;
        </span>
        <span className="absolute right-0 text-[11px]" style={{ top: LINE_Y - 8, color: MUTED }}>
          {end}&apos;
        </span>
        {goals.map((e) => {
          const label = matchStripGoalLabel(e);
          const width = matchStripLabelWidth(label);
          const top = LABEL_TOP[e.side];
          return (
            <span
              key={`label-${e.id}`}
              aria-hidden
              data-slot="match-strip-goal-label"
              data-row={labelRows.base[e.id]}
              className={cn(
                'pointer-events-none absolute flex justify-center text-[12px] font-semibold whitespace-nowrap text-white',
                MATCH_STRIP_LABEL_TIERS.map(({ tier }) => top[tier][labelRows[tier][e.id] ?? 0])
              )}
              style={{ left: labelLeft(at(e), end, width), width }}
            >
              {label}
            </span>
          );
        })}
        {events.map((e) => {
          const on = interactive && e.id === selected?.id;
          const label = `${e.minuteLabel}' ${KIND_LABEL[e.kind]}${e.playerName ? `, ${e.playerName}` : ''}`;
          const style = { left: stripLeft(at(e), end), top: markTop(e) };
          const mark = <StripMark event={e} selected={on} color={colorOf(e)} />;
          if (!interactive) {
            return (
              <span
                key={e.id}
                data-slot="match-strip-mark"
                data-kind={e.kind}
                role="img"
                aria-label={label}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={style}
              >
                {mark}
              </span>
            );
          }
          return (
            <button
              key={e.id}
              type="button"
              data-slot="match-strip-mark"
              data-kind={e.kind}
              aria-pressed={on}
              aria-label={label}
              onClick={(click) => {
                // Marks closer than a hit area overlap (three subs at 68', or
                // any few minutes apart at phone width): a click on an
                // already open mark steps to the next one under the finger.
                const width = click.currentTarget.parentElement?.clientWidth ?? 0;
                const pxPerMinute = Math.max(1, (width - 48) / end);
                const under = events.filter(
                  (o) => o.side === e.side && Math.abs(at(o) - at(e)) * pxPerMinute < 24
                );
                const index = under.findIndex((o) => o.id === selected?.id);
                const next = index >= 0 ? under[(index + 1) % under.length] : e;
                setSelectedId((next ?? e).id);
              }}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
              style={style}
            >
              {mark}
            </button>
          );
        })}
      </div>
      {awayLabel ? <SideLabel name={awayLabel} color={awayColor} slot="match-strip-away" /> : null}
      {showDetail && selected ? (
        <StripDetail
          event={selected}
          renderPlayerName={renderPlayerName}
          renderHeadshot={renderHeadshot}
        />
      ) : null}
    </section>
  );
}
