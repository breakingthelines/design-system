'use client';

import * as React from 'react';
import { MagnifyingGlass, Bell, List } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
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
  /** Logo render prop */
  logo?: React.ReactNode;
}

const defaultTabs: NavTab[] = [
  { label: 'Articles', href: '/articles' },
  { label: 'Thoughts', href: '/thoughts' },
  { label: 'Media', href: '/media' },
  { label: 'Contact', href: '/contact' },
];

function BtlNavLogo() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 30 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-7"
        aria-label="Breaking The Lines"
      >
        <rect width="30" height="28" rx="2" className="fill-red-100" />
        <rect x="6" y="4" width="8" height="9" rx="1" className="fill-white" />
        <rect x="16" y="15" width="8" height="9" rx="1" className="fill-white" />
      </svg>
      <div className="hidden sm:flex flex-col text-sm font-semibold leading-tight tracking-tight text-white">
        <span>breaking</span>
        <span>the lines</span>
      </div>
    </div>
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
  logo,
  ...props
}: SiteNavProps) {
  return (
    <header
      data-slot="site-nav"
      className={cn(
        'sticky top-0 z-50 flex h-14 items-center justify-between px-4 backdrop-blur-xl bg-black/80 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {/* Left: Logo */}
      <div className="flex items-center">{logo ?? <BtlNavLogo />}</div>

      {/* Center: Pill tab bar (desktop/tablet) */}
      <nav className="hidden sm:flex items-center rounded-full bg-grey-200 p-1">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-full px-4 py-2.5 text-xs tracking-tight transition-colors sm:px-3 sm:text-[11px] lg:px-4 lg:text-xs',
              tab.active ? 'bg-grey-300 text-white' : 'text-muted-foreground hover:text-white'
            )}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {onSearchClick && (
            <IconButton aria-label="Search" variant="ghost" size="md" onClick={onSearchClick}>
              <MagnifyingGlass weight="regular" />
            </IconButton>
          )}
          {onNotificationsClick && (
            <div className="relative">
              <IconButton
                aria-label="Notifications"
                variant="ghost"
                size="md"
                onClick={onNotificationsClick}
              >
                <Bell weight="regular" />
              </IconButton>
              {notificationCount !== undefined && notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Avatar or Login */}
        {avatarUrl || initials ? (
          <button type="button" onClick={onAvatarClick} className="cursor-pointer">
            <Avatar size="default">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
              <AvatarFallback>{initials ?? '?'}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          onLoginClick && (
            <button
              type="button"
              onClick={onLoginClick}
              className="text-xs font-medium text-white hover:text-red-100 transition-colors"
            >
              Log in
            </button>
          )
        )}

        {/* Mobile: Hamburger menu */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center">
              <IconButton aria-label="Menu" variant="ghost" size="md" animated={false}>
                <List weight="bold" />
              </IconButton>
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
