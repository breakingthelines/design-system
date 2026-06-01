import preview from '#.storybook/preview';

import { RecentPerformanceStrip, type RecentPerformanceEntry } from './recent-performance-strip';

const meta = preview.meta({
  title: 'GameCentre/RecentPerformanceStrip',
  component: RecentPerformanceStrip,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['ready', 'empty', 'loading'],
    },
  },
});

// Most recent first (left to right). Mirrors the Figma "Recent Match
// Performances" block; the best (lowest) value is highlighted as the peak.
const data: readonly RecentPerformanceEntry[] = [
  { value: 4.8, opponent: 'Liverpool', label: 'MD13', href: '/match/13' },
  { value: 4.3, opponent: 'Brighton', label: 'MD12', href: '/match/12' },
  { value: 4.6, opponent: 'Spurs', label: 'MD11', href: '/match/11' },
  { value: 4.6, opponent: 'Everton', label: 'MD10', href: '/match/10' },
  { value: 5.2, opponent: 'Wolves', label: 'MD9', href: '/match/9' },
  { value: 1.0, opponent: 'Man City', label: 'MD8', href: '/match/8' },
  { value: 3.4, opponent: 'Villa', label: 'MD7', href: '/match/7' },
  { value: 4.0, opponent: 'Fulham', label: 'MD6', href: '/match/6' },
  { value: 3.7, opponent: 'Newcastle', label: 'MD5', href: '/match/5' },
  { value: 3.9, opponent: 'Palace', label: 'MD4', href: '/match/4' },
  { value: 5.1, opponent: 'Leeds', label: 'MD3', href: '/match/3' },
  { value: 5.4, opponent: 'Forest', label: 'MD2', href: '/match/2' },
  { value: 4.7, opponent: 'Burnley', label: 'MD1', href: '/match/1' },
];

export const Default = meta.story({
  name: 'Ready (peak highlighted)',
  args: {
    data,
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[560px]">
      <RecentPerformanceStrip {...args} />
    </div>
  ),
});

export const ShortRun = meta.story({
  name: 'Ready (short run, no labels)',
  args: {
    data: [{ value: 2 }, { value: 3 }, { value: 1 }, { value: 4 }, { value: 2 }],
    state: 'ready',
  },
  render: (args) => (
    <div className="w-[360px]">
      <RecentPerformanceStrip {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no ratings yet)',
  args: {
    data: [],
    state: 'empty',
  },
  render: (args) => (
    <div className="w-[560px]">
      <RecentPerformanceStrip {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Empty (no data for season)',
  args: {
    data: [],
    state: 'empty',
    fallbackReason: 'NO_DATA_FOR_SEASON',
  },
  render: (args) => (
    <div className="w-[560px]">
      <RecentPerformanceStrip {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  args: {
    data: [],
    state: 'loading',
  },
  render: (args) => (
    <div className="w-[560px]">
      <RecentPerformanceStrip {...args} />
    </div>
  ),
});
