'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Heart, Chats } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { useTilt } from '#/hooks/use-tilt';
import { formatCount } from '#/lib/format';
import type { ContentItem } from '#/types/content';

/* ─────────────────────────────────────────────────
 * HeroCard — full-width featured banner
 * Figma node 146:6156 — 1144×480px
 *
 * Key specs from Figma:
 *  - Full-bleed image with angled gradient overlay
 *  - Content overlay positioned bottom-left
 *  - H2 title: Bold 28px, tracking -0.84px
 *  - Author accent bar: red 5px + name semibold 12px
 *  - Excerpt: serif font, 14px, leading 18, grey-400
 *  - Engagement: 24px icons, semibold 14px counts
 *  - Progress bar: 6 segments, 4px height
 *  - Shadow: 0 4px 48px rgba(0,0,0,0.25)
 *  - Mouse-tracking 3D tilt on hover
 * ───────────────────────────────────────────────── */

interface HeroCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  item: ContentItem;
  /** Total slides for progress indicator */
  totalSlides?: number;
  /** Current active slide (0-indexed) */
  activeSlide?: number;
  /** Card click handler */
  onClick?: () => void;
  /** Link href */
  href?: string;
  /** Slide change handler */
  onSlideChange?: (index: number) => void;
}

function HeroCard({
  className,
  item,
  totalSlides = 6,
  activeSlide = 0,
  onClick,
  href,
  onSlideChange,
  ...props
}: HeroCardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};

  // Mouse-tracking 3D tilt — gentle for the large hero card
  const tilt = useTilt(4);

  return (
    <motion.article
      data-slot="hero-card"
      style={{ transformPerspective: 1200, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      whileHover={{}}
      transition={motionTokens.spring.gentle}
      className={cn(
        'group/hero-card relative w-full overflow-hidden shadow-[0_4px_48px_rgba(0,0,0,0.25)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...props}
    >
      <Wrapper className="block relative" {...wrapperProps}>
        {/* ── Background image + gradient overlay ─── */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-grey-300 sm:aspect-[16/7] lg:aspect-[1144/480]">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="size-full object-cover"
            />
          )}
          {/* Angled gradient: transparent top-right → black 0.75 bottom-left */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(235deg, rgba(0,0,0,0) 33.4%, rgba(0,0,0,0.75) 79.17%, rgba(0,0,0,0.75) 100%)',
            }}
          />
        </div>

        {/* ── Content overlay ────────────────────── */}
        <div className="absolute inset-y-0 left-4 flex w-[280px] flex-col items-start justify-end pb-6 sm:left-8 sm:w-[340px] sm:pb-[44px]">
          <div className="flex flex-col gap-4 sm:gap-8">
            {/* Text content block */}
            <div className="flex flex-col gap-2 sm:gap-4">
              {/* Title */}
              <h2 className="font-[family-name:var(--font-content)] text-lg font-bold leading-tight tracking-[-0.54px] text-white sm:max-w-[331px] sm:text-[28px] sm:leading-none sm:tracking-[-0.84px]">
                {item.title}
              </h2>

              {/* Author accent bar — double red bars */}
              <div className="inline-flex items-center gap-1">
                <span className="flex gap-[2px]">
                  <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
                  <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
                </span>
                <span className="text-xs font-semibold leading-4 tracking-[-0.36px] text-white">
                  {item.author.name}
                </span>
              </div>

              {/* Excerpt — hidden on mobile to save space */}
              {item.excerpt && (
                <p className="hidden line-clamp-2 font-serif text-sm font-normal leading-[18px] text-[#ccc4c4] sm:block">
                  {item.excerpt}
                </p>
              )}

              {/* Engagement bar — like + comment */}
              <div className="flex items-center gap-3.5">
                <div className="inline-flex items-center gap-[5px]">
                  <Heart weight="fill" className="size-3 text-white sm:size-3.5" />
                  <span className="text-xs font-semibold tracking-[-0.42px] text-white sm:text-sm">
                    {formatCount(item.stats.likes)}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 overflow-hidden p-[5px] sm:gap-2.5">
                  <Chats weight="regular" className="size-4 text-white sm:size-5" />
                  <span className="text-xs font-semibold tracking-[-0.42px] text-white sm:text-sm">
                    {formatCount(item.stats.comments ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar — 6 segments, 4px height */}
            <div className="flex w-[120px] gap-2 sm:w-[172px] sm:gap-2.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors cursor-pointer',
                    i === activeSlide ? 'bg-red-100' : 'bg-white/20 hover:bg-white/40'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onSlideChange?.(i);
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.article>
  );
}

export { HeroCard, type HeroCardProps };
