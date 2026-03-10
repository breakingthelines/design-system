'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { AuthorLine } from '#/components/ui/author-line';
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
        'flex gap-3 border-b border-grey-300 px-4 py-4',
        onClick && 'cursor-pointer hover:bg-grey-100/50 transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Left: Avatar */}
      <Avatar size="default" className="shrink-0 mt-0.5">
        {thought.author.avatarUrl && (
          <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
        )}
        <AvatarFallback>{thought.author.initials ?? thought.author.name.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* Right: Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <AuthorLine author={thought.author} showHandle date={thought.createdAt} size="sm" />

        {/* Body text */}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
          {thought.body}
        </p>

        {/* Optional image */}
        {thought.imageUrl && (
          <div className="mt-1 overflow-hidden rounded-sm border border-grey-300">
            <img src={thought.imageUrl} alt="" className="w-full object-cover max-h-80" />
          </div>
        )}

        {/* Engagement */}
        <div className="mt-1">
          <EngagementBar variant="compact" actions={engagementActions} />
        </div>
      </div>
    </article>
  );
}

export { ThoughtCard, type ThoughtCardProps };
