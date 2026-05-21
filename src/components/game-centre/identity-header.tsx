'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { MatchHeader } from '#/components/ui/match-header';
import { ScoreboardChip, type ScoreboardChipStatus } from '#/components/ui/scoreboard-chip';

/* ─────────────────────────────────────────────────────────────────────────────
 * IdentityHeader
 *
 * Identity-first header for match and entity pages. Composes design-system
 * `MatchHeader` + `ScoreboardChip` for match pages; for player / team /
 * manager / competition pages it renders a focused hero block (without
 * the full `EntityPageShell` chrome, so it can be reused inside Arena
 * cards and Game Centre tabs).
 *
 * The component is intentionally headless about ratings / predictions /
 * thoughts, those summary blocks render alongside it, not inside it.
 *
 * Unresolved-identity state: dims the crest/initials to a neutral
 * placeholder and replaces the title-line subtitle with the canonical
 * "We could not resolve this {kind}" copy.
 * ──────────────────────────────────────────────────────────────────────────── */

export type IdentityHeaderKind = 'match' | 'player' | 'team' | 'manager' | 'competition';

export type IdentityHeaderState =
  | 'scheduled'
  | 'live'
  | 'half_time'
  | 'full_time'
  | 'postponed'
  | 'cancelled'
  | 'void'
  | 'not_applicable';

export interface IdentityHeaderSide {
  label: string;
  shortLabel?: string;
  imageUrl?: string;
  accentColor?: string;
}

export interface IdentityHeaderMeta {
  competitionLabel?: string;
  venueLabel?: string;
  kickoffIso?: string;
  clockLabel?: string;
}

export type IdentityHeaderIdentity =
  | {
      kind: 'match';
      home: IdentityHeaderSide;
      away: IdentityHeaderSide;
      scoreHome?: number;
      scoreAway?: number;
    }
  | {
      kind: 'entity';
      name: string;
      secondary?: string;
      imageUrl?: string;
      initials?: string;
    };

export interface IdentityHeaderProps {
  kind: IdentityHeaderKind;
  identity: IdentityHeaderIdentity;
  state: IdentityHeaderState;
  meta?: IdentityHeaderMeta;
  /** When true, render the header with the "unresolved identity" treatment. */
  unresolved?: boolean;
  /** Optional trailing action slot, e.g. Follow, Share. */
  actions?: React.ReactNode;
  className?: string;
}

export function IdentityHeader({
  kind,
  identity,
  state,
  meta,
  unresolved,
  actions,
  className,
}: IdentityHeaderProps) {
  const wrapper = cn('mb-6', className);

  if (identity.kind === 'match') {
    const status = matchStateToChipStatus(state);
    return (
      <header
        data-slot="identity-header"
        data-kind="match"
        data-state={state}
        data-unresolved={unresolved || undefined}
        className={wrapper}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-red-100 uppercase">
            Game Centre
          </p>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        <div className="mt-3">
          <MatchHeader
            home={identity.home}
            away={identity.away}
            status={status}
            scoreHome={identity.scoreHome}
            scoreAway={identity.scoreAway}
            kickoffIso={meta?.kickoffIso}
            clockLabel={meta?.clockLabel}
            competitionLabel={meta?.competitionLabel}
            venueLabel={meta?.venueLabel}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/55">
          <ScoreboardChip status={status} clockLabel={meta?.clockLabel} />
          <span>{matchStateLabel(state)}</span>
          {unresolved ? (
            <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[11px] tracking-wide text-white/55">
              Identity unresolved
            </span>
          ) : null}
        </div>
      </header>
    );
  }

  // Entity layout (player / team / manager / competition).
  const initials = identity.initials || initialsFromLabel(identity.name);

  return (
    <header
      data-slot="identity-header"
      data-kind={kind}
      data-state={state}
      data-unresolved={unresolved || undefined}
      className={wrapper}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-red-100 uppercase">
          {entityEyebrow(kind)}
        </p>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <Avatar size="default" className="size-14 border border-white/10">
          {identity.imageUrl && !unresolved ? <AvatarImage src={identity.imageUrl} alt="" /> : null}
          <AvatarFallback className="text-base font-semibold tracking-wide">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl font-bold text-white sm:text-3xl">
            {identity.name}
          </h1>
          {unresolved ? (
            <p className="mt-1 text-sm text-white/55">{unresolvedSubtitle(kind)}</p>
          ) : identity.secondary ? (
            <p className="mt-1 truncate text-sm text-white/55">{identity.secondary}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function matchStateToChipStatus(state: IdentityHeaderState): ScoreboardChipStatus {
  switch (state) {
    case 'scheduled':
      return 'scheduled';
    case 'live':
      return 'live';
    case 'half_time':
      return 'half_time';
    case 'full_time':
      return 'finished';
    case 'postponed':
      return 'postponed';
    case 'cancelled':
    case 'void':
      return 'cancelled';
    case 'not_applicable':
    default:
      return 'scheduled';
  }
}

function matchStateLabel(state: IdentityHeaderState): string {
  switch (state) {
    case 'scheduled':
      return 'Scheduled';
    case 'live':
      return 'Live';
    case 'half_time':
      return 'Half time';
    case 'full_time':
      return 'Full time';
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    case 'void':
      return 'Void';
    case 'not_applicable':
    default:
      return '';
  }
}

function entityEyebrow(kind: IdentityHeaderKind): string {
  switch (kind) {
    case 'player':
      return 'Player';
    case 'team':
      return 'Team';
    case 'manager':
      return 'Manager';
    case 'competition':
      return 'Competition';
    case 'match':
    default:
      return 'Identity';
  }
}

function unresolvedSubtitle(kind: IdentityHeaderKind): string {
  switch (kind) {
    case 'player':
      return 'We could not resolve this player. Rich modules are disabled until the identity backbone resolves it.';
    case 'team':
      return 'We could not resolve this team. Rich modules are disabled until the identity backbone resolves it.';
    case 'manager':
      return 'We could not resolve this manager. Rich modules are disabled until the identity backbone resolves it.';
    case 'competition':
      return 'We could not resolve this competition. Rich modules are disabled until the identity backbone resolves it.';
    case 'match':
    default:
      return 'We could not resolve this match.';
  }
}

function initialsFromLabel(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() || '');
  return parts.slice(0, 2).join('') || 'ID';
}
