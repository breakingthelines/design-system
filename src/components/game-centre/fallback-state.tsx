'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * FallbackState
 *
 * Standardised honest fallback for the Game Centre / Arena / Engagement
 * surfaces. Wraps the design-system `FallbackNotice` so proto-enum reasons
 * keep their canonical copy, and adds a small set of platform-extension
 * reasons that don't have a proto enum yet.
 *
 * Use this primitive in section bodies (a tab panel, a missing-block in
 * Arena, an empty Ratings/Predictions summary). For full proto-level fallback
 * lists from `GamePage.fallback_reasons` etc., normalise the raw proto values
 * via `normaliseFallbackReason` and render `FallbackNotice` directly.
 *
 * FallbackReason union — 7 proto values + 6 platform extensions
 * ────────────────────────────────────────────────────────────
 *
 * Proto-mapped (1:1 with `btl.game.v1.types.FallbackReason`, excluding
 * `UNSPECIFIED`):
 *   - LINEUPS_MISSING
 *   - TIMELINE_MISSING
 *   - RICH_ACTIONS_UNAVAILABLE
 *   - LIVE_SCORE_STALE
 *   - PROVIDER_OUTAGE
 *   - UNRESOLVED_IDENTITY
 *   - SETTLEMENT_PENDING
 *
 * Platform extensions (no proto enum yet — pending Lane A proto v0.13.0):
 *   - RPC_NOT_AVAILABLE
 *   - VIEWER_NOT_ELIGIBLE
 *   - NO_ACTIVE_PREDICTION_LEAGUE
 *   - NO_RATINGS_YET
 *   - NO_THOUGHTS_YET
 *   - LIST_RATINGS_RPC_PENDING
 *
 * Consumers that wire only the proto enum still get autocomplete on the
 * 7 proto reasons via the literal union; the 6 extensions are accepted
 * but render through this primitive's own copy table.
 * ──────────────────────────────────────────────────────────────────────────── */

export type FallbackReason =
  | 'LINEUPS_MISSING'
  | 'TIMELINE_MISSING'
  | 'RICH_ACTIONS_UNAVAILABLE'
  | 'LIVE_SCORE_STALE'
  | 'PROVIDER_OUTAGE'
  | 'UNRESOLVED_IDENTITY'
  | 'SETTLEMENT_PENDING'
  | 'RPC_NOT_AVAILABLE'
  | 'VIEWER_NOT_ELIGIBLE'
  | 'NO_ACTIVE_PREDICTION_LEAGUE'
  | 'NO_RATINGS_YET'
  | 'NO_THOUGHTS_YET'
  | 'LIST_RATINGS_RPC_PENDING';

const PROTO_REASONS = new Set<FallbackReason>([
  'LINEUPS_MISSING',
  'TIMELINE_MISSING',
  'RICH_ACTIONS_UNAVAILABLE',
  'LIVE_SCORE_STALE',
  'PROVIDER_OUTAGE',
  'UNRESOLVED_IDENTITY',
  'SETTLEMENT_PENDING',
]);

// Proto-mapped reasons forward their kebab-case key to FallbackNotice so
// the design-system copy stays the single source of truth.
const PROTO_KEY: Record<string, string> = {
  LINEUPS_MISSING: 'lineups_missing',
  TIMELINE_MISSING: 'timeline_missing',
  RICH_ACTIONS_UNAVAILABLE: 'rich_actions_unavailable',
  LIVE_SCORE_STALE: 'live_score_stale',
  PROVIDER_OUTAGE: 'provider_outage',
  UNRESOLVED_IDENTITY: 'unresolved_identity',
  SETTLEMENT_PENDING: 'settlement_pending',
};

// Platform extensions get their copy here. Keep it terse — title is the
// primary signal, body is one supporting line.
const PLATFORM_COPY: Record<string, { title: string; body: string }> = {
  RPC_NOT_AVAILABLE: {
    title: 'This view is awaiting service coverage',
    body: 'The backing read endpoint is not yet available. We will surface the data the moment it lands.',
  },
  VIEWER_NOT_ELIGIBLE: {
    title: 'Members only',
    body: 'Joining the squad unlocks this engagement.',
  },
  NO_ACTIVE_PREDICTION_LEAGUE: {
    title: 'No prediction leagues are running for this fixture',
    body: 'Squads can run a Prediction League covering this match from Studio.',
  },
  NO_RATINGS_YET: {
    title: 'Be the first to rate this',
    body: 'Ratings are personal. Score on the BTL 1-6 scale (1 excellent, 6 poor).',
  },
  NO_THOUGHTS_YET: {
    title: 'No thoughts yet',
    body: 'Be the first to share a take.',
  },
  LIST_RATINGS_RPC_PENDING: {
    title: 'List ratings RPC pending',
    body: 'Your ratings will land here as soon as the read endpoint ships.',
  },
};

export interface FallbackStateProps {
  reason: FallbackReason;
  /** Tone hint, only affects subtle border/background; copy stays the same. */
  tone?: 'info' | 'warn';
  /** Optional override title (rare). */
  title?: string;
  /** Optional CTA node, e.g. a sign-in button, a "Try again" button. */
  cta?: React.ReactNode;
  className?: string;
}

export function FallbackState({ reason, tone, title, cta, className }: FallbackStateProps) {
  // Proto-mapped reasons route through the design-system FallbackNotice so
  // copy stays in one place.
  if (PROTO_REASONS.has(reason)) {
    const key = PROTO_KEY[reason];
    return (
      <div
        data-slot="game-centre-fallback-state"
        data-reason={reason}
        data-tone={tone ?? 'info'}
        className={className}
      >
        <FallbackNotice reasons={[key]} title={title} />
        {cta ? <div className="mt-3">{cta}</div> : null}
      </div>
    );
  }

  // Platform-extension reasons render their own block.
  const copy = PLATFORM_COPY[reason];
  const heading = title ?? copy.title;
  const isWarn = tone === 'warn';

  return (
    <section
      data-slot="game-centre-fallback-state"
      data-reason={reason}
      data-tone={tone ?? 'info'}
      role="status"
      className={cn(
        'rounded-md border p-4',
        isWarn ? 'border-yellow-300/25 bg-yellow-950/20' : 'border-white/10 bg-white/[0.03]',
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-white">{heading}</h3>
      <p className="mt-1 text-xs leading-5 text-white/55">{copy.body}</p>
      {cta ? <div className="mt-3">{cta}</div> : null}
    </section>
  );
}
