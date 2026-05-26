import preview from '#.storybook/preview';

import { OpportunityCard } from './opportunity-card';

const meta = preview.meta({
  title: 'UI/OpportunityCard',
  component: OpportunityCard,
  tags: ['autodocs'],
});

const baseSignals = [
  { id: 'sub', label: '+12% subs week-on-week', tone: 'positive' as const },
  { id: 'aud', label: 'Audience: Arsenal Squad', tone: 'neutral' as const },
];

export const Default = meta.story({
  render: () => (
    <div className="w-[420px]">
      <OpportunityCard
        kind="trending_subject"
        title="Saka conversation is heating up"
        summary="Your audience has spent 22 minutes on Saka-tagged content this week."
        score={82}
        context="Arsenal Squad · Bukayo Saka"
        signals={baseSignals}
        agoLabel="2h ago"
        actions={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Compose draft
          </button>
        }
      />
    </div>
  ),
});

export const NoScore = meta.story({
  name: 'No score (no priority chip)',
  render: () => (
    <div className="w-[420px]">
      <OpportunityCard
        kind="audience_question"
        title="Three readers asked about Saka's set-piece role"
        summary="No live answer in your squad. A short explainer is overdue."
        context="Arsenal Squad"
        agoLabel="1h ago"
        actions={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Compose draft
          </button>
        }
      />
    </div>
  ),
});

export const Interactive = meta.story({
  name: 'Whole card is interactive (onSelect)',
  render: () => (
    <div className="w-[420px]">
      <OpportunityCard
        kind="rating_spike"
        title="Rice ratings dropped 1.4 in 24h"
        summary="Likely audience appetite for a tactical explainer."
        score={68}
        context="Arsenal Squad · Declan Rice"
        signals={[
          { id: 'rt', label: 'Mean: 3.6 → 5.0', tone: 'warning' },
          { id: 'pool', label: '128 ratings', tone: 'neutral' },
        ]}
        agoLabel="24h ago"
        onSelect={() => {
          /* navigate */
        }}
      />
    </div>
  ),
});

export const LowPriority = meta.story({
  name: 'Low priority chip',
  render: () => (
    <div className="w-[420px]">
      <OpportunityCard
        kind="editorial_gap"
        title="Match preview unwritten"
        summary="Kickoff in 18 hours."
        score={28}
        context="Arsenal v Manchester United"
        signals={[{ id: 'gap', label: 'No preview yet', tone: 'warning' }]}
        agoLabel="3h ago"
      />
    </div>
  ),
});
