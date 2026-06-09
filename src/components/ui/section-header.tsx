'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { Button } from '#/components/ui/button';
import { useLinkComponent } from '#/components/ui/link-context';

interface SectionHeaderProps extends React.ComponentProps<'div'> {
  /** Section title text, rendered uppercase */
  label: string;
  /**
   * Sub-line rendered beneath the title bar. Used for freshness signals
   * ("Updated 6h ago") and other muted captions. Not bolded.
   */
  subLine?: React.ReactNode;
  /** Show "Show more" button */
  moreHref?: string;
  /** Custom label for the more button */
  moreLabel?: string;
  /** Click handler for the more button (alternative to moreHref) */
  onMoreClick?: () => void;
}

function SectionHeader({
  className,
  label,
  subLine,
  moreHref,
  moreLabel = 'Show more',
  onMoreClick,
  ...props
}: SectionHeaderProps) {
  const LinkComponent = useLinkComponent();

  return (
    <div
      data-slot="section-header"
      className={cn('flex items-center justify-between gap-4', className)}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xs font-bold tracking-[6px] uppercase text-foreground">
          {label}
        </h2>
        <div className="h-0.5 w-full bg-red-100" />
        {subLine ? (
          <span data-slot="section-header-sub-line" className="text-xs text-white/50">
            {subLine}
          </span>
        ) : null}
      </div>
      {(moreHref || onMoreClick) && (
        <Button
          variant="outline"
          size="default"
          render={moreHref ? <LinkComponent href={moreHref} /> : undefined}
          onClick={onMoreClick}
        >
          {moreLabel}
        </Button>
      )}
    </div>
  );
}

export { SectionHeader, type SectionHeaderProps };
