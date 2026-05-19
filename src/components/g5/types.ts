import type * as React from 'react';

/**
 * G5 First Touch primitive types.
 *
 * These shapes are intentionally a presentational subset of the generated
 * `btl.context.v1.SubjectRef` / `btl.game.v1` proto messages — so the same
 * card can be fed from a fixture OR from a converted proto without writing
 * adapters per consumer. Keep this file byte-identical with
 * `platform/app/components/g5/types.ts` until the next design-system publish.
 */

export type G5SubjectKind = 'team' | 'competition' | 'game' | 'game_round';

export type G5SubjectRef = {
  kind: G5SubjectKind;
  id: string;
  /** Display label — e.g. "Real Madrid", "Premier League", "ARS v MUN". */
  label: string;
  /** Canonical slug from SubjectRef.slug. */
  slug?: string;
  /** Crest, cover, or poster URL. */
  imageUrl?: string;
  /** Optional brand tint (CSS color); falls back to neutral surface. */
  accentColor?: string;
  /** Optional second line — competition for team, season for competition, kickoff for game. */
  secondaryLabel?: string;
  /** Optional third line — venue, country, gameweek. */
  tertiaryLabel?: string;
};

export type G5FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type G5FixtureSide = {
  label: string;
  imageUrl?: string;
  accentColor?: string;
};

export type G5FixtureCardData = G5SubjectRef & {
  kind: 'game';
  home: G5FixtureSide;
  away: G5FixtureSide;
  /** ISO datetime for SCHEDULED games. */
  kickoffIso?: string;
  status?: G5FixtureStatus;
  /** Present when status !== "scheduled". */
  scoreHome?: number;
  scoreAway?: number;
  competitionLabel?: string;
  venueLabel?: string;
  /** Non-empty → "provisional" chip shown. */
  fallbackReasons?: string[];
};

// ── Issue #1 skeleton ───────────────────────────────────────────────────────

export type G5Issue1SlotState =
  | { kind: 'filled'; content: React.ReactNode }
  | { kind: 'pending'; objectiveLabel: string }
  | { kind: 'fallback'; reason: string };

export type G5Issue1Slots = {
  /** Image + Issue #1 numbering. */
  cover: G5Issue1SlotState;
  /** Handle / display name / archetype line. */
  identity: G5Issue1SlotState;
  /** Chips of selected hard refs. */
  footballScope: G5Issue1SlotState;
  /** FixtureCard list. */
  matchday: G5Issue1SlotState;
  /** Prediction recap OR pending TODO. */
  firstPick: G5Issue1SlotState;
  /** Rating recap OR optional fallback. */
  firstRating: G5Issue1SlotState;
  /** Optional Thought-on-publish OR fallback line. */
  firstTake: G5Issue1SlotState;
  /** Creators/squads followed OR pending. */
  follow: G5Issue1SlotState;
  /** Assistant manager line + share. */
  backCover: G5Issue1SlotState;
};

// ── Inbox objective view-model ─────────────────────────────────────────────

export type G5ObjectiveStatus = 'pending' | 'completed' | 'dismissed';

export type G5ObjectiveIntent = 'predict' | 'rate' | 'write' | 'follow' | 'publish';

export type G5InboxObjective = {
  id: string;
  /** Imperative title — "Make your first pick", not "First pick TODO". */
  title: string;
  /** Optional one-line context, no jargon. */
  body?: string;
  status: G5ObjectiveStatus;
  primaryAction?: {
    label: string;
    href?: string;
    intent: G5ObjectiveIntent;
  };
  /** Assistant copy when provided. */
  voiceFrame?: string;
  /** Deterministic fallback shown when no voiceFrame. */
  fallbackVoiceLine: string;
};

// ── Assistant Manager line keys (Lane D ships the library) ────────────────

export type G5MatchdayLineKey =
  | 'welcome'
  | 'pick-football'
  | 'pick-team-only'
  | 'make-first-pick'
  | 'rate-recent-match'
  | 'no-eligible-fixture'
  | 'publish-issue'
  | 'issue-published';
