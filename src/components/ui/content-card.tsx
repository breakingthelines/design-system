'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { AuthorLine } from '#/components/ui/author-line';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import type { ContentItem } from '#/types/content';

const contentCardVariants = cva(
  'group/content-card overflow-hidden bg-card text-card-foreground transition-colors',
  {
    variants: {
      variant: {
        grid: 'flex flex-col',
        list: 'flex flex-row gap-4',
      },
    },
    defaultVariants: {
      variant: 'grid',
    },
  }
);

interface ContentCardProps
  extends
    Omit<React.ComponentProps<'article'>, 'children'>,
    VariantProps<typeof contentCardVariants> {
  item: ContentItem;
  /** Engagement action handlers */
  actions?: EngagementAction[];
  /** Card click handler */
  onClick?: () => void;
  /** Link href (alternative to onClick) */
  href?: string;
}

function ContentCard({
  className,
  variant,
  item,
  actions,
  onClick,
  href,
  ...props
}: ContentCardProps) {
  const isList = variant === 'list';
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  const engagementActions: EngagementAction[] = actions ?? [
    { type: 'like', count: item.stats.likes },
    { type: 'comment', count: item.stats.comments },
    ...(item.stats.reposts !== undefined
      ? [{ type: 'repost' as const, count: item.stats.reposts }]
      : []),
  ];

  return (
    <motion.article
      data-slot="content-card"
      whileHover={motionTokens.presets.contentCard.hover}
      transition={motionTokens.spring.gentle}
      className={cn(contentCardVariants({ variant, className }))}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <Wrapper
        className={cn('flex', isList ? 'flex-row gap-4' : 'flex-col', onClick && 'cursor-pointer')}
        {...wrapperProps}
      >
        {/* Image */}
        {item.imageUrl && (
          <div
            className={cn(
              'overflow-hidden bg-grey-300',
              isList ? 'h-24 w-36 shrink-0 sm:h-28 sm:w-44' : 'aspect-[16/10] w-full'
            )}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="size-full object-cover transition-transform duration-300 group-hover/content-card:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className={cn('flex min-w-0 flex-1 flex-col', !isList && 'gap-2 pt-3')}>
          <AuthorLine
            author={item.author}
            date={item.publishedAt}
            readTime={item.readTime}
            size="sm"
          />
          <h3
            className={cn(
              'font-display font-bold leading-snug text-foreground',
              isList ? 'text-sm line-clamp-2' : 'mt-1.5 text-sm line-clamp-2'
            )}
          >
            {item.title}
          </h3>
          {item.excerpt && !isList && (
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {item.excerpt}
            </p>
          )}
          {item.excerpt && isList && (
            <p className="hidden text-xs leading-relaxed text-muted-foreground line-clamp-1 sm:block">
              {item.excerpt}
            </p>
          )}
          <div className="mt-auto pt-2">
            <EngagementBar variant="compact" actions={engagementActions} />
          </div>
        </div>
      </Wrapper>
    </motion.article>
  );
}

export { ContentCard, contentCardVariants, type ContentCardProps };
