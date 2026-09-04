import preview from '#.storybook/preview';

import { MetricCard } from './metric-card';

const meta = preview.meta({
  title: 'UI/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One number, named, with an optional movement and a footnote. The delta reads its own sign: a signed value colours itself, an unsigned one stays neutral. No chart lives inside the card.',
      },
    },
  },
  args: {
    label: 'Views',
    value: '12,340',
  },
});

export const Default = meta.story({
  args: {
    delta: '+12.4%',
    hint: 'vs last week',
  },
});

export const Directions = meta.story({
  name: 'Signed deltas',
  parameters: {
    docs: {
      description: {
        story:
          'Nothing here passes a tone. The sign in the delta decides, so a fall cannot come out green.',
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard label="Revenue" value="£8,240" delta="+12.4%" hint="vs last week" />
      <MetricCard label="Refunds" value="£310" delta="-4.1%" hint="vs last week" />
      <MetricCard label="Subscribers" value="1,204" delta="0" hint="vs last week" />
    </div>
  ),
});

export const InverseMetric = meta.story({
  name: 'Where up is bad',
  parameters: {
    docs: {
      description: {
        story:
          'Set higherIsBetter to false and a rise reads as the bad news it is. Both cards below moved up by the same amount.',
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard label="Subscribers" value="1,204" delta="+6%" hint="vs last week" />
      <MetricCard
        label="Bounce rate"
        value="38%"
        delta="+6%"
        higherIsBetter={false}
        hint="vs last week"
      />
    </div>
  ),
});

export const UnsignedDelta = meta.story({
  name: 'Unsigned delta and explicit tone',
  parameters: {
    docs: {
      description: {
        story:
          'Some metrics have no previous period to move against. An unsigned delta is neutral by default; pass deltaTone where the qualifier itself is the news.',
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <MetricCard
        label="Views"
        value="41,208"
        delta="over the last 7 days"
        hint="Article view starts"
      />
      <MetricCard label="Peak readers in an hour" value="612" delta="busiest hour" />
      <MetricCard label="Flags" value="4" delta="3 pending" deltaTone="negative" />
    </div>
  ),
});

export const ValueOnly = meta.story({
  name: 'Value only',
  parameters: {
    docs: {
      description: {
        story:
          'With no delta and no hint the footer is not drawn. An empty string counts as absent, so a card with nothing to report does not leave a coloured dot behind.',
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricCard label="Views" value="12,340" delta="" hint="" />
      <MetricCard label="Likes" value="864" delta="" hint="" />
      <MetricCard label="Thoughts" value="211" delta="" hint="" />
      <MetricCard label="Bookmarks" value="98" delta="" hint="" />
    </div>
  ),
});

export const Spacious = meta.story({
  name: 'Spacious density',
  parameters: {
    docs: {
      description: {
        story: 'More room around a small set of headline figures.',
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <MetricCard
        density="spacious"
        label="Gross revenue"
        value="£128,400"
        delta="+8.1%"
        hint="vs last month"
      />
      <MetricCard
        density="spacious"
        label="Net revenue"
        value="£112,900"
        delta="+7.4%"
        hint="vs last month"
      />
    </div>
  ),
});
