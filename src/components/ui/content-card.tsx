'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { useTilt } from '#/hooks/use-tilt';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import type { ContentItem } from '#/types/content';

/* ─────────────────────────────────────────────────
 * Variants
 * Grid  → tall card, image on top (Figma 80:1052, 366×526)
 * List  → horizontal card (Figma 720:9926, 559.5×110)
 * ───────────────────────────────────────────────── */
const contentCardVariants = cva('group/content-card overflow-hidden text-white transition-colors', {
  variants: {
    variant: {
      grid: 'flex flex-col backdrop-blur-[20px]',
      list: 'flex flex-col backdrop-blur-[20px]',
      portrait: 'flex flex-col backdrop-blur-[20px]',
    },
  },
  defaultVariants: {
    variant: 'grid',
  },
});

type ContentCardVariant = 'grid' | 'list' | 'portrait';

interface ContentCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  /** Card layout variant */
  variant?: ContentCardVariant;
  item: ContentItem;
  /** Engagement action handlers */
  actions?: EngagementAction[];
  /** Card click handler */
  onClick?: () => void;
  /** Link href (alternative to onClick) */
  href?: string;
}

/* ─────────────────────────────────────────────────
 * Author accent bar — red 5px bar + name
 * Matches the inline author treatment from Figma
 * (not using AuthorLine component — Figma shows a
 *  simpler bar + name pattern without avatar)
 * ───────────────────────────────────────────────── */
function AuthorAccent({ name, muted = false }: { name: string; muted?: boolean }) {
  return (
    <div data-slot="author-accent" className="inline-flex items-center gap-1">
      <span className="flex gap-[2px]">
        <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
        <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-4 tracking-[-0.36px]',
          muted ? 'text-[#ccc4c4]' : 'text-white'
        )}
      >
        {name}
      </span>
    </div>
  );
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
  const isPortrait = variant === 'portrait';
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  // Mouse-tracking 3D tilt — gentler for list cards
  const tilt = useTilt(isList ? 3 : 8);

  const engagementActions: EngagementAction[] = actions ?? [
    { type: 'like', count: item.stats.likes },
    { type: 'comment', count: item.stats.comments ?? 0 },
  ];

  /* ── LIST variant ─────────────────────────────── */
  if (isList) {
    return (
      <motion.article
        data-slot="content-card"
        style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        whileHover={{ y: -4 }}
        transition={motionTokens.spring.gentle}
        className={cn(contentCardVariants({ variant, className }))}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        {...props}
      >
        <Wrapper
          className={cn('flex items-start gap-4', onClick && 'cursor-pointer')}
          {...wrapperProps}
        >
          {/* Thumbnail — 108×86 */}
          {item.imageUrl && (
            <div className="h-[86px] w-[108px] shrink-0 overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="size-full object-cover transition-transform duration-300"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex min-h-[86px] min-w-0 flex-1 flex-col gap-4">
            {/* Title + Author */}
            <div className="flex flex-col gap-2">
              <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white">
                {item.title}
              </h3>
              <AuthorAccent name={item.author.name} muted />
            </div>

            {/* Engagement */}
            <div className="mt-auto">
              <EngagementBar variant="compact" actions={engagementActions} />
            </div>
          </div>
        </Wrapper>
      </motion.article>
    );
  }

  /* ── PORTRAIT variant ────────────────────────── */
  if (isPortrait) {
    return (
      <motion.article
        data-slot="content-card"
        style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        whileHover={{ y: -6 }}
        transition={motionTokens.spring.gentle}
        className={cn(contentCardVariants({ variant, className }))}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        {...props}
      >
        <Wrapper className={cn('flex flex-col', onClick && 'cursor-pointer')} {...wrapperProps}>
          {/* Portrait image — tall crop */}
          {item.imageUrl && (
            <div className="aspect-[2/3] w-full overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="size-full object-cover transition-transform duration-300"
              />
            </div>
          )}

          {/* Content below image */}
          <div className="flex flex-col gap-2 pt-6">
            <h3 className="font-[family-name:var(--font-content)] text-xl font-semibold leading-tight tracking-[-0.6px] text-white">
              {item.author.name}
            </h3>
            {item.excerpt && (
              <p className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-normal leading-[18px] tracking-[-0.126px] text-[#ccc4c4]">
                {item.excerpt}
              </p>
            )}
            <div className="mt-1">
              <EngagementBar variant="compact" actions={engagementActions} />
            </div>
          </div>
        </Wrapper>
      </motion.article>
    );
  }

  /* ── GRID variant (default) ───────────────────── */
  return (
    <motion.article
      data-slot="content-card"
      style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      whileHover={{ y: -6 }}
      transition={motionTokens.spring.gentle}
      className={cn(contentCardVariants({ variant, className }))}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...props}
    >
      <Wrapper className={cn('flex flex-col', onClick && 'cursor-pointer')} {...wrapperProps}>
        {/* Image — fills width, tall crop (~364px at 366 wide) */}
        {item.imageUrl && (
          <div className="aspect-[328/364] w-full shrink-0 overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="size-full object-cover transition-transform duration-300"
            />
          </div>
        )}

        {/* Content area — 24px gap from image */}
        <div className="flex flex-col gap-3 pt-6">
          {/* Author + Title + Excerpt block — pr-4 */}
          <div className="flex flex-col gap-4 pr-4">
            {/* Author accent + Title */}
            <div className="flex flex-col gap-3">
              <AuthorAccent name={item.author.name} />
              <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-none tracking-[-0.48px] text-white">
                {item.title}
              </h3>
            </div>

            {/* Excerpt */}
            {item.excerpt && (
              <p className="line-clamp-2 font-serif text-sm font-normal leading-[18px] tracking-[-0.126px] text-[#ccc4c4]">
                {item.excerpt}
              </p>
            )}
          </div>

          {/* Engagement bar */}
          <EngagementBar variant="compact" actions={engagementActions} />
        </div>
      </Wrapper>
    </motion.article>
  );
}

export { ContentCard, contentCardVariants, type ContentCardProps, type ContentCardVariant };
