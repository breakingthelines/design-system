import preview from '#.storybook/preview';
import { FixtureCard } from './fixture-card';
import {
  fixtureFinishedLivCity,
  fixtureLiveMadridDerby,
  fixtureProvisionalChelsea,
  fixtureScheduledArsVMun,
} from './fixtures';

const meta = preview.meta({
  title: 'G5/FixtureCard',
  component: FixtureCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
  },
});

export const ScheduledCompact = meta.story({
  name: 'Scheduled (compact)',
  render: () => (
    <div className="w-[320px]">
      <FixtureCard data={fixtureScheduledArsVMun} variant="compact" />
    </div>
  ),
});

export const ScheduledFull = meta.story({
  name: 'Scheduled (full + venue)',
  render: () => (
    <div className="w-[420px]">
      <FixtureCard data={fixtureScheduledArsVMun} variant="full" />
    </div>
  ),
});

export const Live = meta.story({
  render: () => (
    <div className="w-[360px]">
      <FixtureCard data={fixtureLiveMadridDerby} variant="full" />
    </div>
  ),
});

export const Finished = meta.story({
  render: () => (
    <div className="w-[360px]">
      <FixtureCard data={fixtureFinishedLivCity} variant="compact" />
    </div>
  ),
});

export const ProvisionalChip = meta.story({
  name: 'Provisional (fallbackReasons)',
  render: () => (
    <div className="w-[420px]">
      <FixtureCard data={fixtureProvisionalChelsea} variant="full" />
    </div>
  ),
});

export const InteractiveRow = meta.story({
  name: 'Interactive (onClick)',
  render: () => (
    <div className="flex w-[420px] flex-col gap-3">
      <FixtureCard
        data={fixtureScheduledArsVMun}
        variant="compact"
        onClick={() => undefined}
      />
      <FixtureCard data={fixtureLiveMadridDerby} variant="compact" onClick={() => undefined} />
      <FixtureCard
        data={fixtureFinishedLivCity}
        variant="compact"
        onClick={() => undefined}
      />
    </div>
  ),
});
