'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useSpring,
  useVelocity,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { UserCircle, Hammer, SignOut, Lightbulb, CaretDown } from '@phosphor-icons/react';

import { BtlWordmark } from '#/components/ui/btl-logo';
import { cn } from '#/lib/utils';
import { BrokenLinesIcon } from '#/components/ui/broken-lines-icon';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { GoBack } from '#/components/ui/go-back';
import { motion as motionTokens } from '#/tokens/motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/ui/dropdown-menu';

export interface NavTab {
  label: string;
  /** Link target. Optional when the tab has children (acts as dropdown trigger only). */
  href?: string;
  active?: boolean;
  /** Optional section header shown at the top of this tab's dropdown (12px
   *  Inter Medium, dimmed grey-500/70 — same style as the compose/Account
   *  headers). Omit for a headerless dropdown. */
  menuHeader?: string;
  /** Sub-items rendered as a hover dropdown on desktop, inline on mobile */
  children?: {
    label: string;
    href: string;
    /** Opens in new tab (for external links like Zine) */
    external?: boolean;
    /** Leading glyph for the row (e.g. a Phosphor icon element). The host owns
     *  icon choice/weight/size — SiteNav renders it as-is at a fixed 14px slot.
     *  Ignored when `description` is set (title+description rows have no icon). */
    icon?: React.ReactNode;
    /** When set, the row renders as a taller title (the `label`) + description
     *  block instead of an icon + label row — the About-menu layout (Figma
     *  3010-12052). Takes precedence over `icon`. */
    description?: string;
  }[];
}

export interface AvatarMenuItem {
  label: string;
  /** Link href */
  href?: string;
  /** Click handler (for actions like logout) */
  onClick?: () => void;
  /** Opens in new tab (for external links like Studio) */
  external?: boolean;
}

export interface ComposeItem {
  /** Human label for the content type (e.g. "Article"). */
  label: string;
  /** Link target for creating this content type (e.g. a Studio compose URL). */
  href: string;
  /** Rendered greyed-out and non-interactive — e.g. a content type not yet available. */
  disabled?: boolean;
  /** Leading glyph for the row (e.g. a Phosphor icon element). The host owns
   *  icon choice/weight/size — SiteNav renders it as-is at a fixed slot size. */
  icon?: React.ReactNode;
}

interface SiteNavProps extends React.ComponentProps<'header'> {
  /** Navigation tabs */
  tabs?: NavTab[];
  /** Current user avatar URL (shows avatar when set, login button when not) */
  avatarUrl?: string;
  /** Current user initials for avatar fallback */
  initials?: string;
  /** Search click handler */
  onSearchClick?: () => void;
  /** When non-empty, renders a Compose control in the actions cluster (right
   *  of Notifications, left of the avatar) that opens an About-style dropdown
   *  of the content types you can create, each linking to its `href`.
   *  `disabled` items render greyed-out and non-interactive. Desktop shows a
   *  "Create" text pill (Figma 719-5697); mobile keeps the compact circular
   *  ＋ trigger. Omit / empty to hide it; the consumer gates visibility
   *  (typically only when signed in). */
  composeItems?: ComposeItem[];
  /** Notifications click handler (used as fallback when notificationPopover is not set) */
  onNotificationsClick?: () => void;
  /** @deprecated Use avatarMenu instead */
  onAvatarClick?: () => void;
  /** Dropdown menu items shown on avatar hover (legacy uppercase menu).
   *  Superseded by the Account dropdown when `profileHref`/`studioHref`/
   *  `onLogout` are supplied. */
  avatarMenu?: AvatarMenuItem[];
  /** Account dropdown (Figma 3009-11910) — when logged in, hovering the avatar
   *  opens an "Account" menu (shared NavDropdownPanel icon+label style) with
   *  Profile / Studio / Log out rows. Supply any of these to enable it (it
   *  takes precedence over `avatarMenu`). */
  profileHref?: string;
  /** Account dropdown: Studio row target (opens in a new tab). */
  studioHref?: string;
  /** Account dropdown: Log out action (renders the "Log out" button row). */
  onLogout?: () => void;
  /** Login click handler (shown when no avatarUrl) — renders the "Log in"
   *  text control in the logged-out (public) actions cluster. */
  onLoginClick?: () => void;
  /** Docs/guides destination, shared by both auth states (Figma 719-5697):
   *  logged-out renders a "Learn" text link in the public actions cluster;
   *  logged-in renders a lightbulb icon in the signed-in actions cluster
   *  (desktop only — mobile already reaches it via the hamburger's About >
   *  Learn row). Omit to hide both. */
  learnHref?: string;
  /** When set (and logged out), renders the solid-red "Sign Up" button in the
   *  public actions cluster pointing here (e.g. `/register`). Omit to hide it. */
  signUpHref?: string;
  /** Notification count badge */
  notificationCount?: number;
  /** Popover content shown on bell hover (desktop) / click (mobile).
   *  When provided, replaces the simple onNotificationsClick behavior. */
  notificationPopover?: React.ReactNode;
  /** URL the logo links to (default: '/') */
  logoHref?: string;
  /** Logo render prop */
  logo?: React.ReactNode;
  /** When set, renders a Go-back button in row 1 col 1. Omit to hide the back slot. */
  onGoBack?: () => void;
  /** Label for the Go-back button (default: "Go back"). */
  goBackLabel?: string;
}

