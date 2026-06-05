import preview from '#.storybook/preview';

import { MatchHeader } from './match-header';

const meta = preview.meta({
  title: 'UI/MatchHeader',
  component: MatchHeader,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['flat', 'photo'],
    },
    status: {
      control: 'select',
      options: ['scheduled', 'live', 'finished', 'postponed', 'cancelled'],
    },
  },
});

// A stadium atmosphere shot for the photo-hero variant.
const STADIUM_IMAGE =
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=60';

const arsenal = {
  label: 'Arsenal',
  shortLabel: 'ARS',
  standingLabel: '2nd in Premier League',
};

const chelsea = {
  label: 'Chelsea',
  shortLabel: 'CHE',
  standingLabel: '1st in Premier League',
};

export const PhotoHero = meta.story({
  name: 'Photo hero (finished)',
  args: {
    home: arsenal,
    away: chelsea,
    status: 'finished',
    variant: 'photo',
    backgroundImageUrl: STADIUM_IMAGE,
    scoreHome: 1,
    scoreAway: 2,
    competitionLabel: 'Premier League',
    venueLabel: 'Emirates Stadium',
    kickoffIso: '2026-05-19T19:00:00Z',
    xgHome: 0.25,
    xgAway: 1.25,
  },
  render: (args) => (
    <div className="w-[920px]">
      <MatchHeader {...args} />
    </div>
  ),
});

export const Flat = meta.story({
  name: 'Flat (finished)',
  args: {
    home: arsenal,
    away: chelsea,
    status: 'finished',
    variant: 'flat',
    scoreHome: 1,
    scoreAway: 2,
    competitionLabel: 'Premier League',
    venueLabel: 'Emirates Stadium',
    kickoffIso: '2026-05-19T19:00:00Z',
    xgHome: 0.25,
    xgAway: 1.25,
  },
  render: (args) => (
    <div className="w-[920px]">
      <MatchHeader {...args} />
    </div>
  ),
});

export const PhotoLive = meta.story({
  name: 'Photo hero (live clock)',
  args: {
    home: arsenal,
    away: chelsea,
    status: 'live',
    variant: 'photo',
    backgroundImageUrl: STADIUM_IMAGE,
    scoreHome: 1,
    scoreAway: 1,
    clockLabel: "67'",
    competitionLabel: 'Premier League',
    venueLabel: 'Emirates Stadium',
    xgHome: 0.9,
    xgAway: 0.8,
  },
  render: (args) => (
    <div className="w-[920px]">
      <MatchHeader {...args} />
    </div>
  ),
});

export const Scheduled = meta.story({
  name: 'Scheduled (kickoff time)',
  args: {
    home: arsenal,
    away: chelsea,
    status: 'scheduled',
    variant: 'flat',
    competitionLabel: 'Premier League',
    venueLabel: 'Emirates Stadium',
    kickoffIso: '2026-05-19T19:00:00Z',
  },
  render: (args) => (
    <div className="w-[920px]">
      <MatchHeader {...args} />
    </div>
  ),
});

export const PhotoFallsBackToFlat = meta.story({
  name: 'Photo requested, no image (degrades to flat)',
  args: {
    home: arsenal,
    away: chelsea,
    status: 'finished',
    variant: 'photo',
    scoreHome: 1,
    scoreAway: 2,
    competitionLabel: 'Premier League',
    venueLabel: 'Emirates Stadium',
  },
  render: (args) => (
    <div className="w-[920px]">
      <MatchHeader {...args} />
    </div>
  ),
});
