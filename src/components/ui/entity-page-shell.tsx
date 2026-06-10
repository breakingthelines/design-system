'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * EntityPageShell
 *
 * The universal skeleton for an entity-page: Player, Team, Manager,
 * Competition, Prediction League, Grading Club. All entity pages share the
 * same hero-then-tabs anatomy. EntityPageShell crystallises that anatomy as
 * a layout primitive so the surfaces stay visually identical even when the
 * data sources diverge.
 *
 * Anatomy (top → bottom):
 *
 *   1. eyebrow  — entity kind ("PLAYER", "TEAM", "PREDICTION LEAGUE")
 *   2. hero     — crest + display name + secondary labels + actions
 *   3. meta     — chip row with secondary identity (position, country, etc.)
 *   4. tabs     — render slot for a TabbedPage rail
 *   5. content  — children
 *
 * The shell is *render-only*. Tabs, breadcrumbs and actions are passed in as
 * nodes so the host can wire its own routing.
 * ──────────────────────────────────────────────────────────────────────────── */

export type EntityKind =
  | 'player'
  | 'team'
  | 'manager'
  | 'competition'
  | 'prediction_league'
  | 'rating_club';

const ENTITY_KIND_LABEL: Record<EntityKind, string> = {
  player: 'Player',
  team: 'Team',
  manager: 'Manager',
  competition: 'Competition',
  prediction_league: 'Prediction League',
  rating_club: 'Grading Club',
};

export interface EntityPageShellMeta {
  /** Stable key for React lists. */
  id: string;
  label: string;
  value?: React.ReactNode;
}

export interface EntityPageShellProps {
  kind: EntityKind;
  /** Display name — "Mohamed Salah", "Arsenal", "European Pundits". */
  name: string;
  /** Optional secondary line — handle, season, country, etc. */
  secondary?: React.ReactNode;
  /** Crest / portrait / poster. */
  imageUrl?: string;
  /** Fallback initials when the image is missing. */
  initials?: string;
  /** Brand tint behind the crest. */
  accentColor?: string;
  /** Chip row of identity fields. */
  meta?: readonly EntityPageShellMeta[];
  /** Action row (Follow, Subscribe, Manage). */
  actions?: React.ReactNode;
  /** Tabs rail. Typically a `<TabbedPage>` or its sub-rail. */
  tabs?: React.ReactNode;
  /** Optional masthead callout (e.g. a FallbackNotice for stale providers). */
  notice?: React.ReactNode;
  /** Body content. */
  children?: React.ReactNode;
  className?: string;
}

export function EntityPageShell({
  kind,
  name,
  secondary,
  imageUrl,
  initials,
  accentColor,
  meta,
  actions,
  tabs,
  notice,
  children,
  className,
}: EntityPageShellProps) {
  return (
    <section
      data-slot="entity-page-shell"
      data-kind={kind}
      className={cn('flex w-full flex-col gap-6 text-white', className)}
    >
      <header
        data-slot="entity-page-shell-hero"
        className="flex flex-col gap-4 border-b border-white/10 pb-6"
      >
        <p
          data-slot="entity-page-shell-eyebrow"
          className="text-[10px] tracking-[0.18em] uppercase text-[var(--color-grey-500)]"
        >
          {ENTITY_KIND_LABEL[kind]}
        </p>

        <div className="flex items-center gap-4">
          <span
            data-slot="entity-page-shell-crest"
            aria-hidden="true"
            style={{ backgroundColor: accentColor ?? 'var(--color-grey-300)' }}
            className={cn(
              'relative inline-flex size-16 shrink-0 items-center justify-center',
              'rounded-full border border-white/10 overflow-hidden',
              'text-sm font-bold tracking-tight text-white'
            )}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="eager"
              />
            ) : (
              <span>{initials ?? name.slice(0, 2).toUpperCase()}</span>
            )}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1
              data-slot="entity-page-shell-title"
              className="font-display text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl"
            >
              {name}
            </h1>
            {secondary ? (
              <p
                data-slot="entity-page-shell-secondary"
                className="text-xs text-[var(--color-grey-500)]"
              >
                {secondary}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div data-slot="entity-page-shell-actions" className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>

        {meta && meta.length > 0 ? (
          <ul
            data-slot="entity-page-shell-meta"
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-grey-500)]"
          >
            {meta.map((entry) => (
              <li
                key={entry.id}
                data-slot="entity-page-shell-meta-entry"
                className="inline-flex items-center gap-1.5"
              >
                <span className="tracking-[0.04em] uppercase">{entry.label}</span>
                {entry.value !== undefined ? (
                  <span className="text-white">{entry.value}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {notice ? <div data-slot="entity-page-shell-notice">{notice}</div> : null}
      </header>

      {tabs ? <div data-slot="entity-page-shell-tabs">{tabs}</div> : null}

      <div data-slot="entity-page-shell-content">{children}</div>
    </section>
  );
}
