'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { GradeBox } from '#/components/ui/grade-box';
import type { RatingScaleValue } from '#/components/ui/rating-scale';

import { FallbackState } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * MatchFormationGradeHero (Wave 6.4.5)
 *
 * Top-of-Gradings-tab hero. Replaces the single-player "best grade" / PotM
 * block with a mini formation pitch showing every starter, the top-graded
 * marker emphasised with a BTL-red ring and a `GradeBox` overlay.
 *
 * Visuals:
 *  - Inline SVG pitch (0-100 coord system, dark theme). The ds cannot depend
 *    on `@breakingthelines/viz`, so the pitch/marker rendering is inlined
 *    here. The look intentionally mirrors viz `Pitch` + `PlayerMarker` so
 *    consumers see the same idiom on Match Lineups (viz) and Gradings (ds).
 *  - Glass-pill team toggle (matches the studio compose pattern in
 *    `team-toggled-player-grade-list.tsx`).
 *  - Top-graded marker: red border ring (var(--color-red-100)), GradeBox
 *    overlaid in the bottom-right corner of the marker.
 *  - Empty side (no graded markers + no players): tight FallbackState.
 *  - Empty graded but populated lineup: greyscale markers, no ring.
 *
 * Render-only. Host owns the formation_slot → pitch coordinate mapping
 * by passing players already projected from `FootballTeamSheet.players`
 * with grades from `playerRatings`.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerGradeMarker {
  /** Stable id for React keys. */
  id: string;
  /** Display name (already abbreviated by the host, e.g. "B. Saka"). */
  name: string;
  /** Optional shirt/jersey number. */
  jerseyNumber?: number;
  /**
   * Formation slot. Mirrors `FootballTeamSheetPlayer.formation_slot` —
   * a 1-based index into the starting XI by line + within-line position.
   * The component lays out 11 slots in standard football formation bands.
   */
  positionSlot: number;
  /** BTL grade, 1 (best) to 6 (worst). Omit for "not graded" markers. */
  grade?: RatingScaleValue;
  /** Optional avatar url (currently unused — reserved for later). */
  avatarUrl?: string;
}

export interface MatchFormationGradeHeroTeam {
  /** Display label, e.g. "Arsenal". */
  name: string;
  /**
   * Formation string (e.g. "4-3-3"). Used to band the markers when
   * provided. Falls back to a 4-3-3 layout when omitted or unparseable.
   */
  formation?: string;
  /** Starting XI markers. Anything beyond 11 entries is ignored visually. */
  players: readonly PlayerGradeMarker[];
}

export interface MatchFormationGradeHeroProps extends React.ComponentProps<'div'> {
  teams: {
    home: MatchFormationGradeHeroTeam;
    away: MatchFormationGradeHeroTeam;
  };
  /** Initial side. Defaults to `home`. */
  defaultSide?: 'home' | 'away';
  /** Controlled side. Overrides `defaultSide`. */
  side?: 'home' | 'away';
  /** Side-change callback for controlled mode. */
  onSideChange?: (side: 'home' | 'away') => void;
  /** Click handler when a marker is selected. */
  onPlayerClick?: (player: PlayerGradeMarker) => void;
  /**
   * Caption shown when the active side has no players at all (no lineup yet).
   * Defaults to "Be the first to grade this match".
   */
  emptyCopy?: string;
}

const DEFAULT_FORMATION = '4-3-3';

