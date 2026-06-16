'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * FallbackNotice
 *
 * Honest missing-data state. We *never* fake-fill: when a Game Centre / Arena
 * / Engagement / Studio surface cannot render its full payload (no lineups
 * yet, the provider is down, identities haven't resolved, settlement is
 * pending, viewer not eligible, etc.), we tell the user exactly what's
 * missing and why.
 *
 * The supported reasons mirror the `btl.game.v1.types.FallbackReason` proto
 * enum from `@breakingthelines/protos` v0.15.0 (1:1 for all 46 non-zero
 * values), so consumers can map straight from the proto's numeric value or
 * its SCREAMING_SNAKE_CASE label.
 *
 *   Proto                                          Local key
 *   ──────────────────────────────────────────────  ──────────────────────────────
 *   FALLBACK_REASON_UNSPECIFIED                     (skipped — never shown)
 *   FALLBACK_REASON_LINEUPS_MISSING (1)             lineups_missing
 *   FALLBACK_REASON_TIMELINE_MISSING (2)            timeline_missing
 *   FALLBACK_REASON_RICH_ACTIONS_UNAVAILABLE (3)    rich_actions_unavailable
 *   FALLBACK_REASON_LIVE_SCORE_STALE (4)            live_score_stale
 *   FALLBACK_REASON_PROVIDER_OUTAGE (5)             provider_outage
 *   FALLBACK_REASON_UNRESOLVED_IDENTITY (6)         unresolved_identity
 *   FALLBACK_REASON_SETTLEMENT_PENDING (7)          settlement_pending
 *   FALLBACK_REASON_POTM_NOT_REPORTED (8)           potm_not_reported
 *   FALLBACK_REASON_RPC_NOT_AVAILABLE (9)           rpc_not_available
 *   FALLBACK_REASON_NO_THOUGHTS_YET (10)            no_thoughts_yet
 *   FALLBACK_REASON_NO_RATINGS_YET (11)             no_ratings_yet
 *   FALLBACK_REASON_NO_ACTIVE_PREDICTION_LEAGUE(12) no_active_prediction_league
 *   FALLBACK_REASON_LIST_RATINGS_RPC_PENDING (13)   list_ratings_rpc_pending
 *
 *   ── v0.15.0 additions ──
 *
 *   FALLBACK_REASON_FOLLOW_GRAPH_EMPTY (14)         follow_graph_empty
 *   FALLBACK_REASON_NO_MOVES_PENDING (15)           no_moves_pending
 *   FALLBACK_REASON_USER_NOT_IN_SQUAD (16)          user_not_in_squad
 *   FALLBACK_REASON_VIEWER_NOT_ELIGIBLE (17)        viewer_not_eligible
 *   FALLBACK_REASON_PREDICTION_LEAGUE_NOT_FOUND(18) prediction_league_not_found
 *   FALLBACK_REASON_RATINGS_CLUB_NOT_FOUND (19)     ratings_club_not_found
 *   FALLBACK_REASON_LEAGUE_NAME_TAKEN (20)          league_name_taken
 *   FALLBACK_REASON_CLUB_NAME_TAKEN (21)            club_name_taken
 *   FALLBACK_REASON_LEAGUE_NOT_STARTED (22)         league_not_started
 *   FALLBACK_REASON_NO_RESULTS_YET (23)             no_results_yet
 *   FALLBACK_REASON_RATING_LOG_PRIVATE (24)         rating_log_private
 *   FALLBACK_REASON_NO_DATA_FOR_SEASON (25)         no_data_for_season
 *   FALLBACK_REASON_NO_CONTENT_YET (26)             no_content_yet
 *   FALLBACK_REASON_INSIGHTS_NOT_YET_AVAILABLE (27) insights_not_yet_available
 *   FALLBACK_REASON_DRAFT_NOT_FOUND (28)            draft_not_found
 *   FALLBACK_REASON_EDIT_LOCKED (29)                edit_locked
 *   FALLBACK_REASON_SQUAD_NOT_FOUND (30)            squad_not_found
 *   FALLBACK_REASON_NO_ENGAGEMENT_YET (31)          no_engagement_yet
 *   FALLBACK_REASON_NO_OPPORTUNITIES_YET (32)       no_opportunities_yet
 *   FALLBACK_REASON_SOURCE_NOT_AVAILABLE (33)       source_not_available
 *   FALLBACK_REASON_EXTERNAL_URL_UNRESOLVED (34)    external_url_unresolved
 *   FALLBACK_REASON_EXTERNAL_VIDEO_UNAVAILABLE (35) external_video_unavailable
 *   FALLBACK_REASON_EXTERNAL_PODCAST_UNAVAILABLE(36) external_podcast_unavailable
 *   FALLBACK_REASON_VISUAL_RENDERER_UNAVAILABLE(37) visual_renderer_unavailable
 *   FALLBACK_REASON_MATCH_NOT_STARTED (38)          match_not_started
 *   FALLBACK_REASON_LIVE_DATA_UNAVAILABLE (39)      live_data_unavailable
 *   FALLBACK_REASON_MATCH_POSTPONED (40)            match_postponed
 *   FALLBACK_REASON_MATCH_CANCELLED (41)            match_cancelled
 *   FALLBACK_REASON_MATCH_VOID (42)                 match_void
 *   FALLBACK_REASON_RATING_NOT_YET_OPEN (43)        rating_not_yet_open
 *   FALLBACK_REASON_RATING_PERIOD_CLOSED (44)       rating_period_closed
 *   FALLBACK_REASON_PREDICTION_LOCKED (45)          prediction_locked
 *   FALLBACK_REASON_PREDICTION_NOT_YET_OPEN (46)    prediction_not_yet_open
 *
 * Each reason renders distinct, non-apologetic copy describing *what* is
 * missing and *why*. The component never claims data that isn't there.
 * ──────────────────────────────────────────────────────────────────────────── */

