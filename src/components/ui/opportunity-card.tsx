'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * OpportunityCard (L7 — Studio "Content Opportunities" feed)
 *
 * Atomic card surfacing one intelligence-service-derived opportunity to a
 * creator in the Studio engagement-ops surface. Each opportunity is a signal
 * that the creator's audience is interested in something they could write
 * about (e.g. a player they cover is suddenly trending, a fixture is loaded
 * with prediction picks, a thought is gathering traction in a squad).
 *
 *   - kind        — opportunity kind (semantic data-attribute for analytics)
 *   - title       — the human-readable headline
 *   - summary     — short body
 *   - score       — caller-computed 0-100 priority score
 *   - signals     — small set of typed signal chips
 *   - context     — optional context line (squad, subject)
 *   - actions     — composer CTAs (caller-supplied buttons)
 *
 * The card never claims confidence beyond what the consumer passes. When
 * `score` is undefined, the priority chip is hidden entirely rather than
 * defaulting to a fabricated value.
 * ──────────────────────────────────────────────────────────────────────────── */

export type OpportunityKind =
  | 'trending_subject'
  | 'prediction_swing'
  | 'rating_spike'
  | 'thought_traction'
  | 'audience_question'
  | 'editorial_gap'
  | 'other';

export interface OpportunitySignal {
  /** Stable id. */
  id: string;
  /** Visible label — short chip text. */
  label: string;
  /** Optional emphasis tone. */
  tone?: 'neutral' | 'positive' | 'warning';
  /** Optional tooltip. */
  hint?: string;
}

export interface OpportunityCardProps {
  /** Opportunity classification — drives data-attribs for analytics. */
  kind: OpportunityKind;
  /** Headline. */
  title: string;
  /** Optional short body. */
  summary?: string;
  /** Priority score (0-100). Undefined = hide the priority chip. */
  score?: number;
  /** Optional context line — "Arsenal Squad · Bukayo Saka". */
  context?: React.ReactNode;
  /** Signal chips. */
  signals?: readonly OpportunitySignal[];
  /** Action node — typically a "Compose draft" or "Dismiss" button. */
  actions?: React.ReactNode;
  /** Ago label — e.g. "2h ago". */
  agoLabel?: string;
  /** Optional click handler — when supplied the card root is interactive. */
  onSelect?: () => void;
  className?: string;
}

const KIND_LABEL: Record<OpportunityKind, string> = {
  trending_subject: 'Trending subject',
  prediction_swing: 'Prediction swing',
  rating_spike: 'Rating spike',
  thought_traction: 'Thought traction',
  audience_question: 'Audience question',
  editorial_gap: 'Editorial gap',
  other: 'Opportunity',
};

export function OpportunityCard({
  kind,
  title,
  summary,
  score,
  context,
  signals,
  actions,
  agoLabel,
  onSelect,
  className,
}: OpportunityCardProps) {
  const interactive = Boolean(onSelect);
  const Element = interactive ? 'button' : 'article';
  const interactiveProps = interactive
    ? ({ type: 'button' as const, onClick: onSelect } as const)
    : null;

  const priorityTone = priorityToneFor(score);

  return (
    <Element
      data-slot="opportunity-card"
      data-kind={kind}
      data-score={score ?? ''}
      data-priority={priorityTone ?? undefined}
      {...(interactiveProps ?? {})}
      className={cn(
        'group/opportunity-card flex w-full flex-col gap-2.5 border border-white/10',
        'bg-[var(--color-grey-200)] px-4 py-3 text-left text-white',
        interactive && 'cursor-pointer transition-colors hover:border-white/25',
        interactive && 'focus-visible:outline-none focus-visible:border-[var(--color-red-100)]',
        className
      )}
    >
      <header
        data-slot="opportunity-card-eyebrow"
        className="flex items-center justify-between gap-3 text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        <span data-slot="opportunity-card-kind">{KIND_LABEL[kind]}</span>
        <span className="flex shrink-0 items-center gap-2">
          {agoLabel ? (
            <span
              data-slot="opportunity-card-ago"
              className="font-mono tabular-nums normal-case tracking-normal text-white/55"
            >
              {agoLabel}
            </span>
          ) : null}
          {priorityTone ? <PriorityChip tone={priorityTone} score={score} /> : null}
        </span>
      </header>

      <h4
        data-slot="opportunity-card-title"
        className="text-sm font-semibold leading-snug tracking-tight"
      >
        {title}
      </h4>

      {context ? (
        <p
          data-slot="opportunity-card-context"
          className="text-[11px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
        >
          {context}
        </p>
      ) : null}

      {summary ? (
        <p data-slot="opportunity-card-summary" className="text-[12px] leading-snug text-white/75">
          {summary}
        </p>
      ) : null}

      {signals && signals.length > 0 ? (
        <ul data-slot="opportunity-card-signals" className="flex flex-wrap gap-1.5">
          {signals.map((signal) => (
            <li key={signal.id}>
              <SignalChip signal={signal} />
            </li>
          ))}
        </ul>
      ) : null}

      {actions ? (
        <footer
          data-slot="opportunity-card-actions"
          className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-2.5"
        >
          {actions}
        </footer>
      ) : null}
    </Element>
  );
}

function priorityToneFor(score: number | undefined): 'low' | 'medium' | 'high' | null {
  if (score === undefined) return null;
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function PriorityChip({ tone, score }: { tone: 'low' | 'medium' | 'high'; score?: number }) {
  return (
    <span
      data-slot="opportunity-card-priority"
      data-tone={tone}
      aria-label={`Priority ${tone}, score ${score ?? '—'}`}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] tracking-[0.12em] uppercase',
        tone === 'high' &&
          'border border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/15 text-[var(--color-red-100)]',
        tone === 'medium' && 'border border-amber-300/40 bg-amber-300/10 text-amber-200',
        tone === 'low' && 'border border-white/15 bg-white/[0.04] text-white/70'
      )}
    >
      <span aria-hidden="true" className="size-1 rounded-full bg-current" />
      <span>{tone}</span>
      {score !== undefined ? <span className="ml-0.5 font-mono tabular-nums">{score}</span> : null}
    </span>
  );
}

function SignalChip({ signal }: { signal: OpportunitySignal }) {
  const tone = signal.tone ?? 'neutral';
  return (
    <span
      data-slot="opportunity-card-signal"
      data-id={signal.id}
      data-tone={tone}
      title={signal.hint}
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] tracking-[0.04em]',
        'border',
        tone === 'positive' &&
          'border-[var(--color-status-done)]/30 bg-[var(--color-status-done)]/10 text-[var(--color-status-done)]',
        tone === 'warning' && 'border-amber-300/35 bg-amber-300/10 text-amber-200',
        tone === 'neutral' && 'border-white/15 bg-white/[0.04] text-white/75'
      )}
    >
      {signal.label}
    </span>
  );
}