const defaultTabs: NavTab[] = [
  { label: 'Home', href: '/' },
  { label: 'Thoughts', href: '/thoughts' },
  {
    label: 'Media',
    menuHeader: 'Watch & Listen',
    children: [
      { label: 'BTL TV', href: '/tv' },
      { label: 'BTL Podcasts', href: '/podcasts' },
      { label: 'Zine', href: 'https://zine.breakingthelines.com', external: true },
    ],
  },
  {
    label: 'About',
    children: [
      { label: 'Credo', href: '/credo' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
    ],
  },
];

function getNavTabKey(tab: NavTab): string {
  return `${tab.label}:${tab.href ?? ''}`;
}

function getNavChildKey(child: NonNullable<NavTab['children']>[number]): string {
  return `${child.label}:${child.href}`;
}

/** Search icon matching Figma spec — Material-style magnifying glass */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M15.5 14H14.71L14.43 13.73C15.527 12.452 16.086 10.8 15.99 9.119C15.893 7.438 15.15 5.859 13.915 4.715C12.68 3.571 11.05 2.949 9.366 2.981C7.683 3.013 6.077 3.696 4.887 4.887C3.696 6.077 3.013 7.683 2.981 9.366C2.949 11.05 3.571 12.68 4.715 13.915C5.859 15.15 7.438 15.893 9.119 15.99C10.8 16.086 12.452 15.527 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C8.61 14 7.74 13.736 7 13.242C6.26 12.747 5.683 12.044 5.343 11.222C5.002 10.4 4.913 9.495 5.086 8.622C5.26 7.749 5.689 6.947 6.318 6.318C6.947 5.689 7.749 5.26 8.622 5.086C9.495 4.913 10.4 5.002 11.222 5.343C12.044 5.683 12.747 6.26 13.242 7C13.736 7.74 14 8.61 14 9.5C14.001 10.091 13.885 10.677 13.659 11.223C13.433 11.769 13.102 12.266 12.684 12.684C12.266 13.102 11.769 13.433 11.223 13.659C10.677 13.885 10.091 14.001 9.5 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Notification slot icon — Material-style inbox glyph. The slot still
 * routes to the notification dropdown / Inbox surface; the bell glyph
 * read as "alerts" but BTL's notification surface IS the Inbox, so the
 * tray better matches the destination.
 */
function NotificationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M19 3H5c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h14c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H5V5h14v10z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Small spring "pop" wrapper for the action-cluster glyphs (Search /
 * Notifications) — a quick scale + tilt/lift on hover so the cluster feels
 * alive on interaction, not just a color swap (owner ask, alongside the
 * lightbulb's red/fill hover further down). Deliberately a single-target
 * spring (not a multi-step keyframe wiggle) so the held-hover frame is a
 * clean, deliberate pose rather than a mid-wiggle blur. Respects
 * `reduceMotion` — the whole pop is skipped, not just softened.
 */
function IconPop({
  children,
  hover,
  reduceMotion,
}: {
  children: React.ReactNode;
  hover: { scale: number; rotate?: number; y?: number };
  // useReducedMotion() is `boolean | null` (null before the media query
  // resolves) — accept both rather than coercing at every call site.
  reduceMotion: boolean | null;
}) {
  return (
    <motion.span
      className="flex"
      whileHover={reduceMotion ? undefined : hover}
      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      transition={motionTokens.spring.pop}
    >
      {children}
    </motion.span>
  );
}

/** Spring carrying the highlight pill's position + width — a fluid, slightly
 *  bouncy glide that the velocity-driven stretch below rides on. */
const PILL_SPRING = { stiffness: 320, damping: 26, mass: 1 };
const OPACITY_SPRING = { stiffness: 320, damping: 32 };

/**
 * Displacement map for the liquid-glass refraction: R encodes horizontal
 * offset (black→red left→right), G encodes vertical (black→green top→bottom),
 * screened together. feDisplacementMap reads R/G to bend the backdrop like a
 * lens. Built with encodeURIComponent so the data URI is always valid.
 */
const DISPLACEMENT_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>" +
  "<defs><linearGradient id='gx' x1='0' x2='1'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#f00'/></linearGradient>" +
  "<linearGradient id='gy' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#0f0'/></linearGradient></defs>" +
  "<rect width='100' height='100' fill='url(#gx)'/>" +
  "<rect width='100' height='100' fill='url(#gy)' style='mix-blend-mode:screen'/></svg>";
const DISPLACEMENT_MAP = `data:image/svg+xml,${encodeURIComponent(DISPLACEMENT_SVG)}`;

/**
 * Apple "liquid glass" material for the active pill: a translucent tint, a
 * blurred + refracted + saturated backdrop, and a stack of inset shadows that
 * fake the glass bevel (bright rim-light top-left, dark inner shadow bottom).
 * The url(#…) refraction is Chrome/Edge-only; -webkit falls back to blur-only.
 */
const GLASS_PILL: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.10)',
  backdropFilter: 'blur(8px) url(#nav-liquid-glass) saturate(150%)',
  WebkitBackdropFilter: 'blur(8px) saturate(150%)',
  boxShadow: [
    'inset 0 0 0 1px rgba(255,255,255,0.08)',
    'inset 1.8px 1px 0 -1px rgba(255,255,255,0.55)',
    'inset -1.5px -1px 0 -1px rgba(255,255,255,0.45)',
    'inset -2px -6px 1px -5px rgba(255,255,255,0.35)',
    'inset -1px 2px 3px -1px rgba(0,0,0,0.45)',
    'inset 0 -4px 2px -2px rgba(0,0,0,0.25)',
    '0 3px 8px 0 rgba(0,0,0,0.40)',
  ].join(', '),
};

const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Drives a single highlight pill that glides between nav tabs. The pill sits on
 * whichever tab is `litIndex` (hovered, falling back to the active route). While
 * travelling it stretches with the spring's velocity and squashes vertically —
 * the gooey "liquid glass" morph — then settles to rest on the target tab. When
 * `litIndex` is null (e.g. Home, no tab active and nothing hovered) it fades out.
 */
