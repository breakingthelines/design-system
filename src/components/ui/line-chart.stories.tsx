import * as React from 'react';

import preview from '#.storybook/preview';

import { LineChart } from './line-chart';

const SERIES = [12, 18, 16, 24, 28, 36, 48, 62];

const DAYS = ['Dec 11', 'Dec 12', 'Dec 13', 'Dec 14', 'Dec 15', 'Dec 16', 'Dec 17', 'Dec 18'];

const meta = preview.meta({
  title: 'UI/LineChart',
  component: LineChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A smoothed series over a filled area, with an optional readout at one point. There is no axis and no grid: the shape of the series is what reads, and the figures belong beside it in a MetricCard. Stroke and fill are both derived from the foreground token, so the chart is legible on a light surface and a dark one.',
      },
    },
  },
  args: {
    series: SERIES,
    xLabels: DAYS,
  },
});

export const Default = meta.story({});

export const WithReadout = meta.story({
  name: 'With a readout',
  parameters: {
    docs: {
      description: {
        story:
          'A tooltip is two pieces of text the caller has already formatted. The dot marks the point it belongs to.',
      },
    },
  },
  args: {
    activeIndex: 6,
    tooltip: { title: '$2,250', subtitle: 'Earned' },
  },
});

export const Interactive = meta.story({
  name: 'Pointer selects a point',
  parameters: {
    docs: {
      description: {
        story:
          'With interactive set, the readout follows the pointer and a click reports the nearest index. Hold the selection yourself, as here, or leave activeIndex out and the chart keeps its own.',
      },
    },
  },
  render: function InteractiveStory(args) {
    const [activeIndex, setActiveIndex] = React.useState(6);
    return (
      <LineChart
        {...args}
        interactive
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        tooltip={{ title: `${SERIES[activeIndex]}k`, subtitle: DAYS[activeIndex] }}
      />
    );
  },
});

export const ThreeLabels = meta.story({
  name: 'First, middle and last',
  parameters: {
    docs: {
      description: {
        story:
          'The axis has as many tracks as it has labels, so a three-label axis spans the full width. A ninety-day window is read this way rather than by ninety dates.',
      },
    },
  },
  args: {
    series: Array.from({ length: 90 }, (_, index) => 40 + Math.round(30 * Math.sin(index / 7))),
    xLabels: ['Jun 1', 'Jul 16', 'Aug 30'],
  },
});

export const FlatSeries = meta.story({
  name: 'Nothing moved',
  parameters: {
    docs: {
      description: {
        story:
          'A series that never moves is drawn flat along the floor. The range is floored at 1, so a constant series cannot divide by zero.',
      },
    },
  },
  args: {
    series: [30, 30, 30, 30, 30, 30, 30, 30],
  },
});

export const Short = meta.story({
  name: 'Shorter plot',
  args: { height: 120, activeIndex: 3, tooltip: { title: '24', subtitle: 'Views' } },
});
