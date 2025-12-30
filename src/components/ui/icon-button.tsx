import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-full transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        ghost:
          'backdrop-blur-[15px] bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white',
        outline:
          'backdrop-blur-[15px] border border-grey-300 bg-grey-100 hover:bg-grey-200 text-white',
        solid:
          'bg-red-300 border border-red-100 hover:bg-red-400 text-white',
      },
      size: {
        sm: 'size-[18px] [&_svg]:size-[10px]',
        md: 'size-[24px] [&_svg]:size-[14px]',
        lg: 'size-[32px] [&_svg]:size-[18px]',
        xl: 'size-[40px] [&_svg]:size-[24px]',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
)

export interface IconButtonProps
  extends Omit<ButtonPrimitive.Props, 'className'>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string
  className?: string
  children?: React.ReactNode
}

function IconButton({
  className,
  variant,
  size,
  children,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { IconButton, iconButtonVariants }