export type FallbackReasonKey =
  // v0.3.0 original 13
  | 'lineups_missing'
  | 'timeline_missing'
  | 'rich_actions_unavailable'
  | 'live_score_stale'
  | 'provider_outage'
  | 'unresolved_identity'
  | 'settlement_pending'
  | 'potm_not_reported'
  | 'rpc_not_available'
  | 'no_thoughts_yet'
  | 'no_ratings_yet'
  | 'no_active_prediction_league'
  | 'list_ratings_rpc_pending'
  // v0.15.0 Arena (L1)
  | 'follow_graph_empty'
  | 'no_moves_pending'
  | 'user_not_in_squad'
  // v0.15.0 Eligibility (L4 + L5)
  | 'viewer_not_eligible'
  // v0.15.0 Prediction League / Ratings Club (L4 + L5)
  | 'prediction_league_not_found'
  | 'ratings_club_not_found'
  | 'league_name_taken'
  | 'club_name_taken'
  | 'league_not_started'
  | 'no_results_yet'
  // v0.15.0 Personal Ratings Log (L3)
  | 'rating_log_private'
  // v0.15.0 Game Centre entity pages (L2)
  | 'no_data_for_season'
  // v0.15.0 Studio cockpit (L6)
  | 'no_content_yet'
  | 'insights_not_yet_available'
  | 'draft_not_found'
  | 'edit_locked'
  | 'squad_not_found'
  // v0.15.0 Studio engagement ops (L7)
  | 'no_engagement_yet'
  | 'no_opportunities_yet'
  | 'source_not_available'
  // v0.15.0 Studio media (L8)
  | 'external_url_unresolved'
  | 'external_video_unavailable'
  | 'external_podcast_unavailable'
  | 'visual_renderer_unavailable'
  // v0.15.0 Match lifecycle (L2)
  | 'match_not_started'
  | 'live_data_unavailable'
  | 'match_postponed'
  | 'match_cancelled'
  | 'match_void'
  // v0.15.0 Rating-window lifecycle (L2 + L5)
  | 'rating_not_yet_open'
  | 'rating_period_closed'
  // v0.15.0 Prediction-window lifecycle (L2 + L4)
  | 'prediction_locked'
  | 'prediction_not_yet_open'
  // v0.20.0 Wave 6 Lineups
  | 'lineup_not_yet_announced'
  // Client-only (no proto tag): a surface decides this empty state locally.
  | 'ratings_unavailable';

/** Proto-string accepted as input. We normalise to FallbackReasonKey. */
export type FallbackReasonInput = FallbackReasonKey | string | number;

