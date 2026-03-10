'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';

export interface ProfileTab {
  id: string;
  label: string;
}

interface ProfileTabsProps extends Omit<React.ComponentProps<'nav'>, 'children'> {
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  /** Layout ID namespace for Framer Motion (defaults to "profile-tabs") */
  layoutId?: string;
}

function ProfileTabs({
  className,
  tabs,
  activeTab,
  onTabChange,
  layoutId = 'profile-tabs',
  ...props
}: ProfileTabsProps) {
  return (
    <nav
      data-slot="profile-tabs"
      className={cn('flex items-center gap-0 border-b border-grey-300', className)}
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
              'relative px-6 py-3 text-sm font-medium transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-red-100"
                transition={motionTokens.spring.snappy}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export { ProfileTabs, type ProfileTabsProps };
