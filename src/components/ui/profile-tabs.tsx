'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

export interface ProfileTab {
  id: string;
  label: string;
}

interface ProfileTabsProps extends Omit<React.ComponentProps<'nav'>, 'children'> {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
}

function ProfileTabs({ className, tabs, activeTab, onTabChange, ...props }: ProfileTabsProps) {
  return (
    <nav
      data-slot="profile-tabs"
      className={cn('flex items-start gap-1 overflow-x-auto scrollbar-none', className)}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'flex h-[35px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] px-4 py-3 text-sm font-semibold tracking-tight transition-colors',
              isActive
                ? 'border border-grey-300 bg-grey-200 text-foreground'
                : 'text-[#807c7c] hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export { ProfileTabs, type ProfileTabsProps };
