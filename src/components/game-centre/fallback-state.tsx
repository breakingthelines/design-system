'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { FallbackNotice } from '#/components/ui/fallback-notice';

/* ─────────────────────────────────────────────────────────────────────────────
 * FallbackState
 *
 * Standardised honest fallback for the Game Centre / Arena / Engagement /
 * Studio surfaces. Wraps the design-system `FallbackNotice` so proto-enum
 * reasons keep their canonical copy, and adds a small set of platform-only
 * extensions that don't have a proto enum yet.
 *
 * Use this primitive in section bodies (a tab panel, a missing-block in
 * Arena, an empty Ratings/Predictions summary, a Studio archive page). For
 * full proto-level fallback lists from `GamePage.fallback_reasons` etc.,
 * normalise the raw proto values via `normaliseFallbackReason` and render
 * `FallbackNotice` directly.
 *
 * FallbackReason union — 46 proto values + 0 platform extensions
 * ──────────────────────────────────────────────────────────────
 *
 * All 46 entries map 1:1 to `btl.game.v1.types.FallbackReason` from
 * `@breakingthelines/protos` v0.15.0 (excluding `UNSPECIFIED`). The v0.4.0
 * minor bump elevates the previous `VIEWER_NOT_ELIGIBLE` platform extension
 * into the proto enum and adds 32 new wire-safe values for the Beta Polish
 * Launch-Ready surface matrix.
 *
 * Surface ownership lane is recorded inline with each value so consumers
 * can grep for the lane that emits it.
 * ──────────────────────────────────────────────────────────────────────────── */

export type FallbackReason =
  // Original v0.3.0 proto-mapped reasons
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
  // Arena (L1)
  | 'FOLLOW_GRAPH_EMPTY'
  | 'NO_MOVES_PENDING'
  | 'USER_NOT_IN_SQUAD'
  // Squad-scoped eligibility (L4 + L5) — promoted from platform extension
  | 'VIEWER_NOT_ELIGIBLE'
  // Prediction League / Ratings Club (L4 + L5)
  | 'PREDICTION_LEAGUE_NOT_FOUND'
  | 'RATINGS_CLUB_NOT_FOUND'
  | 'LEAGUE_NAME_TAKEN'
  | 'CLUB_NAME_TAKEN'
  | 'LEAGUE_NOT_STARTED'
  | 'NO_RESULTS_YET'
  // Personal Ratings Log (L3)
  | 'RATING_LOG_PRIVATE'
  // Game Centre entity pages (L2)
  | 'NO_DATA_FOR_SEASON'
  // Studio cockpit (L6)
  | 'NO_CONTENT_YET'
  | 'INSIGHTS_NOT_YET_AVAILABLE'
  | 'DRAFT_NOT_FOUND'
  | 'EDIT_LOCKED'
  | 'SQUAD_NOT_FOUND'
  // Studio engagement ops (L7)
  | 'NO_ENGAGEMENT_YET'
  | 'NO_OPPORTUNITIES_YET'
  | 'SOURCE_NOT_AVAILABLE'
  // Studio media (L8)
  | 'EXTERNAL_URL_UNRESOLVED'
  | 'EXTERNAL_VIDEO_UNAVAILABLE'
  | 'EXTERNAL_PODCAST_UNAVAILABLE'
  | 'VISUAL_RENDERER_UNAVAILABLE'
  // Match lifecycle (L2)
  | 'MATCH_NOT_STARTED'
  | 'LIVE_DATA_UNAVAILABLE'
  | 'MATCH_POSTPONED'
  | 'MATCH_CANCELLED'
  | 'MATCH_VOID'
  // Rating window (L2 + L5)
  | 'RATING_NOT_YET_OPEN'
  | 'RATING_PERIOD_CLOSED'
  // Prediction window (L2 + L4)
  | 'PREDICTION_LOCKED'
  | 'PREDICTION_NOT_YET_OPEN';

