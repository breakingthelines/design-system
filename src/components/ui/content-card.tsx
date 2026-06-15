'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { useTilt } from '#/hooks/use-tilt';
import { EngagementBar, type EngagementAction } from '#/components/ui/engagement-bar';
import { Image } from '#/components/ui/image';
import { useLinkComponent } from '#/components/ui/link-context';
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
type MotionSafeArticleProps = Omit<
  React.ComponentProps<'article'>,
  'children' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
>;

interface ContentCardProps extends MotionSafeArticleProps {
  /** Card layout variant */
  variant?: ContentCardVariant;
  item: ContentItem;
  /** Engagement action handlers */
  actions?: EngagementAction[];
  /** Card click handler */
  onClick?: () => void;
  /** Link href for the content (title + image) */
  href?: string;
  /** Link href for the author profile */
  authorHref?: string;
  /**
   * CSS `view-transition-name` applied to the image container for shared-element
   * transitions. Use this for a STATIC name when the card is guaranteed unique on
   * the page. For listings where the same content can appear in two rails (which
   * would collide and abort the transition), prefer leaving this unset: the image
   * container always carries `data-vt-content-id={item.id}`, so the host can stamp
   * a `view-transition-name` onto only the clicked card at navigation time (see the
   * platform's hero-morph click handler).
   */
  viewTransitionName?: string;
}

/* ─────────────────────────────────────────────────
 * Author accent bar — red 5px bar + name
 * Optionally wraps in a link when authorHref is provided
 * ───────────────────────────────────────────────── */
function AuthorAccent({
  name,
  muted = false,
  href,
}: {
  name: string;
  muted?: boolean;
  href?: string;
}) {
  const LinkComponent = useLinkComponent();
  const Tag = href ? LinkComponent : 'div';
  const tagProps = href ? { href } : {};

  return (
    <Tag
      data-slot="author-accent"
      className={cn('inline-flex items-center gap-1 group/author', href && 'relative z-10')}
      {...tagProps}
    >
      <span className="flex gap-[2px]">
        <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
        <span className="h-4 w-[3px] shrink-0 rounded-[1px] bg-red-100" />
      </span>
      <span
        className={cn(
          'text-xs font-semibold leading-4 tracking-[-0.36px] transition-colors',
          muted ? 'text-[#ccc4c4]' : 'text-white',
          href && 'group-hover/author:text-red-100'
        )}
      >
        {name}
      </span>
    </Tag>
  );
}

