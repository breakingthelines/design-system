'use client';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * Issue1CoverFallback
 *
 * Deterministic branded cover renderer. Pure presentation — no images, no
 * fetching, no fonts loaded at runtime beyond the design-system stack.
 *
 * Visual register: editorial print masthead. The numbering reads as a
 * stenciled press number; the BTL identity sits as a corner mark; the
 * archetype line is set as a tracked-out caption.
 *
 * Two pure helpers (`computeCoverAccent`, `composeCoverHeadline`) are
 * exported so the snapshot test can assert determinism without a DOM.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface Issue1CoverFallbackProps {
  issueNumber: number;
  ownerHandle: string;
  /** Optional archetype slug (e.g. "tactician", "storyteller"). */
  archetype?: string;
  /** Optional accent override. Falls back to a deterministic palette pick. */
  accentColor?: string;
  className?: string;
}

const ACCENT_PALETTE = [
  'var(--color-red-300)',
  '#c0521c', // burnt orange
  '#2b6cb0', // editorial blue
  '#3f7a4d', // pitch green
  '#7a3eb7', // deep violet
  '#a06a00', // ochre
] as const;

export function computeCoverAccent(ownerHandle: string, override?: string): string {
  if (override) return override;
  const handle = ownerHandle.replace(/^@/, '').toLowerCase();
  if (!handle) return ACCENT_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

export function composeCoverHeadline(input: {
  issueNumber: number;
  ownerHandle: string;
  archetype?: string;
}): { issueLabel: string; numberLabel: string; ownerLabel: string; archetypeLabel: string } {
  const number = Math.max(1, Math.floor(input.issueNumber || 1));
  const handle = input.ownerHandle.replace(/^@/, '');
  return {
    issueLabel: 'Issue',
    numberLabel: number.toString().padStart(2, '0'),
    ownerLabel: `@${handle}`,
    archetypeLabel: input.archetype
      ? `The ${input.archetype.toLowerCase()} edition`
      : 'A first edition',
  };
}

export function Issue1CoverFallback({
  issueNumber,
  ownerHandle,
  archetype,
  accentColor,
  className,
}: Issue1CoverFallbackProps) {
  const accent = computeCoverAccent(ownerHandle, accentColor);
  const headline = composeCoverHeadline({ issueNumber, ownerHandle, archetype });

  return (
    <div
      data-slot="issue1-cover-fallback"
      data-issue-number={headline.numberLabel}
      data-archetype={archetype ?? undefined}
      data-accent={accent}
      className={cn(
        'relative isolate aspect-[3/4] w-full overflow-hidden',
        'bg-[var(--color-black)] text-white',
        'rounded-[8px] border border-[var(--color-grey-300)]',
        className
      )}
    >
      <CoverBackground accent={accent} />

      <CornerMark accent={accent} />

      <header className="absolute top-6 right-6 left-6 z-10 flex items-baseline justify-between gap-3">
        <p
          data-slot="cover-masthead"
          className="text-[11px] tracking-[0.28em] text-white/75 uppercase"
        >
          Breaking the Lines
        </p>
        <p
          data-slot="cover-presswatch"
          className="font-mono text-[10px] tabular-nums text-white/45"
        >
          MMXXVI · NEW
        </p>
      </header>

      <div className="absolute inset-x-6 bottom-6 z-10 flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <p
            data-slot="cover-issue-eyebrow"
            className="text-[12px] tracking-[0.24em] text-white/70 uppercase"
          >
            {headline.issueLabel}
          </p>
          <p
            data-slot="cover-issue-archetype"
            className="max-w-[55%] text-right text-[10px] tracking-[0.22em] text-white/55 uppercase"
          >
            {headline.archetypeLabel}
          </p>
        </div>

        <div
          data-slot="cover-issue-number"
          aria-label={`Issue number ${Number(headline.numberLabel)}`}
          className={cn(
            'font-display leading-[0.78] font-bold tracking-[-0.06em] text-white',
            'text-[clamp(96px,28vw,176px)]'
          )}
        >
          {headline.numberLabel}
        </div>

        <hr aria-hidden="true" className="border-t border-white/15" />

        <div className="flex items-center justify-between gap-4">
          <p
            data-slot="cover-owner"
            className="truncate text-[15px] font-semibold tracking-tight text-white"
          >
            {headline.ownerLabel}
          </p>
          <p
            data-slot="cover-footer"
            className="text-right font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase"
          >
            First Edition
          </p>
        </div>
      </div>
    </div>
  );
}

// ── presentation parts ──────────────────────────────────────────────────────

function CoverBackground({ accent }: { accent: string }) {
  return (
    <>
      {/* Layered diagonal washes — gives depth without imagery. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(120% 80% at 20% 110%, ${accent}33 0%, transparent 55%), radial-gradient(80% 60% at 85% 0%, rgba(255,255,255,0.06) 0%, transparent 55%)`,
        }}
      />
      {/* Newsprint-grid overlay. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Brand accent edge. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 -z-10 w-[6px]"
        style={{ backgroundColor: accent }}
      />
    </>
  );
}

function CornerMark({ accent }: { accent: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="cover-corner-mark"
      className="absolute top-6 left-6 z-10 inline-flex h-6 items-center gap-2"
    >
      <span
        className="inline-block size-2.5 rounded-[1px]"
        style={{ backgroundColor: accent }}
      />
      <span className="font-mono text-[10px] tracking-[0.24em] text-white/70 uppercase">
        BTL/01
      </span>
    </span>
  );
}
