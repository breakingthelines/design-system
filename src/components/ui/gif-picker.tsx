'use client';

import * as React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface GifFile {
  url: string;
  width: number;
  height: number;
}

interface GifMediaSet {
  gif?: GifFile;
  webp?: GifFile;
  mp4?: GifFile;
}

interface GifItem {
  id: string;
  title: string;
  slug: string;
  hd?: GifMediaSet;
  md?: GifMediaSet;
  sm?: GifMediaSet;
}

interface GifSelection {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  /** GIF items to display (provided by the consumer via data-fetching hooks) */
  gifs: GifItem[];
  /** Whether gifs are currently loading */
  loading?: boolean;
  /** Whether the last fetch errored */
  error?: boolean;
  /** Called when the search query changes (debounced by consumer or internally) */
  onSearch?: (query: string) => void;
  /** Called when the user wants to retry after an error */
  onRetry?: () => void;
  /** Called when a user selects a GIF */
  onGifSelect?: (gif: GifSelection) => void;
  className?: string;
}

/* ────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────── */

function getBestUrl(item: GifItem, size: 'sm' | 'md' | 'hd'): GifFile | undefined {
  const set = item[size];
  return set?.webp ?? set?.gif;
}

function toSelection(item: GifItem): GifSelection {
  const hd = getBestUrl(item, 'hd') ?? getBestUrl(item, 'md');
  const preview = getBestUrl(item, 'sm') ?? getBestUrl(item, 'md');
  return {
    id: item.id,
    url: hd?.url ?? preview?.url ?? '',
    previewUrl: preview?.url ?? hd?.url ?? '',
    title: item.title,
    width: hd?.width ?? 498,
    height: hd?.height ?? 498,
  };
}

/* ────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────── */

function GifPicker({
  gifs,
  loading = false,
  error = false,
  onSearch,
  onRetry,
  onGifSelect,
  className,
}: GifPickerProps) {
  const [query, setQuery] = React.useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleSearchChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch?.(value), 350);
  }

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className={cn(
        'flex h-[380px] w-[340px] flex-col rounded-[4px] border border-grey-300 bg-grey-200',
        'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        className
      )}
    >
      {/* Search bar */}
      <div className="relative px-2 pt-2">
        <MagnifyingGlass
          weight="regular"
          className="pointer-events-none absolute left-4.5 top-1/2 mt-1 size-3.5 -translate-y-1/2 text-white/30"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search GIFs…"
          className={cn(
            'w-full rounded-[4px] border border-grey-300 bg-grey-100 py-1.5 pl-8 pr-3',
            'text-sm text-foreground caret-red-100 outline-none',
            'placeholder:text-white/30',
            'transition-colors focus:border-red-100/40'
          )}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-1.5 animate-pulse rounded-full bg-red-100/60"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <span className="text-xs text-white/30">
              Failed to load GIFs
            </span>
            <button
              type="button"
              onClick={() => onRetry?.()}
              className="text-xs text-red-100 transition-colors hover:text-red-300"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && gifs.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-white/30">
              {query ? 'No GIFs found.' : 'No trending GIFs.'}
            </span>
          </div>
        )}

        {!loading && !error && gifs.length > 0 && (
          <div className="columns-2 gap-1.5">
            {gifs.map((item) => {
              const preview = getBestUrl(item, 'sm') ?? getBestUrl(item, 'md');
              if (!preview) return null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onGifSelect?.(toSelection(item))}
                  className={cn(
                    'group mb-1.5 block w-full overflow-hidden rounded-[4px]',
                    'cursor-pointer break-inside-avoid',
                    'ring-0 ring-red-100/0 transition-all duration-200',
                    'hover:ring-2 hover:ring-red-100/60',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-100'
                  )}
                  title={item.title}
                >
                  <img
                    src={preview.url}
                    alt={item.title}
                    width={preview.width}
                    height={preview.height}
                    loading="lazy"
                    className="w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — KLIPY attribution */}
      <div className="flex items-center justify-center border-t border-grey-300 px-2 py-1.5">
        <span className="text-[10px] tracking-wide text-white/20">
          Powered by KLIPY
        </span>
      </div>
    </div>
  );
}

export { GifPicker };
export type { GifPickerProps, GifSelection, GifItem, GifFile, GifMediaSet };
