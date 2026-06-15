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

import { BtlWordmark } from '#/components/ui/btl-logo';
import { cn } from '#/lib/utils';
import { BrokenLinesIcon } from '#/components/ui/broken-lines-icon';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
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
  /** Sub-items rendered as a hover dropdown on desktop, inline on mobile */
  children?: {
    label: string;
    href: string;
    /** Opens in new tab (for external links like Zine) */
    external?: boolean;
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

interface SiteNavProps extends React.ComponentProps<'header'> {
  /** Navigation tabs */
  tabs?: NavTab[];
  /** Current user avatar URL (shows avatar when set, login button when not) */
  avatarUrl?: string;
  /** Current user initials for avatar fallback */
  initials?: string;
  /** Search click handler */
  onSearchClick?: () => void;
  /** Notifications click handler (used as fallback when notificationPopover is not set) */
  onNotificationsClick?: () => void;
  /** @deprecated Use avatarMenu instead */
  onAvatarClick?: () => void;
  /** Dropdown menu items shown on avatar hover */
  avatarMenu?: AvatarMenuItem[];
  /** Login click handler (shown when no avatarUrl) */
  onLoginClick?: () => void;
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

function SiteNav({
  className,
  tabs = defaultTabs,
  avatarUrl,
  initials,
  onSearchClick,
  onNotificationsClick,
  onAvatarClick,
  avatarMenu,
  onLoginClick,
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
        className="relative hidden items-center rounded-full bg-grey-200 p-1 sm:flex"
      >
        {/* Refraction filter for the liquid-glass pill (Chrome/Edge). */}
        <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
          <filter id="nav-liquid-glass" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage result="map" href={DISPLACEMENT_MAP} preserveAspectRatio="none" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="10" xChannelSelector="R" yChannelSelector="G" />
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
                  <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
                    <nav className="flex flex-col gap-0.5">
                      {tab.children.map((child) => {
                        const isExternal = child.external;
                        if (isExternal) {
                          return (
                            <a
                              key={getNavChildKey(child)}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                            >
                              {child.label}
                            </a>
                          );
                        }
                        return (
                          <LinkComponent
                            key={getNavChildKey(child)}
                            href={child.href}
                            className="block rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                          >
                            {child.label}
                          </LinkComponent>
                        );
                      })}
                    </nav>
                  </div>
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
          avatarUrl || initials ? 'gap-4' : 'gap-8'
        )}
      >
        {onSearchClick && (
          <button
            type="button"
            aria-label="Search"
            onClick={onSearchClick}
            className="flex items-center justify-center text-white/80 hover:text-red-100 transition-colors cursor-pointer"
          >
            <SearchIcon className="size-6" />
          </button>
        )}
        {(onNotificationsClick || notificationPopover) && (
          <>
            <div className={cn('relative hidden sm:block', notificationPopover && 'group/notif')}>
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={notificationPopover ? undefined : onNotificationsClick}
                  className="flex items-center justify-center text-white/80 hover:text-red-100 transition-colors cursor-pointer"
                >
                  <NotificationIcon className="size-[22px]" />
                </button>
                {notificationCount !== undefined && notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
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
                        className="relative flex items-center justify-center text-white/80 transition-colors hover:text-red-100"
                      />
                    }
                  >
                    <NotificationIcon className="size-[22px]" />
                    {notificationCount !== undefined && notificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-[min(92vw,380px)] p-0"
                  >
                    {notificationPopover}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={onNotificationsClick}
                  className="relative flex items-center justify-center text-white/80 transition-colors hover:text-red-100"
                >
                  <NotificationIcon className="size-[22px]" />
                  {notificationCount !== undefined && notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white pointer-events-none">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* Avatar (logged in) or Login button (logged out) */}
        {avatarUrl || initials ? (
          avatarMenu?.length ? (
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
                  <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
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
                    className="relative min-w-[160px] overflow-hidden"
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
          onLoginClick && (
            <Button onClick={onLoginClick} className="h-auto px-4 py-2.5">
              Login
            </Button>
          )
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
              className="relative min-w-[180px] overflow-hidden rounded-[2px] border-white/10 !bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl"
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export { SiteNav, type SiteNavProps };
