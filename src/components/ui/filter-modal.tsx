'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { MagnifyingGlass, Check, X } from '@phosphor-icons/react';
import { cn } from '#/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ReactNode;
  title: string;
  searchPlaceholder?: string;
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  confirmLabel?: string;
  className?: string;
}

function FilterModal({
  open,
  onOpenChange,
  icon,
  title,
  searchPlaceholder = 'Search...',
  options,
  selectedValues,
  onSelectionChange,
  confirmLabel = 'Confirm',
  className,
}: FilterModalProps) {
  const [search, setSearch] = React.useState('');

  // Reset search when modal opens
  React.useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(value: string) {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-xs duration-100" />
        <DialogPrimitive.Popup
          className={cn(
            'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95',
            'fixed top-1/2 left-1/2 z-50 w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2',
            'bg-grey-200 ring-1 ring-grey-300 rounded-none p-0 outline-none duration-100',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
            {icon && (
              <span className="flex size-5 items-center justify-center text-white/70">{icon}</span>
            )}
            <DialogPrimitive.Title className="text-base font-medium text-white">
              {title}
            </DialogPrimitive.Title>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ml-auto flex size-6 items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <X weight="bold" size={14} />
            </button>
          </div>

          {/* Search */}
          <div className="relative px-5 pb-3">
            <MagnifyingGlass
              weight="regular"
              className="absolute left-8 top-1/2 size-4 -translate-y-1/2 text-white/50"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'h-[34px] w-full rounded-[4px] border border-grey-300 bg-grey-100 pl-9 pr-4',
                'font-[family-name:var(--font-content)] text-base font-normal text-white sm:text-xs',
                'placeholder:text-[#807c7c]',
                'outline-none transition-colors focus:border-white/30'
              )}
            />
          </div>

          {/* Options list */}
          <div className="max-h-[320px] overflow-y-auto px-2 pb-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-white/40">No results found</div>
            ) : (
              filtered.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors',
                      'hover:bg-white/5',
                      selected && 'bg-white/5'
                    )}
                  >
                    {/* Checkbox circle */}
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                        selected ? 'bg-white' : 'ring-1 ring-white/30'
                      )}
                    >
                      {selected && <Check weight="bold" size={12} className="text-grey-200" />}
                    </span>

                    {/* Option icon */}
                    {option.icon && (
                      <span className="flex size-5 shrink-0 items-center justify-center text-white/60">
                        {option.icon}
                      </span>
                    )}

                    {/* Label */}
                    <span className="text-sm font-medium text-white/90">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Confirm button */}
          <div className="px-5 pb-5 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={cn(
                'flex h-[42px] w-full items-center justify-center rounded-[4px]',
                'bg-grey-300 text-sm font-medium text-white/50 transition-colors hover:text-white/70'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { FilterModal, type FilterModalProps, type FilterOption };
