'use client';

import { cn } from '#/lib/utils';
import type { G5Issue1SlotState, G5Issue1Slots } from './types';

/* ─────────────────────────────────────────────────────────────────────────────
 * Issue1Skeleton
 *
 * Locked Issue #1 layout. The slot ORDER is non-negotiable:
 *
 *   cover → identity → footballScope → matchday →
 *   firstPick → firstRating → firstTake → follow → backCover
 *
 * Each slot accepts `G5Issue1SlotState`:
 *   - `filled`   → renders the supplied content inside a press-plate frame
 *   - `pending`  → renders a labelled "waiting" state (honest, not apologetic)
 *   - `fallback` → renders a deterministic reason line in muted type
 *
 * The skeleton ships no fetching. Consumers compose `slots` from their state
 * and feed it whole.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface Issue1SkeletonProps {
  slots: G5Issue1Slots;
  className?: string;
  /** When provided, shown as the live press-watch dateline. */
  dateline?: string;
  /** When provided, shown as the assistant manager voice in the back cover. */
  assistantLine?: string;
}

export const ISSUE1_SLOT_ORDER = [
  'cover',
  'identity',
  'footballScope',
  'matchday',
  'firstPick',
  'firstRating',
  'firstTake',
  'follow',
  'backCover',
] as const satisfies readonly (keyof G5Issue1Slots)[];

type SlotKey = (typeof ISSUE1_SLOT_ORDER)[number];

interface SlotMeta {
  serial: string;
  eyebrow: string;
  headline: string;
}

const SLOT_META: Record<SlotKey, SlotMeta> = {
  cover: { serial: '00', eyebrow: 'Cover', headline: 'The plate' },
  identity: { serial: '01', eyebrow: 'Identity', headline: 'Who is publishing' },
  footballScope: { serial: '02', eyebrow: 'Scope', headline: 'What football' },
  matchday: { serial: '03', eyebrow: 'Matchday', headline: 'Fixtures in frame' },
  firstPick: { serial: '04', eyebrow: 'First pick', headline: 'A prediction on record' },
  firstRating: { serial: '05', eyebrow: 'First rating', headline: 'A match scored' },
  firstTake: { serial: '06', eyebrow: 'First take', headline: 'A line worth keeping' },
  follow: { serial: '07', eyebrow: 'Follow', headline: 'Voices in your room' },
  backCover: { serial: '08', eyebrow: 'Back cover', headline: 'Signing off' },
};

export function Issue1Skeleton({
  slots,
  className,
  dateline,
  assistantLine,
}: Issue1SkeletonProps) {
  return (
    <article
      data-slot="issue1-skeleton"
      className={cn(
        'relative mx-auto w-full max-w-[760px]',
        'border border-[var(--color-grey-300)] bg-[var(--color-black)] text-white',
        'rounded-[8px] overflow-hidden',
        className
      )}
    >
      <Masthead dateline={dateline} />

      <div className="px-6 pb-2 sm:px-8">
        {ISSUE1_SLOT_ORDER.map((key, index) => (
          <SlotShell
            key={key}
            slotKey={key}
            meta={SLOT_META[key]}
            state={slots[key]}
            isLast={index === ISSUE1_SLOT_ORDER.length - 1}
          />
        ))}
      </div>

      <Colophon assistantLine={assistantLine} />
    </article>
  );
}

// ─── chrome ──────────────────────────────────────────────────────────────────

function Masthead({ dateline }: { dateline?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 sm:px-8">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-block size-2 rounded-[1px] bg-[var(--color-red-100)]"
        />
        <p className="text-[10px] tracking-[0.28em] text-white/70 uppercase">
          Breaking the Lines / Issue #1
        </p>
      </div>
      <p className="font-mono text-[10px] tabular-nums text-white/45">
        {dateline ?? 'First edition'}
      </p>
    </header>
  );
}

function Colophon({ assistantLine }: { assistantLine?: string }) {
  return (
    <footer className="flex flex-col gap-1.5 border-t border-white/[0.08] px-6 py-4 sm:px-8">
      <p className="text-[10px] tracking-[0.24em] text-white/40 uppercase">
        Assistant Manager
      </p>
      <p className="text-[13px] text-white/65">
        {assistantLine ?? 'A first edition is a footprint. Drop it and walk forward.'}
      </p>
    </footer>
  );
}

// ─── slot rendering ──────────────────────────────────────────────────────────

function SlotShell({
  slotKey,
  meta,
  state,
  isLast,
}: {
  slotKey: SlotKey;
  meta: SlotMeta;
  state: G5Issue1SlotState;
  isLast: boolean;
}) {
  return (
    <section
      data-slot="issue1-slot"
      data-slot-key={slotKey}
      data-slot-state={state.kind}
      className={cn('flex gap-4 py-5 sm:gap-6 sm:py-6', !isLast && 'border-b border-white/[0.06]')}
    >
      <SlotSerial serial={meta.serial} state={state.kind} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="flex flex-col gap-1">
          <p className="text-[10px] tracking-[0.22em] text-white/45 uppercase">
            {meta.eyebrow}
          </p>
          <h2 className="font-display text-[18px] leading-tight font-bold tracking-tight text-white sm:text-[20px]">
            {meta.headline}
          </h2>
        </header>
        <SlotBody state={state} />
      </div>
    </section>
  );
}

function SlotSerial({ serial, state }: { serial: string; state: G5Issue1SlotState['kind'] }) {
  return (
    <span
      aria-hidden="true"
      data-slot="issue1-slot-serial"
      data-slot-state={state}
      className={cn(
        'flex w-8 shrink-0 flex-col items-start gap-2 pt-0.5',
        'font-mono text-[11px] tracking-[0.16em] tabular-nums text-white/40'
      )}
    >
      <span>{serial}</span>
      <span
        className={cn(
          'h-3 w-[2px]',
          state === 'filled' && 'bg-[var(--color-red-100)]',
          state === 'pending' && 'bg-white/35',
          state === 'fallback' && 'bg-white/15'
        )}
      />
    </span>
  );
}

function SlotBody({ state }: { state: G5Issue1SlotState }) {
  if (state.kind === 'filled') {
    return (
      <div data-slot="issue1-slot-body" data-state="filled" className="min-w-0">
        {state.content}
      </div>
    );
  }
  if (state.kind === 'pending') {
    return (
      <div
        data-slot="issue1-slot-body"
        data-state="pending"
        className={cn(
          'flex flex-col gap-2 border border-dashed border-[var(--color-grey-300)]',
          'rounded-[8px] bg-[var(--color-grey-200)] px-4 py-3.5'
        )}
      >
        <p className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/55 uppercase">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-white/35"
          />
          Waiting
        </p>
        <p data-slot="issue1-slot-objective" className="text-[14px] text-white/80">
          {state.objectiveLabel}
        </p>
      </div>
    );
  }
  return (
    <div
      data-slot="issue1-slot-body"
      data-state="fallback"
      className={cn(
        'flex items-center gap-3 px-4 py-3.5',
        'rounded-[8px] bg-white/[0.025] text-[var(--color-grey-500)]',
        'text-[13px]'
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-[var(--color-grey-500)]"
      />
      <p data-slot="issue1-slot-reason">{state.reason}</p>
    </div>
  );
}
