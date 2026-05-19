'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { initialsFromLabel } from './fixture-card';
import type { G5SubjectRef } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
 * RefCard family
 *
 * Selectable / static surfaces for the football scope picker. Three shapes
 * share a single primitive (`RefCard`) and differ only in iconography and
 * secondary metadata:
 *
 *   - TeamRefCard         — crest + competition or country
 *   - CompetitionRefCard  — logo + country + tier
 *   - GameRoundRefCard    — round label + competition crest + window
 *
 * Visual register: editorial-modernist. A left-edge accent stripe (8px) is
 * neutral by default and fills brand-red when selected. The selection mark
 * is a 2px-radius red square with a white tick, anchored top-right.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RefCardBaseProps {
  data: G5SubjectRef;
  selected?: boolean;
  onToggle?: () => void;
  /** Visual variant: selectable (default, shows checkmark slot) or static. */
  variant?: 'selectable' | 'static';
  /** Override the eyebrow kind label — useful for collapsed lists. */
  kindLabel?: string;
  className?: string;
  /** Optional inline iconography slot — phosphor / svg / etc. */
  glyph?: React.ReactNode;
}

const DEFAULT_KIND_LABELS: Record<G5SubjectRef['kind'], string> = {
  team: 'Team',
  competition: 'Competition',
  game: 'Fixture',
  game_round: 'Gameweek',
};

export function RefCard({
  data,
  selected = false,
  onToggle,
  variant = 'selectable',
  kindLabel,
  className,
  glyph,
}: RefCardBaseProps) {
  const isSelectable = variant === 'selectable';
  const isInteractive = isSelectable && Boolean(onToggle);
  const label = kindLabel ?? DEFAULT_KIND_LABELS[data.kind];

  const Element = isInteractive ? 'button' : 'div';
  const interactiveProps = isInteractive
    ? ({
        type: 'button' as const,
        onClick: onToggle,
        'aria-pressed': selected,
      } satisfies React.ButtonHTMLAttributes<HTMLButtonElement>)
    : null;

  return (
    <Element
      data-slot="ref-card"
      data-kind={data.kind}
      data-selected={selected || undefined}
      data-variant={variant}
      {...(interactiveProps ?? {})}
      className={cn(
        'group/ref relative flex w-full items-center gap-3 text-left',
        'border border-[var(--color-grey-300)] bg-[var(--color-grey-200)]',
        'rounded-[8px] py-3 pr-3 pl-2.5',
        'text-white transition-colors duration-150',
        isInteractive && 'cursor-pointer hover:border-white/25',
        isInteractive && 'focus-visible:border-[var(--color-red-100)] focus-visible:outline-none',
        selected && 'border-[var(--color-red-100)]/45',
        className
      )}
    >
      <AccentStripe selected={selected} accent={data.accentColor} />

      <RefGlyph data={data} glyph={glyph} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[10px] tracking-[0.18em] text-[var(--color-grey-500)] uppercase">
          {label}
        </p>
        <p
          data-slot="ref-card-label"
          className="truncate text-[15px] font-semibold tracking-tight text-white"
        >
          {data.label}
        </p>
        {data.secondaryLabel || data.tertiaryLabel ? (
          <p className="truncate text-[12px] text-white/55">
            {data.secondaryLabel}
            {data.secondaryLabel && data.tertiaryLabel ? (
              <span className="mx-1.5 text-white/30">·</span>
            ) : null}
            {data.tertiaryLabel}
          </p>
        ) : null}
      </div>

      {isSelectable ? <SelectionMark selected={selected} /> : null}
    </Element>
  );
}

// ── facades ───────────────────────────────────────────────────────────────

export interface TeamRefCardProps extends RefCardBaseProps {
  data: G5SubjectRef & { kind: 'team' };
}

export function TeamRefCard(props: TeamRefCardProps) {
  return <RefCard {...props} />;
}

export interface CompetitionRefCardProps extends RefCardBaseProps {
  data: G5SubjectRef & { kind: 'competition' };
}

export function CompetitionRefCard(props: CompetitionRefCardProps) {
  return <RefCard {...props} />;
}

export interface GameRoundRefCardProps extends RefCardBaseProps {
  data: G5SubjectRef & { kind: 'game_round' };
}

export function GameRoundRefCard(props: GameRoundRefCardProps) {
  return <RefCard {...props} kindLabel={props.kindLabel ?? 'Round'} />;
}

// ── interior parts ───────────────────────────────────────────────────────

function AccentStripe({ selected, accent }: { selected: boolean; accent?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="ref-card-stripe"
      className={cn('self-stretch w-[3px] shrink-0 rounded-full transition-colors duration-150')}
      style={{
        backgroundColor: selected ? 'var(--color-red-100)' : (accent ?? 'rgba(255,255,255,0.08)'),
      }}
    />
  );
}

function RefGlyph({ data, glyph }: { data: G5SubjectRef; glyph?: React.ReactNode }) {
  const radiusClass =
    data.kind === 'team' || data.kind === 'competition' ? 'rounded-full' : 'rounded-[2px]';
  return (
    <span
      data-slot="ref-card-glyph"
      aria-hidden="true"
      style={{ backgroundColor: data.accentColor ?? 'var(--color-grey-300)' }}
      className={cn(
        'relative inline-flex size-10 shrink-0 items-center justify-center',
        'overflow-hidden border border-white/10 text-[11px] font-bold tracking-tight text-white',
        radiusClass
      )}
    >
      {glyph ? (
        glyph
      ) : data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initialsFromLabel(data.label)}</span>
      )}
    </span>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-slot="ref-card-mark"
      data-selected={selected || undefined}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center',
        'rounded-[2px] border transition-colors duration-150',
        selected
          ? 'border-[var(--color-red-100)] bg-[var(--color-red-300)]'
          : 'border-white/20 bg-transparent group-hover/ref:border-white/35'
      )}
    >
      {selected ? <CheckGlyph /> : null}
    </span>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      className="size-3 text-white"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M2.5 6.5l2.4 2.4 4.6-5" />
    </svg>
  );
}