const PROTO_REASONS = new Set<FallbackReason>([
  // Original v0.3.0
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
  // Beta Polish additions
  'FOLLOW_GRAPH_EMPTY',
  'NO_MOVES_PENDING',
  'USER_NOT_IN_SQUAD',
  'VIEWER_NOT_ELIGIBLE',
  'PREDICTION_LEAGUE_NOT_FOUND',
  'RATINGS_CLUB_NOT_FOUND',
  'LEAGUE_NAME_TAKEN',
  'CLUB_NAME_TAKEN',
  'LEAGUE_NOT_STARTED',
  'NO_RESULTS_YET',
  'RATING_LOG_PRIVATE',
  'NO_DATA_FOR_SEASON',
  'NO_CONTENT_YET',
  'INSIGHTS_NOT_YET_AVAILABLE',
  'DRAFT_NOT_FOUND',
  'EDIT_LOCKED',
  'SQUAD_NOT_FOUND',
  'NO_ENGAGEMENT_YET',
  'NO_OPPORTUNITIES_YET',
  'SOURCE_NOT_AVAILABLE',
  'EXTERNAL_URL_UNRESOLVED',
  'EXTERNAL_VIDEO_UNAVAILABLE',
  'EXTERNAL_PODCAST_UNAVAILABLE',
  'VISUAL_RENDERER_UNAVAILABLE',
  'MATCH_NOT_STARTED',
  'LIVE_DATA_UNAVAILABLE',
  'MATCH_POSTPONED',
  'MATCH_CANCELLED',
  'MATCH_VOID',
  'RATING_NOT_YET_OPEN',
  'RATING_PERIOD_CLOSED',
  'PREDICTION_LOCKED',
  'PREDICTION_NOT_YET_OPEN',
]);

// Proto-mapped reasons forward their kebab-case key to FallbackNotice so
// the design-system copy stays the single source of truth.
const PROTO_KEY: Record<string, string> = {
  // Original v0.3.0
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
  // Beta Polish additions
  FOLLOW_GRAPH_EMPTY: 'follow_graph_empty',
  NO_MOVES_PENDING: 'no_moves_pending',
  USER_NOT_IN_SQUAD: 'user_not_in_squad',
  VIEWER_NOT_ELIGIBLE: 'viewer_not_eligible',
  PREDICTION_LEAGUE_NOT_FOUND: 'prediction_league_not_found',
  RATINGS_CLUB_NOT_FOUND: 'ratings_club_not_found',
  LEAGUE_NAME_TAKEN: 'league_name_taken',
  CLUB_NAME_TAKEN: 'club_name_taken',
  LEAGUE_NOT_STARTED: 'league_not_started',
  NO_RESULTS_YET: 'no_results_yet',
  RATING_LOG_PRIVATE: 'rating_log_private',
  NO_DATA_FOR_SEASON: 'no_data_for_season',
  NO_CONTENT_YET: 'no_content_yet',
  INSIGHTS_NOT_YET_AVAILABLE: 'insights_not_yet_available',
  DRAFT_NOT_FOUND: 'draft_not_found',
  EDIT_LOCKED: 'edit_locked',
  SQUAD_NOT_FOUND: 'squad_not_found',
  NO_ENGAGEMENT_YET: 'no_engagement_yet',
  NO_OPPORTUNITIES_YET: 'no_opportunities_yet',
  SOURCE_NOT_AVAILABLE: 'source_not_available',
  EXTERNAL_URL_UNRESOLVED: 'external_url_unresolved',
  EXTERNAL_VIDEO_UNAVAILABLE: 'external_video_unavailable',
  EXTERNAL_PODCAST_UNAVAILABLE: 'external_podcast_unavailable',
  VISUAL_RENDERER_UNAVAILABLE: 'visual_renderer_unavailable',
  MATCH_NOT_STARTED: 'match_not_started',
  LIVE_DATA_UNAVAILABLE: 'live_data_unavailable',
  MATCH_POSTPONED: 'match_postponed',
  MATCH_CANCELLED: 'match_cancelled',
  MATCH_VOID: 'match_void',
  RATING_NOT_YET_OPEN: 'rating_not_yet_open',
  RATING_PERIOD_CLOSED: 'rating_period_closed',
  PREDICTION_LOCKED: 'prediction_locked',
  PREDICTION_NOT_YET_OPEN: 'prediction_not_yet_open',
};

// Platform extensions — kept as an empty record now that VIEWER_NOT_ELIGIBLE
// has been promoted to the proto enum. Future UI-only signals (no proto
// counterpart) can land here without an enum bump.
const PLATFORM_COPY: Record<string, { title: string; body: string }> = {};

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

  // Platform-extension reasons (none currently — VIEWER_NOT_ELIGIBLE was
  // promoted to proto). The block is retained so future UI-only signals
  // can land here without breaking the surface contract.
  const copy = PLATFORM_COPY[reason];
  if (!copy) {
    return null;
  }
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
