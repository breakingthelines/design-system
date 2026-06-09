// Components
export * from './components/ui/alert-dialog';
export * from './components/ui/ambient-emitter';
export * from './components/ui/broken-lines-icon';
export * from './components/ui/btl-logo';
export * from './components/ui/btl-placeholder';
export * from './components/ui/audio-player';
export * from './components/ui/author-line';
export * from './components/ui/avatar';
export * from './components/ui/skeleton';
export * from './components/ui/reveal';
export * from './components/ui/avatar-stack';
export * from './components/ui/badge';
export * from './components/ui/button';
export * from './components/ui/card';
export * from './components/ui/collaborator-dropdown';
export * from './components/ui/collection-card';
export * from './components/ui/combobox';
export * from './components/ui/content-card';
// SearchEntityCard — exports SearchEntityCard, searchEntityCardVariants,
// entityKindLabel, and the SearchEntityCard* / SearchEntityKind types.
export * from './components/ui/search-entity-card';
export * from './components/ui/dialog';
export * from './components/ui/dropdown-menu';
export * from './components/ui/emoji-picker';
export * from './components/ui/engagement-bar';
export * from './components/ui/field';
export * from './components/ui/gif-picker';
export * from './components/ui/go-back';
export * from './components/ui/filter-bar';
export * from './components/ui/filter-modal';
export * from './components/ui/hero-card';
export * from './components/ui/icon-button';
export * from './components/ui/image';
export * from './components/ui/input-group';
export * from './components/ui/input';
export * from './components/ui/label';
export * from './components/ui/mini-editor/index';
export * from './components/ui/popover';
export * from './components/ui/profile-hero';
export * from './components/ui/profile-tabs';
export * from './components/ui/progress';
export * from './components/ui/section-header';
export * from './components/ui/select';
export * from './components/ui/sheet';
export * from './components/ui/separator';
export * from './components/ui/site-footer';
export * from './components/ui/site-nav';
export * from './components/ui/squad-role-badge';
export * from './components/ui/tabs';
export * from './components/ui/textarea';
export * from './components/ui/thought-body';
export * from './components/ui/thought-card';
export * from './components/ui/thought-comment';
export * from './components/ui/thought-composer';
export * from './components/ui/thoughts-panel';
export * from './components/ui/toggle';
export * from './components/ui/toggle-group';
export * from './components/ui/tooltip';
export * from './components/ui/user-pill';
export * from './components/ui/verified-badge';

// StatusDot
export { StatusDot, statusDotVariants, type StatusDotProps } from './components/ui/status-dot';

// ConnectionIndicator
export {
  ConnectionIndicator,
  connectionIndicatorVariants,
  type ConnectionIndicatorProps,
  type ConnectionStatus,
} from './components/ui/connection-indicator';

// Toast
export {
  ToastProvider,
  useToast,
  useToastContext,
  Toast,
  Toaster,
  type ToasterPosition,
  type ToasterProps,
  type ToastType,
  type ToastInput,
  type ToastVariant,
} from './components/ui/toast/index';

// Link context (router-agnostic navigation)
export {
  LinkProvider,
  useLinkComponent,
  type LinkComponent,
  type LinkProviderProps,
} from './components/ui/link-context';

// G5 First Touch primitives (render-only)
export * from './components/g5/index';

// G6 Game Centre primitives (render-only)
export {
  RatingScale,
  RATING_SCALE,
  ratingDescriptor,
  type RatingScaleValue,
  type RatingScaleDescriptor,
  type RatingScaleProps,
} from './components/ui/rating-scale';

export {
  RatingDistribution,
  EMPTY_RATING_COUNTS,
  ratingTotal,
  type RatingCounts,
  type RatingDistributionProps,
} from './components/ui/rating-distribution';

export { GradeBox, type GradeBoxProps, type GradeBoxSize } from './components/ui/grade-box';

export { MeanBox, type MeanBoxProps } from './components/ui/mean-box';

