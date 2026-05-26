import preview from '#.storybook/preview';

import { FallbackState } from './fallback-state';

const meta = preview.meta({
  title: 'GameCentre/FallbackState',
  component: FallbackState,
  tags: ['autodocs'],
  argTypes: {
    reason: {
      control: 'select',
      options: [
        // v0.3.0 originals
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
        // v0.15.0 Arena
        'FOLLOW_GRAPH_EMPTY',
        'NO_MOVES_PENDING',
        'USER_NOT_IN_SQUAD',
        // v0.15.0 Eligibility + Squad
        'VIEWER_NOT_ELIGIBLE',
        'PREDICTION_LEAGUE_NOT_FOUND',
        'RATINGS_CLUB_NOT_FOUND',
        'LEAGUE_NAME_TAKEN',
        'CLUB_NAME_TAKEN',
        'LEAGUE_NOT_STARTED',
        'NO_RESULTS_YET',
        // v0.15.0 Personal Ratings Log
        'RATING_LOG_PRIVATE',
        // v0.15.0 Game Centre
        'NO_DATA_FOR_SEASON',
        // v0.15.0 Studio cockpit
        'NO_CONTENT_YET',
        'INSIGHTS_NOT_YET_AVAILABLE',
        'DRAFT_NOT_FOUND',
        'EDIT_LOCKED',
        'SQUAD_NOT_FOUND',
        // v0.15.0 Studio engagement ops
        'NO_ENGAGEMENT_YET',
        'NO_OPPORTUNITIES_YET',
        'SOURCE_NOT_AVAILABLE',
        // v0.15.0 Studio media
        'EXTERNAL_URL_UNRESOLVED',
        'EXTERNAL_VIDEO_UNAVAILABLE',
        'EXTERNAL_PODCAST_UNAVAILABLE',
        'VISUAL_RENDERER_UNAVAILABLE',
        // v0.15.0 Match lifecycle
        'MATCH_NOT_STARTED',
        'LIVE_DATA_UNAVAILABLE',
        'MATCH_POSTPONED',
        'MATCH_CANCELLED',
        'MATCH_VOID',
        // v0.15.0 Rating window
        'RATING_NOT_YET_OPEN',
        'RATING_PERIOD_CLOSED',
        // v0.15.0 Prediction window
        'PREDICTION_LOCKED',
        'PREDICTION_NOT_YET_OPEN',
      ],
    },
    tone: {
      control: 'select',
      options: ['info', 'warn'],
    },
  },
});

export const Default = meta.story({
  args: { reason: 'NO_RATINGS_YET' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ProtoReasonLineupsMissing = meta.story({
  name: 'Proto reason (lineups missing)',
  args: { reason: 'LINEUPS_MISSING' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ProtoReasonProviderOutage = meta.story({
  name: 'Proto reason (provider outage)',
  args: { reason: 'PROVIDER_OUTAGE', tone: 'warn' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ArenaFollowGraphEmpty = meta.story({
  name: 'Arena (L1) — follow graph empty',
  args: { reason: 'FOLLOW_GRAPH_EMPTY' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ArenaNoMovesPending = meta.story({
  name: 'Arena (L1) — no moves pending',
  args: { reason: 'NO_MOVES_PENDING' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ViewerNotEligible = meta.story({
  name: 'Eligibility — viewer not eligible',
  args: { reason: 'VIEWER_NOT_ELIGIBLE' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ProtoReasonNoLeague = meta.story({
  name: 'Proto reason (no prediction league)',
  args: { reason: 'NO_ACTIVE_PREDICTION_LEAGUE' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const PredictionLeagueNotStarted = meta.story({
  name: 'Prediction League (L4) — not started',
  args: { reason: 'LEAGUE_NOT_STARTED' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const RatingLogPrivate = meta.story({
  name: 'Personal Ratings Log (L3) — private',
  args: { reason: 'RATING_LOG_PRIVATE' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const NoDataForSeason = meta.story({
  name: 'Game Centre (L2) — no data for season',
  args: { reason: 'NO_DATA_FOR_SEASON' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const StudioInsightsNotYetAvailable = meta.story({
  name: 'Studio cockpit (L6) — insights not yet available',
  args: { reason: 'INSIGHTS_NOT_YET_AVAILABLE' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const StudioEditLocked = meta.story({
  name: 'Studio cockpit (L6) — edit locked',
  args: { reason: 'EDIT_LOCKED', tone: 'warn' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const NoOpportunitiesYet = meta.story({
  name: 'Studio engagement (L7) — no opportunities yet',
  args: { reason: 'NO_OPPORTUNITIES_YET' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const ExternalVideoUnavailable = meta.story({
  name: 'Studio media (L8) — external video unavailable',
  args: { reason: 'EXTERNAL_VIDEO_UNAVAILABLE', tone: 'warn' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const MatchPostponed = meta.story({
  name: 'Match lifecycle (L2) — postponed',
  args: { reason: 'MATCH_POSTPONED', tone: 'warn' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const PredictionLocked = meta.story({
  name: 'Prediction window (L4) — locked',
  args: { reason: 'PREDICTION_LOCKED' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const RatingPeriodClosed = meta.story({
  name: 'Rating window (L5) — closed',
  args: { reason: 'RATING_PERIOD_CLOSED' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const WithCta = meta.story({
  name: 'With CTA',
  args: {
    reason: 'NO_RATINGS_YET',
    cta: (
      <button
        type="button"
        className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
      >
        Rate this match
      </button>
    ),
  },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});
