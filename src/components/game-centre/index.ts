/* ─────────────────────────────────────────────────────────────────────────────
 * Game Centre primitive barrel
 *
 * The 7 framework-agnostic primitives that back the G6 product-depth pass over
 * the verified game-service data spine. Originally authored under the platform
 * repo (`platform/app/components/game-centre/*`); promoted into the design
 * system at 0.3.0 so any consumer (platform, studio, mobile, future surfaces)
 * imports the same canonical shapes.
 *
 *   import {
 *     IdentityHeader,
 *     GameCentreTabRail,
 *     FallbackState,
 *     RatingSummary,
 *     PredictionSummary,
 *     TimelinePulse,
 *     GatedAction,
 *   } from '@breakingthelines/design-system';
 *
 * Each primitive is render-only: props in, JSX out. No fetching, no router
 * awareness, no auth-state assumptions. Router primitives swap in via the
 * existing `<LinkProvider>` context; auth flows swap in via `GatedAction`
 * callbacks (`onRequireAuth`) and slots (`signInCta`, `roleHint`).
 * ──────────────────────────────────────────────────────────────────────────── */

export { IdentityHeader } from './identity-header';
export type {
  IdentityHeaderProps,
  IdentityHeaderKind,
  IdentityHeaderState,
  IdentityHeaderSide,
  IdentityHeaderMeta,
  IdentityHeaderIdentity,
} from './identity-header';

export { GameCentreTabRail } from './game-centre-tab-rail';
export type { GameCentreTabRailProps, GameCentreTabItem } from './game-centre-tab-rail';

export { FallbackState } from './fallback-state';
export type { FallbackStateProps, FallbackReason } from './fallback-state';

export { RatingSummary } from './rating-summary';
export type { RatingSummaryProps, RatingClubAverage } from './rating-summary';

export { PredictionSummary } from './prediction-summary';
export type { PredictionSummaryProps, ActivePredictionLeagueRef } from './prediction-summary';

export { TimelinePulse } from './timeline-pulse';
export type {
  TimelinePulseProps,
  TimelinePulseEvent,
  TimelinePulseEventKind,
  TimelinePulseSide,
} from './timeline-pulse';

export { MatchTimeline, groupByPhase } from './match-timeline';
export type {
  MatchTimelineProps,
  MatchTimelineEvent,
  MatchTimelineEventKind,
  MatchTimelineSide,
} from './match-timeline';

export { MatchShell, MatchAdRail, MatchAdSlot, MatchRecapStrip } from './match-shell';
export type {
  MatchShellProps,
  MatchShellColumns,
  MatchAdRailProps,
  MatchAdSlotProps,
  MatchRecapStripProps,
  MatchRecapSide,
} from './match-shell';

export { GatedAction } from './gated-action';
export type { GatedActionProps, GatedRole, GatedActionMode } from './gated-action';

export { TeamStatsComparison, barSplit } from './team-stats-comparison';
export type {
  TeamStatsComparisonProps,
  TeamStatRow,
  TeamStatFormat,
} from './team-stats-comparison';

export { PlayerOfTheMatchCard } from './player-of-the-match-card';
export type { PlayerOfTheMatchCardProps } from './player-of-the-match-card';

export { MatchScorersStrip } from './match-scorers-strip';
export type { MatchScorersStripProps, MatchScorersSide, MatchScorer } from './match-scorers-strip';

export { RecentPerformanceStrip } from './recent-performance-strip';
export type {
  RecentPerformanceStripProps,
  RecentPerformanceEntry,
} from './recent-performance-strip';

export { CompetitionStandingsTable } from './competition-standings-table';
export type {
  CompetitionStandingsTableProps,
  CompetitionStandingsRow,
  CompetitionStandingsTeam,
} from './competition-standings-table';

