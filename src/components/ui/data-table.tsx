'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * DataTable — the generic, domain-free table surface.
 *
 * The design-system's other tables (PredictionLeaderboardTable,
 * RatingsClubTable) each know what a row means. This one does not: the caller
 * supplies a `grid-template-columns` template, an array of header cells, and
 * rows of arbitrary children.
 *
 * A grid, not a `<table>`. Every surface this backs has to collapse to a
 * stacked card on a phone, and a real table cannot reflow that way without
 * `display: block` on its rows — which drops the implicit table semantics in
 * every engine anyway. So the roles are declared rather than inherited:
 * `table` / `rowgroup` / `row` / `columnheader` / `cell` survive the reflow
 * that a real table's semantics would not.
 *
 * Below `md` the grid becomes one column and the header row is hidden. Nothing
 * is lost with it, because each cell can name itself with `data-label` (or by
 * being a `DataCell` with a `label`), which renders as a caption line above the
 * value exactly where the column heading would have been.
 *
 * Overflow is owned here and only here. The row grid carries a `minmax()`
 * floor per column, so on a narrow viewport it refuses to shrink; without a
 * scroll container of its own that width would bleed out to the page body.
 * `[data-slot='data-table-scroll']` is the one element with `overflow-x`, and
 * the root sets `min-w-0` so a flex or grid parent cannot be widened by it.
 * ──────────────────────────────────────────────────────────────────────────── */

export type DataTableDensity = 'comfortable' | 'compact';

