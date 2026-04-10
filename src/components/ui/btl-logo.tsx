import { useId } from 'react';

import { cn } from '#/lib/utils';

export interface BtlLogoProps extends React.SVGAttributes<SVGSVGElement> {
  /** Tailwind size class — defaults to `size-7` */
  className?: string;
}

export interface BtlWordmarkProps extends React.ComponentProps<'div'> {
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

/**
 * BTL bracket logo — two offset bracket shapes with red gradient fill.
 * Uses `useId()` for gradient uniqueness so multiple instances render correctly.
 */
export function BtlLogo({ className, ...props }: BtlLogoProps) {
  const uid = useId();
  const gl = `${uid}-l`;
  const gr = `${uid}-r`;

  return (
    <svg
      viewBox="0 0 29.09 28.02"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-7', className)}
      aria-label="Breaking The Lines"
      {...props}
    >
      <defs>
        <linearGradient
          id={gl}
          x1="0"
          y1="14.01"
          x2="12.467"
          y2="14.01"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E20613" />
          <stop offset="1" stopColor="#E5332A" />
        </linearGradient>
        <linearGradient
          id={gr}
          x1="16.628"
          y1="14.01"
          x2="29.091"
          y2="14.01"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E20613" />
          <stop offset="1" stopColor="#E5332A" />
        </linearGradient>
      </defs>
      <path d="M12.467 0V8.516H9.049V19.513H12.467V28.022H0V0H12.467Z" fill={`url(#${gl})`} />
      <path d="M29.091 0V28.022H16.628V19.513H20.046V8.516H16.628V0H29.091Z" fill={`url(#${gr})`} />
    </svg>
  );
}

export function BtlWordmark({
  className,
  iconClassName,
  textClassName,
  showText = true,
  ...props
}: BtlWordmarkProps) {
  return (
    <div className={cn('flex shrink-0 items-center gap-[10.9px]', className)} {...props}>
      <BtlLogo className={cn('size-7 shrink-0', iconClassName)} />
      {showText ? (
        <div
          className={cn(
            'flex flex-col gap-0.5 text-[14px] font-semibold leading-none tracking-[-0.42px] text-white',
            textClassName
          )}
        >
          <span>breaking</span>
          <span>the lines</span>
        </div>
      ) : null}
    </div>
  );
}
