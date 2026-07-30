'use client';

import * as React from 'react';

import { ArrowsClockwise, Clock, UploadSimple } from '@phosphor-icons/react';
import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { Badge } from '#/components/ui/badge';
import { tierVariantMap } from '#/components/ui/author-line';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import { FromGradePill } from '#/components/ui/from-grade-pill';
import { useLinkComponent } from '#/components/ui/link-context';
import { ThoughtBody } from '#/components/ui/thought-body';
import { ThoughtOverflowMenu } from '#/components/ui/thought-overflow-menu';
import type { ThoughtItem } from '#/types/content';

interface ThoughtCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  thought: ThoughtItem;
  /** Override engagement actions */
  actions?: EngagementAction[];
  /** Click handler for the card */
  onClick?: () => void;
  /**
   * Current viewer id. Used to decide whether the destructive Delete item
   * appears in the overflow menu (`thought.publisherId === viewerId`).
   * Optional — when omitted, Delete is never offered.
   */
  viewerId?: string;
  /** Fired when the viewer picks "Expand to article" from the overflow menu. */
  onExpandToArticle?: (thought: ThoughtItem) => void;
  /** Fired when the viewer picks "Report". */
  onReport?: (thought: ThoughtItem) => void;
  /** Fired when the author picks "Delete". */
  onDelete?: (thought: ThoughtItem) => void;
  /**
   * Forwarded to the inner ThoughtBody so a host can render custom block types
   * (e.g. a lineup) read-only.
   */
  blockRenderers?: React.ComponentProps<typeof ThoughtBody>['blockRenderers'];
}