const dataTableVariants: VariantFn<{ density?: DataTableDensity | null }> = cva(
  'flex w-full min-w-0 flex-col text-foreground',
  {
    variants: {
      density: {
        comfortable: '',
        compact: '',
      } satisfies Record<DataTableDensity, string>,
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

const dataTableHeaderVariants: VariantFn<{ density?: DataTableDensity | null }> = cva(
  cn(
    'grid grid-cols-1 items-center gap-4 text-xs tracking-[-0.03em] text-foreground',
    'min-w-full md:min-w-fit md:[grid-template-columns:var(--dt-columns)]',
    // One column has no headings to head. The cells caption themselves instead.
    'max-md:hidden'
  ),
  {
    variants: {
      density: {
        comfortable: 'px-4 py-2',
        compact: 'px-3 py-1.5',
      } satisfies Record<DataTableDensity, string>,
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

const dataTableRowVariants: VariantFn<{
  density?: DataTableDensity | null;
  interactive?: boolean | null;
}> = cva(
  cn(
    'grid grid-cols-1 items-center gap-4',
    'min-w-full md:min-w-fit md:[grid-template-columns:var(--dt-columns)]',
    'border border-border bg-card text-card-foreground',
    'transition-[background-color,border-color] duration-standard ease-standard',
    'hover:border-muted-foreground/40 hover:bg-muted',
    'motion-reduce:transition-none',
    // A cell may not spill into the column beside it. `min-w-0` lets it shrink
    // to its track (a grid item's default `min-width: auto` will not), and
    // wrapping anywhere keeps a long id, email or slug inside that track rather
    // than overflowing it. Both apply at every width; a call site that wants
    // one line and an ellipsis still gets it from its own `truncate`.
    '[&>*]:min-w-0 [&>*]:[overflow-wrap:anywhere]',
    // Stacked-card mode.
    'max-md:items-stretch max-md:gap-2.5',
    'max-md:[&>[data-label]]:block',
    'max-md:[&>[data-label]]:before:mb-1 max-md:[&>[data-label]]:before:block',
    'max-md:[&>[data-label]]:before:content-[attr(data-label)]',
    'max-md:[&>[data-label]]:before:text-[11px]',
    'max-md:[&>[data-label]]:before:tracking-[-0.03em]',
    'max-md:[&>[data-label]]:before:text-muted-foreground'
  ),
  {
    variants: {
      density: {
        comfortable: 'p-4',
        compact: 'px-3 py-2',
      } satisfies Record<DataTableDensity, string>,
      interactive: {
        true: cn(
          'cursor-pointer outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background'
        ),
        false: '',
      } satisfies Record<'true' | 'false', string>,
    },
    defaultVariants: {
      density: 'comfortable',
      interactive: false,
    },
  }
);

/**
 * Density reaches the rows through context rather than a prop, because a row is
 * frequently rendered by an intermediate component (`<AdvertiserRow row={...} />`)
 * that has no reason to know about it, let alone forward it.
 */
const DataTableDensityContext = React.createContext<DataTableDensity>('comfortable');

export interface DataTableProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof dataTableVariants> {
  /**
   * `grid-template-columns` for the header and every row, at `md` and above.
   * Give each column a `minmax()` floor so it stops shrinking and starts
   * scrolling: `minmax(180px, 1.2fr) minmax(110px, 0.8fr) ...`.
   *
   * Below `md` it is ignored and the grid is a single column.
   */
  columns: string;
  /** One node per column, in column order. Pass `''` for a column with no heading. */
  header: readonly React.ReactNode[];
  /** Accessible name for the table. Use this or `aria-labelledby`, not neither. */
  label?: string;
  /** Rows — `DataRow` elements, or components that render one. */
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

function DataTable({
  columns,
  header,
  label,
  density = 'comfortable',
  className,
  headerClassName,
  bodyClassName,
  children,
  style,
  ...props
}: DataTableProps) {
  const resolvedDensity: DataTableDensity = density ?? 'comfortable';

  return (
    <div
      data-slot="data-table"
      data-density={resolvedDensity}
      role="table"
      aria-label={label}
      aria-colcount={header.length}
      className={cn(dataTableVariants({ density: resolvedDensity }), className)}
      style={{ ...style, ['--dt-columns' as string]: columns } as React.CSSProperties}
      {...props}
    >
      {/*
       * The only element in the tree with a horizontal overflow. The header and
       * the rows keep their natural, minmax-floored width (`md:min-w-fit`) and
       * this box catches it, rather than letting it reach the page body.
       *
       * `role="none"` keeps it out of the way of the table's structure: without
       * it, a plain div sits between `role="table"` and its row groups.
       */}
      <div
        data-slot="data-table-scroll"
        role="none"
        className="flex w-full min-w-0 flex-col gap-3 overflow-x-auto"
      >
        <div data-slot="data-table-head" role="rowgroup">
          <div
            data-slot="data-table-header"
            role="row"
            className={cn(dataTableHeaderVariants({ density: resolvedDensity }), headerClassName)}
          >
            {header.map((cell, index) => (
              <span
                // Headings are a fixed, ordered list; position is the identity.
                key={index}
                data-slot="data-table-header-cell"
                role="columnheader"
                className="inline-flex items-center"
              >
                {cell}
              </span>
            ))}
          </div>
        </div>
        <div
          data-slot="data-table-body"
          role="rowgroup"
          className={cn('flex flex-col gap-2', bodyClassName)}
        >
          <DataTableDensityContext.Provider value={resolvedDensity}>
            {children}
          </DataTableDensityContext.Provider>
        </div>
      </div>
    </div>
  );
}

export interface DataRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onKeyDown'> {
  children: React.ReactNode;
  className?: string;
  /**
   * Makes the whole row the click target rather than an inner "View" control.
   * Mouse click, Enter and Space all activate it, and the row gains a focus
   * ring.
   *
   * The row keeps `role="row"` — it does not become a button, because that
   * would cost every screen-reader user the table's structure in order to
   * advertise a shortcut. Row activation is a pointer convenience; keep a real
   * link or button inside the row as the announced path to the same place.
   *
   * Nested interactive elements must stop propagation on their own click and
   * keydown handlers so they do not also fire this.
   */
  onActivate?: () => void;
}

function DataRow({ className, children, onActivate, onClick, ...props }: DataRowProps) {
  const density = React.useContext(DataTableDensityContext);
  const interactive = Boolean(onActivate);

  return (
    <div
      data-slot="data-table-row"
      data-interactive={interactive || undefined}
      role="row"
      tabIndex={interactive ? 0 : undefined}
      onClick={
        interactive
          ? (event) => {
              onClick?.(event);
              if (!event.defaultPrevented) onActivate?.();
            }
          : onClick
      }
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onActivate?.();
            }
          : undefined
      }
      className={cn(dataTableRowVariants({ density, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DataCellProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The column's name, repeated on the cell. Below `md` the header row is
   * hidden and this renders as a caption line above the value.
   *
   * Set it on scalar cells. Leave it off composite ones — an avatar beside a
   * name, a row of action buttons — which carry their own layout and read
   * fine without a caption.
   */
  label?: string;
  children?: React.ReactNode;
}

/**
 * One cell.
 *
 * A row will render whatever children it is given, and a plain
 * `<span data-label="Role">` gets the same mobile caption, so this is optional.
 * It is the shape to prefer for new code: it carries `role="cell"`, which a
 * bare `<span>` does not, and it spells the label as a prop rather than a raw
 * attribute.
 */
function DataCell({ label, className, children, ...props }: DataCellProps) {
  return (
    <div
      data-slot="data-table-cell"
      data-label={label}
      role="cell"
      className={cn('min-w-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  DataTable,
  DataRow,
  DataCell,
  dataTableVariants,
  dataTableRowVariants,
  dataTableHeaderVariants,
};
