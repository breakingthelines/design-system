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

export { GatedAction } from './gated-action';
export type { GatedActionProps, GatedRole, GatedActionMode } from './gated-action';
