'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { ratingDescriptor, type RatingScaleValue } from '#/components/ui/rating-scale';
import { ThoughtBody } from '#/components/ui/thought-body';

/* ─────────────────────────────────────────────────────────────────────────────
 * RatingLogRow
 *
 * A single row in a member's personal Ratings log. Each row records:
 *
 *   - the subject (player/manager)
 *   - the match context (label + ISO datetime)
 *   - the rating value (1-6, lower is better) and its descriptor
 *   - an optional rationale (short note)
 *
 * Rows are intentionally dense — the log surface lives behind a tab and
 * tends to be vertical-scrolled in a Rating Club page or a personal "My
 * ratings" tab. Keep typography compact, tabular-nums for the rating, and
 * the rationale truncated to two lines on overflow.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface RatingLogRowProps {
  /** Person / team being rated. */
  subjectLabel: string;
  /** Optional avatar / crest. */
  subjectImageUrl?: string;
  /** Brand tint used as the avatar fallback. */
  subjectAccentColor?: string;
  /** Optional secondary subject line — position, role, team. */
  subjectSecondary?: string;
  /** Match / context label — "ARS v MUN, PL". */
  matchLabel: string;
  /** ISO date of the match. */
  matchDateIso?: string;
  /** IANA timezone for match date rendering. Defaults to "Europe/London". */
  timeZone?: string;
  /** Rating, 1 (best) to 6 (worst). */
  value: RatingScaleValue;
  /** Optional one-line rationale. */
  rationale?: string;
  /**
   * Optional serialized Lexical state for the rationale, carrying inline
   * MentionNodes. When present, the rationale renders through {@link ThoughtBody}
   * so an @-tagged player/club links to its page; `rationale` stays the
   * plain-text fallback. Pass both — `rationale` for empty/legacy notes.
   */
  rationaleBodyJson?: string;
  className?: string;
}

export function RatingLogRow({
  subjectLabel,
  subjectImageUrl,
  subjectAccentColor,
  subjectSecondary,
  matchLabel,
  matchDateIso,
  timeZone,
  value,
  rationale,
  rationaleBodyJson,
  className,
}: RatingLogRowProps) {
  const descriptor = ratingDescriptor(value);
  const dateLabel = formatLogDate(matchDateIso, timeZone);

  return (
    <article
      data-slot="rating-log-row"
      data-value={value}
      data-direction="lower-is-better"
      className={cn(
        'group/rating-log-row flex w-full items-center gap-3 border-b border-white/[0.06]',
        'py-3 text-white last:border-b-0',
        className
      )}
    >
      <span
        data-slot="rating-log-row-avatar"
        aria-hidden="true"
        style={{ backgroundColor: subjectAccentColor ?? 'var(--color-grey-300)' }}
        className={cn(
          'relative inline-flex size-9 shrink-0 items-center justify-center',
          'rounded-full border border-white/10 overflow-hidden',
          'text-[10px] font-bold tracking-tight text-white'
        )}
      >
        {subjectImageUrl ? (
          <img
            src={subjectImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initialsForLogSubject(subjectLabel)}</span>
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            data-slot="rating-log-row-subject"
            className="truncate text-[13px] font-semibold tracking-tight text-white"
          >
            {subjectLabel}
          </span>
          {subjectSecondary ? (
            <span
              data-slot="rating-log-row-subject-secondary"
              className="text-[11px] text-[var(--color-grey-500)]"
            >
              {subjectSecondary}
            </span>
          ) : null}
        </div>
        <p
          data-slot="rating-log-row-context"
          className="truncate text-[11px] tracking-[0.04em] uppercase text-[var(--color-grey-500)]"
        >
          <span>{matchLabel}</span>
          {dateLabel ? (
            <>
              <span aria-hidden="true" className="mx-1.5">
                ·
              </span>
              <span>{dateLabel}</span>
            </>
          ) : null}
        </p>
        {rationale || rationaleBodyJson ? (
          <ThoughtBody
            data-slot="rating-log-row-rationale"
            className="line-clamp-2 text-[12px] text-white/70"
            body={rationale ?? ''}
            bodyJson={rationaleBodyJson}
          />
        ) : null}
      </div>

      <div
        data-slot="rating-log-row-value"
        className="flex shrink-0 flex-col items-end gap-0.5 text-right"
      >
        <span
          aria-label={`Rating ${value}, ${descriptor.label}`}
          className={cn(
            'inline-flex size-8 items-center justify-center font-mono text-sm font-semibold tabular-nums',
            'border border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/10 text-[var(--color-red-100)]'
          )}
        >
          {value}
        </span>
        <span
          data-slot="rating-log-row-descriptor"
          className="text-[10px] tracking-[0.08em] uppercase text-[var(--color-grey-500)]"
        >
          {descriptor.shortLabel}
        </span>
      </div>
    </article>
  );
}

export function initialsForLogSubject(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '··';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function formatLogDate(
  iso?: string,
  timeZone: string = 'Europe/London'
): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  return `${parts.day ?? ''} ${parts.month ?? ''} ${parts.year ?? ''}`.trim().toUpperCase();
}
