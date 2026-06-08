'use client';

import * as React from 'react';
import { SoccerBall } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchScorersStrip (Match page — companion to the scoreboard header)
 *
 * A supplementary strip that sits beneath `IdentityHeader` / `MatchHeader`
 * showing, per side, the goal scorers with minutes, plus an optional team xG
 * row. It does NOT modify or wrap `MatchHeader` (other apps consume that
 * primitive directly) — compose it alongside.
 *
 * Two columns: home scorers anchored left, away scorers anchored right, each
 * row a small goal icon + "{name} · {minute}′". Penalties and own goals are
 * annotated inline ("(pen)", "(OG)") so the strip never silently misattributes
 * a goal.
 *
 * Honest by default:
 *   - When both scorer lists are empty AND neither side has xG, the strip
 *     renders nothing (returns null) — it is purely supplementary.
 *   - The xG row renders only when xG values are provided (the backend lacks
 *     team xG for live matches), so it stays absent rather than showing 0.
 *
 * Render-only. No fetching, no router awareness.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface MatchScorer {
  /** Scorer display name. */
  name: string;
  /** Minute the goal was scored. */
  minute: number;
  /** Own goal — annotated "(OG)" and attributed to this side's column. */
  isOwnGoal?: boolean;
  /** Penalty — annotated "(pen)". */
  isPenalty?: boolean;
}

export interface MatchScorersSide {
  /** Goal scorers for this side, in display order. */
  scorers: readonly MatchScorer[];
  /** Optional team xG. Only rendered when both sides' values make a row. */
  xg?: number;
}

export interface MatchScorersStripProps {
  home: MatchScorersSide;
  away: MatchScorersSide;
  className?: string;
}

export function MatchScorersStrip({ home, away, className }: MatchScorersStripProps) {
  const hasScorers = home.scorers.length > 0 || away.scorers.length > 0;
  const showXg = home.xg !== undefined || away.xg !== undefined;

  // Purely supplementary: with nothing to show, render nothing.
  if (!hasScorers && !showXg) {
    return null;
  }

  return (
    <div
      data-slot="match-scorers-strip"
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-5 py-4 text-white',
        className
      )}
    >
      {hasScorers ? (
        <div className="grid grid-cols-2 gap-4">
          <ScorerColumn side={home} align="start" />
          <ScorerColumn side={away} align="end" />
        </div>
      ) : null}

      {showXg ? (
        <div
          data-slot="match-scorers-strip-xg"
          className={cn(
            'flex items-center justify-between gap-3',
            hasScorers && 'border-t border-white/[0.06] pt-3'
          )}
        >
          <span
            data-slot="match-scorers-strip-xg-home"
            className="text-[13px] font-semibold tabular-nums text-white"
          >
            {formatXg(home.xg)}
          </span>
          <span className="text-[10px] tracking-[0.16em] text-[var(--color-grey-500)] uppercase">
            xG
          </span>
          <span
            data-slot="match-scorers-strip-xg-away"
            className="text-[13px] font-semibold tabular-nums text-white"
          >
            {formatXg(away.xg)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ScorerColumn({ side, align }: { side: MatchScorersSide; align: 'start' | 'end' }) {
  if (side.scorers.length === 0) {
    return <div data-slot="match-scorers-strip-column" data-align={align} />;
  }
  return (
    <ul
      data-slot="match-scorers-strip-column"
      data-align={align}
      className={cn('flex flex-col gap-1.5', align === 'end' && 'items-end')}
    >
      {side.scorers.map((scorer, idx) => (
        <ScorerRow key={`${scorer.name}-${scorer.minute}-${idx}`} scorer={scorer} align={align} />
      ))}
    </ul>
  );
}

function ScorerRow({ scorer, align }: { scorer: MatchScorer; align: 'start' | 'end' }) {
  const label = scorerLabel(scorer);
  const icon = (
    <SoccerBall
      aria-hidden="true"
      weight="fill"
      className="size-3.5 shrink-0 text-[var(--color-grey-500)]"
    />
  );
  const text = (
    <span className="min-w-0 truncate text-[13px] tracking-tight text-white">
      {label}
      <span className="ml-1.5 text-[12px] tabular-nums text-white/55">{scorer.minute}&prime;</span>
    </span>
  );
  return (
    <li
      data-slot="match-scorers-strip-row"
      className={cn('flex min-w-0 items-center gap-1.5', align === 'end' && 'flex-row-reverse')}
    >
      {icon}
      {text}
    </li>
  );
}

function scorerLabel(scorer: MatchScorer): string {
  const tags: string[] = [];
  if (scorer.isPenalty) tags.push('pen');
  if (scorer.isOwnGoal) tags.push('OG');
  return tags.length > 0 ? `${scorer.name} (${tags.join(', ')})` : scorer.name;
}

function formatXg(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}