export {
  EntityMetaChips,
  PLAYER_META_ICONS,
  MANAGER_META_ICONS,
  TEAM_META_ICONS,
} from './entity-meta-chips';
export type {
  EntityMetaChipsProps,
  EntityMetaChip,
  EntityMetaKind,
  PlayerMetaField,
  ManagerMetaField,
  TeamMetaField,
} from './entity-meta-chips';

export { EntityStatsSummary } from './entity-stats-summary';
export type {
  EntityStatsSummaryProps,
  EntityStatsSummaryHeader,
  EntityStatsMetric,
} from './entity-stats-summary';

export { RatingsReceivedCard } from './ratings-received-card';
export type { RatingsReceivedCardProps, RatingsReceivedOpponent } from './ratings-received-card';

export { AboutEntityGrid } from './about-entity-grid';
export type { AboutEntityGridProps } from './about-entity-grid';

export { MediaTile } from './media-tile';
export type { MediaTileProps } from './media-tile';

export { MatchDaySubTabs } from './match-day-sub-tabs';
export type { MatchDaySubTabsProps, MatchDaySubTabItem } from './match-day-sub-tabs';

export { MatchRatingCard } from './match-rating-card';
export type { MatchRatingCardProps } from './match-rating-card';

export { PredictionCountdownCard } from './prediction-countdown-card';
export type { PredictionCountdownCardProps, CountdownPhase } from './prediction-countdown-card';

export { PredictionPulseCard } from './prediction-pulse-card';
export type {
  PredictionPulseCardProps,
  PredictionPulse,
  PredictionPickSummary,
} from './prediction-pulse-card';

export { PredictionsHero } from './predictions-hero';
export type { PredictionsHeroProps, PredictionsHeroState } from './predictions-hero';

export { PredictionStakesBadge } from './prediction-stakes-badge';
export type { PredictionStakesBadgeProps } from './prediction-stakes-badge';

export { PredictionStandingCard } from './prediction-standing-card';
export type {
  PredictionStandingCardProps,
  PredictionStandingState,
  PredictionGwStatus,
} from './prediction-standing-card';

export { PredictionLifecycleRecap } from './prediction-lifecycle-recap';
export type {
  PredictionLifecycleRecapProps,
  PredictionLifecycleRecapCrowd,
  PredictionRecapRow,
  PredictionRecapFieldStatus,
} from './prediction-lifecycle-recap';

// Wave 6.25a — league-scoped Predictions sub-tab primitives.
export { PredictionLeagueSelector } from './prediction-league-selector';
export type {
  PredictionLeagueSelectorProps,
  PredictionLeagueSelectorOption,
  PredictionLeagueSelectorBrowse,
} from './prediction-league-selector';

export { PredictionLeaderboardPanel } from './prediction-leaderboard-panel';
export type {
  PredictionLeaderboardPanelProps,
  PredictionLeaderboardPanelEntry,
} from './prediction-leaderboard-panel';

export { GradeScale } from './grade-scale';
export type {
  GradeScaleProps,
  GradeScaleMode,
  GradeScaleAggregate,
  GradeScaleCounts,
} from './grade-scale';

export { VerticalGradeScale } from './vertical-grade-scale';
export type { VerticalGradeScaleProps } from './vertical-grade-scale';

export { TeamToggledPlayerGradeList } from './team-toggled-player-grade-list';
export type {
  TeamToggledPlayerGradeListProps,
  PlayerGradeRow,
} from './team-toggled-player-grade-list';

export { PlayerMultiSelectField } from './player-multi-select-field';
export type {
  PlayerMultiSelectFieldProps,
  PlayerMultiSelectOption,
} from './player-multi-select-field';

// MatchFormationGradeHero (Wave 6.4.5) was deleted in 0.23.0. The bespoke
// inline SVG pitch was redundant with `@breakingthelines/viz` `PlayerRatingBoard`
// and its formation_slot → coordinate mapping mishandled formations like
// "4-2-3-1". Consumers should swap to viz `PlayerRatingBoard` directly; see
// `viz-adapters.ts` `teamSheetToFormation` in the BTL platform for the
// proto → viz Formation projection.
