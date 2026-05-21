import preview from '#.storybook/preview';

import { IdentityHeader } from './identity-header';

const meta = preview.meta({
  title: 'GameCentre/IdentityHeader',
  component: IdentityHeader,
  tags: ['autodocs'],
});

const arsenalSide = { label: 'Arsenal', shortLabel: 'ARS' };
const unitedSide = { label: 'Manchester United', shortLabel: 'MUN' };

export const Default = meta.story({
  name: 'Match (scheduled)',
  render: () => (
    <div className="w-[640px]">
      <IdentityHeader
        kind="match"
        state="scheduled"
        identity={{
          kind: 'match',
          home: arsenalSide,
          away: unitedSide,
        }}
        meta={{
          competitionLabel: 'Premier League',
          venueLabel: 'Emirates Stadium',
          kickoffIso: '2026-05-20T16:30:00Z',
        }}
      />
    </div>
  ),
});

export const MatchLive = meta.story({
  name: 'Match (live)',
  render: () => (
    <div className="w-[640px]">
      <IdentityHeader
        kind="match"
        state="live"
        identity={{
          kind: 'match',
          home: arsenalSide,
          away: unitedSide,
          scoreHome: 2,
          scoreAway: 1,
        }}
        meta={{
          competitionLabel: 'Premier League',
          venueLabel: 'Emirates Stadium',
          clockLabel: "78'",
        }}
      />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Entity (no image)',
  render: () => (
    <div className="w-[640px]">
      <IdentityHeader
        kind="player"
        state="not_applicable"
        identity={{ kind: 'entity', name: 'Bukayo Saka', secondary: 'Arsenal — Right Wing' }}
      />
    </div>
  ),
});

export const EntityWithImage = meta.story({
  name: 'Entity (player with image)',
  render: () => (
    <div className="w-[640px]">
      <IdentityHeader
        kind="player"
        state="not_applicable"
        identity={{
          kind: 'entity',
          name: 'Bukayo Saka',
          secondary: 'Arsenal — Right Wing',
          imageUrl: 'https://breakingthelines.com/placeholder-avatar.png',
        }}
      />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Unresolved identity',
  render: () => (
    <div className="w-[640px]">
      <IdentityHeader
        kind="player"
        state="not_applicable"
        unresolved
        identity={{ kind: 'entity', name: 'Unknown player' }}
      />
    </div>
  ),
});

export const Loading = meta.story({
  name: 'Loading (skeleton)',
  render: () => (
    <div className="w-[640px] space-y-3">
      <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
      <div className="h-24 animate-pulse rounded-md bg-white/[0.04]" />
      <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
    </div>
  ),
});
