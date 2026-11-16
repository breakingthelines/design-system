import * as React from 'react';

import preview from '#.storybook/preview';

import { BarChart } from './bar-chart';

const FORTNIGHT = [56, 88, 103, 140, 160, 200, 170, 155, 125, 149, 176, 165, 141, 107];

const DATED_LABELS = FORTNIGHT.map((value, index) => ({
  top: String(value),
  bottom: `Dec ${11 + index}`,
}));

const meta = preview.meta({
  title: 'UI/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One bar per bucket, with an optional two-line label under each. Pass the values, not pixel heights: the chart scales them to its own plot, and the track count follows the length of the array. Both bar tones are the foreground token mixed toward the panel, so the bars sit above a light surface and a dark one alike.',
      },
    },
  },
  args: {
    bars: FORTNIGHT,
    labels: DATED_LABELS,
  },
});

export const Default = meta.story({});

export const Selectable = meta.story({
  name: 'Pressable bars',
  parameters: {
    docs: {
      description: {
        story:
          'Pass onSelect and the bars become buttons, with the selected one lifted and its label brightened. Without it they are plain marks, because a bar that does nothing should not be in the tab order.',
      },
    },
  },
  render: function SelectableStory(args) {
    const [activeIndex, setActiveIndex] = React.useState(5);
    return (
      <BarChart
        {...args}
        activeIndex={activeIndex}
        onSelect={setActiveIndex}
        barLabel={(index) => `Dec ${11 + index}`}
      />
    );
  },
});

export const SevenBuckets = meta.story({
  name: 'A week',
  parameters: {
    docs: {
      description: {
        story: 'Seven values fill the plot, the same way fourteen or ninety do.',
      },
    },
  },
  args: {
    bars: [24, 31, 18, 44, 39, 12, 27],
    labels: [24, 31, 18, 44, 39, 12, 27].map((value, index) => ({
      top: String(value),
      bottom: `Day ${index + 1}`,
    })),
  },
});

export const EmptyWindow = meta.story({
  name: 'An empty window',
  parameters: {
    docs: {
      description: {
        story:
          'Every value is zero, so every bar is zero. A window with nothing in it is not scaled up to look full.',
      },
    },
  },
  args: {
    bars: [0, 0, 0, 0, 0, 0, 0],
    labels: undefined,
  },
});

export const Unlabelled = meta.story({
  name: 'No labels',
  args: { labels: undefined, height: 120 },
});

const STACK_DAYS = ['Dec 11', 'Dec 12', 'Dec 13', 'Dec 14', 'Dec 15', 'Dec 16', 'Dec 17'];
const STACK_SERIES = [
  { key: 'chat', label: 'Chat', values: [4.1, 5.3, 3.8, 6.2, 7.0, 2.4, 3.1] },
  { key: 'prompts', label: 'Article prompts', values: [1.2, 0.8, 1.6, 1.1, 2.3, 0.6, 0.9] },
  { key: 'eval', label: 'Eval', values: [0, 0, 2.5, 0, 0, 0, 2.5] },
];

export const Stacked = meta.story({
  name: 'Stacked',
  parameters: {
    docs: {
      description: {
        story:
          'Pass series instead of bars and each bar stacks one layer per series, the first at the foot. The bar is the bucket total; the legend names the layers.',
      },
    },
  },
  args: {
    bars: undefined,
    series: STACK_SERIES,
    labels: STACK_DAYS.map((day, index) => ({
      top: STACK_SERIES.reduce((sum, entry) => sum + entry.values[index], 0).toFixed(1),
      bottom: day,
    })),
  },
});
