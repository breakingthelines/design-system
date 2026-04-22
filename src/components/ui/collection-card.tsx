'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { useTilt } from '#/hooks/use-tilt';
import { Image } from '#/components/ui/image';
import { useLinkComponent } from '#/components/ui/link-context';
import type { CollectionItem } from '#/types/content';

const collectionCardVariants = cva(
  'group/collection-card overflow-hidden text-white transition-colors',
  {
    variants: {
      variant: {
        grid: 'flex flex-col backdrop-blur-[20px]',
        list: 'flex flex-col backdrop-blur-[20px]',
      },
    },
    defaultVariants: {
      variant: 'grid',
    },
  }
);

type CollectionCardVariant = 'grid' | 'list';

interface CollectionCardProps extends Omit<React.ComponentProps<'article'>, 'children'> {
  variant?: CollectionCardVariant;
  item: CollectionItem;
  onClick?: () => void;
  href?: string;
  creatorHref?: string;
  viewTransitionName?: string;
}

function CreatorAccent({
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
      data-slot="creator-accent"
      className={cn('inline-flex items-center gap-1 group/creator', href && 'relative z-10')}
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
          href && 'group-hover/creator:text-red-100'
        )}
      >
        {name}
      </span>
    </Tag>
  );
}

function typeLabel(type?: CollectionItem['collectionType']): string | undefined {
  if (!type) return undefined;
  switch (type) {
    case 'podcast':
      return 'Podcast';
    case 'video':
      return 'Video';
    case 'newsletter':
      return 'Newsletter';
    case 'visual':
      return 'Visual';
    case 'article':
      return 'Articles';
    case 'mixed':
      return 'Collection';
    default:
      return undefined;
  }
}

function itemCountLabel(type: CollectionItem['collectionType'], count: number): string {
  let unit: string;
  if (type === 'podcast') {
    unit = count === 1 ? 'episode' : 'episodes';
  } else if (type === 'video') {
    unit = count === 1 ? 'video' : 'videos';
  } else if (type === 'article') {
    unit = count === 1 ? 'article' : 'articles';
  } else if (type === 'newsletter') {
    unit = count === 1 ? 'issue' : 'issues';
  } else {
    unit = count === 1 ? 'item' : 'items';
  }
  return `${count} ${unit}`;
}

function CollectionCard({
  className,
  variant,
  item,
  onClick,
  href,
  creatorHref,
  viewTransitionName,
  ...props
}: CollectionCardProps) {
  const isList = variant === 'list';
  const LinkComponent = useLinkComponent();
  const vtStyle = viewTransitionName ? { viewTransitionName } : undefined;

  const tilt = useTilt(isList ? 3 : 8);
  const label = typeLabel(item.collectionType);
  const meta = item.itemCount != null ? itemCountLabel(item.collectionType, item.itemCount) : undefined;

  if (isList) {
    return (
      <motion.article
        data-slot="collection-card"
        style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        whileHover={{ y: -4 }}
        transition={motionTokens.spring.gentle}
        className={cn(collectionCardVariants({ variant, className }), 'relative')}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        {...props}
      >
        <div className={cn('flex items-start gap-4', onClick && 'cursor-pointer')}>
          {href ? (
            <LinkComponent
              href={href}
              className="h-[86px] w-[86px] shrink-0 overflow-hidden"
              style={vtStyle}
              tabIndex={-1}
            >
              <Image
                src={item.artworkUrl}
                alt={item.name}
                className="size-full"
                imgClassName="object-cover transition-transform duration-300"
              />
            </LinkComponent>
          ) : (
            <div className="h-[86px] w-[86px] shrink-0 overflow-hidden" style={vtStyle}>
              <Image
                src={item.artworkUrl}
                alt={item.name}
                className="size-full"
                imgClassName="object-cover transition-transform duration-300"
              />
            </div>
          )}

          <div className="flex min-h-[86px] min-w-0 flex-1 flex-col gap-2">
            {href ? (
              <LinkComponent href={href} className="group/title">
                <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white transition-colors group-hover/title:text-red-100">
                  {item.name}
                </h3>
              </LinkComponent>
            ) : (
              <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white">
                {item.name}
              </h3>
            )}
            {item.creator?.name && (
              <CreatorAccent name={item.creator.name} href={creatorHref} muted />
            )}
            <div className="mt-auto flex items-center gap-2 text-[11px] tracking-[-0.33px] text-white/40">
              {label && <span className="uppercase">{label}</span>}
              {label && meta && <span aria-hidden>·</span>}
              {meta && <span>{meta}</span>}
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      data-slot="collection-card"
      style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      whileHover={{ y: -6 }}
      transition={motionTokens.spring.gentle}
      className={cn(collectionCardVariants({ variant, className }), 'relative')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...props}
    >
      <div className={cn('flex flex-col', onClick && 'cursor-pointer')}>
        {href ? (
          <LinkComponent
            href={href}
            className="aspect-square w-full shrink-0 overflow-hidden"
            style={vtStyle}
            tabIndex={-1}
          >
            <Image
              src={item.artworkUrl}
              alt={item.name}
              className="size-full"
              imgClassName="object-cover transition-transform duration-300"
            />
          </LinkComponent>
        ) : (
          <div className="aspect-square w-full shrink-0 overflow-hidden" style={vtStyle}>
            <Image
              src={item.artworkUrl}
              alt={item.name}
              className="size-full"
              imgClassName="object-cover transition-transform duration-300"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 pt-6">
          <div className="flex flex-col gap-4 pr-4">
            <div className="flex flex-col gap-3">
              {item.creator?.name && (
                <CreatorAccent name={item.creator.name} href={creatorHref} />
              )}
              {href ? (
                <LinkComponent href={href} className="group/title">
                  <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-none tracking-[-0.48px] text-white transition-colors group-hover/title:text-red-100">
                    {item.name}
                  </h3>
                </LinkComponent>
              ) : (
                <h3 className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-none tracking-[-0.48px] text-white">
                  {item.name}
                </h3>
              )}
            </div>

            {item.description && (
              <p className="line-clamp-2 font-serif text-sm font-normal leading-[18px] tracking-[-0.126px] text-[#ccc4c4]">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] tracking-[-0.33px] text-white/40">
            {label && <span className="uppercase">{label}</span>}
            {label && meta && <span aria-hidden>·</span>}
            {meta && <span>{meta}</span>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export {
  CollectionCard,
  collectionCardVariants,
  type CollectionCardProps,
  type CollectionCardVariant,
};
