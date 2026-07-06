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

/** Signed-in creator: a circular ＋ Compose control sits right of Notifications
 *  (left of the avatar) and opens an About-style menu of the content types you
 *  can create. Newsletter and Visual render disabled ("not ready yet"). Rendered
 *  only when `composeItems` is non-empty — the app supplies it once the user is
 *  authenticated. */
export const WithCompose = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    composeItems: [
      { label: 'Article', href: 'https://studio.breakingthelines.com/compose/new' },
      { label: 'Video', href: 'https://studio.breakingthelines.com/compose/new' },
      { label: 'Podcast', href: 'https://studio.breakingthelines.com/compose/new' },
      {
        label: 'Newsletter',
        href: 'https://studio.breakingthelines.com/compose/new',
        disabled: true,
      },
      { label: 'Visual', href: 'https://studio.breakingthelines.com/compose/new', disabled: true },
    ],
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
