'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * FallbackNotice
 *
 * Honest missing-data state. We *never* fake-fill: when a Game Centre surface
 * cannot render its full payload (no lineups yet, the provider is down,
 * identities haven't resolved, settlement is pending, etc.), we tell the
 * user exactly what's missing and why.
 *
 * The supported reasons mirror the `btl.game.v1.types.FallbackReason` proto
 * enum so consumers can map straight from the proto's numeric value or its
 * SCREAMING_SNAKE_CASE label.
 *
 *   Proto                                          Local key
 *   ──────────────────────────────────────────────  ──────────────────────────────
 *   FALLBACK_REASON_UNSPECIFIED                     (skipped — never shown)
 *   FALLBACK_REASON_LINEUPS_MISSING                 lineups_missing
 *   FALLBACK_REASON_TIMELINE_MISSING                timeline_missing
 *   FALLBACK_REASON_RICH_ACTIONS_UNAVAILABLE        rich_actions_unavailable
 *   FALLBACK_REASON_LIVE_SCORE_STALE                live_score_stale
 *   FALLBACK_REASON_PROVIDER_OUTAGE                 provider_outage
 *   FALLBACK_REASON_UNRESOLVED_IDENTITY             unresolved_identity
 *   FALLBACK_REASON_SETTLEMENT_PENDING              settlement_pending
 *   FALLBACK_REASON_POTM_NOT_REPORTED               potm_not_reported
 *   FALLBACK_REASON_RPC_NOT_AVAILABLE               rpc_not_available
 *   FALLBACK_REASON_NO_THOUGHTS_YET                 no_thoughts_yet
 *   FALLBACK_REASON_NO_RATINGS_YET                  no_ratings_yet
 *   FALLBACK_REASON_NO_ACTIVE_PREDICTION_LEAGUE     no_active_prediction_league
 *   FALLBACK_REASON_LIST_RATINGS_RPC_PENDING        list_ratings_rpc_pending
 *
 * Each reason renders distinct, non-apologetic copy describing *what* is
 * missing and *why*. The component never claims data that isn't there.
 * ──────────────────────────────────────────────────────────────────────────── */

export type FallbackReasonKey =
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
  | 'list_ratings_rpc_pending';

/** Proto-string accepted as input. We normalise to FallbackReasonKey. */
export type FallbackReasonInput = FallbackReasonKey | string | number;

/**
 * Map a raw proto value (numeric tag or SCREAMING_SNAKE label) to a
 * FallbackReasonKey. Unknown / unspecified values resolve to undefined so the
 * caller can drop the row instead of rendering a hollow notice.
 */
export function normaliseFallbackReason(input: FallbackReasonInput): FallbackReasonKey | undefined {
  if (typeof input === 'number') {
    switch (input) {
      case 1:
        return 'lineups_missing';
      case 2:
        return 'timeline_missing';
      case 3:
        return 'rich_actions_unavailable';
      case 4:
        return 'live_score_stale';
      case 5:
        return 'provider_outage';
      case 6:
        return 'unresolved_identity';
      case 7:
        return 'settlement_pending';
      case 8:
        return 'potm_not_reported';
      case 9:
        return 'rpc_not_available';
      case 10:
        return 'no_thoughts_yet';
      case 11:
        return 'no_ratings_yet';
      case 12:
        return 'no_active_prediction_league';
      case 13:
        return 'list_ratings_rpc_pending';
      default:
        return undefined;
    }
  }
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  switch (upper) {
    case 'FALLBACK_REASON_LINEUPS_MISSING':
    case 'LINEUPS_MISSING':
      return 'lineups_missing';
    case 'FALLBACK_REASON_TIMELINE_MISSING':
    case 'TIMELINE_MISSING':
      return 'timeline_missing';
    case 'FALLBACK_REASON_RICH_ACTIONS_UNAVAILABLE':
    case 'RICH_ACTIONS_UNAVAILABLE':
      return 'rich_actions_unavailable';
    case 'FALLBACK_REASON_LIVE_SCORE_STALE':
    case 'LIVE_SCORE_STALE':
      return 'live_score_stale';
    case 'FALLBACK_REASON_PROVIDER_OUTAGE':
    case 'PROVIDER_OUTAGE':
      return 'provider_outage';
    case 'FALLBACK_REASON_UNRESOLVED_IDENTITY':
    case 'UNRESOLVED_IDENTITY':
      return 'unresolved_identity';
    case 'FALLBACK_REASON_SETTLEMENT_PENDING':
    case 'SETTLEMENT_PENDING':
      return 'settlement_pending';
    case 'FALLBACK_REASON_POTM_NOT_REPORTED':
    case 'POTM_NOT_REPORTED':
      return 'potm_not_reported';
    case 'FALLBACK_REASON_RPC_NOT_AVAILABLE':
    case 'RPC_NOT_AVAILABLE':
      return 'rpc_not_available';
    case 'FALLBACK_REASON_NO_THOUGHTS_YET':
    case 'NO_THOUGHTS_YET':
      return 'no_thoughts_yet';
    case 'FALLBACK_REASON_NO_RATINGS_YET':
    case 'NO_RATINGS_YET':
      return 'no_ratings_yet';
    case 'FALLBACK_REASON_NO_ACTIVE_PREDICTION_LEAGUE':
    case 'NO_ACTIVE_PREDICTION_LEAGUE':
      return 'no_active_prediction_league';
    case 'FALLBACK_REASON_LIST_RATINGS_RPC_PENDING':
    case 'LIST_RATINGS_RPC_PENDING':
      return 'list_ratings_rpc_pending';
    default:
      // Accept already-normalised keys
      if (
        (
          [
            'lineups_missing',
            'timeline_missing',
            'rich_actions_unavailable',
            'live_score_stale',
            'provider_outage',
            'unresolved_identity',
            'settlement_pending',
            'potm_not_reported',
            'rpc_not_available',
            'no_thoughts_yet',
            'no_ratings_yet',
            'no_active_prediction_league',
            'list_ratings_rpc_pending',
          ] as string[]
        ).includes(trimmed)
      ) {
        return trimmed as FallbackReasonKey;
      }
      return undefined;
  }
}

interface FallbackReasonCopy {
  title: string;
  body: string;
}

const FALLBACK_REASON_COPY: Record<FallbackReasonKey, FallbackReasonCopy> = {
  lineups_missing: {
    title: 'Lineups not announced',
    body: "Team sheets haven't been published yet. We'll fill this in as soon as they do.",
  },
  timeline_missing: {
    title: 'Live timeline unavailable',
    body: 'Our provider has not published a play-by-play feed for this fixture.',
  },
  rich_actions_unavailable: {
    title: 'Rich actions unavailable',
    body: 'Heatmaps, passing networks, and shot maps are not enabled for this competition.',
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
    title: 'Identity not yet resolved',
    body: 'We are still matching player or team identities for this fixture.',
  },
  settlement_pending: {
    title: 'Settlement pending',
    body: 'The match has ended but results have not yet been settled by our provider.',
  },
  potm_not_reported: {
    title: 'Player of the match not reported',
    body: 'The match POTM has not been published for this fixture.',
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
    title: 'No ratings yet',
    body: 'Player ratings will appear after the match.',
  },
  no_active_prediction_league: {
    title: 'No active prediction league',
    body: 'Join or create a league to start predicting.',
  },
  list_ratings_rpc_pending: {
    title: 'Ratings loading',
    body: 'Pulling your rating history.',
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
          'inline-flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-amber-100',
          className
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-200/80" />
        <span data-slot="fallback-notice-title">
          {title ?? FALLBACK_REASON_COPY[normalised[0]].title}
        </span>
      </p>
    );
  }

  return (
    <section
      data-slot="fallback-notice"
      data-variant="default"
      data-reason-count={normalised.length}
      className={cn(
        'flex flex-col gap-2 border border-amber-200/20 bg-amber-200/[0.04]',
        'px-4 py-3 text-white',
        className
      )}
    >
      <header
        data-slot="fallback-notice-eyebrow"
        className="text-[10px] tracking-[0.16em] uppercase text-amber-100/90"
      >
        {title ?? 'Some data is missing'}
      </header>
      <ul className="flex flex-col gap-1.5 text-[12px] text-white/80">
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
