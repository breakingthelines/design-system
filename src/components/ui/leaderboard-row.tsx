'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * LeaderboardRow
 *
 * One row on a Prediction League (or generic competitive) leaderboard. Each
 * row contains:
 *
 *   - rank (current)
 *   - rankDelta (movement since last gameweek — +/- or 0)
 *   - member (avatar + display name + optional handle)
 *   - points (current total, font-mono tabular)
 *   - optional streak / form chips
 *
 * The component carries no row-virtualisation logic — callers should use
 * an outer virtual list if the leaderboard is large.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface LeaderboardRowProps {
  rank: number;
  /** Movement vs previous snapshot. Positive = climbed up. */
  rankDelta?: number;
  /** Member display name. */
  memberName: string;
  /** Member handle, no leading "@". */
  memberHandle?: string;
  /** Avatar URL. */
  memberImageUrl?: string;
  /** Brand tint for avatar fallback. */
  memberAccentColor?: string;
  /** Total points (or scalar value being ranked). */
  points: number;
  /** Optional secondary stat — "GW32 · 24 pts". */
  secondaryStat?: React.ReactNode;
  /** Highlight current viewer's row. */
  isViewer?: boolean;
  /** Optional click handler — if provided, the row becomes a button. */
  onClick?: () => void;
  className?: string;
}

export function LeaderboardRow({
  rank,
  rankDelta,
  memberName,
  memberHandle,
  memberImageUrl,
  memberAccentColor,
  points,
  secondaryStat,
  isViewer,
  onClick,
  className,
}: LeaderboardRowProps) {
  const interactive = Boolean(onClick);
  const Element = interactive ? 'button' : 'div';

  const interactiveProps = interactive
    ? ({
        type: 'button' as const,
        onClick,
      } satisfies React.ButtonHTMLAttributes<HTMLButtonElement>)
    : null;

  return (
    <Element
      data-slot="leaderboard-row"
      data-rank={rank}
      data-viewer={isViewer || undefined}
      {...(interactiveProps ?? {})}
      className={cn(
        'group/leaderboard-row flex w-full items-center gap-3 border-b border-white/[0.06]',
        'px-3 py-2.5 text-left text-white last:border-b-0',
        isViewer && 'bg-[var(--color-red-100)]/[0.06] border-[var(--color-red-100)]/30',
        interactive && 'cursor-pointer transition-colors hover:bg-white/[0.03]',
        interactive && 'focus-visible:outline-none focus-visible:bg-white/[0.04]',
        className
      )}
    >
      <div
        data-slot="leaderboard-row-rank"
        className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5"
      >
        <span className="font-mono text-base font-semibold tabular-nums text-white">{rank}</span>
        {rankDelta !== undefined ? <RankDeltaBadge delta={rankDelta} /> : null}
      </div>

      <span
        data-slot="leaderboard-row-avatar"
        aria-hidden="true"
        style={{ backgroundColor: memberAccentColor ?? 'var(--color-grey-300)' }}
        className={cn(
          'relative inline-flex size-9 shrink-0 items-center justify-center',
          'rounded-full border border-white/10 overflow-hidden',
          'text-[10px] font-bold tracking-tight text-white'
        )}
      >
        {memberImageUrl ? (
          <img
            src={memberImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initialsForMember(memberName)}</span>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <p
          data-slot="leaderboard-row-name"
          className="truncate text-[13px] font-semibold tracking-tight text-white"
        >
          {memberName}
          {isViewer ? (
            <span className="ml-1.5 text-[10px] tracking-[0.12em] uppercase text-[var(--color-red-100)]">
              You
            </span>
          ) : null}
        </p>
        {memberHandle ? (
          <p
            data-slot="leaderboard-row-handle"
            className="truncate text-[11px] text-[var(--color-grey-500)]"
          >
            @{memberHandle}
          </p>
        ) : null}
        {secondaryStat ? (
          <p
            data-slot="leaderboard-row-secondary"
            className="truncate text-[10px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
          >
            {secondaryStat}
          </p>
        ) : null}
      </div>

      <div data-slot="leaderboard-row-points" className="flex shrink-0 flex-col items-end">
        <span className="font-mono text-base font-semibold tabular-nums text-white">{points}</span>
        <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--color-grey-500)]">
          pts
        </span>
      </div>
    </Element>
  );
}

function RankDeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        data-slot="leaderboard-row-delta"
        data-direction="flat"
        aria-label="No change"
        className="text-[9px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]"
      >
        —
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      data-slot="leaderboard-row-delta"
      data-direction={up ? 'up' : 'down'}
      aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(delta)}`}
      className={cn(
        'inline-flex items-center gap-0.5 text-[9px] font-mono tabular-nums',
        up ? 'text-[var(--color-status-done)]' : 'text-[var(--color-status-todo)]'
      )}
    >
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span>{Math.abs(delta)}</span>
    </span>
  );
}

export function initialsForMember(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
