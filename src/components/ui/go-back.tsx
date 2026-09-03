'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { CaretLeft } from '@phosphor-icons/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import type { VariantFn } from '#/lib/cva';

export type GoBackVariant = 'default' | 'subtle';

export type GoBackSize = 'sm' | 'md';

const goBackVariants: VariantFn<{ variant?: GoBackVariant | null; size?: GoBackSize | null }> = cva(
  'group/go-back inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full py-1 pl-1 pr-3.5 font-sans font-bold tracking-[-0.28px] transition-colors outline-none backdrop-blur-sm disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white',
        subtle: 'bg-transparent text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
      } satisfies Record<GoBackVariant, string>,
      size: {
        sm: 'text-xs pr-3 [&_[data-slot=go-back-well]]:size-5 [&_[data-slot=go-back-well]_svg]:size-[9px]',
        md: 'text-sm [&_[data-slot=go-back-well]]:size-6 [&_[data-slot=go-back-well]_svg]:size-3',
      } satisfies Record<GoBackSize, string>,
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
  /** Renders just the circular chevron well — no label, symmetric padding.
   *  Opt-in (default false, unaffected existing behavior). The `label` is
   *  still used as the accessible name (`aria-label`) since removing the
   *  text node would otherwise leave the button unnamed. Callers that need a
   *  responsive icon-only-below-a-breakpoint control (e.g. SiteNav's
   *  content-page Go-back slot reclaiming width at narrow viewports) render
   *  two `GoBack`s side by side and toggle visibility with Tailwind
   *  responsive classes — same dual-render pattern SiteNav already uses for
   *  Search text/icon and the notification bell's desktop/mobile triggers. */
  iconOnly?: boolean;
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
  iconOnly = false,
  'aria-label': ariaLabelProp,
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
      // Icon-only drops the label's own pr-3/pr-3.5 (sized for trailing
      // text) down to the well's own pl-1, so the button reads as a
      // symmetric circle rather than a chevron with dead space trailing it.
      className={cn(goBackVariants({ variant, size, className }), iconOnly && 'pr-1')}
      disabled={disabled}
      render={render}
      nativeButton={resolvedNativeButton}
      aria-label={ariaLabelProp ?? (iconOnly ? label : undefined)}
      {...props}
    >
      <span
        data-slot="go-back-well"
        aria-hidden="true"
        className="inline-flex items-center justify-center rounded-full bg-white/[0.12] transition-colors group-hover/go-back:bg-white/[0.2]"
      >
        <CaretLeft weight="bold" />
      </span>
      {!iconOnly && label}
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
