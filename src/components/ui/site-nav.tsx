'use client';

import * as React from 'react';
import { List } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
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
  href: string;
  active?: boolean;
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
  /** Notifications click handler */
  onNotificationsClick?: () => void;
  /** Avatar/profile click handler */
  onAvatarClick?: () => void;
  /** Login click handler (shown when no avatarUrl) */
  onLoginClick?: () => void;
  /** Notification count badge */
  notificationCount?: number;
  /** URL the logo links to (default: '/') */
  logoHref?: string;
  /** Logo render prop */
  logo?: React.ReactNode;
}

const defaultTabs: NavTab[] = [
  { label: 'Home', href: '/' },
  { label: 'Thoughts', href: '/thoughts' },
  { label: 'Media', href: '/media' },
  { label: 'Contact', href: '/contact' },
];

/** BTL bracket logo — two offset bracket shapes with red gradient fill */
function BtlNavLogo() {
  return (
    <div className="flex items-center gap-[10.9px] shrink-0">
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
      <div className="hidden sm:flex flex-col gap-0.5 text-[14px] font-medium leading-none tracking-[-0.42px] text-white">
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
  onLoginClick,
  notificationCount,
  logoHref = '/',
  logo,
  ...props
}: SiteNavProps) {
  return (
    <header
      data-slot="site-nav"
      className={cn(
        'z-50 flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {/* Left: Logo */}
      <a href={logoHref} className="flex items-center">{logo ?? <BtlNavLogo />}</a>

      {/* Center: Pill tab bar (desktop/tablet) */}
      <nav className="hidden sm:flex items-center rounded-full p-1">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-full px-4 py-3 text-[12px] tracking-[-0.36px] transition-colors',
              tab.active
                ? 'bg-white/[0.12] text-white'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {/* Right: Actions — gap-8 (32px) between icon group and avatar/login per Figma */}
      <div className="flex items-center gap-8">
        {/* Icons: search + notifications (16px gap) */}
        <div className="flex items-center gap-4">
          {onSearchClick && (
            <button
              type="button"
              aria-label="Search"
              onClick={onSearchClick}
              className="text-white hover:text-white/80 transition-colors cursor-pointer"
            >
              <SearchIcon className="size-6" />
            </button>
          )}
          {onNotificationsClick && (
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={onNotificationsClick}
                className="text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                <NotificationIcon className="size-6" />
              </button>
              {notificationCount !== undefined && notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Avatar (logged in) or Login button (logged out) */}
        {avatarUrl || initials ? (
          <button type="button" onClick={onAvatarClick} className="cursor-pointer">
            <Avatar size="default" className="size-[34px]">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
              <AvatarFallback>{initials ?? '?'}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          onLoginClick && (
            <Button onClick={onLoginClick}>
              Login
            </Button>
          )
        )}

        {/* Mobile: Hamburger menu */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <IconButton aria-label="Menu" variant="ghost" size="md" animated={false} />
              }
            >
              <List weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              {tabs.map((tab) => (
                <DropdownMenuItem key={tab.href} render={<a href={tab.href} />}>
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export { SiteNav, type SiteNavProps };
