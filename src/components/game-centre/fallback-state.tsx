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
 * FallbackReason union — 12 proto values + 1 platform extension
 * ────────────────────────────────────────────────────────────
 *
 * Proto-mapped (1:1 with `btl.game.v1.types.FallbackReason` from
 * `@breakingthelines/protos`, excluding `UNSPECIFIED`):
 *   - LINEUPS_MISSING
 *   - TIMELINE_MISSING
 *   - RICH_ACTIONS_UNAVAILABLE
 *   - LIVE_SCORE_STALE
 *   - PROVIDER_OUTAGE
 *   - UNRESOLVED_IDENTITY
 *   - SETTLEMENT_PENDING
 *   - POTM_NOT_REPORTED
 *   - RPC_NOT_AVAILABLE
 *   - NO_THOUGHTS_YET
 *   - NO_RATINGS_YET
 *   - NO_ACTIVE_PREDICTION_LEAGUE
 *   - LIST_RATINGS_RPC_PENDING
 *
 * Platform extensions (no proto enum — UI-only signal):
 *   - VIEWER_NOT_ELIGIBLE
 *
 * Consumers that wire only the proto enum get autocomplete on the proto
 * reasons via the literal union; the platform extension is accepted but
 * renders through this primitive's own copy table.
 * ──────────────────────────────────────────────────────────────────────────── */

export type FallbackReason =
  | 'LINEUPS_MISSING'
  | 'TIMELINE_MISSING'
  | 'RICH_ACTIONS_UNAVAILABLE'
  | 'LIVE_SCORE_STALE'
  | 'PROVIDER_OUTAGE'
  | 'UNRESOLVED_IDENTITY'
  | 'SETTLEMENT_PENDING'
  | 'POTM_NOT_REPORTED'
  | 'RPC_NOT_AVAILABLE'
  | 'NO_THOUGHTS_YET'
  | 'NO_RATINGS_YET'
  | 'NO_ACTIVE_PREDICTION_LEAGUE'
  | 'LIST_RATINGS_RPC_PENDING'
  | 'VIEWER_NOT_ELIGIBLE';

const PROTO_REASONS = new Set<FallbackReason>([
  'LINEUPS_MISSING',
  'TIMELINE_MISSING',
  'RICH_ACTIONS_UNAVAILABLE',
  'LIVE_SCORE_STALE',
  'PROVIDER_OUTAGE',
  'UNRESOLVED_IDENTITY',
  'SETTLEMENT_PENDING',
  'POTM_NOT_REPORTED',
  'RPC_NOT_AVAILABLE',
  'NO_THOUGHTS_YET',
  'NO_RATINGS_YET',
  'NO_ACTIVE_PREDICTION_LEAGUE',
  'LIST_RATINGS_RPC_PENDING',
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
  POTM_NOT_REPORTED: 'potm_not_reported',
  RPC_NOT_AVAILABLE: 'rpc_not_available',
  NO_THOUGHTS_YET: 'no_thoughts_yet',
  NO_RATINGS_YET: 'no_ratings_yet',
  NO_ACTIVE_PREDICTION_LEAGUE: 'no_active_prediction_league',
  LIST_RATINGS_RPC_PENDING: 'list_ratings_rpc_pending',
};

// Platform extensions get their copy here. Keep it terse — title is the
// primary signal, body is one supporting line.
const PLATFORM_COPY: Record<string, { title: string; body: string }> = {
  VIEWER_NOT_ELIGIBLE: {
    title: 'Members only',
    body: 'Joining the squad unlocks this engagement.',
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
        className
      )}
    >
      <h3 className="text-sm font-semibold text-white">{heading}</h3>
      <p className="mt-1 text-xs leading-5 text-white/55">{copy.body}</p>
      {cta ? <div className="mt-3">{cta}</div> : null}
    </section>
  );
}