export {
  MatchHeader,
  formatMatchKickoff,
  initialsFromMatchLabel,
  type MatchHeaderProps,
  type MatchHeaderSide,
  type MatchHeaderVariant,
} from './components/ui/match-header';

export {
  ScoreboardChip,
  type ScoreboardChipProps,
  type ScoreboardChipStatus,
} from './components/ui/scoreboard-chip';

export {
  TabbedPage,
  readTabFromSearch,
  pushTabToSearch,
  type TabbedPageProps,
  type TabbedPageTab,
} from './components/ui/tabbed-page';

export {
  FallbackNotice,
  normaliseFallbackReason,
  type FallbackNoticeProps,
  type FallbackReasonKey,
  type FallbackReasonInput,
} from './components/ui/fallback-notice';

export {
  EntityPageShell,
  type EntityKind,
  type EntityPageShellMeta,
  type EntityPageShellProps,
} from './components/ui/entity-page-shell';

export {
  RatingLogRow,
  formatLogDate,
  initialsForLogSubject,
  type RatingLogRowProps,
} from './components/ui/rating-log-row';

export {
  PredictionPickCard,
  formatKickoffShort,
  type PredictionPickCardProps,
  type PredictionPickModule,
  type PredictionOutcomePick,
  type PredictionPickResult,
  type PredictionExactScore,
} from './components/ui/prediction-pick-card';

export {
  LeaderboardRow,
  initialsForMember,
  type LeaderboardRowProps,
} from './components/ui/leaderboard-row';

export {
  ContextSlot,
  type ContextSlotProps,
  type ContextSlotState,
} from './components/ui/context-slot';

// Beta Polish v0.4.0 primitives — Prediction League, Ratings Club, Studio cockpit, engagement ops, media
export {
  PredictionFormCard,
  type PredictionFormCardProps,
  type PredictionFormOutcome,
  type PredictionFormExactScore,
  type PredictionFormModule,
} from './components/ui/prediction-form-card';

export {
  PredictionLeaderboardTable,
  type PredictionLeaderboardTableProps,
  type PredictionLeaderboardEntry,
} from './components/ui/prediction-leaderboard-table';

export {
  RatingScaleSlider,
  type RatingScaleSliderProps,
} from './components/ui/rating-scale-slider';

export {
  RatingDistributionBar,
  type RatingDistributionBarProps,
} from './components/ui/rating-distribution-bar';

export {
  RatingsClubTable,
  type RatingsClubTableProps,
  type RatingsClubTableEntry,
} from './components/ui/ratings-club-table';

export {
  StudioCockpitSidebar,
  type StudioCockpitSidebarProps,
  type StudioCockpitSidebarItem,
  type StudioCockpitSidebarSection,
} from './components/ui/studio-cockpit-sidebar';

export {
  EngagementOpsHeader,
  type EngagementOpsHeaderProps,
  type EngagementOpsKpi,
  type EngagementOpsWindow,
} from './components/ui/engagement-ops-header';

export {
  OpportunityCard,
  type OpportunityCardProps,
  type OpportunityKind,
  type OpportunitySignal,
} from './components/ui/opportunity-card';

export {
  ExternalMediaPicker,
  type ExternalMediaPickerProps,
  type ExternalMediaKind,
} from './components/ui/external-media-picker';

export {
  ComposerFromSourceCard,
  type ComposerFromSourceCardProps,
  type ComposerSourceKind,
  type ComposerFromSourceSignal,
} from './components/ui/composer-from-source-card';

// G6 Game Centre composite primitives (promoted from platform 0.3.0)
export * from './components/game-centre/index';

// Types
export * from './types/content';
export * from './page-composition/index';

// Utilities
export * from './lib/format';
export * from './lib/image-presentation';
export * from './lib/render-mentions';
export * from './lib/entity-image';
export {
  ENTITY_IMAGERY_CDN_BASE,
  ENTITY_IMAGERY_SEED_MANIFEST,
} from './lib/entity-imagery-manifest';

// Hooks
export * from './hooks/index';

// Tokens
export * from './tokens/index';
