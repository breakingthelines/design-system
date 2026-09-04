import preview from '#.storybook/preview';

import { FullscreenLoader } from './fullscreen-loader';

const meta = preview.meta({
  title: 'UI/FullscreenLoader',
  component: FullscreenLoader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The whole viewport, while there is nothing yet to show: a session being resolved before a route can decide what to render, a shell booting. Anything loading inside a page that is already drawn wants a Skeleton in the shape of the thing arriving.',
      },
    },
  },
});

export const Default = meta.story({});

export const Labelled = meta.story({
  name: 'Named wait',
  parameters: {
    docs: {
      description: {
        story:
          'The label is announced, so name what is being waited on. This is the one call site the estate has today.',
      },
    },
  },
  args: { label: 'Loading session' },
});

export const Small = meta.story({
  name: 'Smaller spinner',
  args: { label: 'Loading session', size: 24 },
});
