'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';

import { BtlPlaceholder } from '#/components/ui/btl-placeholder';
import { cn } from '#/lib/utils';
import { useSourceChain } from '#/components/ui/entity-asset-image';
import { motion as motionTokens } from '#/tokens/motion';
import type { VariantFn } from '#/lib/cva';

export type AvatarBorderColor = 'default' | 'red' | 'cyan' | 'white' | 'grey';

const avatarBorderVariants: VariantFn<{ borderColor?: AvatarBorderColor | null }> = cva('ring-2', {
  variants: {
    borderColor: {
      default: 'ring-background',
      red: 'ring-red-100',
      cyan: 'ring-cyan-500',
      white: 'ring-white',
      grey: 'ring-grey-300',
    } satisfies Record<AvatarBorderColor, string>,
  },
  defaultVariants: {
    borderColor: 'default',
  },
});

export type AvatarStatus = 'active' | 'typing' | 'idle';

export type AvatarSize = 'default' | 'sm' | 'lg' | 'xl' | 'xxl';

/**
 * Maps an avatar image address to the addresses to try, in order, for an
 * avatar of `size`. Return `[src]` (or anything of length 1) to leave it
 * alone. A typical resolver puts a small resized copy first and the original
 * second, so a copy that does not exist falls back to the original before the
 * initials.
 */
export type AvatarSourceResolver = (src: string, size: AvatarSize) => readonly string[];

const AvatarSourceResolverContext = React.createContext<AvatarSourceResolver | null>(null);
const AvatarSizeContext = React.createContext<AvatarSize>('default');

interface AvatarSourceProviderProps {
  /** Keep this stable (module level or memoised): it is a render dependency. */
  resolve: AvatarSourceResolver;
  children?: React.ReactNode;
}

/**
 * Gives every `AvatarImage` below it a source resolver, including the ones
 * inside composite components (bylines, thought rows, the nav avatar), so an
 * app can serve resized avatars without threading a prop through each one.
 * `ChainedAvatarImage` is not affected: its `sources` are already a chain.
 */
function AvatarSourceProvider({ resolve, children }: AvatarSourceProviderProps) {
  return (
    <AvatarSourceResolverContext.Provider value={resolve}>
      {children}
    </AvatarSourceResolverContext.Provider>
  );
}

interface AvatarProps
  extends AvatarPrimitive.Root.Props, VariantProps<typeof avatarBorderVariants> {
  size?: AvatarSize;
  /** Collaboration cursor color - overrides borderColor when provided */
  cursorColor?: string;
  /** Background color for fallback initials */
  fallbackColor?: string;
  /** Collaboration status indicator */
  status?: AvatarStatus;
  /** Enable hover/tap animations */
  interactive?: boolean;
}

// Size classes applied directly for reliable Tailwind JIT compilation
const sizeClasses = {
  sm: 'size-6',
  default: 'size-8',
  lg: 'size-10',
  xl: 'size-16',
  xxl: 'size-[164px]',
} as const;

function Avatar({
  className,
  size = 'default',
  borderColor,
  cursorColor,
  status = 'active',
  interactive = false,
  style,
  children,
  ...props
}: AvatarProps) {
  const ringStyle = cursorColor
    ? ({
        '--tw-ring-color': cursorColor,
        '--pulse-color': `${cursorColor}40`,
      } as React.CSSProperties)
    : undefined;

  const statusStyles = {
    active: '',
    typing: 'animate-pulse-ring',
    idle: 'opacity-60',
  };

  const content = (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      data-status={status}
      className={cn(
        'relative flex shrink-0 select-none rounded-full group/avatar',
        sizeClasses[size],
        'after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten',
        !cursorColor && avatarBorderVariants({ borderColor }),
        cursorColor && 'ring-2',
        statusStyles[status],
        className
      )}
      style={{ ...style, ...ringStyle }}
      {...props}
    >
      <AvatarSizeContext.Provider value={size}>{children}</AvatarSizeContext.Provider>
    </AvatarPrimitive.Root>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={motionTokens.presets.avatar.hover}
        whileTap={motionTokens.presets.avatar.tap}
        transition={motionTokens.spring.pop}
        className="inline-flex"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

function BaseAvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full rounded-full object-cover', className)}
      {...props}
    />
  );
}

/**
 * The avatar photo. Under an `AvatarSourceProvider`, `src` goes through the
 * provider's resolver with the enclosing `Avatar`'s size; when that yields
 * more than one address they are tried in order, as `ChainedAvatarImage`
 * does, and the `AvatarFallback` shows only once every address has failed.
 */
function AvatarImage({ src, ...props }: AvatarPrimitive.Image.Props) {
  const resolve = React.useContext(AvatarSourceResolverContext);
  const size = React.useContext(AvatarSizeContext);
  const sources = React.useMemo(
    () => (resolve && src ? resolve(src, size) : undefined),
    [resolve, src, size]
  );
  if (sources && sources.length > 1) {
    return <ChainedAvatarImage sources={sources} {...props} />;
  }
  return <BaseAvatarImage src={sources?.[0] ?? src} {...props} />;
}

