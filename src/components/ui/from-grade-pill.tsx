'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { GradeBox } from '#/components/ui/grade-box';
import { useLinkComponent } from '#/components/ui/link-context';
import type { ThoughtFromGrade } from '#/types/content';

interface FromGradePillProps {
  data: ThoughtFromGrade;
  /**
   * Caller-facing palette hint. Defaults to `light` (foreground-on-foreground
   * tints) which matches the {@link ThoughtCard} body. Pass `dark` from
   * dark-surface contexts ({@link ThoughtComment} on the match Thoughts
   * panel) so the pill reads on near-black backgrounds without re-tinting
   * the GradeBox.
   */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Slim "from grade" pill rendered above a thought body when the thought
 * was spawned by the game-service grade-review fan-out (Wave 6.8). Visual:
 * tiny GradeBox (xs, label suppressed) + subject line + match context,
 * with a tap-through to the match when the host supplies `matchHref`.
 * Stays intentionally small — the body and engagement bar remain the
 * primary visual hierarchy; the pill is metadata, not content.
 *
 * Shared between {@link ThoughtCard} (the timeline card) and
 * {@link ThoughtComment} (the match Thoughts panel + content-page thread
 * lists) so the rating-spawned thought reads the same wherever it shows
 * up. Lifted out of `thought-card.tsx` in Wave 6.16 — keep both call
 * sites in sync by editing this file.
 */
function FromGradePill({ data, tone = 'light', className }: FromGradePillProps) {
  const Link = useLinkComponent();
  const palette =
    tone === 'dark'
      ? {
          base: 'bg-white/[0.06]',
          hover: 'hover:bg-white/[0.10] focus-visible:bg-white/[0.10]',
          subjectText: 'text-white',
          dotText: 'text-white/30',
          matchText: 'text-white/60',
        }
      : {
          base: 'bg-foreground/[0.04]',
          hover: 'hover:bg-foreground/[0.08] focus-visible:bg-foreground/[0.08]',
          subjectText: 'text-foreground',
          dotText: 'text-foreground/30',
          matchText: 'text-foreground/60',
        };

  const body = (
    <span
      data-slot="thought-from-grade"
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3',
        palette.base,
        data.matchHref && cn('transition-colors', palette.hover),
      )}
    >
      <GradeBox value={data.value} size="xs" showLabel={false} />
      <span className="flex min-w-0 items-center gap-1.5 text-xs leading-tight">
        <span className={cn('truncate font-medium', palette.subjectText)}>{data.subjectLabel}</span>
        {data.matchLabel && (
          <>
            <span aria-hidden="true" className={palette.dotText}>
              ·
            </span>
            <span className={cn('truncate', palette.matchText)}>{data.matchLabel}</span>
          </>
        )}
      </span>
    </span>
  );

  if (!data.matchHref) {
    return <div className={cn('-mt-2', className)}>{body}</div>;
  }

  return (
    <div className={cn('-mt-2', className)}>
      <Link
        href={data.matchHref}
        className="inline-block max-w-full"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
      >
        {body}
      </Link>
    </div>
  );
}

export { FromGradePill, type FromGradePillProps };
