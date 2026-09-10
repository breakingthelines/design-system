'use client';

import * as React from 'react';
import { Smiley } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { formatCount } from '#/lib/format';
import { EmojiPicker } from '#/components/ui/emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import type { ThoughtReaction } from '#/types/content';

/* ────────────────────────────────────────────────────────────
 * ReactionPills — the stacked emoji row under a thought body
 *
 * One pill per distinct emoji: the emoji, then its count, marked when the
 * viewer is in it. Tapping toggles. A trailing control opens the same
 * {@link EmojiPicker} the composer uses, in a Popover so a 320px panel
 * never widens the row that owns it — the chat rail is 332px and the row
 * has to stay inside the board anatomy.
 *
 * The row owns no fetching and no cap arithmetic. The server orders the
 * stack (highest count first, emoji as tiebreak), normalises each emoji,
 * and is the only authority on the 20-distinct and 6-per-viewer caps; this
 * renders the stack it is handed and shows whatever `notice` the host sets
 * when a call comes back refused. Two sources of truth for a cap is how a
 * pill row ends up disagreeing with the server it renders.
 * ──────────────────────────────────────────────────────────── */

export type ReactionPillsDensity = 'comfortable' | 'compact';

export interface ReactionPillsProps {
  /** The stack, server-ordered. An empty or absent list renders nothing. */
  reactions?: ThoughtReaction[];
  /** Viewer adds this emoji. Called with the emoji exactly as given. */
  onReact?: (emoji: string) => void;
  /** Viewer removes their own reaction. */
  onUnreact?: (emoji: string) => void;
  /**
   * Read-only row: pills render with their counts, nothing toggles, and the
   * add control is gone. What a viewer without write access to the thought
   * sees, and what a row shows while a refusal stands.
   */
  disabled?: boolean;
  /**
   * Quiet inline line after the pills. The host sets it when the server
   * refuses (cap reached, no access) and clears it on the next success.
   */
  notice?: string;
  /** Matches the host row's density. */
  density?: ReactionPillsDensity;
  className?: string;
}

export function ReactionPills({
  reactions,
  onReact,
  onUnreact,
  disabled = false,
  notice,
  density = 'comfortable',
  className,
}: ReactionPillsProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const isCompact = density === 'compact';
  const stack = reactions ?? [];
  const canAdd = !disabled && !!onReact;

  // Nothing to show and nothing to offer: render no element at all, so the
  // parent's flex gap does not pay for an empty row.
  if (stack.length === 0 && !canAdd && !notice) return null;

  const pillClass = isCompact
    ? 'h-[18px] gap-1 rounded-full px-1.5 text-[10px]'
    : 'h-6 gap-1.5 rounded-full px-2 text-[11px]';
  const emojiClass = isCompact ? 'text-[11px] leading-none' : 'text-[13px] leading-none';

  return (
    <div
      data-slot="reaction-pills"
      className={cn('flex flex-wrap items-center', isCompact ? 'gap-1' : 'gap-1.5', className)}
    >
      {stack.map((reaction) => {
        const mine = !!reaction.viewerHasReacted;
        return (
          <button
            key={reaction.emoji}
            type="button"
            data-slot="reaction-pill"
            data-emoji={reaction.emoji}
            data-mine={mine ? 'true' : 'false'}
            disabled={disabled}
            aria-pressed={mine}
            aria-label={`${reaction.emoji} ${reaction.count}`}
            onClick={
              disabled
                ? undefined
                : () => (mine ? onUnreact?.(reaction.emoji) : onReact?.(reaction.emoji))
            }
            className={cn(
              'inline-flex shrink-0 items-center border font-content tabular-nums transition-colors',
              pillClass,
              mine
                ? 'border-red-100/40 bg-red-100/15 text-white'
                : 'border-white/10 bg-white/[0.06] text-[#807c7c]',
              disabled
                ? 'cursor-default opacity-60'
                : cn(
                    'cursor-pointer',
                    mine ? 'hover:bg-red-100/25' : 'hover:bg-white/[0.10] hover:text-white'
                  )
            )}
          >
            <span className={emojiClass}>{reaction.emoji}</span>
            <span className="leading-none">{formatCount(reaction.count)}</span>
          </button>
        );
      })}

      {canAdd && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger
            data-slot="reaction-add"
            aria-label="Add reaction"
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center border border-white/10',
              'bg-white/[0.06] text-[#807c7c] transition-colors hover:bg-white/[0.10] hover:text-white',
              isCompact ? 'h-[18px] w-6 rounded-full' : 'h-6 w-7 rounded-full'
            )}
          >
            <Smiley weight="regular" className={isCompact ? 'size-[11px]' : 'size-[13px]'} />
          </PopoverTrigger>
          {/* The popup is portalled, so the picker's 320x340 panel is laid
              out against the viewport rather than against the rail column. */}
          <PopoverContent
            align="start"
            side="top"
            sideOffset={6}
            collisionAvoidance={{ align: 'shift' }}
            collisionPadding={8}
            className="w-auto border-0 bg-transparent p-0 shadow-none ring-0"
          >
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setPickerOpen(false);
                onReact?.(emoji);
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {notice && (
        <span
          data-slot="reaction-notice"
          className={cn(
            'font-content leading-none text-[#807c7c]',
            isCompact ? 'text-[10px]' : 'text-[11px]'
          )}
        >
          {notice}
        </span>
      )}
    </div>
  );
}
