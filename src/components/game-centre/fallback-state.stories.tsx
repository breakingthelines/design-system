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
        'LINEUPS_MISSING',
        'TIMELINE_MISSING',
        'RICH_ACTIONS_UNAVAILABLE',
        'LIVE_SCORE_STALE',
        'PROVIDER_OUTAGE',
        'UNRESOLVED_IDENTITY',
        'SETTLEMENT_PENDING',
        'RPC_NOT_AVAILABLE',
        'VIEWER_NOT_ELIGIBLE',
        'NO_ACTIVE_PREDICTION_LEAGUE',
        'NO_RATINGS_YET',
        'NO_THOUGHTS_YET',
        'LIST_RATINGS_RPC_PENDING',
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

export const PlatformExtensionMembersOnly = meta.story({
  name: 'Platform extension (members only)',
  args: { reason: 'VIEWER_NOT_ELIGIBLE' },
  render: (args) => (
    <div className="w-[420px]">
      <FallbackState {...args} />
    </div>
  ),
});

export const PlatformExtensionNoLeague = meta.story({
  name: 'Platform extension (no prediction league)',
  args: { reason: 'NO_ACTIVE_PREDICTION_LEAGUE' },
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
