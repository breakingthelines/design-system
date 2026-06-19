import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { Badge } from '#/components/ui/badge';
import type { ContentAuthor } from '#/types/content';

const authorLineVariants = cva('inline-flex items-center group/author-line', {
  variants: {
    size: {
      sm: 'gap-2',
      default: 'gap-2',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface AuthorLineProps
  extends Omit<React.ComponentProps<'div'>, 'children'>, VariantProps<typeof authorLineVariants> {
  author: ContentAuthor;
  /** Date string (e.g. "2h ago", "Just now") */
  date?: string;
  /** Read time (e.g. "5 min read") */
  readTime?: string;
  /** Show the author handle */
  showHandle?: boolean;
  /** Show avatar before the name */
  showAvatar?: boolean;
}

export const tierVariantMap = {
  Free: 'secondary',
  Pro: 'default',
  'Line Breaker': 'outline',
} as const;

function AuthorLine({
  className,
  size,
  author,
  date,
  readTime,
  showHandle = false,
  showAvatar = false,
  ...props
}: AuthorLineProps) {
  const avatarSize = size === 'sm' ? 'sm' : 'default';
  const badgeSize = size === 'sm' ? 'sm' : 'default';

  return (
    <div data-slot="author-line" className={cn(authorLineVariants({ size, className }))} {...props}>
      {showAvatar && (
        <Avatar size={avatarSize}>
          {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
          <AvatarFallback>{author.initials ?? author.name.charAt(0)}</AvatarFallback>
        </Avatar>
      )}

      {/* Name + Verified Badge */}
      <div className="inline-flex items-center gap-1">
        <span
          className={cn(
            'font-display font-bold leading-normal text-foreground',
            size === 'sm' ? 'text-sm' : 'text-base'
          )}
        >
          {author.name}
        </span>
        {author.verified && <VerifiedBadge size={badgeSize} />}
      </div>

      {/* Handle */}
      {showHandle && author.handle && (
        <span className="text-xs leading-6 text-foreground opacity-50">@{author.handle}</span>
      )}

      {/* Dot + Date */}
      {(date || readTime) && (
        <>
          <span className="inline-block size-[2px] shrink-0 rounded-full bg-foreground opacity-50" />
          {date && (
            <span className="text-xs font-medium leading-6 text-foreground opacity-50">{date}</span>
          )}
          {readTime && (
            <>
              {date && (
                <span className="inline-block size-[2px] shrink-0 rounded-full bg-foreground opacity-50" />
              )}
              <span className="text-xs font-medium leading-6 text-foreground opacity-50">
                {readTime}
              </span>
            </>
          )}
        </>
      )}

      {/* Tier badge */}
      {author.tier && author.tier !== 'Free' && (
        <Badge variant={tierVariantMap[author.tier]} className="ml-1">
          {author.tier}
        </Badge>
      )}
    </div>
  );
}

export { AuthorLine, authorLineVariants, type AuthorLineProps };