export interface ChainedAvatarImageProps extends Omit<AvatarPrimitive.Image.Props, 'src'> {
  /**
   * Candidate addresses in probe order — typically `entityAssetCandidates(...)`.
   * The first address that loads renders; when every address has failed the
   * component renders nothing and the surrounding `AvatarFallback` shows.
   */
  sources: readonly string[];
}

/**
 * An AvatarImage that walks an address chain itself, so callers cannot get the
 * failure wiring wrong.
 *
 * base-ui's Avatar.Image preloads its src on a DETACHED window.Image and only
 * mounts the rendered <img> once that preloader reports loaded — on a 404
 * there is never an element in the DOM, so the `onError`/`imgRef` contract
 * that `useSourceChain` documents is silently unsatisfiable here. Every
 * consumer that hand-wired a chain through AvatarImage shipped the same bug
 * (platform#948, the Arena club pill stuck on initials with the provider
 * crest at 200): the walk never advanced past its first dead address.
 *
 * `onLoadingStatusChange` is the callback base-ui actually fires for the
 * preloader's failure, and it is what advances the walk. `onError` and the
 * mount ref stay wired for the one narrow case where a mounted <img> can
 * still fail independently (preloader satisfied from cache, real fetch
 * evicted between). This component is the Avatar counterpart of
 * `EntityAssetImage`: pass `sources`, keep your `AvatarFallback`, done.
 */
function ChainedAvatarImage({
  sources,
  onError: callerOnError,
  onLoadingStatusChange: callerOnStatus,
  ...props
}: ChainedAvatarImageProps) {
  const { src, onError, imgRef } = useSourceChain(sources);
  if (!src) return null;
  // A caller hears about a failure only when the last address fails: an
  // earlier one just moves the walk on.
  const isLast = src === sources[sources.length - 1];
  return (
    <BaseAvatarImage
      key={src}
      ref={imgRef}
      {...props}
      src={src}
      onError={(event) => {
        onError();
        if (isLast) callerOnError?.(event);
      }}
      onLoadingStatusChange={(status) => {
        if (status === 'error') onError();
        if (status !== 'error' || isLast) callerOnStatus?.(status);
      }}
    />
  );
}

interface AvatarFallbackProps extends AvatarPrimitive.Fallback.Props {
  /** Background color for the fallback */
  fallbackColor?: string;
  /** Use the branded BTL logo fallback instead of text initials */
  branded?: boolean;
}

function AvatarFallback({
  className,
  fallbackColor,
  branded = false,
  style,
  children,
  ...props
}: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'relative isolate flex size-full items-center justify-center overflow-hidden rounded-full text-sm font-medium',
        branded ? 'bg-transparent text-white' : 'bg-muted text-muted-foreground',
        'group-data-[size=sm]/avatar:text-xs',
        'group-data-[size=xl]/avatar:text-xl',
        'group-data-[size=xxl]/avatar:text-4xl',
        className
      )}
      style={!branded && fallbackColor ? { ...style, backgroundColor: fallbackColor } : style}
      {...props}
    >
      {branded ? (
        <>
          <BtlPlaceholder variant="avatar" showBrand={!children} className="absolute inset-0" />
          {children ? (
            <span className="relative z-10 font-display font-semibold uppercase tracking-[-0.08em] text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
              {children}
            </span>
          ) : null}
        </>
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute bottom-0 right-0 z-10 inline-flex select-none items-center justify-center rounded-full bg-primary bg-blend-color text-primary-foreground ring-2 ring-background',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        'group-data-[size=xl]/avatar:size-4 group-data-[size=xl]/avatar:[&>svg]:size-2.5 group-data-[size=xl]/avatar:ring-[3px]',
        'group-data-[size=xxl]/avatar:size-6 group-data-[size=xxl]/avatar:[&>svg]:size-4 group-data-[size=xxl]/avatar:ring-4',
        className
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn('group/avatar-group flex -space-x-2', className)}
      {...props}
    />
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-background',
        'group-has-data-[size=sm]/avatar-group:size-6',
        'group-has-data-[size=lg]/avatar-group:size-10',
        '[&>svg]:size-4 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5',
        className
      )}
      {...props}
    />
  );
}

/** Animated avatar wrapper for enter/exit animations in lists */
interface AnimatedAvatarProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

function AnimatedAvatar({ children, ...props }: AnimatedAvatarProps) {
  return (
    <motion.div
      initial={motionTokens.presets.avatarEnter.initial}
      animate={motionTokens.presets.avatarEnter.animate}
      exit={motionTokens.presets.avatarExit.exit}
      transition={motionTokens.spring.shift}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarSourceProvider,
  ChainedAvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
  AnimatedAvatar,
  avatarBorderVariants,
};
