'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionPickCard
 *
 * A modular pick card. The *core* shape is small and stable:
 *
 *   - matchLabel       — "Arsenal v Man Utd"
 *   - kickoffIso       — ISO datetime of the fixture
 *   - outcomePick      — the user's home/draw/away choice
 *   - exactScore       — optional exact-score pick
 *   - result           — pending / won / lost / void
 *
 * Every other dimension (custom modules: top scorer, both teams to score,
 * cards over/under, etc.) is accepted as a free-form `modules` array. The
 * card renders them as a list of <dt>/<dd> pairs so the component never has
 * to grow new props for a new league rule.
 *
 * Tested boundaries:
 *   - exact-score is rendered as <span class="font-mono tabular-nums"> so
 *     scores line up vertically in a list of picks.
 *   - result is exposed on the root via `data-result`, used by snapshot
 *     tests to verify settlement states without scraping inner copy.
 * ──────────────────────────────────────────────────────────────────────────── */

export type PredictionOutcomePick = 'home' | 'draw' | 'away';

export type PredictionPickResult = 'pending' | 'won' | 'lost' | 'void';

export interface PredictionExactScore {
  home: number;
  away: number;
}

export interface PredictionPickModule {
  /** Stable React key. */
  id: string;
  /** Short label — e.g. "Top scorer", "BTTS". */
  label: string;
  /** Display value. */
  value: React.ReactNode;
  /** Optional outcome chip — when set, painted with result colours. */
  status?: 'correct' | 'incorrect' | 'pending' | 'void';
}

export interface PredictionPickCardProps {
  matchLabel: string;
  kickoffIso?: string;
  /** IANA timezone for kickoff rendering. Defaults to "Europe/London". */
  timeZone?: string;
  /** User's outcome pick. */
  outcomePick: PredictionOutcomePick;
  /** Optional exact score. */
  exactScore?: PredictionExactScore;
  /** Final score, used to render the actual outcome alongside the pick. */
  finalScore?: PredictionExactScore;
  result?: PredictionPickResult;
  /** Free-form pick modules. */
  modules?: readonly PredictionPickModule[];
  /** Points earned, when known. */
  pointsAwarded?: number;
  /** League or context label — "Premier League Predictor". */
  contextLabel?: string;
  className?: string;
}

const OUTCOME_LABEL: Record<PredictionOutcomePick, string> = {
  home: 'Home',
  draw: 'Draw',
  away: 'Away',
};

const RESULT_LABEL: Record<PredictionPickResult, string> = {
  pending: 'Pending',
  won: 'Won',
  lost: 'Lost',
  void: 'Void',
};

