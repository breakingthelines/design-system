import preview from '#.storybook/preview';

import { PredictionFormCard } from './prediction-form-card';

const meta = preview.meta({
  title: 'UI/PredictionFormCard',
  component: PredictionFormCard,
  tags: ['autodocs'],
});

const KICKOFF = '2026-05-30T14:00:00Z';

export const Empty = meta.story({
  name: 'Empty form (open window)',
  render: () => (
    <div className="w-[480px]">
      <PredictionFormCard
        matchLabel="Arsenal v Manchester United"
        kickoffIso={KICKOFF}
        contextLabel="Premier League Predictor"
      />
    </div>
  ),
});

export const Filled = meta.story({
  name: 'Outcome + exact score picked',
  render: () => (
    <div className="w-[480px]">
      <PredictionFormCard
        matchLabel="Arsenal v Manchester United"
        kickoffIso={KICKOFF}
        contextLabel="Premier League Predictor"
        outcomePick="home"
        exactScore={{ home: 2, away: 1 }}
      />
    </div>
  ),
});

export const WithModules = meta.story({
  name: 'With custom modules',
  render: () => (
    <div className="w-[480px]">
      <PredictionFormCard
        matchLabel="Arsenal v Manchester United"
        kickoffIso={KICKOFF}
        contextLabel="Premier League Predictor"
        outcomePick="home"
        exactScore={{ home: 2, away: 1 }}
        modules={[
          {
            id: 'top-scorer',
            label: 'Top scorer',
            control: (
              <input
                type="text"
                placeholder="Saka"
                className="h-9 w-full rounded border border-white/[0.12] bg-white/[0.04] px-2 text-sm text-white"
              />
            ),
            helpText: '+2 points for a correct top scorer.',
          },
          {
            id: 'btts',
            label: 'Both teams to score?',
            control: (
              <select className="h-9 w-full rounded border border-white/[0.12] bg-white/[0.04] px-2 text-sm text-white">
                <option>Yes</option>
                <option>No</option>
              </select>
            ),
          },
        ]}
        footer={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Lock in picks
          </button>
        }
      />
    </div>
  ),
});

export const Disabled = meta.story({
  name: 'Disabled (submitting)',
  render: () => (
    <div className="w-[480px]">
      <PredictionFormCard
        matchLabel="Arsenal v Manchester United"
        kickoffIso={KICKOFF}
        contextLabel="Premier League Predictor"
        outcomePick="draw"
        exactScore={{ home: 1, away: 1 }}
        disabled
      />
    </div>
  ),
});