function MatchFormationGradeHero({
  teams,
  defaultSide = 'home',
  side,
  onSideChange,
  onPlayerClick,
  emptyCopy = 'Be the first to grade this match',
  className,
  ...props
}: MatchFormationGradeHeroProps) {
  const [internalSide, setInternalSide] = React.useState<'home' | 'away'>(defaultSide);
  const activeSide = side ?? internalSide;
  const handleSide = (next: 'home' | 'away') => {
    if (side === undefined) setInternalSide(next);
    onSideChange?.(next);
  };

  const team = activeSide === 'home' ? teams.home : teams.away;
  const players = team.players;
  const formation = team.formation || DEFAULT_FORMATION;

  // Resolve the top-graded player (lowest grade wins on the 1-6 inverse scale).
  const topGraded = React.useMemo<PlayerGradeMarker | undefined>(() => {
    let best: PlayerGradeMarker | undefined;
    for (const p of players) {
      if (p.grade === undefined) continue;
      if (!best || (best.grade !== undefined && p.grade < best.grade)) best = p;
    }
    return best;
  }, [players]);

  const positions = React.useMemo(
    () => layoutFormation(formation, players),
    [formation, players],
  );

  return (
    <div
      data-slot="match-formation-grade-hero"
      data-active-side={activeSide}
      className={cn(
        'flex flex-col gap-3 rounded-[4px] border border-white/[0.05] bg-[var(--color-grey-200)] p-4',
        className,
      )}
      {...props}
    >
      <header className="flex items-center justify-between gap-3">
        <h3
          data-slot="match-formation-grade-hero-title"
          className="min-w-0 truncate text-sm font-semibold tracking-tight text-white"
        >
          {team.name}
        </h3>

        <div
          data-slot="match-formation-grade-hero-toggle"
          role="tablist"
          aria-label="Team grade pitch"
          className="inline-flex w-fit items-center gap-0.5 self-start rounded-[6px] bg-white/[0.04] p-0.5 backdrop-blur"
        >
          <HeroSideButton
            label={teams.home.name}
            active={activeSide === 'home'}
            onClick={() => handleSide('home')}
            side="home"
          />
          <HeroSideButton
            label={teams.away.name}
            active={activeSide === 'away'}
            onClick={() => handleSide('away')}
            side="away"
          />
        </div>
      </header>

      <div
        data-slot="match-formation-grade-hero-pitch-wrap"
        className="relative w-full overflow-hidden rounded-[4px] bg-[var(--color-grey-300)]"
      >
        {players.length === 0 ? (
          <div className="px-4 py-12">
            <FallbackState reason="NO_RATINGS_YET" title={emptyCopy} />
          </div>
        ) : (
          <FormationPitchSVG
            positions={positions}
            topGradedId={topGraded?.id}
            onPlayerClick={onPlayerClick}
          />
        )}
      </div>
    </div>
  );
}

function HeroSideButton({
  label,
  active,
  onClick,
  side,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  side: 'home' | 'away';
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-slot="match-formation-grade-hero-toggle-button"
      data-side={side}
      data-active={active || undefined}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer rounded-[6px] px-3 py-1 text-[11px] font-semibold tracking-tight transition-colors',
        active ? 'bg-white/[0.08] text-white' : 'text-white/55 hover:text-white',
      )}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Inline pitch + markers (0-100 viewBox; mirrors viz visuals).
 * ──────────────────────────────────────────────────────────────────────────── */

interface PlacedMarker {
  player: PlayerGradeMarker;
  x: number;
  y: number;
}

function FormationPitchSVG({
  positions,
  topGradedId,
  onPlayerClick,
}: {
  positions: readonly PlacedMarker[];
  topGradedId?: string;
  onPlayerClick?: (player: PlayerGradeMarker) => void;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="block aspect-[3/2] h-auto w-full"
      data-slot="match-formation-grade-hero-pitch"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
    >
      {/* Background (dark theme — visually matches viz `theme="dark"`). The ds
          does not depend on viz, so the colours are local literals here. */}
      <rect x="0" y="0" width="100" height="100" fill="#0c1416" />
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.3" fill="none">
        <rect x="0" y="0" width="100" height="100" />
        <line x1="50" y1="0" x2="50" y2="100" />
        <circle cx="50" cy="50" r="9.15" />
        <rect x="0" y="21.1" width="16.5" height="57.8" />
        <rect x="0" y="36.8" width="5.5" height="26.4" />
        <path d="M 16.5 40.1 A 9.15 9.15 0 0 1 16.5 59.9" />
        <rect x="83.5" y="21.1" width="16.5" height="57.8" />
        <rect x="94.5" y="36.8" width="5.5" height="26.4" />
        <path d="M 83.5 40.1 A 9.15 9.15 0 0 0 83.5 59.9" />
      </g>

      {positions.map((placed) => {
        const isTop = placed.player.id === topGradedId;
        const hasGrade = placed.player.grade !== undefined;
        const markerR = 3.2;
        return (
          <MarkerNode
            key={placed.player.id}
            placed={placed}
            isTop={isTop}
            hasGrade={hasGrade}
            markerR={markerR}
            onClick={onPlayerClick ? () => onPlayerClick(placed.player) : undefined}
          />
        );
      })}
    </svg>
  );
}

