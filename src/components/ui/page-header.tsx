'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * PageHeader — the title bar at the top of a page, and the controls that act
 * on the whole page.
 *
 * Not `SectionHeader`, which is a different animal: an uppercase display
 * heading with a rule under it and a "Show more" affordance, sized to introduce
 * a block inside a page. This one names the page.
 *
 * Three things were fixed on the way in, and all three are why the local
 * version was adopted by two pages out of twenty-one while nineteen hand-rolled
 * a heading instead:
 *
 *   - It rendered `h2`. A page's own name is `h1`, and every hand-rolled header
 *     in the estate agrees. `level` is there for the surface nested inside
 *     another page that genuinely needs to step down.
 *   - It rendered a hardcoded "BTL Admin" kicker with no way to remove it, so
 *     any page outside one dashboard inherited a false eyebrow. `kicker` is now
 *     a prop and there is no default.
 *   - It took no `className` and exported no props type.
 *
 * `actions` sits opposite the title and wraps under it on a narrow viewport
 * rather than squeezing the title, which is the layout every hand-rolled
 * `.titleRow` in the estate arrived at independently.
 * ──────────────────────────────────────────────────────────────────────────── */

export type PageHeaderLevel = 1 | 2 | 3;

const pageHeaderVariants: VariantFn<{ bordered?: boolean | null }> = cva(
  cn(
    'flex w-full min-w-0 gap-6 text-foreground',
    // The title column and the actions share a baseline while they fit on one
    // line, and stack from the start edge once they do not.
    'flex-col items-start md:flex-row md:items-center md:justify-between'
  ),
  {
    variants: {
      bordered: {
        true: 'border-b border-border pb-4',
        false: '',
      } satisfies Record<'true' | 'false', string>,
    },
    defaultVariants: {
      bordered: false,
    },
  }
);

const pageHeaderTitleVariants: VariantFn<{ level?: PageHeaderLevel | null }> = cva(
  'min-w-0 font-semibold tracking-[-0.02em] text-foreground',
  {
    variants: {
      level: {
        1: 'text-2xl',
        2: 'text-xl',
        3: 'text-lg',
      } satisfies Record<`${PageHeaderLevel}`, string>,
    },
    defaultVariants: {
      level: 1,
    },
  }
);

export interface PageHeaderProps
  extends Omit<React.ComponentProps<'div'>, 'title'>, VariantProps<typeof pageHeaderVariants> {
  /** The page's name. */
  title: React.ReactNode;
  /** One line under the title saying what the page is for. */
  description?: React.ReactNode;
  /**
   * Small uppercase line above the title — a product or section name. There is
   * no default: a header that does not need one must not be given one.
   */
  kicker?: React.ReactNode;
  /**
   * Page-level controls, opposite the title. Wraps under it below `md`.
   */
  actions?: React.ReactNode;
  /**
   * Heading level for `title`. `1` unless the page already has an `h1` above
   * this header.
   */
  level?: PageHeaderLevel;
  /** Rendered under the description, inside the title column. Filters, tabs, a breadcrumb. */
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  actionsClassName?: string;
}

function PageHeader({
  title,
  description,
  kicker,
  actions,
  level = 1,
  bordered = false,
  className,
  titleClassName,
  actionsClassName,
  children,
  ...props
}: PageHeaderProps) {
  const Heading = `h${level}` as 'h1' | 'h2' | 'h3';

  return (
    <div
      data-slot="page-header"
      className={cn(pageHeaderVariants({ bordered }), className)}
      {...props}
    >
      <div data-slot="page-header-titles" className="flex min-w-0 flex-col gap-1.5">
        {kicker ? (
          <p
            data-slot="page-header-kicker"
            className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground"
          >
            {kicker}
          </p>
        ) : null}
        <Heading
          data-slot="page-header-title"
          className={cn(pageHeaderTitleVariants({ level }), titleClassName)}
        >
          {title}
        </Heading>
        {description ? (
          <p
            data-slot="page-header-description"
            className="max-w-prose text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div
          data-slot="page-header-actions"
          className={cn(
            'flex shrink-0 flex-wrap items-center gap-2 max-md:w-full',
            actionsClassName
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export { PageHeader, pageHeaderVariants, pageHeaderTitleVariants };