export function PredictionPickCard({
  matchLabel,
  kickoffIso,
  timeZone,
  outcomePick,
  exactScore,
  finalScore,
  result = 'pending',
  modules,
  pointsAwarded,
  contextLabel,
  className,
}: PredictionPickCardProps) {
  const kickoff = formatKickoffShort(kickoffIso, timeZone);

  return (
    <article
      data-slot="prediction-pick-card"
      data-result={result}
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-4 py-3.5 text-white',
        className
      )}
    >
      <header
        data-slot="prediction-pick-card-eyebrow"
        className="flex items-center justify-between gap-3 text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        <span data-slot="prediction-pick-card-context" className="truncate">
          {contextLabel ?? 'Prediction'}
        </span>
        <ResultChip result={result} />
      </header>

      <div className="flex items-baseline justify-between gap-3">
        <p
          data-slot="prediction-pick-card-match"
          className="truncate text-sm font-semibold tracking-tight"
        >
          {matchLabel}
        </p>
        {kickoff ? (
          <span
            data-slot="prediction-pick-card-kickoff"
            className="font-mono text-[11px] tabular-nums text-white/70"
          >
            {kickoff}
          </span>
        ) : null}
      </div>

      <dl
        data-slot="prediction-pick-card-core"
        className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3"
      >
        <PickField label="Outcome" data-slot="prediction-pick-card-outcome">
          <span
            data-slot="prediction-pick-card-outcome-value"
            data-pick={outcomePick}
            className="text-[13px] font-semibold tracking-tight text-white"
          >
            {OUTCOME_LABEL[outcomePick]}
          </span>
        </PickField>
        <PickField label="Score" data-slot="prediction-pick-card-score">
          {exactScore ? (
            <span
              data-slot="prediction-pick-card-exact-score"
              className="font-mono text-[13px] font-semibold tabular-nums text-white"
            >
              {exactScore.home}–{exactScore.away}
            </span>
          ) : (
            <span className="text-[12px] text-[var(--color-grey-500)]">No exact score</span>
          )}
          {finalScore ? (
            <span
              data-slot="prediction-pick-card-final-score"
              className="ml-1 font-mono text-[11px] tabular-nums text-white/60"
            >
              (final {finalScore.home}–{finalScore.away})
            </span>
          ) : null}
        </PickField>
      </dl>

      {modules && modules.length > 0 ? (
        <dl
          data-slot="prediction-pick-card-modules"
          className="grid grid-cols-1 gap-x-3 gap-y-2 border-t border-white/[0.06] pt-3 sm:grid-cols-2"
        >
          {modules.map((entry) => (
            <PickField
              key={entry.id}
              label={entry.label}
              data-slot="prediction-pick-card-module"
              data-module-id={entry.id}
              data-module-status={entry.status ?? undefined}
            >
              <span
                data-slot="prediction-pick-card-module-value"
                className="text-[12px] text-white"
              >
                {entry.value}
              </span>
              {entry.status ? <ModuleStatusBadge status={entry.status} /> : null}
            </PickField>
          ))}
        </dl>
      ) : null}

      {pointsAwarded !== undefined ? (
        <footer
          data-slot="prediction-pick-card-points"
          className="flex items-baseline justify-between border-t border-white/[0.06] pt-3 text-[11px] text-[var(--color-grey-500)]"
        >
          <span className="tracking-[0.04em] uppercase">Points</span>
          <span className="font-mono text-base font-semibold tabular-nums text-white">
            {pointsAwarded}
          </span>
        </footer>
      ) : null}
    </article>
  );
}

function PickField({
  label,
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { label: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...rest}>
      <dt className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
        {label}
      </dt>
      <dd className="flex flex-wrap items-baseline gap-1.5">{children}</dd>
    </div>
  );
}

function ResultChip({ result }: { result: PredictionPickResult }) {
  return (
    <span
      data-slot="prediction-pick-card-result"
      data-result={result}
      className={cn(
        'inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] tracking-[0.12em] uppercase',
        result === 'won' &&
          'border border-[var(--color-status-done)]/30 bg-[var(--color-status-done)]/10 text-[var(--color-status-done)]',
        result === 'lost' &&
          'border border-[var(--color-status-todo)]/30 bg-[var(--color-status-todo)]/10 text-[var(--color-status-todo)]',
        result === 'pending' && 'border border-white/15 bg-transparent text-white/70',
        result === 'void' &&
          'border border-white/10 bg-transparent text-[var(--color-grey-500)] line-through'
      )}
    >
      {RESULT_LABEL[result]}
    </span>
  );
}

function ModuleStatusBadge({ status }: { status: NonNullable<PredictionPickModule['status']> }) {
  const label =
    status === 'correct' ? '✓' : status === 'incorrect' ? '✕' : status === 'void' ? '—' : '·';
  return (
    <span
      data-slot="prediction-pick-card-module-status"
      data-status={status}
      aria-label={status}
      className={cn(
        'inline-flex size-4 items-center justify-center text-[9px] font-bold',
        status === 'correct' && 'text-[var(--color-status-done)]',
        status === 'incorrect' && 'text-[var(--color-status-todo)]',
        status === 'pending' && 'text-white/60',
        status === 'void' && 'text-[var(--color-grey-500)]'
      )}
    >
      {label}
    </span>
  );
}

export function formatKickoffShort(
  iso?: string,
  timeZone: string = 'Europe/London'
): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  // Assemble parts manually — see comment on `formatMatchKickoff` for why we
  // avoid letting locale punctuation decide the separator.
  const dateParts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone,
  }).formatToParts(date)) {
    if (p.type !== 'literal') dateParts[p.type] = p.value;
  }
  const timeParts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).formatToParts(date)) {
    if (p.type !== 'literal') timeParts[p.type] = p.value;
  }
  const datePart = `${dateParts.day ?? ''} ${dateParts.month ?? ''}`.trim().toUpperCase();
  const timePart = `${timeParts.hour ?? '00'}:${timeParts.minute ?? '00'}`;
  return `${datePart} · ${timePart}`;
}
