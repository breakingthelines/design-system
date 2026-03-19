'use client';

import * as React from 'react';

import { ArrowsClockwise } from '@phosphor-icons/react';
import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import { useLinkComponent } from '#/components/ui/link-context';
import type { ThoughtItem } from '#/types/content';

interface ThoughtCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  thought: ThoughtItem;
  /** Override engagement actions */
  actions?: EngagementAction[];
  /** Click handler for the card */
  onClick?: () => void;
}

function ThoughtCard({ className, thought, actions, onClick, ...props }: ThoughtCardProps) {
  const Link = useLinkComponent();
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
        'border-b border-grey-300',
        onClick && 'cursor-pointer hover:bg-grey-100/50 transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Repost banner */}
      {thought.repostedBy && (
        <div className="flex items-center gap-1 px-4 pt-3 pl-[76px]">
          <ArrowsClockwise weight="bold" className="size-3.5 text-foreground/40" />
          <span className="text-xs font-medium text-foreground/40">
            <Link
              href={`/@${thought.repostedBy.username}`}
              className="transition-colors hover:text-red-100"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {thought.repostedBy.displayName || thought.repostedBy.username}
            </Link>
            {' '}reposted
          </span>
        </div>
      )}

      <div className={cn('flex gap-3 px-4', thought.repostedBy ? 'pt-2 pb-5' : 'py-5')}>
      {/* Left: Avatar — 48px per Figma */}
      <Avatar className="size-[48px] shrink-0">
        {thought.author.avatarUrl && (
          <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
        )}
        <AvatarFallback>{thought.author.initials ?? thought.author.name.charAt(0)}</AvatarFallback>
      </Avatar>

      {/* Right: Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Reply context */}
        {thought.replyingTo && (
          <span className="text-xs leading-5 text-foreground/50">
            Replying to{' '}
            <Link
              href={`/@${thought.replyingTo.username}`}
              className="text-primary font-medium hover:underline"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              @{thought.replyingTo.username}
            </Link>
          </span>
        )}

        {/* Author header */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {thought.author.handle ? (
              <Link
                href={`/@${thought.author.handle}`}
                className="font-display text-base font-bold leading-normal text-foreground whitespace-nowrap transition-colors hover:text-red-100"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {thought.author.name}
              </Link>
            ) : (
              <span className="font-display text-base font-bold leading-normal text-foreground whitespace-nowrap">
                {thought.author.name}
              </span>
            )}
            {thought.author.verified && <VerifiedBadge size="sm" />}
          </div>
          {thought.author.handle && (
            <Link
              href={`/@${thought.author.handle}`}
              className="text-xs leading-6 text-foreground/50 whitespace-nowrap transition-colors hover:text-foreground/80"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              @{thought.author.handle}
            </Link>
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
        {thought.body && (
          <p className="font-serif text-sm leading-[18px] text-foreground whitespace-pre-line">
            {thought.body}
          </p>
        )}

        {/* GIF / image attachment */}
        {(thought.gifUrl || thought.imageUrl) && (
          <div className="max-w-[280px] overflow-hidden rounded-[6px] border border-grey-300">
            <img
              src={thought.gifUrl || thought.imageUrl}
              alt=""
              className="block max-h-[220px] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content context */}
        {thought.contentContext && (
          <span className="text-xs leading-5 text-foreground/50">
            on{' '}
            <Link
              href={thought.contentContext.href}
              className="font-medium text-foreground/70 transition-colors hover:text-red-100"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {thought.contentContext.title}
            </Link>
          </span>
        )}

        {/* Engagement — compact variant, gap-2 between actions */}
        <EngagementBar variant="compact" actions={engagementActions} />
      </div>
      </div>
    </article>
  );
}

export { ThoughtCard, type ThoughtCardProps };
