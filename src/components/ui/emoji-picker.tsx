'use client';

import * as React from 'react';
import { EmojiPicker as Frimousse } from 'frimousse';

import { cn } from '#/lib/utils';

interface EmojiPickerProps {
  /** Called with the native emoji character when a user selects one */
  onEmojiSelect?: (emoji: string) => void;
  className?: string;
}

function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  return (
    <Frimousse.Root
      onEmojiSelect={
        onEmojiSelect ? (emoji) => onEmojiSelect(emoji.emoji) : undefined
      }
      className={cn(
        'flex h-[340px] w-[320px] flex-col rounded-[4px] border border-grey-300 bg-grey-200 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        className
      )}
    >
      <div className="px-2 pt-2">
        <Frimousse.Search
          autoFocus
          placeholder="Search emoji…"
          className={cn(
            'w-full rounded-[4px] border border-grey-300 bg-grey-100 px-3 py-1.5',
            'text-sm text-foreground caret-red-100 outline-none',
            'placeholder:text-white/30',
            'transition-colors focus:border-red-100/40'
          )}
        />
      </div>

      <Frimousse.Viewport className="flex-1 overflow-y-auto px-1 py-1.5">
        <Frimousse.Loading className="flex h-full items-center justify-center">
          <span className="text-xs text-white/30">Loading…</span>
        </Frimousse.Loading>

        <Frimousse.Empty className="flex h-full items-center justify-center">
          <span className="text-xs text-white/30">No emoji found.</span>
        </Frimousse.Empty>

        <Frimousse.List
          className={cn(
            'select-none',
            '[&_[frimousse-emoji]]:flex [&_[frimousse-emoji]]:size-8 [&_[frimousse-emoji]]:cursor-pointer',
            '[&_[frimousse-emoji]]:items-center [&_[frimousse-emoji]]:justify-center',
            '[&_[frimousse-emoji]]:rounded-[4px] [&_[frimousse-emoji]]:text-lg',
            '[&_[frimousse-emoji]]:transition-colors hover:[&_[frimousse-emoji]]:bg-red-100/15',
            '[&_[frimousse-category-header]]:mb-0.5 [&_[frimousse-category-header]]:mt-2',
            '[&_[frimousse-category-header]]:px-1.5 [&_[frimousse-category-header]]:text-[10px]',
            '[&_[frimousse-category-header]]:font-semibold [&_[frimousse-category-header]]:uppercase',
            '[&_[frimousse-category-header]]:tracking-[0.08em] [&_[frimousse-category-header]]:text-white/30'
          )}
        />
      </Frimousse.Viewport>
    </Frimousse.Root>
  );
}

export { EmojiPicker, type EmojiPickerProps };
