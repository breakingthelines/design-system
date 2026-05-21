import preview from '#.storybook/preview';

import { TimelinePulse, type TimelinePulseEvent } from './timeline-pulse';

const meta = preview.meta({
  title: 'GameCentre/TimelinePulse',
  component: TimelinePulse,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['vertical', 'horizontal'],
    },
  },
});

const sampleEvents: readonly TimelinePulseEvent[] = [
  { id: '1', minute: "12'", minuteNumber: 12, kind: 'goal', label: 'Saka', detail: 'Arsenal 1 — 0', side: 'home' },
  { id: '2', minute: "31'", minuteNumber: 31, kind: 'yellow_card', label: 'Bruno Fernandes', side: 'away' },
  { id: '3', minute: 'HT', minuteNumber: 45, kind: 'half_time', label: 'Half time', detail: '1 — 0' },
  { id: '4', minute: "58'", minuteNumber: 58, kind: 'substitution', label: 'Trossard → Martinelli', side: 'home' },
  { id: '5', minute: "67'", minuteNumber: 67, kind: 'penalty_goal', label: 'Ødegaard', detail: 'Arsenal 2 — 0', side: 'home' },
  { id: '6', minute: "78'", minuteNumber: 78, kind: 'red_card', label: 'Casemiro', side: 'away' },
  { id: '7', minute: 'FT', minuteNumber: 90, kind: 'full_time', label: 'Full time', detail: '2 — 0' },
];

export const Default = meta.story({
  name: 'Vertical (full match)',
  args: { events: sampleEvents, variant: 'vertical' },
  render: (args) => (
    <div className="w-[520px]">
      <TimelinePulse {...args} />
    </div>
  ),
});

export const Horizontal = meta.story({
  name: 'Horizontal (header strip)',
  args: { events: sampleEvents, variant: 'horizontal' },
  render: (args) => (
    <div className="w-[640px]">
      <TimelinePulse {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no events)',
  args: { events: [] },
  render: (args) => (
    <div className="w-[520px]">
      <TimelinePulse {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Empty (provider outage)',
  args: { events: [], fallbackReason: 'PROVIDER_OUTAGE' },
  render: (args) => (
    <div className="w-[520px]">
      <TimelinePulse {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  name: 'Loading (skeleton)',
  render: () => (
    <div className="w-[520px] space-y-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="h-10 animate-pulse rounded-md bg-white/[0.04]"
        />
      ))}
    </div>
  ),
});

export const Limited = meta.story({
  name: 'Limited (top 3)',
  args: { events: sampleEvents, variant: 'vertical', limit: 3 },
  render: (args) => (
    <div className="w-[520px]">
      <TimelinePulse {...args} />
    </div>
  ),
});
