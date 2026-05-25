import preview from '#.storybook/preview';

import { ComposerFromSourceCard } from './composer-from-source-card';

const meta = preview.meta({
  title: 'UI/ComposerFromSourceCard',
  component: ComposerFromSourceCard,
  tags: ['autodocs'],
});

const baseSignals = [
  { id: 's1', label: '+30% thoughts vs last week', tone: 'positive' as const },
  { id: 's2', label: 'Audience: Arsenal Squad', tone: 'neutral' as const },
];

export const FromOpportunity = meta.story({
  name: 'From opportunity',
  render: () => (
    <div className="w-[480px]">
      <ComposerFromSourceCard
        kind="opportunity"
        title="Saka conversation is heating up"
        summary="Your audience spent 22 minutes on Saka content this week."
        context="Arsenal Squad · Bukayo Saka"
        signals={baseSignals}
        sourceId="op_123"
        actions={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Compose draft
          </button>
        }
        secondaryActions={
          <button
            type="button"
            className="h-9 rounded border border-white/[0.12] bg-white/[0.04] px-3 text-sm text-white"
          >
            Dismiss
          </button>
        }
      />
    </div>
  ),
});

export const FromThought = meta.story({
  name: 'From thought (with preview)',
  render: () => (
    <div className="w-[480px]">
      <ComposerFromSourceCard
        kind="thought"
        title="Reader: Rice should drift higher on transitions"
        summary="A thought from your squad gathering reactions in the last 6 hours."
        context="Arsenal Squad · Declan Rice"
        sourceId="th_999"
        previewNode={
          <blockquote className="rounded border border-white/[0.12] bg-white/[0.04] p-3 text-sm text-white">
            &ldquo;Rice should drift higher when we have settled possession in the middle
            third.&rdquo;
          </blockquote>
        }
        actions={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Compose tactical reply
          </button>
        }
      />
    </div>
  ),
});

export const FromFixture = meta.story({
  name: 'From fixture',
  render: () => (
    <div className="w-[480px]">
      <ComposerFromSourceCard
        kind="fixture"
        title="Arsenal v Manchester United"
        summary="Kickoff in 18 hours. No preview written yet."
        context="Premier League · Sat 30 May"
        sourceId="fx_42"
        actions={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Compose preview
          </button>
        }
      />
    </div>
  ),
});

export const Minimal = meta.story({
  name: 'Minimal (no summary, no signals)',
  render: () => (
    <div className="w-[480px]">
      <ComposerFromSourceCard
        kind="other"
        title="Compose from something else"
        sourceId="src_001"
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
