'use client';

import * as React from 'react';

import { BtlLogo, BtlWordmark } from '#/components/ui/btl-logo';
import { cn } from '#/lib/utils';

export type BtlPlaceholderBrand = 'wordmark' | 'logo' | 'none';

export interface BtlPlaceholderProps extends React.ComponentProps<'div'> {
  variant?: 'media' | 'avatar';
  /**
   * Which brand element to render. Defaults: 'wordmark' for media, 'logo' for avatar.
   * Pass 'logo' on small thumbnails where the wordmark text would be unreadable.
   */
  brand?: BtlPlaceholderBrand;
  /** @deprecated Prefer `brand="none"`. Kept for backward compatibility. */
  showBrand?: boolean;
  /**
   * Inset framing line that creates a "card-inside-a-card" look. Defaults to false —
   * pass `framed` when the placeholder is large enough to benefit from the
   * decorative inset (e.g. profile headers). Grid thumbnails look cleaner flush.
   */
  framed?: boolean;
}

function BtlPlaceholder({
  className,
  variant = 'media',
  brand,
  showBrand,
  framed = false,
  ...props
}: BtlPlaceholderProps) {
  const isAvatar = variant === 'avatar';
  const resolvedBrand: BtlPlaceholderBrand =
    brand ?? (showBrand === false ? 'none' : isAvatar ? 'logo' : 'wordmark');

  return (
    <div
      data-slot="btl-placeholder"
      data-variant={variant}
      data-brand={resolvedBrand}
      className={cn(
        '@container relative isolate flex size-full items-center justify-center overflow-hidden bg-[#050505] text-white',
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

      {framed ? (
        <div
          aria-hidden
          className="absolute inset-[10%] rounded-[inherit] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]"
        />
      ) : null}

      {resolvedBrand !== 'none' ? (
        <div className="relative z-10 flex size-full items-center justify-center">
          {resolvedBrand === 'logo' ? (
            <BtlLogo className="h-[44%] w-auto max-w-[58%]" />
          ) : (
            <BtlWordmark
              className="gap-[clamp(8px,2.8cqi,11px)]"
              iconClassName="size-[clamp(26px,11cqi,40px)]"
              textClassName="text-[clamp(10px,5.5cqi,12px)] font-semibold tracking-[-0.04em] text-white"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export { BtlPlaceholder };
