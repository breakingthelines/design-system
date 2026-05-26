'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * ComposerFromSourceCard (L7 — Studio "Compose From Source")
 *
 * Card surface that primes a Studio composer with an upstream source — an
 * opportunity, an audience question, a thought, a fixture, etc. Each card
 * answers two questions for the creator:
 *
 *   1) What is the source? (kind, label, optional avatar / image)
 *   2) Why should I write about this? (summary + signals from intelligence)
 *
 * The "Compose draft" CTA is consumer-supplied via the `actions` slot so the
 * primitive stays router-agnostic. When the upstream source has become
 * unreachable, the consumer should render a FallbackState with
 * `SOURCE_NOT_AVAILABLE` instead of this card.
 *
 * The card never invents content. If a field is unavailable (no summary,
 * no signals, no preview) it is omitted entirely.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ComposerSourceKind =
  | 'opportunity'
  | 'thought'
  | 'question'
  | 'fixture'
  | 'rating_window'
  | 'prediction_window'
  | 'subject'
  | 'other';

export interface ComposerFromSourceSignal {
  id: string;
  label: string;
  tone?: 'neutral' | 'positive' | 'warning';
  hint?: string;
}

export interface ComposerFromSourceCardProps {
  /** Kind of upstream source — drives the eyebrow label + data-attribs. */
  kind: ComposerSourceKind;
  /** Headline — typically the source's title or subject. */
  title: string;
  /** Optional summary body. */
  summary?: string;
  /** Optional context line — "Arsenal Squad", "Bukayo Saka", etc. */
  context?: React.ReactNode;
  /** Optional image / avatar URL. */
  sourceImageUrl?: string;
  /** Brand tint used as image fallback. */
  sourceAccentColor?: string;
  /** Signal chips. */
  signals?: readonly ComposerFromSourceSignal[];
  /** Optional preview node — caller-provided embed (thought card, etc.). */
  previewNode?: React.ReactNode;
  /** Required upstream reference id, exposed as data-source-id for analytics. */
  sourceId?: string;
  /** Action node — typically a "Compose draft" button. */
  actions?: React.ReactNode;
  /** Optional secondary action node — e.g. "Dismiss". */
  secondaryActions?: React.ReactNode;
  className?: string;
}

const KIND_LABEL: Record<ComposerSourceKind, string> = {
  opportunity: 'Compose from opportunity',
  thought: 'Compose from thought',
  question: 'Compose from audience question',
  fixture: 'Compose from fixture',
  rating_window: 'Compose from rating window',
  prediction_window: 'Compose from prediction window',
  subject: 'Compose from subject',
  other: 'Compose from source',
};

export function ComposerFromSourceCard({
  kind,
  title,
  summary,
  context,
  sourceImageUrl,
  sourceAccentColor,
  signals,
  previewNode,
  sourceId,
  actions,
  secondaryActions,
  className,
}: ComposerFromSourceCardProps) {
  return (
    <article
      data-slot="composer-from-source-card"
      data-kind={kind}
      data-source-id={sourceId}
      className={cn(
        'flex w-full flex-col gap-3 border border-white/10 bg-[var(--color-grey-200)]',
        'px-4 py-3.5 text-white',
        className
      )}
    >
      <header
        data-slot="composer-from-source-card-eyebrow"
        className="text-[10px] tracking-[0.16em] uppercase text-[var(--color-grey-500)]"
      >
        {KIND_LABEL[kind]}
      </header>

      <div className="flex items-start gap-3">
        {sourceImageUrl !== undefined || sourceAccentColor !== undefined ? (
          <span
            data-slot="composer-from-source-card-avatar"
            aria-hidden="true"
            style={{ backgroundColor: sourceAccentColor ?? 'var(--color-grey-300)' }}
            className={cn(
              'relative inline-flex size-10 shrink-0 items-center justify-center',
              'rounded-md border border-white/10 overflow-hidden',
              'text-[10px] font-bold tracking-tight text-white'
            )}
          >
            {sourceImageUrl ? (
              <img
                src={sourceImageUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span>{initialsForSource(title)}</span>
            )}
          </span>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h4
            data-slot="composer-from-source-card-title"
            className="text-sm font-semibold leading-snug tracking-tight"
          >
            {title}
          </h4>
          {context ? (
            <p
              data-slot="composer-from-source-card-context"
              className="text-[11px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
            >
              {context}
            </p>
          ) : null}
        </div>
      </div>

      {summary ? (
        <p
          data-slot="composer-from-source-card-summary"
          className="text-[12px] leading-snug text-white/75"
        >
          {summary}
        </p>
      ) : null}

      {previewNode ? (
        <div
          data-slot="composer-from-source-card-preview"
          className="border border-white/[0.06] bg-[var(--color-grey-300)] p-3"
        >
          {previewNode}
        </div>
      ) : null}

      {signals && signals.length > 0 ? (
        <ul data-slot="composer-from-source-card-signals" className="flex flex-wrap gap-1.5">
          {signals.map((signal) => (
            <li key={signal.id}>
              <SignalChip signal={signal} />
            </li>
          ))}
        </ul>
      ) : null}

      {actions || secondaryActions ? (
        <footer
          data-slot="composer-from-source-card-actions"
          className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-3"
        >
          {secondaryActions ? (
            <div className="mr-auto flex items-center gap-2">{secondaryActions}</div>
          ) : null}
          {actions}
        </footer>
      ) : null}
    </article>
  );
}

function SignalChip({ signal }: { signal: ComposerFromSourceSignal }) {
  const tone = signal.tone ?? 'neutral';
  return (
    <span
      data-slot="composer-from-source-card-signal"
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

function initialsForSource(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
