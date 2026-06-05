'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * Match shell + AD rail (Match Centre layout helpers)
 *
 * Layout primitives that frame the Match Centre body beneath the scoreboard
 * header + tab rail (Figma 2177-9474 Game Day / 2177-9665 Stats). They own the
 * column geometry only — every cell is `children`, so the page composes the
 * real modules (PotM, MatchTimeline, TeamStatsComparison, ShotMap …) into them.
 *
 *   - `MatchShell`        — the two-region grid: a flexible `main` content
 *                           column and an optional fixed-width `aside` rail
 *                           (where the AD slots live on wide screens). Two
 *                           presets via `columns`:
 *                             • `'three'` (Game Day) — content + rail.
 *                             • `'two'`   (Stats)    — content + rail, narrower
 *                               default content gap; rail optional.
 *                           The rail collapses below the content on narrow
 *                           viewports (it is never load-bearing).
 *   - `MatchAdRail`       — vertical stack wrapper for the rail's AD slots.
 *   - `MatchAdSlot`       — the gradient "AD" placeholder tile (house slot).
 *   - `MatchRecapStrip`   — the slim full-time recap bar ("FT · home n–n away").
 *
 * Render-only. No fetching, no router awareness. Tailwind handles the
 * responsive collapse so there is no JS breakpoint logic to drift.
 * ──────────────────────────────────────────────────────────────────────────── */

export type MatchShellColumns = 'two' | 'three';

export interface MatchShellProps {
  /** Primary content column (modules stacked by the page). */
  children: React.ReactNode;
  /** Optional rail content (typically a `MatchAdRail`). Omit for no rail. */
  aside?: React.ReactNode;
  /**
   * Column preset. `three` is the Game Day layout, `two` the Stats layout.
   * Both render main + optional rail; the preset only tunes spacing. Default:
   * `three`.
   */
  columns?: MatchShellColumns;
  className?: string;
}

export function MatchShell({ children, aside, columns = 'three', className }: MatchShellProps) {
  const hasAside = Boolean(aside);
  return (
    <div
      data-slot="match-shell"
      data-columns={columns}
      data-has-aside={hasAside ? 'true' : 'false'}
      className={cn(
        'flex w-full flex-col gap-4',
        // The rail docks to the right on wide screens; on narrow it stacks
        // beneath the content. `xl` keeps it off small screens entirely.
        hasAside && 'xl:flex-row xl:items-start',
        className
      )}
    >
      <div data-slot="match-shell-main" className="flex min-w-0 flex-1 flex-col gap-4">
        {children}
      </div>
      {hasAside ? (
        <aside
          data-slot="match-shell-aside"
          className="flex w-full shrink-0 flex-col gap-4 xl:w-[227px]"
        >
          {aside}
        </aside>
      ) : null}
    </div>
  );
}

export interface MatchAdRailProps {
  children: React.ReactNode;
  className?: string;
}

export function MatchAdRail({ children, className }: MatchAdRailProps) {
  return (
    <div data-slot="match-ad-rail" className={cn('flex flex-col gap-4', className)}>
      {children}
    </div>
  );
}

export interface MatchAdSlotProps {
  /** Slot height in px (house slots vary by position). Default: 339. */
  height?: number;
  /** Label shown in the placeholder. Default: "AD". */
  label?: string;
  className?: string;
}

export function MatchAdSlot({ height = 339, label = 'AD', className }: MatchAdSlotProps) {
  return (
    <div
      data-slot="match-ad-slot"
      aria-hidden="true"
      style={{ height }}
      className={cn(
        'flex w-full items-center justify-center overflow-hidden rounded-[4px] border border-white/[0.05]',
        'bg-gradient-to-b from-[#191919] to-[#262525]',
        className
      )}
    >
      <span className="text-[14px] font-semibold tracking-tight text-[var(--color-grey-500)]">
        {label}
      </span>
    </div>
  );
}

export interface MatchRecapStripProps {
  /** Status label shown at the strip's left edge ("FT", "HT"). Default: "FT". */
  statusLabel?: string;
  home: MatchRecapSide;
  away: MatchRecapSide;
  scoreHome: number;
  scoreAway: number;
  className?: string;
}

export interface MatchRecapSide {
  label: string;
  shortLabel?: string;
  imageUrl?: string;
}

export function MatchRecapStrip({
  statusLabel = 'FT',
  home,
  away,
  scoreHome,
  scoreAway,
  className,
}: MatchRecapStripProps) {
  return (
    <div
      data-slot="match-recap-strip"
      className={cn(
        'flex w-full items-center gap-2 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-300)]',
        'px-4 py-3 text-white backdrop-blur-md',
        className
      )}
    >
      <span
        data-slot="match-recap-strip-status"
        className="shrink-0 text-[12px] tracking-tight text-[var(--color-red-100)]"
      >
        {statusLabel}
      </span>
      <div className="flex flex-1 items-center justify-center gap-4">
        <RecapSide side={home} align="end" />
        <span
          data-slot="match-recap-strip-score"
          className="flex shrink-0 items-center gap-2 font-mono text-[16px] font-semibold tabular-nums text-white"
        >
          <span>{scoreHome}</span>
          <span className="text-[var(--color-grey-500)]">-</span>
          <span>{scoreAway}</span>
        </span>
        <RecapSide side={away} align="start" />
      </div>
    </div>
  );
}

function RecapSide({ side, align }: { side: MatchRecapSide; align: 'start' | 'end' }) {
  const initials = initialsFromLabel(side.shortLabel ?? side.label);
  const crest = (
    <span
      aria-hidden="true"
      className="relative inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-grey-300)] text-[8px] font-bold tracking-tight text-white"
    >
      {side.imageUrl ? (
        <img
          src={side.imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
  const name = (
    <span className="min-w-0 truncate text-[12px] tracking-tight text-white">{side.label}</span>
  );
  return (
    <div
      data-slot="match-recap-strip-side"
      data-align={align}
      className={cn('flex min-w-0 items-center gap-2', align === 'end' && 'flex-row-reverse')}
    >
      {crest}
      {name}
    </div>
  );
}

function initialsFromLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
