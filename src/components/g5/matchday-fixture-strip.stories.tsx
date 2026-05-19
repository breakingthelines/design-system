import preview from '#.storybook/preview';
import { MatchdayFixtureStrip } from './matchday-fixture-strip';
import {
  fixtureFinishedLivCity,
  fixtureLiveMadridDerby,
  fixtureProvisionalChelsea,
  fixtureScheduledArsVMun,
} from './fixtures';

const meta = preview.meta({
  title: 'G5/MatchdayFixtureStrip',
  component: MatchdayFixtureStrip,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <div className="w-[720px]">
      <MatchdayFixtureStrip
        fixtures={[
          fixtureScheduledArsVMun,
          fixtureLiveMadridDerby,
          fixtureProvisionalChelsea,
          fixtureFinishedLivCity,
        ]}
      />
    </div>
  ),
});

export const Empty = meta.story({
  render: () => (
    <div className="w-[480px]">
      <MatchdayFixtureStrip fixtures={[]} />
    </div>
  ),
});

export const FullVariant = meta.story({
  name: 'Full variant (venue + provisional)',
  render: () => (
    <div className="w-[720px]">
      <MatchdayFixtureStrip
        fixtures={[fixtureScheduledArsVMun, fixtureProvisionalChelsea]}
        cardVariant="full"
      />
    </div>
  ),
});
