'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { Heart, Chats, ArrowsClockwise, BookmarkSimple, ShareNetwork } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { formatCount } from '#/lib/format';
import { motion as motionTokens } from '#/tokens/motion';

const engagementBarVariants = cva('flex items-center', {
  variants: {
    variant: {
      compact: 'gap-2',
      full: 'gap-4',
    },
  },
  defaultVariants: {
    variant: 'compact',
  },
});

export interface EngagementAction {
  type: 'like' | 'comment' | 'repost' | 'bookmark' | 'share';
  count?: number;
  active?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface EngagementBarProps
  extends
    Omit<React.ComponentProps<'div'>, 'children'>,
    VariantProps<typeof engagementBarVariants> {
  actions: EngagementAction[];
}

const iconMap = {
  like: Heart,
  comment: Chats,
  repost: ArrowsClockwise,
  bookmark: BookmarkSimple,
  share: ShareNetwork,
} as const;

const labelMap: Record<EngagementAction['type'], string> = {
  like: 'Like',
  comment: 'Comment',
  repost: 'Repost',
  bookmark: 'Bookmark',
  share: 'Share',
};

function EngagementBar({ className, variant, actions, ...props }: EngagementBarProps) {
  const isFull = variant === 'full';

  return (
    <div
      data-slot="engagement-bar"
      className={cn(engagementBarVariants({ variant, className }))}
      {...props}
    >
      {actions.map((action) => {
        const Icon = iconMap[action.type];
        const isActive = action.active;
        const isLike = action.type === 'like';

        return (
          <motion.button
            key={action.type}
            type="button"
            whileHover={motionTokens.presets.engagementAction.hover}
            whileTap={motionTokens.presets.engagementAction.tap}
            transition={motionTokens.spring.snappy}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1 transition-colors select-none',
              isActive && isLike
                ? 'text-red-100'
                : isActive
                  ? 'text-cyan-500'
                  : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={(event) => action.onClick?.(event)}
            aria-label={labelMap[action.type]}
            aria-pressed={isActive}
          >
            <Icon weight={isActive ? 'fill' : 'regular'} className={isFull ? 'size-5' : 'size-4'} />
            {action.count !== undefined && (
              <span className={cn('text-xs', isFull && 'text-sm')}>
                {formatCount(action.count)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export { EngagementBar, engagementBarVariants, type EngagementBarProps };
