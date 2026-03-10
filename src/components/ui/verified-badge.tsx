'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';

const verifiedBadgeVariants = cva('inline-flex shrink-0 items-center justify-center', {
  variants: {
    size: {
      sm: 'size-3',
      default: 'size-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

interface VerifiedBadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof verifiedBadgeVariants> {}

function VerifiedBadge({ className, size, ...props }: VerifiedBadgeProps) {
  return (
    <span
      data-slot="verified-badge"
      className={cn(verifiedBadgeVariants({ size, className }))}
      role="img"
      aria-label="Verified"
      {...props}
    >
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <circle cx="8" cy="8" r="8" className="fill-red-100" />
        <path
          d="M6.5 11.5L3.5 8.5L4.55 7.45L6.5 9.4L11.45 4.45L12.5 5.5L6.5 11.5Z"
          className="fill-white"
        />
      </svg>
    </span>
  );
}

export { VerifiedBadge, verifiedBadgeVariants, type VerifiedBadgeProps };
