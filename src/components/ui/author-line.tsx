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
      sm: 'gap-1.5',
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
  /** Date string (e.g. "2h ago", "Mar 3") */
  date?: string;
  /** Read time (e.g. "5 min read") */
  readTime?: string;
  /** Show the author handle */
  showHandle?: boolean;
}

const tierVariantMap = {
  free: 'secondary',
  pro: 'default',
  premium: 'outline',
} as const;

function AuthorLine({
  className,
  size,
  author,
  date,
  readTime,
  showHandle = false,
  ...props
}: AuthorLineProps) {
  const avatarSize = size === 'sm' ? 'sm' : 'default';
  const badgeSize = size === 'sm' ? 'sm' : 'default';

  return (
    <div data-slot="author-line" className={cn(authorLineVariants({ size, className }))} {...props}>
      <Avatar size={avatarSize}>
        {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
        <AvatarFallback>{author.initials ?? author.name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="inline-flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
        <span className={cn('font-medium text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {author.name}
        </span>
        {author.verified && <VerifiedBadge size={badgeSize} />}
        {showHandle && author.handle && (
          <span className="text-xs text-muted-foreground">@{author.handle}</span>
        )}
        {(date || readTime) && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            {date && <span className="text-xs text-muted-foreground">{date}</span>}
            {readTime && (
              <>
                {date && <span className="text-xs text-muted-foreground">·</span>}
                <span className="text-xs text-muted-foreground">{readTime}</span>
              </>
            )}
          </>
        )}
        {author.tier && author.tier !== 'free' && (
          <Badge variant={tierVariantMap[author.tier]} className="ml-1">
            {author.tier}
          </Badge>
        )}
      </div>
    </div>
  );
}

export { AuthorLine, authorLineVariants, type AuthorLineProps };
