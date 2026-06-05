/**
 * G5 First Touch primitives — render-only.
 *
 * All exports in this barrel are presentational: props in, JSX out, no
 * fetching, no router awareness, no global state. They are designed for
 * the Matchday-first onboarding flow, the Issue #1 preview/publish surface,
 * and the Inbox objective contract.
 *
 * Types and presentation utilities are co-exported so platform consumers
 * can pull the whole G5 surface from a single import:
 *
 *   import {
 *     FixtureCard,
 *     TeamRefCard,
 *     CompetitionRefCard,
 *     GameRoundRefCard,
 *     MatchdayFixtureStrip,
 *     Issue1Skeleton,
 *     Issue1CoverFallback,
 *     ISSUE1_SLOT_ORDER,
 *   } from '@breakingthelines/design-system';
 */

export { FixtureCard, formatKickoff, initialsFromLabel } from './fixture-card';
export type { FixtureCardProps } from './fixture-card';

export { RefCard, TeamRefCard, CompetitionRefCard, GameRoundRefCard } from './ref-card';
export type {
  RefCardBaseProps,
  TeamRefCardProps,
  CompetitionRefCardProps,
  GameRoundRefCardProps,
} from './ref-card';

export { MatchdayFixtureStrip, MATCHDAY_FIXTURE_STRIP_EMPTY_LINE } from './matchday-fixture-strip';
export type { MatchdayFixtureStripProps } from './matchday-fixture-strip';

// fixtures-hub family — the dense, status-driven score-row family powering the
// Football Home + "What's Happening" widget. Extends (does not replace) the
// FixtureCard tile family above.
export {
  FixtureRow,
  FixtureGroup,
  FixtureFilterBar,
  FixtureEngagementBadges,
  initialsFromFixtureLabel,
  isLateLive,
  formatFixtureTime,
} from './fixture-row';
export type {
  FixtureRowProps,
  FixtureRowData,
  FixtureRowStatus,
  FixtureRowDensity,
  FixtureEngagement,
  FixtureGroupProps,
  FixtureFilterBarProps,
  FixtureFilter,
} from './fixture-row';

export {
  WhatsHappeningPanel,
  groupFixturesByDate,
  WHATS_HAPPENING_EMPTY_LINE,
} from './whats-happening-panel';
export type { WhatsHappeningPanelProps, WhatsHappeningGroup } from './whats-happening-panel';

export { Issue1Skeleton, ISSUE1_SLOT_ORDER } from './issue1-skeleton';
export type { Issue1SkeletonProps } from './issue1-skeleton';

export {
  Issue1CoverFallback,
  computeCoverAccent,
  composeCoverHeadline,
} from './issue1-cover-fallback';
export type { Issue1CoverFallbackProps } from './issue1-cover-fallback';

export type {
  G5SubjectKind,
  G5SubjectRef,
  G5FixtureStatus,
  G5FixtureSide,
  G5FixtureCardData,
  G5Issue1SlotState,
  G5Issue1Slots,
  G5ObjectiveStatus,
  G5ObjectiveIntent,
  G5InboxObjective,
  G5MatchdayLineKey,
} from './types';
