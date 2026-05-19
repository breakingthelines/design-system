/**
 * Story / test fixtures for the G5 primitives. Pure data, no imports from
 * presentational modules. Safe to use in both node-environment unit tests
 * and the browser storybook runner.
 *
 * NOTE: these are intentionally NOT exported from the package barrel. They
 * exist so stories and tests can stay in this directory without duplicating
 * realistic data inside every `.stories.tsx` file.
 */

import type {
  G5FixtureCardData,
  G5InboxObjective,
  G5Issue1Slots,
  G5SubjectRef,
} from './types';

export const teamRefArsenal: G5SubjectRef = {
  kind: 'team',
  id: 'team-arsenal',
  label: 'Arsenal',
  slug: 'arsenal',
  imageUrl:
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  accentColor: '#ef0107',
  secondaryLabel: 'Premier League',
  tertiaryLabel: 'London',
};

export const teamRefRealMadrid: G5SubjectRef = {
  kind: 'team',
  id: 'team-real-madrid',
  label: 'Real Madrid',
  slug: 'real-madrid',
  accentColor: '#ffffff',
  secondaryLabel: 'LaLiga',
  tertiaryLabel: 'Madrid',
};

export const competitionRefPremierLeague: G5SubjectRef = {
  kind: 'competition',
  id: 'comp-premier-league',
  label: 'Premier League',
  slug: 'premier-league',
  accentColor: '#3d195b',
  secondaryLabel: 'England',
  tertiaryLabel: 'Tier 1',
};

export const competitionRefChampionsLeague: G5SubjectRef = {
  kind: 'competition',
  id: 'comp-champions-league',
  label: 'UEFA Champions League',
  slug: 'champions-league',
  accentColor: '#1c2c5b',
  secondaryLabel: 'UEFA',
  tertiaryLabel: 'Continental',
};

export const gameRoundRefGameweek34: G5SubjectRef = {
  kind: 'game_round',
  id: 'round-pl-gw34',
  label: 'Gameweek 34',
  slug: 'pl-gw34',
  accentColor: '#3d195b',
  secondaryLabel: 'Premier League',
  tertiaryLabel: 'Apr 25 — Apr 28',
};

export const fixtureScheduledArsVMun: G5FixtureCardData = {
  kind: 'game',
  id: 'fixture-ars-mun',
  label: 'ARS v MUN',
  slug: 'ars-v-mun-2026-05-19',
  competitionLabel: 'Premier League · GW 34',
  venueLabel: 'Emirates Stadium',
  kickoffIso: '2026-05-19T19:30:00Z',
  status: 'scheduled',
  home: {
    label: 'Arsenal',
    accentColor: '#ef0107',
  },
  away: {
    label: 'Manchester United',
    accentColor: '#da291c',
  },
};

export const fixtureLiveMadridDerby: G5FixtureCardData = {
  kind: 'game',
  id: 'fixture-rmd-atm',
  label: 'RMA v ATM',
  slug: 'rma-v-atm-2026-05-19',
  competitionLabel: 'LaLiga · MD 36',
  venueLabel: 'Santiago Bernabéu',
  kickoffIso: '2026-05-19T20:00:00Z',
  status: 'live',
  scoreHome: 2,
  scoreAway: 1,
  home: { label: 'Real Madrid', accentColor: '#fff' },
  away: { label: 'Atlético Madrid', accentColor: '#ce1126' },
};

export const fixtureFinishedLivCity: G5FixtureCardData = {
  kind: 'game',
  id: 'fixture-liv-city',
  label: 'LIV v MCI',
  competitionLabel: 'Premier League · GW 33',
  kickoffIso: '2026-05-12T15:00:00Z',
  status: 'finished',
  scoreHome: 1,
  scoreAway: 2,
  home: { label: 'Liverpool', accentColor: '#c8102e' },
  away: { label: 'Manchester City', accentColor: '#6cabdd' },
};

export const fixtureProvisionalChelsea: G5FixtureCardData = {
  kind: 'game',
  id: 'fixture-che-tot',
  label: 'CHE v TOT',
  competitionLabel: 'Premier League · GW 35',
  kickoffIso: '2026-05-26T14:00:00Z',
  status: 'scheduled',
  fallbackReasons: ['Provider feed lagging'],
  home: { label: 'Chelsea', accentColor: '#034694' },
  away: { label: 'Tottenham Hotspur', accentColor: '#132257' },
};

