import {
  Article,
  VideoCamera,
  Microphone,
  Envelope,
  Image,
  Television,
  BookOpenUser,
  Scroll,
  FileText,
  Tag,
  Briefcase,
} from '@phosphor-icons/react';
import { userEvent, within } from 'storybook/test';

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

/** 14px outline icons at the fixed slot size the new NavDropdownPanel row
 *  spec calls for (Figma 2941-11302 / 3010-11985). */
const rowIconProps = { size: 14, weight: 'regular' as const };

/** Media + About tabs with real children — used by the dropdown-open stories
 *  below. Icon choices: Media = Television / Microphone / BookOpenUser
 *  (spec'd directly by the Figma ref). About = Scroll (Credo, i.e. a
 *  manifesto/scroll), FileText (Docs), Tag (Pricing), Envelope (Contact),
 *  Briefcase (Careers) — "Docs" is added here (5 items to match the 5
 *  suggested icons) even though it isn't in SiteNav's built-in `defaultTabs`;
 *  confirm with the user before wiring a real Docs link into the app tabs. */
const tabsWithDropdowns: NavTab[] = [
  { label: 'Home', href: '#' },
  { label: 'Thoughts', href: '#', active: true },
  {
    label: 'Media',
    children: [
      { label: 'BTL TV', href: '/tv', icon: <Television {...rowIconProps} /> },
      { label: 'BTL Podcasts', href: '/podcasts', icon: <Microphone {...rowIconProps} /> },
      {
        label: 'Zine',
        href: 'https://zine.breakingthelines.com',
        external: true,
        icon: <BookOpenUser {...rowIconProps} />,
      },
    ],
  },
  {
    label: 'About',
    children: [
      { label: 'Credo', href: '/credo', icon: <Scroll {...rowIconProps} /> },
      {
        label: 'Docs',
        href: 'https://docs.breakingthelines.com',
        external: true,
        icon: <FileText {...rowIconProps} />,
      },
      { label: 'Pricing', href: '/pricing', icon: <Tag {...rowIconProps} /> },
      { label: 'Contact', href: '/contact', icon: <Envelope {...rowIconProps} /> },
      { label: 'Careers', href: '/careers', icon: <Briefcase {...rowIconProps} /> },
    ],
  },
];

const composeItemsWithIcons = [
  {
    label: 'Article',
    href: 'https://studio.breakingthelines.com/compose/new',
    icon: <Article {...rowIconProps} />,
  },
  {
    label: 'Video',
    href: 'https://studio.breakingthelines.com/compose/new',
    icon: <VideoCamera {...rowIconProps} />,
  },
  {
    label: 'Podcast',
    href: 'https://studio.breakingthelines.com/compose/new',
    icon: <Microphone {...rowIconProps} />,
  },
  {
    label: 'Newsletter',
    href: 'https://studio.breakingthelines.com/compose/new',
    disabled: true,
    icon: <Envelope {...rowIconProps} />,
  },
  {
    label: 'Visuals',
    href: 'https://studio.breakingthelines.com/compose/new',
    disabled: true,
    icon: <Image {...rowIconProps} />,
  },
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
 *  (left of the avatar) and opens the shared NavDropdownPanel with a
 *  "Create Content" header, each row a 14px outline icon + 12px grey-500
 *  label. Newsletter and Visuals render disabled ("Soon"). Rendered only when
 *  `composeItems` is non-empty — the app supplies it once the user is
 *  authenticated. */
export const WithCompose = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    composeItems: composeItemsWithIcons,
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
    notificationCount: 3,
  },
});

/** Compose dropdown pinned open (via a hover play step) so the new flat
 *  grey-200 panel — "Create Content" header, 14px icon rows, red "Soon"
 *  badges on the disabled rows — can be reviewed without having to hover
 *  it yourself. */
export const ComposeDropdownOpen = meta.story({
  args: {
    tabs,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    composeItems: composeItemsWithIcons,
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [composeTrigger] = canvas.getAllByLabelText('Compose');
    await userEvent.hover(composeTrigger);
  },
});

/** Media tab dropdown pinned open — new shared panel with a "Media" section
 *  header and BTL TV / BTL Podcasts / Zine rows, each with a 14px icon. */
export const MediaDropdownOpen = meta.story({
  args: {
    tabs: tabsWithDropdowns,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Media' }));
  },
});

/** About tab dropdown pinned open — new shared panel with an "About" section
 *  header and five rows (Credo, Docs, Pricing, Contact, Careers), each with
 *  a 14px icon. */
export const AboutDropdownOpen = meta.story({
  args: {
    tabs: tabsWithDropdowns,
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    initials: 'ZL',
    onSearchClick: () => {},
    onNotificationsClick: () => {},
    onAvatarClick: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'About' }));
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

/** Logged-out / public header (unauthenticated). No compose (＋), bell, or
 *  avatar. The tabs sit left with the active one lit in the pill; the right
 *  side is TEXT controls — Search, Learn, Log in — followed by a solid-red
 *  "Sign Up" button (→ /register). Search is text here, not the icon used in
 *  the signed-in header. Story hrefs are inline placeholders; the app wires
 *  the real routes at ship time. */
export const LoggedOutPublic = meta.story({
  args: {
    tabs: [
      { label: 'Arena', href: '#', active: true },
      { label: 'Thoughts', href: '#' },
      { label: 'Media', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    onSearchClick: () => {},
    onLoginClick: () => {},
    learnHref: '/learn',
    signUpHref: '/register',
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
