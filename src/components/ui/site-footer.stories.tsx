import { expect, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';
import { SiteFooter } from './site-footer';

const meta = preview.meta({
  title: 'UI/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

export const Default = meta.story({
  args: {},
});

export const CustomLinks = meta.story({
  args: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles' },
      { label: 'Thoughts', href: '/thoughts' },
      { label: 'Media', href: '/media' },
    ],
    copyright: '© 2013–2026',
  },
});

/** Media submenu open: a flat panel with a hairline border, no accent line. */
export const SubmenuOpen = meta.story({
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Media' }));
    await expect(canvas.getByRole('button', { name: 'Media' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  },
});