export const sampleObjectives: G5InboxObjective[] = [
  {
    id: 'obj-first-pick',
    title: 'Make your first pick',
    body: 'Choose a winner for ARS v MUN on Saturday.',
    status: 'pending',
    primaryAction: { label: 'Pick', intent: 'predict' },
    fallbackVoiceLine: 'One prediction is enough to put a stake in the ground.',
  },
  {
    id: 'obj-first-rating',
    title: 'Rate a recent match',
    body: 'Score Madrid 2 — 1 Atlético out of ten.',
    status: 'pending',
    primaryAction: { label: 'Rate', intent: 'rate' },
    fallbackVoiceLine: 'Rate a recent match and the data starts to learn you.',
  },
];

export const issue1AllFilled: G5Issue1Slots = {
  cover: { kind: 'filled', content: 'COVER IMAGE PLACEHOLDER' },
  identity: { kind: 'filled', content: '@ando · Tactician' },
  footballScope: { kind: 'filled', content: 'Arsenal · Premier League · GW 34' },
  matchday: { kind: 'filled', content: 'Matchday strip placeholder' },
  firstPick: { kind: 'filled', content: 'Arsenal to win 2 — 0' },
  firstRating: { kind: 'filled', content: 'Madrid 2 — 1 Atlético · 7.4' },
  firstTake: { kind: 'filled', content: 'A line on the season.' },
  follow: { kind: 'filled', content: 'Following 4 voices' },
  backCover: { kind: 'filled', content: 'Share Issue #1' },
};

export const issue1MostlyPending: G5Issue1Slots = {
  cover: { kind: 'pending', objectiveLabel: 'Upload a cover or accept the branded fallback.' },
  identity: { kind: 'filled', content: '@ando' },
  footballScope: { kind: 'filled', content: 'Arsenal · Premier League' },
  matchday: { kind: 'pending', objectiveLabel: 'Waiting on the fixture window to load.' },
  firstPick: { kind: 'pending', objectiveLabel: 'Make a first pick on an upcoming fixture.' },
  firstRating: { kind: 'fallback', reason: 'No recent match to rate. Rate one after the weekend.' },
  firstTake: { kind: 'fallback', reason: 'Optional. Add a short take or leave it blank.' },
  follow: { kind: 'pending', objectiveLabel: 'Follow at least one voice from your scope.' },
  backCover: { kind: 'pending', objectiveLabel: 'Publish to unlock share links.' },
};

export const issue1Mixed: G5Issue1Slots = {
  cover: { kind: 'filled', content: 'COVER' },
  identity: { kind: 'filled', content: '@ando · Storyteller' },
  footballScope: { kind: 'filled', content: 'Arsenal' },
  matchday: { kind: 'filled', content: '3 fixtures lined up' },
  firstPick: { kind: 'pending', objectiveLabel: 'Pick the ARS v MUN winner.' },
  firstRating: { kind: 'filled', content: 'Madrid 2 — 1 Atlético · 8.0' },
  firstTake: { kind: 'filled', content: 'Why Arsenal still has it.' },
  follow: { kind: 'pending', objectiveLabel: 'Follow at least one voice.' },
  backCover: { kind: 'filled', content: 'Share Issue #1' },
};

export const issue1AllFallback: G5Issue1Slots = {
  cover: { kind: 'fallback', reason: 'Branded fallback selected. The press still runs.' },
  identity: { kind: 'fallback', reason: 'Display name will be set in profile later.' },
  footballScope: { kind: 'fallback', reason: 'Scope deferred. Pick at least one ref in settings.' },
  matchday: { kind: 'fallback', reason: 'No matches in window. Try the next gameweek.' },
  firstPick: { kind: 'fallback', reason: 'Submit later from the Inbox.' },
  firstRating: { kind: 'fallback', reason: 'Submit later from the Inbox.' },
  firstTake: { kind: 'fallback', reason: 'Optional. Add a take from any matchday surface.' },
  follow: { kind: 'fallback', reason: 'Follow voices from search at any time.' },
  backCover: { kind: 'fallback', reason: 'Sign-off line drawn from your scope.' },
};