function ContentCard({
  className,
  variant,
  item,
  actions,
  onClick,
  href,
  authorHref,
  viewTransitionName,
  ...props
}: ContentCardProps) {
  const isList = variant === 'list';
  const isPortrait = variant === 'portrait';
  const LinkComponent = useLinkComponent();
  const vtStyle = viewTransitionName ? { viewTransitionName } : undefined;

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
        className={cn(contentCardVariants({ variant, className }), 'relative')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        {...props}
      >
        <div className={cn('flex items-start gap-4', onClick && 'cursor-pointer')}>
          {/* Thumbnail — 108×86 */}
          {href ? (
            <LinkComponent
              href={href}
              className="h-[86px] w-[108px] shrink-0 overflow-hidden"
              style={vtStyle}
              data-vt-content-id={item.id}
              tabIndex={-1}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                presentation={item.imagePresentation}
                className="size-full"
                imgClassName="transition-transform duration-300"
              />
            </LinkComponent>
          ) : (
            <div
              className="h-[86px] w-[108px] shrink-0 overflow-hidden"
              style={vtStyle}
              data-vt-content-id={item.id}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                presentation={item.imagePresentation}
                className="size-full"
                imgClassName="transition-transform duration-300"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex min-h-[86px] min-w-0 flex-1 flex-col gap-4">
            {/* Title + Author */}
            <div className="flex flex-col gap-2">
              {href ? (
                <LinkComponent href={href} className="group/title">
                  <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white transition-colors group-hover/title:text-red-100">
                    {item.title}
                  </h3>
                </LinkComponent>
              ) : (
                <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white">
                  {item.title}
                </h3>
              )}
              <AuthorAccent name={item.author.name} href={authorHref} muted />
            </div>

            {/* Engagement */}
            <div className="mt-auto">
              <EngagementBar variant="compact" actions={engagementActions} />
            </div>
          </div>
        </div>
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
        className={cn(contentCardVariants({ variant, className }), 'relative')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        {...props}
      >
        <div className={cn('flex flex-col', onClick && 'cursor-pointer')}>
          {/* Portrait image — tall crop */}
          {href ? (
            <LinkComponent
              href={href}
              className="aspect-[2/3] w-full overflow-hidden"
              style={vtStyle}
              data-vt-content-id={item.id}
              tabIndex={-1}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                presentation={item.imagePresentation}
                className="size-full"
                imgClassName="transition-transform duration-300"
              />
            </LinkComponent>
          ) : (
            <div
              className="aspect-[2/3] w-full overflow-hidden"
              style={vtStyle}
              data-vt-content-id={item.id}
            >
              <Image
                src={item.imageUrl}
                alt={item.title}
                presentation={item.imagePresentation}
                className="size-full"
                imgClassName="transition-transform duration-300"
              />
            </div>
          )}

          {/* Content below image */}
          <div className="flex flex-col gap-2 pt-6">
            {authorHref ? (
              <LinkComponent href={authorHref} className="group/author">
                <h3 className="font-[family-name:var(--font-content)] text-xl font-semibold leading-tight tracking-[-0.6px] text-white transition-colors group-hover/author:text-red-100">
                  {item.author.name}
                </h3>
              </LinkComponent>
            ) : (
              <h3 className="font-[family-name:var(--font-content)] text-xl font-semibold leading-tight tracking-[-0.6px] text-white">
                {item.author.name}
              </h3>
            )}
            {item.excerpt && (
              <p className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-normal leading-[18px] tracking-[-0.126px] text-[#ccc4c4]">
                {item.excerpt}
              </p>
            )}
            <div className="mt-1">
              <EngagementBar variant="compact" actions={engagementActions} />
            </div>
          </div>
        </div>
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
      className={cn(contentCardVariants({ variant, className }), 'relative')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...props}
    >
      <div className={cn('flex flex-col', onClick && 'cursor-pointer')}>
        {/* Image — fills width, tall crop (~364px at 366 wide) */}
        {href ? (
          <LinkComponent
            href={href}
            className="aspect-[328/364] w-full shrink-0 overflow-hidden"
            style={vtStyle}
            data-vt-content-id={item.id}
            tabIndex={-1}
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              presentation={item.imagePresentation}
              className="size-full"
              imgClassName="transition-transform duration-300"
            />
          </LinkComponent>
        ) : (
          <div
            className="aspect-[328/364] w-full shrink-0 overflow-hidden"
            style={vtStyle}
            data-vt-content-id={item.id}
          >
            <Image
              src={item.imageUrl}
              alt={item.title}
              presentation={item.imagePresentation}
              className="size-full"
              imgClassName="transition-transform duration-300"
            />
          </div>
        )}

        {/* Content area — 24px gap from image */}
        <div className="flex flex-col gap-3 pt-6">
          {/* Author + Title + Excerpt block — pr-4 */}
          <div className="flex flex-col gap-4 pr-4">
            {/* Author accent + Title */}
            <div className="flex flex-col gap-3">
              <AuthorAccent name={item.author.name} href={authorHref} />
              {href ? (
                <LinkComponent href={href} className="group/title">
                  <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-none tracking-[-0.48px] text-white transition-colors group-hover/title:text-red-100">
                    {item.title}
                  </h3>
                </LinkComponent>
              ) : (
                <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-none tracking-[-0.48px] text-white">
                  {item.title}
                </h3>
              )}
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
      </div>
    </motion.article>
  );
}

export { ContentCard, contentCardVariants, type ContentCardProps, type ContentCardVariant };