const NUMERIC_TAG_TO_KEY: Record<number, FallbackReasonKey> = {
  1: 'lineups_missing',
  2: 'timeline_missing',
  3: 'rich_actions_unavailable',
  4: 'live_score_stale',
  5: 'provider_outage',
  6: 'unresolved_identity',
  7: 'settlement_pending',
  8: 'potm_not_reported',
  9: 'rpc_not_available',
  10: 'no_thoughts_yet',
  11: 'no_ratings_yet',
  12: 'no_active_prediction_league',
  13: 'list_ratings_rpc_pending',
  14: 'follow_graph_empty',
  15: 'no_moves_pending',
  16: 'user_not_in_squad',
  17: 'viewer_not_eligible',
  18: 'prediction_league_not_found',
  19: 'ratings_club_not_found',
  20: 'league_name_taken',
  21: 'club_name_taken',
  22: 'league_not_started',
  23: 'no_results_yet',
  24: 'rating_log_private',
  25: 'no_data_for_season',
  26: 'no_content_yet',
  27: 'insights_not_yet_available',
  28: 'draft_not_found',
  29: 'edit_locked',
  30: 'squad_not_found',
  31: 'no_engagement_yet',
  32: 'no_opportunities_yet',
  33: 'source_not_available',
  34: 'external_url_unresolved',
  35: 'external_video_unavailable',
  36: 'external_podcast_unavailable',
  37: 'visual_renderer_unavailable',
  38: 'match_not_started',
  39: 'live_data_unavailable',
  40: 'match_postponed',
  41: 'match_cancelled',
  42: 'match_void',
  43: 'rating_not_yet_open',
  44: 'rating_period_closed',
  45: 'prediction_locked',
  46: 'prediction_not_yet_open',
  47: 'lineup_not_yet_announced',
};

// Client-only reasons have no proto numeric tag — a surface decides the empty
// state locally and passes the key directly (e.g. the match Grades sub-tab
// showing "Grading unavailable" when there's no lineup to grade). They still
// resolve through normaliseFallbackReason and render canonical copy.
const CLIENT_ONLY_KEYS: ReadonlyArray<FallbackReasonKey> = ['ratings_unavailable'];
const ALL_KEYS: ReadonlyArray<FallbackReasonKey> = [
  ...Object.values(NUMERIC_TAG_TO_KEY),
  ...CLIENT_ONLY_KEYS,
];
const KEY_SET: ReadonlySet<string> = new Set(ALL_KEYS);

/**
 * Map a raw proto value (numeric tag or SCREAMING_SNAKE label) to a
 * FallbackReasonKey. Unknown / unspecified values resolve to undefined so the
 * caller can drop the row instead of rendering a hollow notice.
 */
export function normaliseFallbackReason(input: FallbackReasonInput): FallbackReasonKey | undefined {
  if (typeof input === 'number') {
    return NUMERIC_TAG_TO_KEY[input];
  }
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Accept already-normalised lowercase keys verbatim.
  if (KEY_SET.has(trimmed)) {
    return trimmed as FallbackReasonKey;
  }

  // Accept SCREAMING_SNAKE labels with or without the `FALLBACK_REASON_` prefix.
  const upper = trimmed.toUpperCase();
  const stripped = upper.startsWith('FALLBACK_REASON_')
    ? upper.slice('FALLBACK_REASON_'.length)
    : upper;
  const candidate = stripped.toLowerCase();
  if (KEY_SET.has(candidate)) {
    return candidate as FallbackReasonKey;
  }
  return undefined;
}

interface FallbackReasonCopy {
  title: string;
  body: string;
}