function MarkerNode({
  placed,
  isTop,
  hasGrade,
  markerR,
  onClick,
}: {
  placed: PlacedMarker;
  isTop: boolean;
  hasGrade: boolean;
  markerR: number;
  onClick?: () => void;
}) {
  const { player, x, y } = placed;
  const ariaLabel = `${player.name}${player.grade !== undefined ? `, grade ${player.grade}` : ''}`;
  return (
    <g
      data-slot="match-formation-grade-hero-marker"
      data-player-id={player.id}
      data-top-graded={isTop || undefined}
      data-graded={hasGrade || undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(onClick && 'cursor-pointer')}
    >
      {/* Highlight ring for the top-graded marker. */}
      {isTop ? (
        <circle
          cx={x}
          cy={y}
          r={markerR + 1.2}
          fill="none"
          stroke="var(--color-red-100)"
          strokeWidth="0.7"
        />
      ) : null}

      {/* Main marker. Greyscale when ungraded; team-tone (default red token) otherwise. */}
      <circle
        cx={x}
        cy={y}
        r={markerR}
        fill={hasGrade ? '#2a2f33' : 'rgba(255,255,255,0.18)'}
        stroke={hasGrade ? 'white' : 'rgba(255,255,255,0.35)'}
        strokeWidth="0.3"
        style={{ opacity: hasGrade ? 1 : 0.7 }}
      />

      {/* Jersey number, when known. */}
      {player.jerseyNumber !== undefined ? (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill={hasGrade ? 'white' : 'rgba(255,255,255,0.55)'}
          fontSize={markerR * 0.85}
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          {player.jerseyNumber}
        </text>
      ) : null}

      {/* Abbreviated name below the marker. */}
      <text
        x={x}
        y={y + markerR + 2.4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize="1.8"
        style={{ pointerEvents: 'none' }}
      >
        {player.name}
      </text>

      {/* GradeBox overlay (rendered as a small foreignObject in the SVG so we
          reuse the canonical GradeBox tone gradient instead of redrawing). */}
      {hasGrade && player.grade !== undefined ? (
        <foreignObject
          x={x + markerR * 0.55}
          y={y - markerR - 1.4}
          width="8"
          height="8"
          data-slot="match-formation-grade-hero-marker-grade"
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              height: '100%',
              justifyContent: 'center',
              pointerEvents: 'none',
              width: '100%',
            }}
          >
            <GradeBox value={player.grade} size="xs" showLabel={false} />
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Layout helpers
 *
 * Lays out 11 markers using the formation string (e.g. "4-3-3") as band hints.
 * If the formation can't be parsed (or doesn't add up to 10 outfield), falls
 * back to the default 4-3-3.
 *
 * We always treat the rendered side as attacking left→right, with x=10 being
 * the GK band and x=90 the attacking band.
 * ──────────────────────────────────────────────────────────────────────────── */

const BAND_X = {
  GK: 8,
  DEF: 26,
  MID_DEF: 44,
  MID: 56,
  MID_FWD: 70,
  FWD: 88,
} as const;

function layoutFormation(
  formation: string,
  players: readonly PlayerGradeMarker[],
): readonly PlacedMarker[] {
  if (players.length === 0) return [];

  const ordered = players.toSorted((a, b) => a.positionSlot - b.positionSlot).slice(0, 11);
  const lines = parseLines(formation);

  // The first slot is always the GK. Remaining slots fill outfield lines in
  // ascending formation_slot order, distributed across each line evenly along y.
  const gk = ordered[0];
  const outfield = ordered.slice(1);

  const bandsX = chooseBandX(lines.length);

  const placed: PlacedMarker[] = [];
  if (gk) placed.push({ player: gk, x: BAND_X.GK, y: 50 });

  let cursor = 0;
  lines.forEach((count, lineIdx) => {
    const x = bandsX[lineIdx];
    const ys = spreadY(count);
    for (let i = 0; i < count; i += 1) {
      const p = outfield[cursor];
      cursor += 1;
      if (!p) continue;
      placed.push({ player: p, x, y: ys[i] });
    }
  });

  // Any stragglers (e.g. data carried 12 starters) drop in centre band.
  while (cursor < outfield.length) {
    const p = outfield[cursor];
    if (p) placed.push({ player: p, x: BAND_X.MID, y: 50 });
    cursor += 1;
  }

  return placed;
}

function parseLines(formation: string): number[] {
  const parts = (formation || DEFAULT_FORMATION)
    .split(/[-/x]/)
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const sum = parts.reduce((acc, n) => acc + n, 0);
  if (parts.length < 2 || sum < 8 || sum > 11) {
    return [4, 3, 3];
  }
  return parts;
}

function chooseBandX(lineCount: number): readonly number[] {
  switch (lineCount) {
    case 2:
      return [BAND_X.DEF, BAND_X.FWD];
    case 3:
      return [BAND_X.DEF, BAND_X.MID, BAND_X.FWD];
    case 4:
      return [BAND_X.DEF, BAND_X.MID_DEF, BAND_X.MID_FWD, BAND_X.FWD];
    case 5:
      return [BAND_X.DEF, BAND_X.MID_DEF, BAND_X.MID, BAND_X.MID_FWD, BAND_X.FWD];
    default:
      return Array.from({ length: lineCount }).map(
        (_, i) => BAND_X.DEF + ((BAND_X.FWD - BAND_X.DEF) / Math.max(1, lineCount - 1)) * i,
      );
  }
}

function spreadY(count: number): number[] {
  if (count <= 1) return [50];
  // Padding from each touchline so markers don't sit on the edge.
  const pad = 14;
  const start = pad;
  const end = 100 - pad;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }).map((_, i) => start + step * i);
}

export { MatchFormationGradeHero };
