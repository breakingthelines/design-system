'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import type { ThoughtItem } from '#/types/content';

interface ThoughtCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  thought: ThoughtItem;
  /** Override engagement actions */
  actions?: EngagementAction[];
  /** Click handler for the card */
  onClick?: () => void;
}

function ThoughtCard({ className, thought, actions, onClick, ...props }: ThoughtCardProps) {
  const engagementActions: EngagementAction[] = actions ?? [
    { type: 'comment', count: thought.stats.comments },
    { type: 'like', count: thought.stats.likes, active: thought.liked },
    ...(thought.stats.reposts !== undefined
      ? [{ type: 'repost' as const, count: thought.stats.reposts, active: thought.reposted }]
      : []),
  ];

  return (
    <article
      data-slot="thought-card"
      className={cn(
        'flex gap-3 border-b border-grey-300 px-4 py-5',
        onClick && 'cursor-pointer hover:bg-grey-100/50 transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Left: Avatar — 48px per Figma */}
      <Avatar className="size-[48px] shrink-0">
        {thought.author.avatarUrl && (
          <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
        )}
        <AvatarFallback>{thought.author.initials ?? thought.author.name.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* Right: Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Comment Header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="font-display text-base font-bold leading-normal text-foreground whitespace-nowrap">
              {thought.author.name}
            </span>
            {thought.author.verified && <VerifiedBadge size="sm" />}
          </div>
          {thought.author.handle && (
            <span className="text-xs leading-6 text-foreground/50 whitespace-nowrap">
              @{thought.author.handle}
            </span>
          )}
          {thought.createdAt && (
            <>
              <span className="size-0.5 shrink-0 rounded-full bg-foreground/50" />
              <span className="text-xs font-medium leading-6 text-foreground/50 whitespace-nowrap">
                {thought.createdAt}
              </span>
            </>
          )}
        </div>

        {/* Body text — Book Antiqua 14px / 18px per Figma */}
        <p className="font-serif text-sm leading-[18px] text-foreground whitespace-pre-line">
          {thought.body}
        </p>

        {/* Optional image */}
        {thought.imageUrl && (
          <div className="overflow-hidden rounded-sm border border-grey-300">
            <img src={thought.imageUrl} alt="" className="w-full object-cover max-h-80" />
          </div>
        )}

        {/* Engagement — compact variant, gap-2 between actions */}
        <EngagementBar variant="compact" actions={engagementActions} />
      </div>
    </article>
  );
}

export { ThoughtCard, type ThoughtCardProps };
