'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';

const avatarBorderVariants = cva('ring-2', {
  variants: {
    borderColor: {
      default: 'ring-background',
      red: 'ring-red-100',
      cyan: 'ring-cyan-500',
      white: 'ring-white',
      grey: 'ring-grey-300',
    },
  },
  defaultVariants: {
    borderColor: 'default',
  },
});

export type AvatarStatus = 'active' | 'typing' | 'idle';

interface AvatarProps
  extends AvatarPrimitive.Root.Props, VariantProps<typeof avatarBorderVariants> {
  size?: 'default' | 'sm' | 'lg';
  /** Collaboration cursor color - overrides borderColor when provided */
  cursorColor?: string;
  /** Background color for fallback initials */
  fallbackColor?: string;
  /** Collaboration status indicator */
  status?: AvatarStatus;
  /** Enable hover/tap animations */
  interactive?: boolean;
}

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
        'size-8 data-[size=sm]:size-6 data-[size=lg]:size-10',
        'after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten',
        !cursorColor && avatarBorderVariants({ borderColor }),
        cursorColor && 'ring-2',
        statusStyles[status],
        className
      )}
      style={{ ...style, ...ringStyle }}
      {...props}
    >
      {children}
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

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full rounded-full object-cover', className)}
      {...props}
    />
  );
}

interface AvatarFallbackProps extends AvatarPrimitive.Fallback.Props {
  /** Background color for the fallback */
  fallbackColor?: string;
}

function AvatarFallback({ className, fallbackColor, style, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
        'group-data-[size=sm]/avatar:text-xs',
        className
      )}
      style={fallbackColor ? { ...style, backgroundColor: fallbackColor } : style}
      {...props}
    />
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
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
  AnimatedAvatar,
  avatarBorderVariants,
};
