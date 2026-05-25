import preview from '#.storybook/preview';

import { EngagementOpsHeader } from './engagement-ops-header';

const meta = preview.meta({
  title: 'UI/EngagementOpsHeader',
  component: EngagementOpsHeader,
  tags: ['autodocs'],
});

const baseKpis = [
  { id: 'readers', label: 'Readers', value: 1240, delta: 12, deltaUnit: 'percent' as const },
  { id: 'subs', label: 'Subscribers', value: 88, delta: 0 },
  { id: 'thoughts', label: 'Thoughts', value: 53, delta: -5 },
  { id: 'ratings', label: 'Ratings', value: 142, delta: 21, deltaUnit: 'percent' as const },
];

const windows = [
  { id: '7d', label: '7d', isActive: true },
  { id: '14d', label: '14d' },
  { id: '30d', label: '30d' },
];

export const Default = meta.story({
  render: () => (
    <div className="w-[840px]">
      <EngagementOpsHeader
        eyebrow="Engagement overview"
        title="Arsenal Squad"
        subtitle={<span>Last 7 days</span>}
        kpis={baseKpis}
        windows={windows}
      />
    </div>
  ),
});

export const EmptyMetric = meta.story({
  name: 'KPI with missing value',
  render: () => (
    <div className="w-[840px]">
      <EngagementOpsHeader
        eyebrow="Engagement overview"
        title="Arsenal Squad"
        kpis={[
          baseKpis[0],
          baseKpis[1],
          baseKpis[2],
          { id: 'ratings', label: 'Ratings', value: undefined },
        ]}
        windows={windows}
      />
    </div>
  ),
});

export const WithActions = meta.story({
  name: 'With action bar',
  render: () => (
    <div className="w-[840px]">
      <EngagementOpsHeader
        eyebrow="Engagement overview"
        title="Arsenal Squad"
        subtitle={<span>Last 30 days</span>}
        kpis={baseKpis}
        windows={[
          { id: '7d', label: '7d' },
          { id: '14d', label: '14d' },
          { id: '30d', label: '30d', isActive: true },
        ]}
        actions={
          <>
            <button
              type="button"
              className="h-9 rounded border border-white/[0.12] bg-white/[0.04] px-3 text-sm text-white"
            >
              Export CSV
            </button>
            <button
              type="button"
              className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </>
        }
      />
    </div>
  ),
});
