'use client';

import * as React from 'react';

import { ArrowsClockwise, Clock } from '@phosphor-icons/react';
import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import { useLinkComponent } from '#/components/ui/link-context';
import { ThoughtBody } from '#/components/ui/thought-body';
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
  const shareHref =
    thought.permalinkHref ||
    (thought.author.handle && thought.id
      ? `/@${thought.author.handle}/thoughts/${thought.id}`
      : '');
  const handleShare = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!shareHref || typeof window === 'undefined') return;
      const url = new URL(shareHref, window.location.origin).toString();
      if (navigator.share) {
        void navigator.share({ title: `Thought by ${thought.author.name}`, url }).catch(() => {});
        return;
      }
      void navigator.clipboard?.writeText(url).catch(() => {});
    },
    [shareHref, thought.author.name]
  );
  const baseActions: EngagementAction[] = actions ?? [
    { type: 'comment', count: thought.stats.comments },
    { type: 'like', count: thought.stats.likes, active: thought.liked },
    ...(thought.stats.reposts !== undefined
      ? [{ type: 'repost' as const, count: thought.stats.reposts, active: thought.reposted }]
      : []),
  ];
  const engagementActions = withThoughtUtilityActions(
    baseActions,
    shareHref ? handleShare : undefined
  );
  const primaryActions = engagementActions.filter((action) => action.type !== 'share');
  const shareActions = engagementActions.filter((action) => action.type === 'share');

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
            </Link>{' '}
            reposted
          </span>
        </div>
      )}

      <div className={cn('flex gap-3 px-4', thought.repostedBy ? 'pt-2 pb-5' : 'py-5')}>
        {/* Left: Avatar — 48px per Figma */}
        <Avatar className="size-[48px] shrink-0">
          {thought.author.avatarUrl && (
            <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
          )}
          <AvatarFallback>
            {thought.author.initials ?? thought.author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {/* Right: Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Author header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {thought.author.handle ? (
                <Link
                  href={`/@${thought.author.handle}`}
                  className="font-content text-[15px] font-semibold leading-5 text-foreground whitespace-nowrap transition-colors hover:text-red-100"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  {thought.author.name}
                </Link>
              ) : (
                <span className="font-content text-[15px] font-semibold leading-5 text-foreground whitespace-nowrap">
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
                {thought.permalinkHref ? (
                  <Link
                    href={thought.permalinkHref}
                    className="text-xs font-medium leading-6 text-foreground/50 whitespace-nowrap transition-colors hover:text-foreground/70"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {thought.createdAt}
                  </Link>
                ) : (
                  <span className="text-xs font-medium leading-6 text-foreground/50 whitespace-nowrap">
                    {thought.createdAt}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Quoted passage anchor — links back to the source passage */}
          {thought.anchor?.type === 'text' &&
            thought.anchor.text?.selectedText &&
            (() => {
              const base = thought.contentContext?.href;
              const sep = base?.includes('?') ? '&' : '?';
              const anchorHref = base
                ? `${base}${sep}highlight=${encodeURIComponent(thought.anchor!.text!.blockId)}&offset=${thought.anchor!.text!.textOffset}`
                : undefined;
              const block = (
                <div
                  className={cn(
                    'rounded-md border-l-2 border-red-100/40 bg-foreground/[0.03] py-1.5 pl-3 pr-2',
                    anchorHref &&
                      'cursor-pointer transition-colors hover:bg-foreground/[0.06] hover:border-red-100/60'
                  )}
                >
                  <p className="font-content text-xs leading-relaxed text-foreground/40 italic line-clamp-3">
                    &ldquo;{thought.anchor!.text!.selectedText}&rdquo;
                  </p>
                </div>
              );
              return anchorHref ? (
                <Link href={anchorHref} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  {block}
                </Link>
              ) : (
                block
              );
            })()}

          {/* Timestamp anchor badge — links back to the source at that time */}
          {thought.anchor?.type === 'timestamp' &&
            thought.anchor.label &&
            (() => {
              const base = thought.contentContext?.href;
              const sep = base?.includes('?') ? '&' : '?';
              const anchorHref = base
                ? `${base}${sep}t=${thought.anchor!.startSeconds}`
                : undefined;
              const badge = (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full bg-red-100/10 px-2 py-0.5 text-red-100',
                    anchorHref && 'cursor-pointer transition-colors hover:bg-red-100/20'
                  )}
                >
                  <Clock size={10} weight="bold" />
                  <span className="font-content text-[10px] font-semibold tabular-nums">
                    {thought.anchor!.label}
                  </span>
                </span>
              );
              return anchorHref ? (
                <Link href={anchorHref} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  {badge}
                </Link>
              ) : (
                badge
              );
            })()}

          {/* Body text — Book Antiqua 14px / 18px per Figma */}
          {thought.body && (
            <ThoughtBody
              body={thought.body}
              bodyJson={thought.bodyJson}
              className="font-content text-sm leading-[18px] text-foreground"
            />
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

          {/* Footer meta — reply context + content context, stacked */}
          {(thought.replyingTo || thought.contentContext) && (
            <div className="flex flex-col gap-0.5">
              {thought.replyingTo && (
                <span className="text-xs leading-5 text-foreground/50">
                  Replying to{' '}
                  <Link
                    href={thought.replyingTo.href ?? `/@${thought.replyingTo.username}`}
                    className="font-medium text-foreground/70 transition-colors hover:text-red-100"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    @{thought.replyingTo.username}
                  </Link>
                </span>
              )}
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
            </div>
          )}

          {/* Engagement — compact variant, gap-2 between actions */}
          <div className="flex items-center justify-between gap-3">
            <EngagementBar variant="compact" actions={primaryActions} />
            {shareActions.length > 0 && <EngagementBar variant="compact" actions={shareActions} />}
          </div>
        </div>
      </div>
    </article>
  );
}

function withThoughtUtilityActions(
  actions: EngagementAction[],
  onShare?: EngagementAction['onClick']
): EngagementAction[] {
  const actionTypes = new Set(actions.map((action) => action.type));
  return [
    ...actions,
    ...(actionTypes.has('bookmark') ? [] : [{ type: 'bookmark' as const }]),
    ...(actionTypes.has('share') ? [] : [{ type: 'share' as const, onClick: onShare }]),
  ];
}

export { ThoughtCard, type ThoughtCardProps };
