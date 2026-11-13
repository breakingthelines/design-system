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

/**
 * Hover opened the submenu and the click that followed closed it. A click on
 * a hover-opened menu now pins it: it stays open when the pointer leaves, and
 * a second click closes it.
 */
export const SubmenuHoverThenClick = meta.story({
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Media' });

    await userEvent.hover(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.unhover(trigger);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
});

/** Escape and a click outside both close a pinned submenu. */
export const SubmenuDismiss = meta.story({
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'About' });

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(canvasElement.ownerDocument.body);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
});

/** Enter and Space on the focused trigger toggle the submenu. */
export const SubmenuKeyboard = meta.story({
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'About' });

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard(' ');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
});
