'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { formatKickoffShort } from '#/components/ui/prediction-pick-card';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionFormCard (L4 — Prediction League composer)
 *
 * Render-only composer surface for entering a single fixture's prediction
 * before the prediction window locks. Mirrors the read-only PredictionPickCard
 * shape so a card can transition from "writable" (PredictionFormCard) to
 * "settled" (PredictionPickCard) without surface drift.
 *
 * Outcome (home/draw/away) and exact-score inputs are mandatory; arbitrary
 * extra modules (top scorer, BTTS, etc.) are passed as free-form `modules`
 * with controlled input nodes provided by the caller so this primitive stays
 * fetcher-agnostic.
 *
 * Window state:
 *   - "open"    — accepting picks
 *   - "locked"  — kickoff passed, no edits
 *   - "settled" — match settled, points awarded
 *
 * For "locked" / "settled" / "not_yet_open" the consumer should swap to
 * FallbackState with the corresponding proto reason (`PREDICTION_LOCKED`,
 * `PREDICTION_NOT_YET_OPEN`) rather than rendering this composer.
 * ──────────────────────────────────────────────────────────────────────────── */

export type PredictionFormOutcome = 'home' | 'draw' | 'away';

export interface PredictionFormExactScore {
  home: number | undefined;
  away: number | undefined;
}

export interface PredictionFormModule {
  /** Stable React key. */
  id: string;
  /** Short label — e.g. "Top scorer", "BTTS". */
  label: string;
  /** Controlled input element rendered by the caller. */
  control: React.ReactNode;
  /** Optional short helper line under the control. */
  helpText?: React.ReactNode;
}

export interface PredictionFormCardProps {
  /** Fixture label — "Arsenal v Man Utd". */
  matchLabel: string;
  /** ISO datetime of the fixture, used for the kickoff stamp. */
  kickoffIso?: string;
  /** League / context label — "Premier League Predictor". */
  contextLabel?: string;
  /** Currently picked outcome, or undefined to render an empty form. */
  outcomePick?: PredictionFormOutcome;
  /** Called when the viewer picks an outcome. */
  onOutcomeChange?: (next: PredictionFormOutcome) => void;
  /** Exact-score picks; either side may be undefined. */
  exactScore?: PredictionFormExactScore;
  /** Called with a sanitised numeric value when a score input changes. */
  onExactScoreChange?: (side: 'home' | 'away', value: number | undefined) => void;
  /** Optional custom modules — free-form pick widgets. */
  modules?: readonly PredictionFormModule[];
  /** Footer slot — typically the submit button. */
  footer?: React.ReactNode;
  /** Disable all inputs (e.g. while submitting). */
  disabled?: boolean;
  className?: string;
}

const OUTCOME_LABEL: Record<PredictionFormOutcome, string> = {
  home: 'Home',
  draw: 'Draw',
  away: 'Away',
};

const OUTCOMES: readonly PredictionFormOutcome[] = ['home', 'draw', 'away'];

export function PredictionFormCard({
  matchLabel,
  kickoffIso,
  contextLabel,
  outcomePick,
  onOutcomeChange,
  exactScore,
  onExactScoreChange,
  modules,
  footer,
  disabled,
  className,
}: PredictionFormCardProps) {
  const kickoff = formatKickoffShort(kickoffIso);

  return (
    <article
      data-slot="prediction-form-card"
      data-state={disabled ? 'disabled' : 'open'}
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-4 py-3.5 text-white',
        className
      )}
    >
      <header
        data-slot="prediction-form-card-eyebrow"
        className="flex items-center justify-between gap-3 text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        <span data-slot="prediction-form-card-context" className="truncate">
          {contextLabel ?? 'Prediction'}
        </span>
        <span data-slot="prediction-form-card-status" className="text-[var(--color-status-todo)]">
          Open
        </span>
      </header>

      <div className="flex items-baseline justify-between gap-3">
        <p
          data-slot="prediction-form-card-match"
          className="truncate text-sm font-semibold tracking-tight"
        >
          {matchLabel}
        </p>
        {kickoff ? (
          <span
            data-slot="prediction-form-card-kickoff"
            className="font-mono text-[11px] tabular-nums text-white/70"
          >
            {kickoff}
          </span>
        ) : null}
      </div>

      <fieldset
        data-slot="prediction-form-card-outcome"
        disabled={disabled}
        className="flex flex-col gap-2 border-t border-white/[0.06] pt-3"
      >
        <legend className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
          Outcome
        </legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
          {OUTCOMES.map((value) => {
            const active = outcomePick === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                data-slot="prediction-form-card-outcome-option"
                data-value={value}
                data-active={active || undefined}
                aria-checked={active}
                onClick={() => onOutcomeChange?.(value)}
                disabled={disabled}
                className={cn(
                  'inline-flex h-9 items-center justify-center text-[12px] font-semibold tracking-tight',
                  'border transition-colors',
                  active
                    ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)] text-white'
                    : 'border-white/15 bg-transparent text-white/80 hover:border-white/30',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {OUTCOME_LABEL[value]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset
        data-slot="prediction-form-card-exact-score"
        disabled={disabled}
        className="flex flex-col gap-2 border-t border-white/[0.06] pt-3"
      >
        <legend className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
          Exact score
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <ScoreInput
            slot="home"
            value={exactScore?.home}
            onChange={(next) => onExactScoreChange?.('home', next)}
            disabled={disabled}
          />
          <ScoreInput
            slot="away"
            value={exactScore?.away}
            onChange={(next) => onExactScoreChange?.('away', next)}
            disabled={disabled}
          />
        </div>
      </fieldset>

      {modules && modules.length > 0 ? (
        <fieldset
          data-slot="prediction-form-card-modules"
          disabled={disabled}
          className="flex flex-col gap-2 border-t border-white/[0.06] pt-3"
        >
          <legend className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
            Extras
          </legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module.id}
                data-slot="prediction-form-card-module"
                data-module-id={module.id}
                className="flex flex-col gap-1"
              >
                <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
                  {module.label}
                </span>
                <div>{module.control}</div>
                {module.helpText ? (
                  <span className="text-[10px] text-white/55">{module.helpText}</span>
                ) : null}
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      {footer ? (
        <footer
          data-slot="prediction-form-card-footer"
          className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-3"
        >
          {footer}
        </footer>
      ) : null}
    </article>
  );
}

interface ScoreInputProps {
  slot: 'home' | 'away';
  value: number | undefined;
  onChange?: (next: number | undefined) => void;
  disabled?: boolean;
}

function ScoreInput({ slot, value, onChange, disabled }: ScoreInputProps) {
  return (
    <label
      data-slot="prediction-form-card-score-input"
      data-side={slot}
      className="flex items-center gap-2"
    >
      <span className="text-[10px] tracking-[0.12em] uppercase text-[var(--color-grey-500)]">
        {slot === 'home' ? 'Home' : 'Away'}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        step={1}
        value={value === undefined ? '' : String(value)}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange?.(undefined);
            return;
          }
          const next = Number.parseInt(raw, 10);
          if (Number.isNaN(next)) {
            onChange?.(undefined);
            return;
          }
          onChange?.(Math.max(0, Math.min(20, next)));
        }}
        disabled={disabled}
        aria-label={`Exact score, ${slot}`}
        className={cn(
          'h-9 w-full border border-white/15 bg-transparent px-2 text-center',
          'font-mono text-sm font-semibold tabular-nums text-white',
          'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      />
    </label>
  );
}