const FALLBACK_REASON_COPY: Record<FallbackReasonKey, FallbackReasonCopy> = {
  // v0.3.0 original 13
  lineups_missing: {
    title: 'Lineups coming soon',
    body: "Confirmed XIs land in the build-up to kickoff. We'll post them here.",
  },
  timeline_missing: {
    title: 'No timeline yet',
    body: 'Key moments will appear here as the match unfolds.',
  },
  rich_actions_unavailable: {
    title: 'Match stats coming soon',
    body: "Detailed stats aren't published for this match yet.",
  },
  live_score_stale: {
    title: 'Live score paused',
    body: 'The live ticker has stopped updating. Score may be a few minutes behind.',
  },
  provider_outage: {
    title: 'Provider outage',
    body: 'Our data provider is currently degraded. We will refresh as soon as the feed recovers.',
  },
  unresolved_identity: {
    title: 'Still being set up',
    body: "We're still putting this one together. Check back soon.",
  },
  settlement_pending: {
    title: 'Settlement pending',
    body: 'The match has ended but results have not yet been settled by our provider.',
  },
  potm_not_reported: {
    title: 'No Player of the Match yet',
    body: 'Voting opens when the final whistle blows.',
  },
  rpc_not_available: {
    title: 'Service unavailable',
    body: 'Try again shortly.',
  },
  no_thoughts_yet: {
    title: 'No thoughts yet',
    body: 'Be the first to share.',
  },
  no_ratings_yet: {
    title: 'No grades yet',
    body: 'Be the first to grade this game.',
  },
  ratings_unavailable: {
    title: 'Grading unavailable',
    body: 'Player grades open once the lineup is confirmed.',
  },
  no_active_prediction_league: {
    title: 'No prediction league yet',
    body: 'Join or create a league to start predicting this fixture.',
  },
  list_ratings_rpc_pending: {
    title: 'Ratings loading',
    body: 'Pulling your rating history.',
  },

  // v0.15.0 Arena (L1)
  follow_graph_empty: {
    title: 'Nothing followed yet',
    body: 'Follow players, teams, managers or competitions to fill this in.',
  },
  no_moves_pending: {
    title: 'No moves pending',
    body: 'Predictions and ratings due soon will appear here.',
  },
  user_not_in_squad: {
    title: 'No squads yet',
    body: 'Join a squad to see its prediction leagues and rating clubs.',
  },

  // v0.15.0 Eligibility
  viewer_not_eligible: {
    title: 'Hidden from you',
    body: 'This is a private squad surface. Ask a squad lead for access.',
  },

  // v0.15.0 Prediction League / Ratings Club
  prediction_league_not_found: {
    title: 'League not found',
    body: 'This prediction league does not exist or has been archived.',
  },
  ratings_club_not_found: {
    title: 'Club not found',
    body: 'This ratings club does not exist or has been archived.',
  },
  league_name_taken: {
    title: 'Name already in use',
    body: 'Another prediction league in this squad already uses that name.',
  },
  club_name_taken: {
    title: 'Name already in use',
    body: 'Another ratings club in this squad already uses that name.',
  },
  league_not_started: {
    title: 'League not started yet',
    body: 'Standings will populate once the first gameweek closes.',
  },
  no_results_yet: {
    title: 'No results yet',
    body: 'Standings will appear once the first scored gameweek settles.',
  },

  // v0.15.0 Personal Ratings Log
  rating_log_private: {
    title: 'Rating log is private',
    body: 'This user keeps their rating history to themselves.',
  },

  // v0.15.0 Game Centre entity pages
  no_data_for_season: {
    title: 'Nothing for this season yet',
    body: "Check back as the season's matches are played.",
  },

  // v0.15.0 Studio cockpit
  no_content_yet: {
    title: 'No content yet',
    body: 'Drafts and published pieces will show up here once you start writing.',
  },
  insights_not_yet_available: {
    title: 'Insights warming up',
    body: 'Studio Insights need a few more days of engagement before they appear.',
  },
  draft_not_found: {
    title: 'Draft not found',
    body: 'This draft has been deleted or never existed.',
  },
  edit_locked: {
    title: 'Edit lock held by another editor',
    body: 'Another collaborator is editing this draft. Try again once they save.',
  },
  squad_not_found: {
    title: 'Squad not found',
    body: 'This squad has been archived or never existed.',
  },

  // v0.15.0 Studio engagement ops
  no_engagement_yet: {
    title: 'No engagement yet',
    body: 'Engagement signals appear here as readers, thoughts and ratings arrive.',
  },
  no_opportunities_yet: {
    title: 'No opportunities yet',
    body: 'Content opportunities surface from intelligence-service as your audience signals build up.',
  },
  source_not_available: {
    title: 'Source not available',
    body: 'The signal this draft was composed from is no longer reachable.',
  },

  // v0.15.0 Studio media
  external_url_unresolved: {
    title: 'External URL could not be resolved',
    body: 'The publisher URL did not return readable metadata. Paste a direct link to retry.',
  },
  external_video_unavailable: {
    title: 'Video unavailable',
    body: 'The embedded YouTube video is private, deleted, or geo-blocked.',
  },
  external_podcast_unavailable: {
    title: 'Podcast source unavailable',
    body: 'No playable RSS enclosure is available here. Open the provider or source externally to listen.',
  },
  visual_renderer_unavailable: {
    title: 'Visual renderer unavailable',
    body: 'The viz subtype renderer reported an error. Try a different visual or re-publish.',
  },

  // v0.15.0 Match lifecycle
  // Wave 6.25a: reframed for the SCHEDULED Timeline. The pre-match Timeline
  // panel emits this reason so the empty state reads as "by design", not as
  // "our provider missed a feed". Copy refresh kept honest: nothing to show
  // yet, but the time is known.
  match_not_started: {
    title: 'Timeline opens at kickoff',
    body: 'Play-by-play arrives once the match is underway.',
  },
  live_data_unavailable: {
    title: 'Live data temporarily unavailable',
    body: 'The provider feed has gone quiet. We will resume as soon as updates arrive.',
  },
  match_postponed: {
    title: 'Match postponed',
    body: 'The fixture has been postponed by the competition. A new date is pending.',
  },
  match_cancelled: {
    title: 'Match cancelled',
    body: 'The fixture has been cancelled by the competition.',
  },
  match_void: {
    title: 'Match voided',
    body: 'The fixture was abandoned or voided. Predictions and ratings are returned.',
  },

  // v0.15.0 Rating-window lifecycle
  // Wave 6.25a: the Grades sub-tab on a SCHEDULED match also leans on this
  // reason. Both surfaces want a single honest line: grading happens
  // post-whistle, not pre-match.
  rating_not_yet_open: {
    title: 'Grades open at full-time',
    body: "Grade the players once the match is done. We'll open it up here then.",
  },
  rating_period_closed: {
    title: 'Grades closed',
    body: 'The grading window has closed. Final grades are below.',
  },

  // v0.15.0 Prediction-window lifecycle
  prediction_locked: {
    title: 'Predictions locked',
    body: 'Kickoff has passed, so picks are closed for this fixture.',
  },
  prediction_not_yet_open: {
    title: 'Predictions open soon',
    body: 'Picks open closer to kickoff.',
  },
  lineup_not_yet_announced: {
    title: 'Lineups not announced yet',
    body: 'Confirmed XIs land in the build-up to kickoff.',
  },
};

