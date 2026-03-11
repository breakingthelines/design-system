'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';
import { MagnifyingGlass } from '@phosphor-icons/react';

interface FilterChip {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface FilterBarProps extends React.ComponentProps<'div'> {
  /** Label shown before filters */
  label?: string;
  /** Filter chip definitions */
  filters: FilterChip[];
  /** Currently active filter values */
  activeFilters?: string[];
  /** Called when a filter chip is toggled */
  onFilterChange?: (value: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Called when search input changes */
  onSearchChange?: (value: string) => void;
}

function FilterBar({
  className,
  label = 'Filter By:',
  filters,
  activeFilters = [],
  onFilterChange,
  searchPlaceholder = 'Search',
  searchValue,
  onSearchChange,
  ...props
}: FilterBarProps) {
  return (
    <div
      data-slot="filter-bar"
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4', className)}
      {...props}
    >
      {/* Left — label + filter chips, scrollable on mobile */}
      <div className="flex min-w-0 items-center gap-3 overflow-x-auto sm:gap-4">
        <span className="shrink-0 font-sans text-xs font-normal leading-6 text-[#ccc4c4]">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {filters.map((filter) => {
            const isActive = activeFilters.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onFilterChange?.(filter.value)}
                className={cn(
                  'inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[24px] px-4 py-3',
                  'font-[family-name:var(--font-content)] text-sm font-medium tracking-[-0.42px]',
                  'transition-colors',
                  isActive
                    ? 'bg-white/20 text-white backdrop-blur-[15px]'
                    : 'bg-white/10 text-[#ccc4c4] backdrop-blur-[15px] hover:bg-white/15'
                )}
              >
                {filter.icon && (
                  <span className="flex size-4 items-center justify-center">
                    {filter.icon}
                  </span>
                )}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right — search input, full-width on mobile */}
      <div className="relative">
        <MagnifyingGlass
          weight="regular"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50"
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className={cn(
            'h-[34px] w-full rounded-[2px] border border-grey-300 bg-grey-100 pl-9 pr-4 sm:w-[300px]',
            'font-[family-name:var(--font-content)] text-xs font-normal text-white',
            'placeholder:text-[#807c7c]',
            'outline-none transition-colors focus:border-white/30'
          )}
        />
      </div>
    </div>
  );
}

export { FilterBar, type FilterBarProps, type FilterChip };