function ThoughtCard({
  className,
  thought,
  actions,
  onClick,
  viewerId,
  onExpandToArticle,
  onReport,
  onDelete,
  blockRenderers,
  ...props
}: ThoughtCardProps) {
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
  const shareAction = engagementActions.find((action) => action.type === 'share');

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
      {/* Repost banner. Aligned to the card padding, not an avatar gutter:
          `pl-[76px]` was arithmetic against the old two-column layout
          (px-4 16 + avatar 48 + gap-3 12), and with the body full width there
          is no gutter to line up with. */}
      {thought.repostedBy && (
        <div className="flex items-center gap-1 px-4 pt-3">
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

      {/* Figma 2142:9201 — the card is a COLUMN of three rows at 12px:
          identity, body, actions. The body is full width rather than indented
          into an avatar gutter, which is the substantive change from the old
          two-column layout: at 14/18 a thought reads far better across the
          whole card than in a column inset by 76px, and full-bleed blocks stop
          needing negative-margin arithmetic to escape that gutter. */}
      <div className={cn('flex flex-col gap-3 px-4', thought.repostedBy ? 'pt-2 pb-5' : 'py-5')}>
        {/* Identity row — avatar beside the stacked name / @handle · time. */}
        <div className="flex items-center gap-3">
          {/* Left: Avatar — 40px per Figma */}
          <Avatar className="size-[40px] shrink-0">
            {thought.author.avatarUrl && (
              <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
            )}
            {/* No avatar image → the branded BTL placeholder (BtlPlaceholder),
              not text initials or a bare “?”. */}
            <AvatarFallback branded />
          </Avatar>

          {/* Name over @handle · time (Figma 2142:9209). Stacking them is what
            stops a long display name pushing the handle and timestamp off the
            row, and it gives the name its own line to be read on.

            The Figma says 8px, but that is measured between text-box-TRIMMED
            boxes, and CSS gap is not: it stacks on top of each line's leading.
            The name is 14px on leading-5 and the handle 12px on leading-[18px],
            so each contributes 3px of half-leading into the space between them.
            A literal gap-2 therefore rendered ~14px of optical gap, nearly
            double the intent, which is why the two lines read as drifting
            apart. gap-0.5 puts it back at 3 + 2 + 3 = 8px on screen. */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              {/* min-w-0 lets this group shrink below its content's natural
                width inside the row (flex items default to min-width:auto,
                which otherwise refuses to shrink and pushes @handle/timestamp
                off-screen for a long display name); `truncate` on the name
                itself is what actually turns that shrink into an ellipsis. */}
              <div className="flex min-w-0 items-center gap-1">
                {thought.author.handle ? (
                  <Link
                    href={`/@${thought.author.handle}`}
                    className="font-content text-sm font-semibold leading-5 text-foreground truncate transition-colors hover:text-red-100"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {thought.author.name}
                  </Link>
                ) : (
                  <span className="font-content text-sm font-semibold leading-5 text-foreground truncate">
                    {thought.author.name}
                  </span>
                )}
                {thought.author.verified && <VerifiedBadge size="sm" />}
                {/* Tier badge — reuses AuthorLine's Badge treatment (Free → no badge) */}
                {thought.author.tier && thought.author.tier !== 'Free' && (
                  <Badge variant={tierVariantMap[thought.author.tier]} className="ml-1">
                    {thought.author.tier}
                  </Badge>
                )}
              </div>
              {/* Overflow `…` — pinned right of the NAME row, so it stays level
                with the name rather than floating between the two lines.
                Renders only when a handler is wired; the menu self-skips a
                no-op render. */}
              <ThoughtOverflowMenu
                thought={thought}
                canDelete={!!viewerId && !!thought.publisherId && thought.publisherId === viewerId}
                onExpandToArticle={onExpandToArticle}
                onReport={onReport}
                onDelete={onDelete}
                tone="light"
                className="ml-auto"
              />
            </div>

            {/* Second line: @handle · time (Figma 3000:10971). 8px apart with a
              2px dot between; both at 50% so the name carries the row. */}
            {(thought.author.handle || thought.createdAt) && (
              <div className="flex items-center gap-2">
                {thought.author.handle && (
                  <Link
                    href={`/@${thought.author.handle}`}
                    className="text-xs leading-[18px] text-foreground/50 whitespace-nowrap transition-colors hover:text-foreground/80"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    @{thought.author.handle}
                  </Link>
                )}
                {thought.author.handle && thought.createdAt && (
                  <span className="size-0.5 shrink-0 rounded-full bg-foreground/50" />
                )}
                {thought.createdAt &&
                  (thought.permalinkHref ? (
                    <Link
                      href={thought.permalinkHref}
                      className="text-xs leading-[18px] text-foreground/50 whitespace-nowrap transition-colors hover:text-foreground/70"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      {thought.createdAt}
                    </Link>
                  ) : (
                    <span className="text-xs leading-[18px] text-foreground/50 whitespace-nowrap">
                      {thought.createdAt}
                    </span>
                  ))}
              </div>
            )}
          </div>
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
            const anchorHref = base ? `${base}${sep}t=${thought.anchor!.startSeconds}` : undefined;
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

        {/* From-grade pill — Wave 6.8. Marks a thought that was spawned
              by a GLOBAL grade fan-out (game-service). Slim row with a
              tiny GradeBox + subject name + match context; tappable when
              the host supplies a matchHref. PRIVATE grades never reach
              this path — privacy is enforced upstream in the fan-out. */}
        {thought.fromGrade && <FromGradePill data={thought.fromGrade} />}

        {/* Body text — Book Antiqua 14px / 18px per Figma */}
        {thought.body && (
          <ThoughtBody
            body={thought.body}
            bodyJson={thought.bodyJson}
            blockRenderers={blockRenderers}
            className="font-content text-sm leading-[18px] text-foreground"
            // Full-bleed game/decorator blocks reach the card edges with a
            // plain -mx-4 now. The old value was `-ml-[76px]`, hand-arithmetic
            // against the avatar gutter (px-4 16 + avatar 48 + gap-3 12) back
            // when the body lived in the right-hand column. The body is full
            // width, so only the card's own 16px padding needs escaping.
            blockClassName="-mx-4"
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

        {/* Actions row (Figma 2142:9364): reply, like, repost, bookmark on
              the left at a fixed 36px rhythm, Share pushed to the far right.

              A fixed gap, NOT `justify-between` inside a 340px box. That box
              spread the four actions by dividing whatever width was left, so
              their spacing shifted with the card's width and a host had to
              fight it back with a descendant-selector override. A fixed rhythm
              is what the design specifies and it looks the same everywhere. */}
        <div className="flex items-center justify-between gap-3">
          <EngagementBar variant="compact" actions={primaryActions} className="gap-9" />
          {shareAction && (
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={(event) => shareAction.onClick?.(event)}
              aria-label="Share"
            >
              <UploadSimple weight="regular" className="size-4" />
              <span>Share</span>
            </button>
          )}
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
