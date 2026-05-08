'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { CaretLeft } from '@phosphor-icons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';

const goBackVariants = cva(
  'group/go-back inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full py-1 pl-1 pr-3.5 font-display font-bold tracking-[-0.28px] transition-colors outline-none backdrop-blur-sm disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white',
        subtle: 'bg-transparent text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
      },
      size: {
        sm: 'text-xs pr-3 [&_[data-slot=go-back-well]]:size-5 [&_[data-slot=go-back-well]_svg]:size-[9px]',
        md: 'text-sm [&_[data-slot=go-back-well]]:size-6 [&_[data-slot=go-back-well]_svg]:size-3',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface GoBackProps
  extends
    Omit<ButtonPrimitive.Props, 'className' | 'children'>,
    VariantProps<typeof goBackVariants> {
  className?: string;
  /** Text after the chevron. Defaults to "Go back". */
  label?: string;
  /** Enable whileHover/whileTap micro-motion. Default true. */
  animated?: boolean;
}

function GoBack({
  className,
  variant,
  size,
  label = 'Go back',
  animated = true,
  disabled,
  render,
  nativeButton,
  ...props
}: GoBackProps) {
  const resolvedNativeButton =
    nativeButton ??
    (render != null && typeof render === 'object' && 'type' in render && render.type !== 'button'
      ? false
      : undefined);

  const button = (
    <ButtonPrimitive
      data-slot="go-back"
      className={cn(goBackVariants({ variant, size, className }))}
      disabled={disabled}
      render={render}
      nativeButton={resolvedNativeButton}
      {...props}
    >
      <span
        data-slot="go-back-well"
        aria-hidden="true"
        className="inline-flex items-center justify-center rounded-full bg-white/[0.12] transition-colors group-hover/go-back:bg-white/[0.2]"
      >
        <CaretLeft weight="bold" />
      </span>
      {label}
    </ButtonPrimitive>
  );

  if (animated && !disabled) {
    return (
      <motion.span
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={motionTokens.spring.snappy}
        className="inline-flex"
      >
        {button}
      </motion.span>
    );
  }
  return button;
}

export { GoBack, goBackVariants };
