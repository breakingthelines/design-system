import preview from '#.storybook/preview';

import { RatingDistributionBar } from './rating-distribution-bar';
import { EMPTY_RATING_COUNTS } from './rating-distribution';

const meta = preview.meta({
  title: 'UI/RatingDistributionBar',
  component: RatingDistributionBar,
  tags: ['autodocs'],
});

const sampleCounts = { 1: 12, 2: 18, 3: 9, 4: 4, 5: 2, 6: 1 };

export const Stacked = meta.story({
  name: 'Stacked (default)',
  render: () => (
    <div className="w-[420px]">
      <RatingDistributionBar counts={sampleCounts} meanValue={2.3} label="Bukayo Saka" />
    </div>
  ),
});

export const Grouped = meta.story({
  name: 'Grouped (per-bucket columns)',
  render: () => (
    <div className="w-[420px]">
      <RatingDistributionBar
        counts={sampleCounts}
        meanValue={2.3}
        label="Bukayo Saka"
        variant="grouped"
      />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Empty (no ratings yet)',
  render: () => (
    <div className="w-[420px]">
      <RatingDistributionBar counts={EMPTY_RATING_COUNTS} label="Unrated subject" />
    </div>
  ),
});
