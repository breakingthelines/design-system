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
      { label: 'HOME', href: '/' },
      { label: 'ARTICLES', href: '/articles' },
      { label: 'THOUGHTS', href: '/thoughts' },
      { label: 'MEDIA', href: '/media' },
    ],
    copyright: '© 2013–2026',
  },
});
