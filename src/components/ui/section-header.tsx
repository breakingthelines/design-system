import * as React from 'react';

import { cn } from '#/lib/utils';

interface SectionHeaderProps extends React.ComponentProps<'div'> {
  /** Section title text, rendered uppercase */
  label: string;
  /** Optional "More >" link */
  moreHref?: string;
  /** Custom label for the more link */
  moreLabel?: string;
  /** Click handler for the more link (alternative to moreHref) */
  onMoreClick?: () => void;
}

function SectionHeader({
  className,
  label,
  moreHref,
  moreLabel = 'More',
  onMoreClick,
  ...props
}: SectionHeaderProps) {
  const MoreTag = moreHref ? 'a' : 'button';
  const moreProps = moreHref
    ? { href: moreHref }
    : { type: 'button' as const, onClick: onMoreClick };

  return (
    <div
      data-slot="section-header"
      className={cn('flex items-center justify-between gap-4', className)}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xs tracking-[0.15em] uppercase text-foreground">
          {label}
        </h2>
        <div className="h-0.5 w-8 bg-red-100" />
      </div>
      {(moreHref || onMoreClick) && (
        <MoreTag
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          {...moreProps}
        >
          {moreLabel} &gt;
        </MoreTag>
      )}
    </div>
  );
}

export { SectionHeader, type SectionHeaderProps };
