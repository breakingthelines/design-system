'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

export type VerifiedBadgeSize = 'sm' | 'default';

const verifiedBadgeVariants: VariantFn<{ size?: VerifiedBadgeSize | null }> = cva(
  'inline-flex shrink-0 items-center justify-center',
  {
    variants: {
      size: {
        sm: 'size-3',
        default: 'size-4',
      } satisfies Record<VerifiedBadgeSize, string>,
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

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
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
        <mask
          id="vb-mask"
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="32"
          height="32"
        >
          <rect width="32" height="32" fill="#D9D9D9" />
        </mask>
        <g mask="url(#vb-mask)">
          <rect x="8" y="9.333" width="14.667" height="16" fill="white" />
          <path
            d="M14.6 16.933L12.667 15.033C12.422 14.789 12.117 14.666 11.75 14.666C11.383 14.666 11.067 14.8 10.8 15.066C10.556 15.311 10.433 15.622 10.433 16C10.433 16.377 10.556 16.689 10.8 16.933L13.667 19.8C13.933 20.066 14.244 20.2 14.6 20.2C14.956 20.2 15.267 20.066 15.533 19.8L21.2 14.133C21.467 13.866 21.594 13.555 21.583 13.2C21.572 12.844 21.444 12.533 21.2 12.266C20.933 12 20.617 11.861 20.25 11.85C19.883 11.839 19.567 11.966 19.3 12.233L14.6 16.933ZM10.867 29L8.933 25.733L5.267 24.933C4.933 24.866 4.667 24.694 4.467 24.416C4.267 24.139 4.189 23.833 4.233 23.5L4.6 19.733L2.1 16.866C1.878 16.622 1.767 16.333 1.767 16C1.767 15.666 1.878 15.377 2.1 15.133L4.6 12.266L4.233 8.5C4.189 8.166 4.267 7.861 4.467 7.583C4.667 7.305 4.933 7.133 5.267 7.066L8.933 6.266L10.867 3C11.044 2.711 11.289 2.516 11.6 2.416C11.911 2.316 12.222 2.333 12.533 2.466L16 3.933L19.467 2.466C19.778 2.333 20.089 2.316 20.4 2.416C20.711 2.516 20.956 2.711 21.133 3L23.067 6.266L26.733 7.066C27.067 7.133 27.333 7.305 27.533 7.583C27.733 7.861 27.811 8.166 27.767 8.5L27.4 12.266L29.9 15.133C30.122 15.377 30.233 15.666 30.233 16C30.233 16.333 30.122 16.622 29.9 16.866L27.4 19.733L27.767 23.5C27.811 23.833 27.733 24.139 27.533 24.416C27.333 24.694 27.067 24.866 26.733 24.933L23.067 25.733L21.133 29C20.956 29.289 20.711 29.483 20.4 29.583C20.089 29.683 19.778 29.666 19.467 29.533L16 28.066L12.533 29.533C12.222 29.666 11.911 29.683 11.6 29.583C11.289 29.483 11.044 29.289 10.867 29Z"
            fill="url(#vb-gradient)"
          />
        </g>
        <defs>
          <linearGradient
            id="vb-gradient"
            x1="16"
            y1="2.352"
            x2="16"
            y2="29.647"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EB0000" />
            <stop offset="1" stopColor="#850000" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export { VerifiedBadge, verifiedBadgeVariants, type VerifiedBadgeProps };
