import preview from '#.storybook/preview';
import { FixtureCard } from './fixture-card';
import {
  fixtureFinishedLivCity,
  fixtureLiveMadridDerby,
  fixtureScheduledArsVMun,
  issue1AllFallback,
  issue1AllFilled,
  issue1Mixed,
  issue1MostlyPending,
} from './fixtures';
import { Issue1CoverFallback } from './issue1-cover-fallback';
import { Issue1Skeleton } from './issue1-skeleton';
import { MatchdayFixtureStrip } from './matchday-fixture-strip';

const meta = preview.meta({
  title: 'G5/Issue1Skeleton',
  component: Issue1Skeleton,
  tags: ['autodocs'],
});

export const AllFilled = meta.story({
  render: () => (
    <Issue1Skeleton
      slots={{
        ...issue1AllFilled,
        cover: {
          kind: 'filled',
          content: (
            <div className="w-full max-w-[260px]">
              <Issue1CoverFallback issueNumber={1} ownerHandle="ando" archetype="Tactician" />
            </div>
          ),
        },
        matchday: {
          kind: 'filled',
          content: (
            <MatchdayFixtureStrip
              fixtures={[fixtureScheduledArsVMun, fixtureLiveMadridDerby, fixtureFinishedLivCity]}
            />
          ),
        },
        firstPick: {
          kind: 'filled',
          content: (
            <div className="text-[14px] text-white/85">
              <span className="font-semibold text-white">Arsenal to win 2 — 0</span> over Manchester
              United, Sat 19 May.
            </div>
          ),
        },
        firstRating: {
          kind: 'filled',
          content: <FixtureCard data={fixtureLiveMadridDerby} variant="compact" />,
        },
      }}
      dateline="WED 19 MAY 2026"
      assistantLine="An Editor's edition — leave the bench, walk to the touchline."
    />
  ),
});

export const MixedFilledPending = meta.story({
  name: 'Mixed (filled + pending)',
  render: () => <Issue1Skeleton slots={issue1Mixed} dateline="WED 19 MAY 2026" />,
});

export const MostlyPending = meta.story({
  name: 'Brand-new user (mostly pending)',
  render: () => (
    <Issue1Skeleton
      slots={issue1MostlyPending}
      dateline="WED 19 MAY 2026"
      assistantLine="Lay down the plate. The print runs once you publish."
    />
  ),
});

export const AllFallback = meta.story({
  name: 'Worst case (all fallback)',
  render: () => (
    <Issue1Skeleton
      slots={issue1AllFallback}
      dateline="WED 19 MAY 2026"
      assistantLine="The branded fallback still ships. Add your own pieces from the Inbox."
    />
  ),
});
