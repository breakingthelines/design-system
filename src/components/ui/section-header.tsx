import * as React from 'react';

import { cn } from '#/lib/utils';
import { Button } from '#/components/ui/button';

interface SectionHeaderProps extends React.ComponentProps<'div'> {
  /** Section title text, rendered uppercase */
  label: string;
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
  moreHref,
  moreLabel = 'Show more',
  onMoreClick,
  ...props
}: SectionHeaderProps) {
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
      </div>
      {(moreHref || onMoreClick) && (
        <Button
          variant="outline"
          size="default"
          render={moreHref ? <a href={moreHref} /> : undefined}
          onClick={onMoreClick}
        >
          {moreLabel}
        </Button>
      )}
    </div>
  );
}

export { SectionHeader, type SectionHeaderProps };
