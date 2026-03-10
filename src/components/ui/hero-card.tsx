'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { AuthorLine } from '#/components/ui/author-line';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import type { ContentItem } from '#/types/content';

interface HeroCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  item: ContentItem;
  /** Engagement action handlers */
  actions?: EngagementAction[];
  /** Card click handler */
  onClick?: () => void;
  /** Link href */
  href?: string;
}

function HeroCard({ className, item, actions, onClick, href, ...props }: HeroCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  const engagementActions: EngagementAction[] = actions ?? [
    { type: 'like', count: item.stats.likes },
    { type: 'comment', count: item.stats.comments },
    ...(item.stats.reposts !== undefined
      ? [{ type: 'repost' as const, count: item.stats.reposts }]
      : []),
    { type: 'share' },
  ];

  return (
    <motion.article
      data-slot="hero-card"
      whileHover={motionTokens.presets.heroCard.hover}
      transition={motionTokens.spring.gentle}
      className={cn(
        'group/hero-card relative w-full overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <Wrapper className="block relative" {...wrapperProps}>
        {/* Background image */}
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-grey-300 sm:aspect-[2.5/1]">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="size-full object-cover transition-transform duration-500 group-hover/hero-card:scale-105"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 sm:p-8 lg:p-10">
          <AuthorLine
            author={item.author}
            date={item.publishedAt}
            readTime={item.readTime}
            size="sm"
          />
          <h2 className="font-display text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl max-w-2xl">
            {item.title}
          </h2>
          {item.excerpt && (
            <p className="hidden text-sm leading-relaxed text-white/70 line-clamp-2 sm:block max-w-xl">
              {item.excerpt}
            </p>
          )}
          <EngagementBar variant="compact" actions={engagementActions} />
        </div>
      </Wrapper>
    </motion.article>
  );
}

export { HeroCard, type HeroCardProps };
