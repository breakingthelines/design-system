import preview from '#.storybook/preview';
import { SiteNav, type NavTab } from './site-nav';

const meta = preview.meta({
  title: 'UI/SiteNav',
  component: SiteNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

const tabs: NavTab[] = [
  { label: 'Home', href: '#', active: false },
  { label: 'Thoughts', href: '#', active: true },
  { label: 'Media', href: '#', active: false },
  { label: 'Contact', href: '#', active: false },
];

export const LoggedIn = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
  },
});

export const WithNotifications = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
    notificationCount: 3,
  },
});

export const LoggedOut = meta.story({
  args: {
    tabs: [
      { label: 'Home', href: '#', active: true },
      { label: 'Thoughts', href: '#' },
      { label: 'Media', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    onSearchClick: () => {},
    onLoginClick: () => {},
  },
});

/** Home / any route with no matching tab — the highlight pill rests hidden and
 *  only appears (fading in) while a tab is hovered. */
export const HomeNoActiveTab = meta.story({
  args: {
    tabs: [
      { label: 'Arena', href: '#' },
      { label: 'Thoughts', href: '#' },
      { label: 'Media', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    onSearchClick: () => {},
    onLoginClick: () => {},
  },
});

export const WithGoBack = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    avatarMenu: [
      { label: 'Profile', href: '#' },
      { label: 'Logout', onClick: () => {} },
    ],
    onGoBack: () => {},
  },
});
