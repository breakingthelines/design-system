'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface FilterChip {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SelectedEntity {
  id: string;
  label: string;
  icon?: React.ReactNode;
  filterValue: string;
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
  /** Called when a filter chip's X is clicked to clear all selections for that filter */
  onFilterClear?: (value: string) => void;
  /** Placeholder for the search input */
  searchPlaceholder?: string;
  /** Controlled search value */
  searchValue?: string;
  /** Called when search input changes */
  onSearchChange?: (value: string) => void;
  /** Called when search X button is clicked */
  onSearchClear?: () => void;
  /** Selected entities to display as chips below the bar */
  selectedEntities?: SelectedEntity[];
  /** Called when an entity chip is dismissed */
  onEntityRemove?: (entityId: string, filterValue: string) => void;
}

function FilterBar({
  className,
  label = 'Filter By:',
  filters,
  activeFilters = [],
  onFilterChange,
  onFilterClear,
  searchPlaceholder = 'Search',
  searchValue,
  onSearchChange,
  onSearchClear,
  selectedEntities = [],
  onEntityRemove,
  ...props
}: FilterBarProps) {
  return (
    <div
      data-slot="filter-bar"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {/* Main row — filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Left — label + filter chips, scrollable on mobile */}
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto sm:gap-4">
          <span className="shrink-0 font-sans text-xs font-normal leading-6 text-[#ccc4c4]">
            {label}
          </span>
          <div className="flex items-center gap-2">
            {filters.map((filter) => {
              const isActive = activeFilters.includes(filter.value);
              return (
                <div key={filter.value} className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onFilterChange?.(filter.value)}
                    className={cn(
                      'inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[24px] py-3',
                      isActive ? 'pl-4 pr-2' : 'px-4',
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
                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterClear?.(filter.value);
                      }}
                      className="ml-[-2px] inline-flex size-[34px] shrink-0 items-center justify-center rounded-r-[24px] bg-white/20 text-white/60 backdrop-blur-[15px] transition-colors hover:text-white"
                    >
                      <X weight="bold" size={10} />
                    </button>
                  )}
                </div>
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
              'h-[34px] w-full rounded-[2px] border border-grey-300 bg-grey-100 pl-9 pr-8 sm:w-[300px]',
              'font-[family-name:var(--font-content)] text-xs font-normal text-white',
              'placeholder:text-[#807c7c]',
              'outline-none transition-colors focus:border-white/30'
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                onSearchClear?.();
                onSearchChange?.('');
              }}
              className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-white/40 transition-colors hover:text-white"
            >
              <X weight="bold" size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Second row — selected entity chips */}
      {selectedEntities.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          {selectedEntities.map((entity) => (
            <span
              key={`${entity.filterValue}-${entity.id}`}
              className="inline-flex h-[28px] shrink-0 items-center gap-1.5 rounded-[24px] bg-white/10 pl-2.5 pr-1.5 backdrop-blur-[15px]"
            >
              {entity.icon && (
                <span className="flex size-3.5 items-center justify-center text-white/60">
                  {entity.icon}
                </span>
              )}
              <span className="text-xs font-medium tracking-[-0.36px] text-white/80">
                {entity.label}
              </span>
              <button
                type="button"
                onClick={() => onEntityRemove?.(entity.id, entity.filterValue)}
                className="flex size-4 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white"
              >
                <X weight="bold" size={8} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export { FilterBar, type FilterBarProps, type FilterChip, type SelectedEntity };
