'use client';

import * as React from 'react';
import { List } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { IconButton } from '#/components/ui/icon-button';
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
  /** Internal link href */
  href?: string;
  /** Click handler (for actions like logout) */
  onClick?: () => void;
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
}

const defaultTabs: NavTab[] = [
  { label: 'Home', href: '/' },
  { label: 'Thoughts', href: '/thoughts' },
  {
    label: 'Media',
    children: [
      { label: 'BTL TV', href: '/btl-tv' },
      { label: 'BTL Podcasts', href: '/podcasts' },
      { label: 'Zine', href: 'https://zine.breakingthelines.com', external: true },
    ],
  },
  { label: 'Contact', href: '/contact' },
];

/** BTL bracket logo — two offset bracket shapes with red gradient fill */
function BtlNavLogo() {
  return (
    <div data-slot="button" data-shimmer="slow" className="flex items-center gap-[10.9px] shrink-0">
      <svg
        viewBox="0 0 29.09 28.02"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[29px] h-[28px]"
        aria-label="Breaking The Lines"
      >
        <defs>
          <linearGradient
            id="nav-logo-left"
            x1="0"
            y1="14.01"
            x2="12.467"
            y2="14.01"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E20613" />
            <stop offset="1" stopColor="#E5332A" />
          </linearGradient>
          <linearGradient
            id="nav-logo-right"
            x1="16.628"
            y1="14.01"
            x2="29.091"
            y2="14.01"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E20613" />
            <stop offset="1" stopColor="#E5332A" />
          </linearGradient>
        </defs>
        <path
          d="M12.467 0V8.516H9.049V19.513H12.467V28.022H0V0H12.467Z"
          fill="url(#nav-logo-left)"
        />
        <path
          d="M29.091 0V28.022H16.628V19.513H20.046V8.516H16.628V0H29.091Z"
          fill="url(#nav-logo-right)"
        />
      </svg>
      <div className="hidden sm:flex flex-col gap-0.5 text-[14px] font-semibold leading-none tracking-[-0.42px] text-white">
        <span>breaking</span>
        <span>the lines</span>
      </div>
    </div>
  );
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

/** Notification bell icon matching Figma spec — Material-style bell */
function NotificationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M4 19V17H6V10C6 8.617 6.417 7.388 7.25 6.313C8.083 5.238 9.167 4.533 10.5 4.2V3.5C10.5 3.083 10.646 2.729 10.938 2.438C11.229 2.146 11.583 2 12 2C12.417 2 12.771 2.146 13.063 2.438C13.354 2.729 13.5 3.083 13.5 3.5V4.2C14.833 4.533 15.917 5.238 16.75 6.313C17.583 7.388 18 8.617 18 10V17H20V19H4ZM12 22C11.45 22 10.979 21.804 10.588 21.413C10.196 21.021 10 20.55 10 20H14C14 20.55 13.804 21.021 13.413 21.413C13.021 21.804 12.55 22 12 22Z"
        fill="currentColor"
      />
    </svg>
  );
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
  ...props
}: SiteNavProps) {
  const LinkComponent = useLinkComponent();

  return (
    <header
      data-slot="site-nav"
      className={cn('z-50 flex h-14 items-center justify-between', className)}
      {...props}
    >
      {/* Left: Logo */}
      <LinkComponent href={logoHref} className="flex items-center">
        {logo ?? <BtlNavLogo />}
      </LinkComponent>

      {/* Center: Pill tab bar (desktop/tablet) */}
      <nav className="hidden sm:flex items-center rounded-full p-1">
        {tabs.map((tab) =>
          tab.children ? (
            <div key={tab.label} className="group/sub relative">
              <button
                type="button"
                className={cn(
                  'cursor-pointer rounded-full px-4 py-3 text-[12px] tracking-[-0.36px] transition-colors',
                  tab.active ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:text-white/80'
                )}
                aria-haspopup="true"
              >
                {tab.label}
              </button>
              {/* Dropdown — pt-2 creates an invisible hover bridge between trigger and panel */}
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 invisible translate-y-1 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-y-0 transition-all duration-150 ease-out">
                <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
                  {/* Subtle bottom accent line */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
                  <nav className="flex flex-col gap-0.5">
                  {tab.children.map((child) => {
                    const isExternal = child.external;
                    if (isExternal) {
                      return (
                        <a
                          key={child.href}
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
                        key={child.href}
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
            </div>
          ) : (
            <LinkComponent
              key={tab.href ?? tab.label}
              href={tab.href ?? '#'}
              className={cn(
                'rounded-full px-4 py-3 text-[12px] tracking-[-0.36px] transition-colors',
                tab.active ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:text-white/80'
              )}
            >
              {tab.label}
            </LinkComponent>
          )
        )}
      </nav>

      {/* Right: Actions — uniform gap, all items on the same level */}
      <div className={cn('flex items-center', avatarUrl || initials ? 'gap-4' : 'gap-8')}>
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
          <div className={cn('relative', notificationPopover && 'group/notif')}>
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
        )}

        {/* Avatar (logged in) or Login button (logged out) */}
        {avatarUrl || initials ? (
          avatarMenu?.length ? (
            <div className="group/avatar relative">
              <div className="flex items-center justify-center cursor-pointer">
                <Avatar size="default" className="size-[34px]">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                  <AvatarFallback>{initials ?? '?'}</AvatarFallback>
                </Avatar>
              </div>
              {/* Dropdown — same pattern as Media dropdown */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover/avatar:opacity-100 group-hover/avatar:visible group-hover/avatar:translate-y-0 transition-all duration-150 ease-out">
                <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
                  <nav className="flex flex-col gap-0.5">
                    {avatarMenu.map((item) =>
                      item.href ? (
                        <LinkComponent
                          key={item.label}
                          href={item.href}
                          className="block rounded-[2px] px-4 py-2.5 text-xs uppercase tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {item.label}
                        </LinkComponent>
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
          ) : (
            <button type="button" onClick={onAvatarClick} className="flex items-center justify-center cursor-pointer">
              <Avatar size="default" className="size-[34px]">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                <AvatarFallback>{initials ?? '?'}</AvatarFallback>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<IconButton aria-label="Menu" variant="ghost" size="lg" animated={false} />}
            >
              <List weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              {tabs.map((tab) =>
                tab.children ? (
                  <React.Fragment key={tab.label}>
                    <div className="px-2 py-1.5 text-[11px] uppercase tracking-[-0.33px] text-white/40">
                      {tab.label}
                    </div>
                    {tab.children.map((child) => (
                      <DropdownMenuItem
                        key={child.href}
                        render={
                          child.external ? (
                            <a href={child.href} target="_blank" rel="noopener noreferrer" />
                          ) : (
                            <LinkComponent href={child.href} />
                          )
                        }
                        className="pl-4"
                      >
                        {child.label}
                      </DropdownMenuItem>
                    ))}
                  </React.Fragment>
                ) : (
                  <DropdownMenuItem key={tab.href ?? tab.label} render={<LinkComponent href={tab.href ?? '#'} />}>
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
