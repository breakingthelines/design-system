import preview from '#.storybook/preview';

import { RatingScaleSlider } from './rating-scale-slider';

const meta = preview.meta({
  title: 'UI/RatingScaleSlider',
  component: RatingScaleSlider,
  tags: ['autodocs'],
});

export const Tiles = meta.story({
  name: 'Tiles (default)',
  render: () => (
    <div className="w-[420px]">
      <RatingScaleSlider eyebrow="Rate Bukayo Saka" defaultValue={2} variant="tiles" />
    </div>
  ),
});

export const TilesEmpty = meta.story({
  name: 'Tiles (no value)',
  render: () => (
    <div className="w-[420px]">
      <RatingScaleSlider eyebrow="Rate Bukayo Saka" variant="tiles" />
    </div>
  ),
});

export const Slider = meta.story({
  name: 'Slider variant',
  render: () => (
    <div className="w-[420px]">
      <RatingScaleSlider
        eyebrow="Rate Bukayo Saka"
        defaultValue={3}
        variant="slider"
        helpText="Lower is better. 1 = excellent, 6 = poor."
      />
    </div>
  ),
});

export const Disabled = meta.story({
  name: 'Disabled (rating window closed)',
  render: () => (
    <div className="w-[420px]">
      <RatingScaleSlider eyebrow="Rate Bukayo Saka" value={2} variant="tiles" disabled />
    </div>
  ),
});
