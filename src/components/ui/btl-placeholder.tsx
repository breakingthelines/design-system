'use client';

import * as React from 'react';

import { BtlLogo, BtlWordmark } from '#/components/ui/btl-logo';
import { cn } from '#/lib/utils';

export interface BtlPlaceholderProps extends React.ComponentProps<'div'> {
  variant?: 'media' | 'avatar';
  showBrand?: boolean;
  framed?: boolean;
}

function BtlPlaceholder({
  className,
  variant = 'media',
  showBrand = true,
  framed,
  ...props
}: BtlPlaceholderProps) {
  const isAvatar = variant === 'avatar';
  const shouldShowFrame = framed ?? !isAvatar;

  return (
    <div
      data-slot="btl-placeholder"
      data-variant={variant}
      className={cn(
        'relative isolate flex size-full items-center justify-center overflow-hidden bg-[#050505] text-white',
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-0',
          isAvatar
            ? 'bg-[radial-gradient(circle_at_35%_30%,rgba(229,51,42,0.18),transparent_45%),radial-gradient(circle_at_72%_72%,rgba(226,6,19,0.14),transparent_38%)]'
            : 'bg-[radial-gradient(circle_at_28%_32%,rgba(229,51,42,0.16),transparent_34%),radial-gradient(circle_at_74%_68%,rgba(226,6,19,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]'
        )}
      />

      {shouldShowFrame ? (
        <div
          aria-hidden
          className="absolute inset-[10%] rounded-[inherit] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]"
        />
      ) : null}

      {showBrand ? (
        <div className="relative z-10 flex items-center justify-center">
          {isAvatar ? (
            <BtlLogo className="h-[44%] w-auto max-w-[58%]" />
          ) : (
            <BtlWordmark
              iconClassName="size-7 sm:size-8"
              textClassName="text-[13px] font-semibold tracking-[-0.39px] text-white/68"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export { BtlPlaceholder };