function useNavHighlight(litIndex: number | null, revision: string) {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLElement | null>>([]);
  const mounted = useRef(false);

  const x = useSpring(0, PILL_SPRING);
  const width = useSpring(0, PILL_SPRING);
  const opacity = useSpring(0, OPACITY_SPRING);
  const velocity = useVelocity(x);
  // |horizontal velocity| → stretch; vertical squash keeps the volume honest.
  // Sensitive curve (saturates ~600px/s) so even an adjacent-tab hop reads gooey.
  const scaleX = useTransform(velocity, [-600, 0, 600], [1.22, 1, 1.22], { clamp: true });
  const scaleY = useTransform(scaleX, (s) => 1 - (s - 1) * 0.7);
  // Anchor the stretch to the trailing edge so the pill is "pulled" toward the
  // target (moving right → grow from the left), matching the reference.
  const transformOrigin = useTransform(velocity, (v) => (v >= 0 ? 'left center' : 'right center'));

  const measure = useCallback(
    (animate: boolean) => {
      const nav = navRef.current;
      const el = litIndex == null ? null : tabRefs.current[litIndex];
      if (!nav || !el) {
        if (animate && mounted.current) opacity.set(0);
        else opacity.jump(0);
        return;
      }
      const navBox = nav.getBoundingClientRect();
      const tabBox = el.getBoundingClientRect();
      const left = tabBox.left - navBox.left;
      // Jump (no tween) on first paint / fade-in / reduced-motion; otherwise glide.
      const instant = !animate || !mounted.current || opacity.get() === 0 || reduceMotion;
      if (instant) {
        x.jump(left);
        width.jump(tabBox.width);
      } else {
        x.set(left);
        width.set(tabBox.width);
      }
      if (mounted.current) opacity.set(1);
      else opacity.jump(1);
    },
    [litIndex, reduceMotion, x, width, opacity]
  );

  useIsoLayoutEffect(() => {
    measure(true);
    mounted.current = true;
  }, [measure, revision]);

  useIsoLayoutEffect(() => {
    const onResize = () => measure(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  const setTabRef = (index: number) => (el: HTMLElement | null) => {
    tabRefs.current[index] = el;
  };

  const pillStyle = {
    x,
    width,
    opacity,
    scaleX: reduceMotion ? 1 : scaleX,
    scaleY: reduceMotion ? 1 : scaleY,
    transformOrigin: reduceMotion ? 'center center' : transformOrigin,
  };

  return { navRef, setTabRef, pillStyle };
}

/** A single row rendered by {@link NavDropdownPanel} — the shape both the
 *  compose menu (`ComposeItem`) and nav-tab children (`NavTab['children']`)
 *  get normalised to. */
interface NavDropdownRow {
  key: string;
  label: string;
  href?: string;
  external?: boolean;
  icon?: React.ReactNode;
  /** Action row (e.g. Account "Log out") — renders a button instead of a
   *  link. Takes precedence over `href`. */
  onSelect?: () => void;
  /** When set, the row is a title (label) + description block (About layout,
   *  Figma 3010-12052) — taller, no icon. Takes precedence over `icon`. */
  description?: string;
  disabled?: boolean;
}

/** Resting text tone for a row's title. Icon rows + About descriptions use
 *  grey-500; the About title uses grey-400 (#ccc4c4, not a DS token yet). */
const NAV_ROW_TITLE_GREY_400 = '#ccc4c4';

/**
 * Shared nav dropdown panel — one visual language for every SiteNav dropdown
 * (the compose "+" menu and the Media/About tab submenus). Flat grey-200
 * surface (Figma 2941-11302 / 3010-11985) and two row shapes:
 *  - icon + label rows (compose, Media): 14px icon + 12px grey-500 label,
 *    `py-7`.
 *  - title + description rows (About, Figma 3010-12052): 12px grey-400 title
 *    over a 14px grey-500 description, `py-16`, no icon.
 * `header` is optional — the compose "+" panel names itself ("Create
 * Content") because its trigger doesn't; the Media/About tab panels omit it
 * (the tab already names them).
 *
 * Rows are flat + muted at rest. A SINGLE liquid-glass highlight (the same
 * `GLASS_PILL` material the middle-nav tab pill uses) glides vertically to
 * whichever row is hovered — driven by the same `PILL_SPRING` so it has the
 * tabs' flowy slide/morph, not an independent per-row `:hover` background.
 * The hovered row's icon + label (or title + description) brighten to white;
 * resting rows stay muted. Disabled rows (compose "Soon") aren't hoverable —
 * the highlight skips them (hovering one hides it).
 */
function NavDropdownPanel({
  header,
  items,
  className,
  compact = false,
}: {
  header?: string;
  items: NavDropdownRow[];
  className?: string;
  /** Headered panels (compose + Account) set this to tighten the header→list
   *  gap (`gap-4` vs `gap-8`). Row padding is uniform across all panels, so
   *  every dropdown shares one vertical rhythm regardless of this flag. */
  compact?: boolean;
}) {
  const LinkComponent = useLinkComponent();
  const reduceMotion = useReducedMotion();
  const labelClassName = 'text-[12px] leading-[18px] tracking-[-0.36px]';
  // Row layout lives on the interactive element itself (the link/button), so
  // the whole padded row is a real, clickable box (`w-full` to fill the
  // measured wrapper). One consistent, tight vertical rhythm across every
  // dropdown: all icon rows are py-6 (compose / Media / Account read equally
  // tight).
  const iconRowClassName =
    'group/navrow flex w-full cursor-pointer items-center gap-[8px] rounded-[4px] py-[6px] pl-[8px] pr-[16px]';
  // About title+description rows: py-8 for a tight between-item rhythm that
  // matches the icon rows, and gap-0 so the description sits flush under its
  // title (their line-heights give the pair its separation) — one tight pair.
  const descRowClassName =
    'group/navrow flex w-full cursor-pointer flex-col gap-[0px] rounded-[4px] py-[8px] pl-[8px] pr-[16px]';

  // Single shared glass highlight — mirrors the tab pill's mechanism
  // (useNavHighlight), oriented vertically: springs y + height to the hovered
  // row and fades out when nothing is hovered.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const mounted = useRef(false);
  const y = useSpring(0, PILL_SPRING);
  const height = useSpring(0, PILL_SPRING);
  const opacity = useSpring(0, OPACITY_SPRING);

  useIsoLayoutEffect(() => {
    const el = hoveredKey ? (rowRefs.current.get(hoveredKey) ?? null) : null;
    if (!el) {
      if (mounted.current) opacity.set(0);
      else opacity.jump(0);
      return;
    }
    const top = el.offsetTop;
    const h = el.offsetHeight;
    // Jump on first appearance / after a fade-out / reduced-motion; glide otherwise.
    const instant = !mounted.current || opacity.get() === 0 || reduceMotion;
    if (instant) {
      y.jump(top);
      height.jump(h);
    } else {
      y.set(top);
      height.set(h);
    }
    opacity.set(1);
    mounted.current = true;
  }, [hoveredKey, reduceMotion, y, height, opacity]);

  const setRowRef = (key: string) => (el: HTMLElement | null) => {
    if (el) rowRefs.current.set(key, el);
    else rowRefs.current.delete(key);
  };

  return (
    <div
      className={cn(
        // Each panel sizes to its OWN content (`w-max`): About reads wide (long
        // descriptions on one line), compose/Account hug their short labels.
        // Compact panels tighten the header→list gap; Per Figma "On" states
        // 3010-12001 / 3010-12102.
        'flex w-max flex-col rounded-[4px] bg-grey-200 p-[8px]',
        compact ? 'gap-[4px]' : 'gap-[8px]',
        className
      )}
    >
      {header && (
        // Slightly dimmer than the row labels so the section header reads as
        // a quiet caption, not an item.
        <div
          className={cn('py-[8px] pl-[8px] pr-[16px] font-medium text-grey-500/70', labelClassName)}
        >
          {header}
        </div>
      )}
      <nav className="relative flex flex-col" onMouseLeave={() => setHoveredKey(null)}>
        {/* The gliding highlight (behind the rows, z-0). It keeps the tab
            pill's flowy spring MOTION but a subtle appearance per Figma
            3010-12001 / 3010-12102: a 5% white fill + 5% white 1px border. */}
        <motion.div
          aria-hidden
          style={{
            y,
            height,
            opacity,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
          className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-[4px]"
        />
        {items.map((item) => {
          if (item.disabled) {
            return (
              <span
                key={item.key}
                aria-disabled="true"
                onMouseEnter={() => setHoveredKey(null)}
                className="relative z-10 flex cursor-not-allowed items-center justify-between gap-[8px] rounded-[4px] py-[6px] pl-[8px] pr-[16px] select-none"
              >
                <span className="flex items-center gap-[8px]">
                  {item.icon && (
                    <span className="flex size-[14px] shrink-0 items-center justify-center text-grey-300">
                      {item.icon}
                    </span>
                  )}
                  <span className={cn(labelClassName, 'text-grey-300')}>{item.label}</span>
                </span>
                <span className="text-[10px] tracking-[-0.3px] text-red-100">Soon</span>
              </span>
            );
          }

          const rowClassName = item.description ? descRowClassName : iconRowClassName;
          const inner = item.description ? (
            <>
              {/* Resting title grey-400; only the hovered title goes white. */}
              <span
                style={{ color: NAV_ROW_TITLE_GREY_400 }}
                className="text-[12px] leading-[18px] tracking-[-0.36px] transition-colors group-hover/navrow:text-white"
              >
                {item.label}
              </span>
              {/* Description always grey-500 (does not brighten on hover). */}
              <span className="text-[14px] leading-[24px] font-medium tracking-[-0.42px] text-grey-500">
                {item.description}
              </span>
            </>
          ) : (
            <>
              {item.icon && (
                <span className="flex size-[14px] shrink-0 items-center justify-center text-grey-500 transition-colors group-hover/navrow:text-white">
                  {item.icon}
                </span>
              )}
              <span
                className={cn(
                  labelClassName,
                  'text-grey-500 transition-colors group-hover/navrow:text-white'
                )}
              >
                {item.label}
              </span>
            </>
          );

          // The link/button IS the full-size clickable row (rowClassName +
          // w-full). The outer <div> is only a measured/positioned wrapper for
          // the ref + hover tracking + z-order above the highlight; keeping the
          // ref off the polymorphic LinkComponent avoids the TS union blow-up.
          const control = item.onSelect ? (
            <button type="button" onClick={item.onSelect} className={rowClassName}>
              {inner}
            </button>
          ) : item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className={rowClassName}>
              {inner}
            </a>
          ) : (
            <LinkComponent href={item.href ?? '#'} className={rowClassName}>
              {inner}
            </LinkComponent>
          );

          return (
            <div
              key={item.key}
              ref={setRowRef(item.key)}
              onMouseEnter={() => setHoveredKey(item.key)}
              className="relative z-10 flex"
            >
              {control}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Compose (＋) dropdown panel — thin adapter from `ComposeItem` to the
 * shared {@link NavDropdownPanel}. Header reads "Create Content"; shared
 * between the desktop hover panel and the mobile `DropdownMenuContent`
 * popup (the latter renders it inside a transparent, chrome-less content
 * wrapper so this panel supplies all the visuals).
 */
function ComposeMenuPanel({ items }: { items: ComposeItem[] }) {
  return (
    <NavDropdownPanel
      header="Create Content"
      compact
      className="w-[210px]"
      items={items.map((item) => ({
        key: item.label,
        label: item.label,
        href: item.href,
        icon: item.icon,
        disabled: item.disabled,
      }))}
    />
  );
}

/** Shared "Create" pill trigger (Figma 719-5697) — the frosted button that
 *  opens the compose dropdown. Byte-identical on desktop (hover-opens) and
 *  mobile (click-opens) so the two breakpoints can't drift apart again;
 *  mobile previously swapped this for a bare circular "+" icon, which read
 *  as an unrelated control next to the boxed search/notif/avatar buttons.
 *  Both usages also carry `data-slot="button" data-shimmer="brand"` — the
 *  existing global hover-shimmer sweep (globals.css) already used on the
 *  BtlWordmark, opted into here rather than reinvented, so Create reads as
 *  the header's primary CTA catching brand-red light on hover. */
const CREATE_PILL_CLASSNAME =
  'flex h-8 cursor-pointer items-center justify-center rounded-[4px] border border-white/5 bg-white/10 px-[8px] text-[12px] font-semibold leading-[16px] tracking-[-0.36px] text-white backdrop-blur-[15px] transition-colors hover:bg-white/[0.16]';

/** Shared "Account" trigger pill (Figma 719-5697) — the avatar + caret
 *  frosted button. Byte-identical on desktop (CSS hover-reveal) and mobile
 *  (click-open DropdownMenu) so the two can't drift apart again; mobile
 *  previously rendered a bare, unboxed 34px avatar here — taller than the
 *  cluster's other 32px buttons and one of the mismatched-looking controls
 *  the owner flagged. */
const ACCOUNT_TRIGGER_CLASSNAME =
  'flex h-8 cursor-pointer items-center gap-[8px] rounded-[4px] border border-white/5 bg-white/10 px-[8px] backdrop-blur-[15px]';

/** The shared `Avatar` primitive (avatar.tsx) bakes in a 2px `ring-background`
 *  (near-black in dark mode) plus a mix-blend-darken after-border — both
 *  meant to cut an avatar out from a busy/bright backdrop (avatar stacks,
 *  profile hero, thought cards, etc.), which every OTHER Avatar consumer in
 *  the DS still relies on. Set against THIS frosted bg-white/10 pill it read
 *  as a hard black ring hugging the pill's edges (owner feedback on the
 *  0.61.0 header), so it's neutralised here only — not in the shared
 *  primitive. size-5 (down from size-6) also gives it visible clearance from
 *  the pill edges now that the ring isn't filling that space. */
const ACCOUNT_AVATAR_CLASSNAME = 'size-5 ring-0 after:border-transparent';

function SiteNav({
  className,
  tabs = defaultTabs,
  avatarUrl,
  initials,
  onSearchClick,
  composeItems,
  onNotificationsClick,
  onAvatarClick,
  avatarMenu,
  profileHref,
  studioHref,
  onLogout,
  onLoginClick,
  learnHref,
  signUpHref,
  notificationCount,
  notificationPopover,
  logoHref = '/',
  logo,
  onGoBack,
  goBackLabel,
  ...props
}: SiteNavProps) {
  const LinkComponent = useLinkComponent();
  const [menuOpen, setMenuOpen] = useState(false);
  // Gates the action-cluster hover flourishes below (Search tilt,
  // Notifications lift, Docs red/fill crossfade) — reduced-motion users get
  // the plain background/text hover transitions only.
  const reduceMotion = useReducedMotion();
  // Logged out (public) header: no avatar/initials. Drives the text-based
  // public actions cluster (Search / Learn / Log in / Sign Up) instead of the
  // signed-in icon cluster.
  const isLoggedOut = !(avatarUrl || initials);

  // Account dropdown rows (Figma 3009-11910) — built from the profile/studio/
  // logout props. When non-empty, the avatar becomes an Account-menu trigger
  // (taking precedence over the legacy `avatarMenu`).
  const accountItems: NavDropdownRow[] = [];
  if (profileHref) {
    accountItems.push({
      key: 'profile',
      label: 'Profile',
      href: profileHref,
      icon: <UserCircle size={14} weight="regular" />,
    });
  }
  if (studioHref) {
    accountItems.push({
      key: 'studio',
      label: 'Studio',
      href: studioHref,
      external: true,
      icon: <Hammer size={14} weight="regular" />,
    });
  }
  if (onLogout) {
    accountItems.push({
      key: 'logout',
      label: 'Log out',
      onSelect: onLogout,
      icon: <SignOut size={14} weight="regular" />,
    });
  }

  // Liquid highlight: the pill follows the hovered tab, falling back to the
  // active route; null (e.g. Home) leaves the bar bare until you hover.
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeIndex = tabs.findIndex((tab) => tab.active);
  const litIndex = hoverIndex ?? (activeIndex >= 0 ? activeIndex : null);
  const tabsRevision = tabs.map((tab) => `${tab.label}:${tab.active ? 1 : 0}`).join('|');
  const { navRef, setTabRef, pillStyle } = useNavHighlight(litIndex, tabsRevision);

  return (
    <header
      data-slot="site-nav"
      className={cn('relative z-50 flex h-14 items-center justify-between', className)}
      {...props}
    >
      {/* Left: optional back button + logo. The outer motion.div clips width
          + margin on exit; the inner box is pinned to max-content so the pill
          keeps its natural size while the clipping window slides over it.
          No squish, no overlap with the logo. */}
      <div className="flex items-center">
        <AnimatePresence initial={false}>
          {onGoBack ? (
            <motion.div
              key="go-back"
              initial={{ width: 0, marginRight: 0, opacity: 0 }}
              animate={{
                width: 'auto',
                marginRight: 12,
                opacity: 1,
                transition: {
                  width: motionTokens.spring.shift,
                  marginRight: motionTokens.spring.shift,
                  opacity: {
                    duration: motionTokens.duration.entrance / 1000,
                    ease: [0, 0, 0.2, 1],
                  },
                },
              }}
              exit={{
                width: 0,
                marginRight: 0,
                opacity: 0,
                transition: {
                  width: { duration: motionTokens.duration.exit / 1000, ease: [0.4, 0, 1, 1] },
                  marginRight: {
                    duration: motionTokens.duration.exit / 1000,
                    ease: [0.4, 0, 1, 1],
                  },
                  opacity: {
                    duration: motionTokens.duration.micro / 1000,
                    ease: [0.4, 0, 1, 1],
                  },
                },
              }}
              style={{ overflow: 'hidden' }}
              className="shrink-0"
            >
              <div className="flex items-center" style={{ width: 'max-content' }}>
                <GoBack size="sm" onClick={onGoBack} label={goBackLabel} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <LinkComponent href={logoHref} className="flex items-center">
          {logo ?? (
            <BtlWordmark
              data-slot="button"
              data-shimmer="brand"
              iconClassName="size-[29px]"
              textClassName="hidden sm:flex"
            />
          )}
        </LinkComponent>
      </div>

      {/* Center: liquid pill tab bar (tablet+). A solid grey-200 capsule holds a
          single grey-300 pill that glides between tabs on hover — velocity-driven
          stretch/squash for the gooey morph — and rests on the active route.
          Resting colours per Figma 2204:9786. */}
      <nav
        ref={navRef}
        onMouseLeave={() => setHoverIndex(null)}
        className="relative hidden items-center rounded-full bg-white/[0.06] p-1 backdrop-blur-md sm:flex"
      >
        {/* Refraction filter for the liquid-glass pill (Chrome/Edge). */}
        <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
          <filter
            id="nav-liquid-glass"
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage result="map" href={DISPLACEMENT_MAP} preserveAspectRatio="none" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        <motion.div
          aria-hidden
          style={{ ...pillStyle, ...GLASS_PILL }}
          className="pointer-events-none absolute left-0 top-1 bottom-1 rounded-full"
        />
        {tabs.map((tab, index) => {
          const lit = litIndex === index;
          const tabClassName = cn(
            // px-3.5 py-2.5 + leading-none → compact pill (design-tuned).
            'relative block cursor-pointer px-3.5 py-2.5 text-[12px] leading-none tracking-[-0.36px] transition-colors',
            lit ? 'text-white' : 'text-grey-500 hover:text-white/80'
          );
          return (
            <div
              key={getNavTabKey(tab)}
              ref={setTabRef(index)}
              onMouseEnter={() => setHoverIndex(index)}
              className={cn('relative z-10', tab.children && 'group/sub')}
            >
              {tab.children ? (
                <button type="button" className={tabClassName} aria-haspopup="true">
                  {tab.label}
                </button>
              ) : (
                <LinkComponent href={tab.href ?? '#'} className={tabClassName}>
                  {tab.label}
                </LinkComponent>
              )}
              {tab.children ? (
                // Dropdown — pt-2 creates an invisible hover bridge between trigger and panel
                <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 invisible translate-y-1 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-y-0 transition-all duration-150 ease-out">
                  {/* Optional section header per tab (`menuHeader`, e.g. Media
                      "Watch & Listen"); omit for a headerless dropdown (About).
                      Fixed widths per spec: title+description panels (About)
                      317px so descriptions stay on one line; icon+label panels
                      (Media) 210px. */}
                  <NavDropdownPanel
                    header={tab.menuHeader}
                    compact={Boolean(tab.menuHeader)}
                    className={
                      tab.children.some((child) => child.description) ? 'w-[317px]' : 'w-[210px]'
                    }
                    items={tab.children.map((child) => ({
                      key: getNavChildKey(child),
                      label: child.label,
                      href: child.href,
                      external: child.external,
                      icon: child.icon,
                      description: child.description,
                    }))}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {/* Right: Actions cluster */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-end',
          // Figma 719-5697: signed-in actions (Search / Docs / Notifications /
          // Create / Account) sit in one tight gap cluster, not the older
          // 16px rhythm — the new bg-white/5 icon boxes supply their own
          // visual separation. Desktop keeps the spec's 4px; mobile opens it
          // to 8px — the same five items at 4px read as squished on a
          // narrow screen (owner feedback on the 0.61.0 header).
          avatarUrl || initials ? 'gap-[8px] sm:gap-[4px]' : 'gap-8'
        )}
      >
        {/* Search icon — signed-in only (all sizes). Signed-out uses the
            "Search" TEXT control in the public actions cluster below, at every
            viewport (mobile + desktop). Figma 719-5697: a 32px frosted icon
            slot (bg-white/5, rounded-4px) rather than the old bare icon. */}
        {!isLoggedOut && onSearchClick && (
          <button
            type="button"
            aria-label="Search"
            onClick={onSearchClick}
            className="flex size-8 cursor-pointer items-center justify-center rounded-[4px] bg-white/5 text-grey-500 transition-colors hover:bg-white/10 hover:text-white"
          >
            {/* A little tilt-and-grow on hover — reads as the glass glancing
                to search, not just a static swap to white. */}
            <IconPop hover={{ scale: 1.15, rotate: -10 }} reduceMotion={reduceMotion}>
              <SearchIcon className="size-[14px]" />
            </IconPop>
          </button>
        )}
        {/* Docs (lightbulb) — signed-in, both breakpoints. Reuses `learnHref`,
            the same docs destination the logged-out cluster shows as "Learn"
            text, so both auth states share one source of truth. Used to be
            desktop-only (mobile reached docs only via the hamburger's About >
            Learn row) — the owner's since called for exact parity between
            the two action clusters, so it's shown here too; the hamburger
            row is a harmless duplicate path, same as Search already was.
            Hover "switches the bulb on": the outline glyph crossfades to a
            BTL-red filled one with a soft glow, each on its own spring, via
            framer-motion variant propagation (parent declares the named
            "rest"/"hover" state; each glyph layer supplies its own targets
            for that state). Skipped under reduceMotion — see IconPop. */}
        {!isLoggedOut && learnHref && (
          <motion.a
            href={learnHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Docs"
            initial="rest"
            whileHover={reduceMotion ? undefined : 'hover'}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="relative flex size-8 items-center justify-center rounded-[4px] border border-white/5 bg-white/5 text-grey-500 backdrop-blur-[15px] transition-colors hover:bg-white/10"
          >
            {/* Outline (rest) — fades/spins out as the filled glyph swaps in. */}
            <motion.span
              variants={{
                rest: { opacity: 1, scale: 1, rotate: 0 },
                hover: { opacity: 0, scale: 0.5, rotate: -25 },
              }}
              transition={motionTokens.spring.pop}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Lightbulb size={14} weight="regular" />
            </motion.span>
            {/* Filled + BTL red + soft glow (hover) — the "switched on" state. */}
            <motion.span
              variants={{
                rest: { opacity: 0, scale: 0.5, rotate: 25 },
                hover: { opacity: 1, scale: 1, rotate: 0 },
              }}
              transition={motionTokens.spring.pop}
              className="absolute inset-0 flex items-center justify-center text-red-100 drop-shadow-[0_0_6px_rgba(235,0,0,0.65)]"
            >
              <Lightbulb size={14} weight="fill" />
            </motion.span>
          </motion.a>
        )}
        {(onNotificationsClick || notificationPopover) && (
          <>
            <div className={cn('relative hidden sm:block', notificationPopover && 'group/notif')}>
              <div className="relative flex size-8 items-center justify-center rounded-[4px] bg-white/5">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={notificationPopover ? undefined : onNotificationsClick}
                  className="flex size-full items-center justify-center rounded-[4px] text-grey-500 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  {/* A little lift-and-grow on hover — same "cool" treatment
                      family as Search, tuned to feel like the tray perking up. */}
                  <IconPop hover={{ scale: 1.15, y: -2 }} reduceMotion={reduceMotion}>
                    <NotificationIcon className="size-[14px]" />
                  </IconPop>
                </button>
                {notificationCount !== undefined && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </div>
              {notificationPopover && (
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover/notif:opacity-100 group-hover/notif:visible group-hover/notif:translate-y-0 transition-all duration-150 ease-out">
                  {notificationPopover}
                </div>
              )}
            </div>
            <div className="relative sm:hidden">
              {notificationPopover ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Notifications"
                        className="relative flex size-8 items-center justify-center rounded-[4px] bg-white/5 text-grey-500 transition-colors hover:bg-white/10 hover:text-white"
                      />
                    }
                  >
                    <IconPop hover={{ scale: 1.15, y: -2 }} reduceMotion={reduceMotion}>
                      <NotificationIcon className="size-[14px]" />
                    </IconPop>
                    {notificationCount !== undefined && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-[min(92vw,380px)] p-0 !bg-grey-200 backdrop-blur-none"
                  >
                    {notificationPopover}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={onNotificationsClick}
                  className="relative flex size-8 items-center justify-center rounded-[4px] bg-white/5 text-grey-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <IconPop hover={{ scale: 1.15, y: -2 }} reduceMotion={reduceMotion}>
                    <NotificationIcon className="size-[14px]" />
                  </IconPop>
                  {notificationCount !== undefined && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* Compose: opens the shared NavDropdownPanel (see above) with a
            "Create Content" header and icon rows. Sits right of
            Notifications, left of the avatar. Rendered only when
            composeItems is supplied (the consumer gates visibility on
            sign-in). */}
        {composeItems && composeItems.length > 0 && (
          <>
            {/* Desktop: hover dropdown. Figma 719-5697 replaces the old
                circular ＋ trigger with a labelled "Create" pill; the
                dropdown panel it opens is unchanged. */}
            <div className="group/compose relative hidden sm:block">
              <button
                type="button"
                aria-label="Compose"
                aria-haspopup="true"
                data-slot="button"
                data-shimmer="brand"
                className={CREATE_PILL_CLASSNAME}
              >
                Create
              </button>
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover/compose:opacity-100 group-hover/compose:visible group-hover/compose:translate-y-0 transition-all duration-150 ease-out">
                <ComposeMenuPanel items={composeItems} />
              </div>
            </div>
            {/* Mobile: click dropdown. Same "Create" pill as desktop — used to
                be a bare circular "+" here, which read as an unrelated
                control next to the boxed search/notif icons (owner
                feedback); parity fixes that. */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Compose"
                      data-slot="button"
                      data-shimmer="brand"
                      className={CREATE_PILL_CLASSNAME}
                    />
                  }
                >
                  Create
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="min-w-0 border-none bg-transparent p-0 shadow-none backdrop-blur-none"
                >
                  <ComposeMenuPanel items={composeItems} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}

        {/* Avatar (logged in) or Login button (logged out) */}
        {avatarUrl || initials ? (
          accountItems.length > 0 ? (
            <>
              {/* Desktop: hover-opens the shared "Account" NavDropdownPanel
                  (Figma 3009-11910). Figma 719-5697 wraps the trigger in the
                  same frosted pill as "Create" and appends a CaretDown so it
                  reads as a dropdown trigger, not a plain avatar. */}
              <div className="group/avatar relative hidden sm:block">
                <div className={ACCOUNT_TRIGGER_CLASSNAME}>
                  <Avatar size="default" className={ACCOUNT_AVATAR_CLASSNAME}>
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                    <AvatarFallback branded>{initials ?? '?'}</AvatarFallback>
                  </Avatar>
                  <CaretDown size={14} weight="regular" className="text-white" />
                </div>
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover/avatar:opacity-100 group-hover/avatar:visible group-hover/avatar:translate-y-0 transition-all duration-150 ease-out">
                  <NavDropdownPanel
                    header="Account"
                    compact
                    className="w-[210px]"
                    items={accountItems}
                  />
                </div>
              </div>
              {/* Mobile: click-opens the same panel inside a chrome-less menu.
                  Trigger pill is byte-identical to desktop's
                  (ACCOUNT_TRIGGER_CLASSNAME) — used to be a bare 34px avatar
                  with no pill, taller than the cluster's other 32px buttons
                  and one of the mismatched-looking controls the owner
                  flagged. */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Account"
                        className={ACCOUNT_TRIGGER_CLASSNAME}
                      />
                    }
                  >
                    <Avatar size="default" className={ACCOUNT_AVATAR_CLASSNAME}>
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                      <AvatarFallback branded>{initials ?? '?'}</AvatarFallback>
                    </Avatar>
                    <CaretDown size={14} weight="regular" className="text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="min-w-0 border-none bg-transparent p-0 shadow-none backdrop-blur-none"
                  >
                    <NavDropdownPanel
                      header="Account"
                      compact
                      className="w-[210px]"
                      items={accountItems}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : avatarMenu?.length ? (
            <>
              <div className="group/avatar relative hidden sm:block">
                <div className="flex items-center justify-center cursor-pointer">
                  <Avatar size="default" className="size-[34px]">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                    <AvatarFallback branded>{initials ?? '?'}</AvatarFallback>
                  </Avatar>
                </div>
                {/* Dropdown — same pattern as Media dropdown */}
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover/avatar:opacity-100 group-hover/avatar:visible group-hover/avatar:translate-y-0 transition-all duration-150 ease-out">
                  <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200 p-1 shadow-xl">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
                    <nav className="flex flex-col gap-0.5">
                      {avatarMenu.map((item) =>
                        item.href ? (
                          item.external ? (
                            <a
                              key={item.label}
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                            >
                              {item.label}
                            </a>
                          ) : (
                            <LinkComponent
                              key={item.label}
                              href={item.href}
                              className="block rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                            >
                              {item.label}
                            </LinkComponent>
                          )
                        ) : (
                          <button
                            key={item.label}
                            type="button"
                            onClick={item.onClick}
                            className="block w-full cursor-pointer rounded-[2px] px-4 py-2.5 text-left text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                          >
                            {item.label}
                          </button>
                        )
                      )}
                    </nav>
                  </div>
                </div>
              </div>
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Account"
                        className="flex items-center justify-center"
                      />
                    }
                  >
                    <Avatar size="default" className="size-[34px]">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                      <AvatarFallback branded>{initials ?? '?'}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="relative min-w-[160px] overflow-hidden !bg-grey-200 backdrop-blur-none"
                  >
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
                    {avatarMenu.map((item) =>
                      item.href ? (
                        <DropdownMenuItem
                          key={item.label}
                          render={
                            item.external ? (
                              <a href={item.href} target="_blank" rel="noopener noreferrer" />
                            ) : (
                              <LinkComponent href={item.href} />
                            )
                          }
                        >
                          {item.label}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem key={item.label} onClick={item.onClick}>
                          {item.label}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onAvatarClick}
              className="flex items-center justify-center cursor-pointer"
            >
              <Avatar size="default" className="size-[34px]">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                <AvatarFallback branded>{initials ?? '?'}</AvatarFallback>
              </Avatar>
            </button>
          )
        ) : (
          /* Logged-out (public) actions cluster: text controls + a solid-red
             Sign Up button. "Search" is desktop-only text now (mobile reaches
             it via the hamburger, alongside "Learn" — see the hamburger panel
             below); "Log in" then Sign Up show at ALL sizes. */
          <div className="flex items-center gap-6">
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className="hidden text-[12px] leading-[18px] tracking-[-0.36px] text-grey-500 transition-colors hover:text-white/80 cursor-pointer sm:block"
              >
                Search
              </button>
            )}
            {learnHref && (
              <LinkComponent
                href={learnHref}
                className="hidden text-[12px] leading-[18px] tracking-[-0.36px] text-grey-500 transition-colors hover:text-white/80 sm:block"
              >
                Learn
              </LinkComponent>
            )}
            {onLoginClick && (
              <button
                type="button"
                onClick={onLoginClick}
                // Mobile-only vertical padding (matches Sign Up's py-2.5) now
                // that Search has vacated the row — gives "Log in" a proper
                // touch target instead of a bare text sliver next to the
                // boxed Sign Up button. Reverts to the original zero-padding
                // text link on desktop (sm:py-0) — desktop is unchanged.
                className="py-2.5 sm:py-0 text-[12px] leading-[18px] tracking-[-0.36px] text-grey-500 transition-colors hover:text-white/80 cursor-pointer"
              >
                Log in
              </button>
            )}
            {signUpHref && (
              <LinkComponent
                href={signUpHref}
                className="flex items-center justify-center rounded-none bg-red-100 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-red-300"
              >
                Sign Up
              </LinkComponent>
            )}
          </div>
        )}

        {/* Mobile: Hamburger menu */}
        <div className="sm:hidden">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label="Menu"
                  className="flex items-center justify-center text-white/80 transition-colors hover:text-white cursor-pointer"
                />
              }
            >
              <BrokenLinesIcon open={menuOpen} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="relative min-w-[180px] overflow-hidden rounded-[2px] border-white/10 !bg-grey-200 p-1 shadow-xl"
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
              {/* Search moved in from the mobile top bar (was crammed in
                  alongside Log in / Sign Up / this hamburger — see
                  `onSearchClick` above, now `hidden sm:block`). Logged-out
                  only: signed-in mobile keeps its own persistent Search icon
                  in the actions cluster, so adding it here too would
                  duplicate it. First item, un-headered like the flat tab
                  rows below. */}
              {isLoggedOut && onSearchClick && (
                <DropdownMenuItem
                  onClick={onSearchClick}
                  className="rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                >
                  Search
                </DropdownMenuItem>
              )}
              {tabs.map((tab) =>
                tab.children ? (
                  <React.Fragment key={tab.label}>
                    <div className="px-4 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/30">
                      {tab.label}
                    </div>
                    {tab.children.map((child) => (
                      <DropdownMenuItem
                        key={getNavChildKey(child)}
                        render={
                          child.external ? (
                            <a href={child.href} target="_blank" rel="noopener noreferrer" />
                          ) : (
                            <LinkComponent href={child.href} />
                          )
                        }
                        className="rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                      >
                        {child.label}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ) : (
                  <DropdownMenuItem
                    key={getNavTabKey(tab)}
                    render={<LinkComponent href={tab.href ?? '#'} />}
                    className="rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {tab.label}
                  </DropdownMenuItem>
                )
              )}
              {/* No standalone logged-out "Learn" here: "Learn" already surfaces
                  as the About tab's child (rendered inline above), so a separate
                  item would duplicate it. Desktop keeps its cluster "Learn" text
                  link (driven by `learnHref`); that is unaffected. */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export { SiteNav, type SiteNavProps };
