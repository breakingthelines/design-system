'use client';

import * as React from 'react';
import { Image, Gif, SoccerBall } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';

const MAX_CHARS = 500;

interface ThoughtComposerProps extends Omit<React.ComponentProps<'div'>, 'onSubmit'> {
  /** Current user's avatar URL */
  avatarUrl?: string;
  /** Fallback initials when no avatar */
  initials?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Submit handler with the composed text */
  onSubmit?: (text: string) => void;
  /** Image attachment handler */
  onImageClick?: () => void;
  /** GIF picker handler */
  onGifClick?: () => void;
  /** Emoji/football picker handler */
  onEmojiClick?: () => void;
  /** Disable the composer */
  disabled?: boolean;
}

function ThoughtComposer({
  className,
  avatarUrl,
  initials,
  placeholder = 'Share your thoughts',
  onSubmit,
  onImageClick,
  onGifClick,
  onEmojiClick,
  disabled = false,
  ...props
}: ThoughtComposerProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [text, setText] = React.useState('');
  const remaining = MAX_CHARS - text.length;
  const isOverLimit = remaining < 0;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !disabled;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit?.(text.trim());
    setText('');
    setExpanded(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      data-slot="thought-composer"
      className={cn(
        'flex flex-col gap-2 rounded-[4px] border border-grey-300 bg-grey-100 px-8 py-3 backdrop-blur-[15px]',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {/* Prompt row — always visible */}
      <div
        className="flex items-center gap-2 cursor-text"
        onClick={() => !disabled && !expanded && setExpanded(true)}
      >
        <Avatar size="default" className="shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Your avatar" />}
          <AvatarFallback>{initials ?? '?'}</AvatarFallback>
        </Avatar>

        {expanded ? (
          <textarea
            className="min-h-[60px] w-full resize-none bg-transparent text-sm font-medium leading-6 tracking-[-0.42px] text-foreground placeholder:text-muted-foreground focus:outline-none field-sizing-content"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium leading-6 tracking-[-0.42px] text-muted-foreground select-none">
            {placeholder}
          </span>
        )}
      </div>

      {/* Bottom row — action icons + submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onImageClick && (
            <button
              type="button"
              aria-label="Add image"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              onClick={onImageClick}
              disabled={disabled}
            >
              <Image weight="regular" className="size-[15px]" />
            </button>
          )}
          {onGifClick && (
            <button
              type="button"
              aria-label="Add GIF"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              onClick={onGifClick}
              disabled={disabled}
            >
              <Gif weight="regular" className="size-[15px]" />
            </button>
          )}
          {onEmojiClick && (
            <button
              type="button"
              aria-label="Add emoji"
              className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              onClick={onEmojiClick}
              disabled={disabled}
            >
              <SoccerBall weight="regular" className="size-[15px]" />
            </button>
          )}
        </div>

        {expanded && (
          <div className="flex items-center gap-3">
            {text.length > 0 && (
              <span
                className={cn(
                  'text-xs tabular-nums',
                  isOverLimit
                    ? 'text-red-100'
                    : remaining <= 50
                      ? 'text-yellow-500'
                      : 'text-muted-foreground'
                )}
              >
                {remaining}
              </span>
            )}
            <Button size="xs" disabled={!canSubmit} onClick={handleSubmit}>
              Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { ThoughtComposer, type ThoughtComposerProps };
