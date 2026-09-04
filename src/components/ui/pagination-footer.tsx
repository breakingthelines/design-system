'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CaretDownIcon } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * PaginationFooter — the generic footer under a paged list.
 *
 * Three parts, in one wrapping row: a total, the page controls, and a per-page
 * selector. The component owns none of the paging state. It is told which page
 * numbers to draw (`pages`), which one is current, and whether there is
 * anything either side; the host keeps the cursor. `buildPageList` below is the
 * elision the hosts were each writing for themselves.
 *
 * It never scrolls. Prev and Next bracket the page numbers, so a single line
 * that scrolls puts both of them off screen the moment there are more than
 * about five pages — and a suppressed scrollbar leaves nothing to say they are
 * there. Every strip here wraps instead, and no element sets `overflow`.
 * ──────────────────────────────────────────────────────────────────────────── */

/** A page number, or the gap between two runs of them. */
export type PaginationPage = number | '...';

export type PaginationFooterDensity = 'comfortable' | 'compact';

/** The three control shapes in the footer: Prev/Next, a page number, the per-page trigger. */
export type PaginationControlVariant = 'nav' | 'page' | 'trigger';

const paginationFooterVariants: VariantFn<{ density?: PaginationFooterDensity | null }> = cva(
  'flex w-full min-w-0 flex-wrap items-center justify-between gap-3 text-foreground',
  {
    variants: {
      density: {
        comfortable: 'px-4',
        compact: 'px-2',
      } satisfies Record<PaginationFooterDensity, string>,
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

const paginationControlVariants: VariantFn<{
  variant?: PaginationControlVariant | null;
  active?: boolean | null;
}> = cva(
  cn(
    'inline-flex items-center justify-center rounded-btl-sm text-xs tracking-[-0.03em]',
    'transition-colors duration-swift ease-standard motion-reduce:transition-none',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-45',
    // A phone needs a thumb-sized target. The row wraps, so growing the
    // controls costs nothing but height.
    'max-md:min-h-11 max-md:min-w-11'
  ),
  {
    variants: {
      variant: {
        nav: 'bg-muted px-2.5 py-1 text-foreground hover:bg-muted/70',
        page: 'bg-transparent px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground',
        trigger: 'gap-2 bg-muted p-2 text-foreground hover:bg-muted/70',
      } satisfies Record<PaginationControlVariant, string>,
      active: {
        true: 'bg-muted text-foreground',
        false: '',
      } satisfies Record<'true' | 'false', string>,
    },
    defaultVariants: {
      variant: 'page',
      active: false,
    },
  }
);

export interface PaginationFooterProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof paginationFooterVariants> {
  /** Left-hand summary — "Total users: 1,284". Rendered as given. */
  totalLabel: React.ReactNode;
  /** The page numbers to draw, gaps included. See `buildPageList`. */
  pages: readonly PaginationPage[];
  /** The page the list is showing. */
  activePage?: number;
  /** Defaults to `activePage > 1`. */
  hasPrevious?: boolean;
  /** Defaults to "some drawn page is higher than `activePage`". */
  hasNext?: boolean;
  previousLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
  /** Rows currently shown per page. */
  perPage?: number;
  /** Offering these opens the per-page selector. Omit it and the value is read-only. */
  perPageOptions?: readonly number[];
  perPageLabel?: React.ReactNode;
  /** Replaces the caret on the per-page trigger. */
  perPageIcon?: React.ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  /** Accessible name for the page controls. */
  label?: string;
  className?: string;
}

function PaginationFooter({
  totalLabel,
  pages,
  activePage,
  hasPrevious,
  hasNext,
  previousLabel = 'Prev',
  nextLabel = 'Next',
  perPage = 10,
  perPageOptions,
  perPageLabel = 'Show per page:',
  perPageIcon,
  onPrevious,
  onNext,
  onPageChange,
  onPerPageChange,
  label = 'Pagination',
  density = 'comfortable',
  className,
  ...props
}: PaginationFooterProps) {
  const resolvedHasPrevious =
    hasPrevious ?? (typeof activePage === 'number' ? activePage > 1 : false);
  const resolvedHasNext =
    hasNext ??
    (typeof activePage === 'number'
      ? pages.some((page) => typeof page === 'number' && page > activePage)
      : false);

  return (
    <div
      data-slot="pagination-footer"
      className={cn(paginationFooterVariants({ density }), className)}
      {...props}
    >
      <span
        data-slot="pagination-footer-total"
        className="text-sm font-medium tracking-[-0.03em] text-foreground"
      >
        {totalLabel}
      </span>

      <nav
        data-slot="pagination-footer-nav"
        aria-label={label}
        className="flex min-w-0 flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          data-slot="pagination-footer-previous"
          className={cn(paginationControlVariants({ variant: 'nav' }))}
          disabled={!resolvedHasPrevious}
          aria-label="Previous page"
          onClick={onPrevious}
        >
          {previousLabel}
        </button>

        {pages.map((page, index) =>
          page === '...' ? (
            <span
              // Gaps are positional; there is nothing else to key them by.
              key={`gap-${index}`}
              data-slot="pagination-footer-gap"
              aria-hidden="true"
              className="rounded-btl-sm px-2.5 py-1 text-xs text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              data-slot="pagination-footer-page"
              data-page={page}
              className={cn(
                paginationControlVariants({ variant: 'page', active: page === activePage })
              )}
              aria-label={`Page ${page}`}
              aria-current={page === activePage ? 'page' : undefined}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          data-slot="pagination-footer-next"
          className={cn(paginationControlVariants({ variant: 'nav' }))}
          disabled={!resolvedHasNext}
          aria-label="Next page"
          onClick={onNext}
        >
          {nextLabel}
        </button>
      </nav>

      <PerPageSelect
        perPage={perPage}
        options={perPageOptions}
        label={perPageLabel}
        icon={perPageIcon}
        onPerPageChange={onPerPageChange}
      />
    </div>
  );
}

interface PerPageSelectProps {
  perPage: number;
  options?: readonly number[];
  label: React.ReactNode;
  icon?: React.ReactNode;
  onPerPageChange?: (perPage: number) => void;
}

/**
 * The per-page control.
 *
 * A listbox rather than a `<select>` so the trigger can carry the host's own
 * caret, and rather than the design-system's `Select` so the footer does not
 * portal: it sits at the bottom of a scrolling page, and a portalled popup
 * there has to be re-anchored on every scroll of every ancestor.
 */
function PerPageSelect({ perPage, options, label, icon, onPerPageChange }: PerPageSelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const labelId = React.useId();
  const valueId = React.useId();
  const listboxId = React.useId();
  const hasOptions = Boolean(options?.length);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Opening moves focus onto the current value, so the arrow keys start from
  // where the viewer already is rather than from the top of the list.
  React.useEffect(() => {
    if (!open || !options?.length) return;
    const selected = Math.max(
      0,
      options.findIndex((option) => option === perPage)
    );
    optionRefs.current[selected]?.focus();
  }, [open, options, perPage]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function moveFocus(from: number, delta: number) {
    if (!options?.length) return;
    const next = (from + delta + options.length) % options.length;
    optionRefs.current[next]?.focus();
  }

  return (
    <div data-slot="pagination-footer-per-page" className="flex items-center gap-2">
      <span
        id={labelId}
        data-slot="pagination-footer-per-page-label"
        className="text-sm font-medium tracking-[-0.03em] text-foreground"
      >
        {label}
      </span>
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          data-slot="pagination-footer-per-page-trigger"
          className={cn(paginationControlVariants({ variant: 'trigger' }))}
          aria-labelledby={`${labelId} ${valueId}`}
          aria-haspopup={hasOptions ? 'listbox' : undefined}
          aria-expanded={hasOptions ? open : undefined}
          aria-controls={hasOptions && open ? listboxId : undefined}
          disabled={!hasOptions}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (!hasOptions) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span id={valueId}>{perPage}</span>
          {icon ?? <CaretDownIcon aria-hidden="true" className="size-3 shrink-0" />}
        </button>

        {hasOptions && open ? (
          <div
            id={listboxId}
            data-slot="pagination-footer-per-page-list"
            role="listbox"
            aria-labelledby={labelId}
            className={cn(
              'absolute right-0 top-[calc(100%+0.375rem)] z-20 flex min-w-28 flex-col gap-1',
              'rounded-btl-sm border border-border bg-popover p-1.5 text-popover-foreground shadow-md'
            )}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                close(true);
              }
            }}
          >
            {options?.map((option, index) => (
              <button
                key={option}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                data-slot="pagination-footer-per-page-option"
                aria-selected={option === perPage}
                tabIndex={-1}
                className={cn(
                  'w-full rounded-btl-sm px-2 py-1.5 text-left text-xs outline-none',
                  'text-muted-foreground hover:bg-muted hover:text-foreground',
                  'focus-visible:ring-2 focus-visible:ring-ring',
                  'aria-selected:bg-muted aria-selected:text-foreground',
                  'max-md:min-h-11'
                )}
                onClick={() => {
                  onPerPageChange?.(option);
                  close(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    moveFocus(index, 1);
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    moveFocus(index, -1);
                  } else if (event.key === 'Home') {
                    event.preventDefault();
                    moveFocus(0, 0);
                  } else if (event.key === 'End') {
                    event.preventDefault();
                    moveFocus((options?.length ?? 1) - 1, 0);
                  } else if (event.key === 'Tab') {
                    close(false);
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The page list to hand `PaginationFooter`.
 *
 * Up to seven pages are drawn in full. Past that it is first, last, the current
 * page with one either side, and a gap wherever a run was cut. The gap is
 * `'...'`, never a page number, so the caller cannot mistake it for one.
 *
 * A list with no pages still reports page 1: an empty result is on its first
 * page, not on no page at all.
 */
function buildPageList(totalPages: number, activePage: number): PaginationPage[] {
  if (totalPages <= 0) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const safeActivePage = Math.min(Math.max(activePage, 1), totalPages);
  const start = Math.max(2, safeActivePage - 1);
  const end = Math.min(totalPages - 1, safeActivePage + 1);
  const pages: PaginationPage[] = [1];

  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('...');

  pages.push(totalPages);
  return pages;
}

export { PaginationFooter, buildPageList, paginationFooterVariants, paginationControlVariants };