export interface FallbackNoticeProps {
  /** One or more reasons (proto enum values, strings, or normalised keys). */
  reasons: FallbackReasonInput[];
  /** Optional override title (rare — only for context-specific surfaces). */
  title?: string;
  /** Compact one-line variant. */
  variant?: 'default' | 'compact';
  className?: string;
}

export function FallbackNotice({
  reasons,
  title,
  variant = 'default',
  className,
}: FallbackNoticeProps) {
  const normalised = reasons
    .map((reason) => normaliseFallbackReason(reason))
    .filter((reason): reason is FallbackReasonKey => Boolean(reason));

  // If nothing survives normalisation, render nothing — never invent copy.
  if (normalised.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <p
        data-slot="fallback-notice"
        data-variant="compact"
        data-reason-count={normalised.length}
        className={cn(
          'inline-flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-white/70',
          className
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-white/30" />
        <span data-slot="fallback-notice-title">
          {title ?? FALLBACK_REASON_COPY[normalised[0]].title}
        </span>
      </p>
    );
  }

  // Default variant. Single-reason notices (~99% of in-game uses) lead with the
  // reason title in white — no universal "Some data is missing" eyebrow. Multi-
  // reason notices keep the eyebrow so the list reads as a roll-up.
  const singleReason = normalised.length === 1 && !title;

  return (
    <section
      data-slot="fallback-notice"
      data-variant="default"
      data-reason-count={normalised.length}
      className={cn(
        'flex flex-col gap-2 border border-white/10 bg-white/[0.03]',
        'px-4 py-3 text-white',
        className
      )}
    >
      {singleReason ? null : (
        <header
          data-slot="fallback-notice-eyebrow"
          className="text-[10px] tracking-[0.16em] uppercase text-white/50"
        >
          {title ?? 'Coming soon'}
        </header>
      )}
      <ul className="flex flex-col gap-1.5 text-[12px] text-white/60">
        {normalised.map((reason) => {
          const copy = FALLBACK_REASON_COPY[reason];
          return (
            <li
              key={reason}
              data-slot="fallback-notice-reason"
              data-reason={reason}
              className="flex flex-col gap-0.5"
            >
              <span className="font-medium text-white">{copy.title}</span>
              <span className="text-white/60">{copy.body}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
