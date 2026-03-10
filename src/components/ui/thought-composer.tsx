'use client';

import * as React from 'react';
import { Image, Gif, Smiley } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { IconButton } from '#/components/ui/icon-button';
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
  /** Emoji picker handler */
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
  const [text, setText] = React.useState('');
  const remaining = MAX_CHARS - text.length;
  const isOverLimit = remaining < 0;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !disabled;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit?.(text.trim());
    setText('');
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
        'flex gap-3 rounded-none border border-grey-300 bg-grey-100 p-4',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      <Avatar size="default">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="Your avatar" />}
        <AvatarFallback>{initials ?? '?'}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <textarea
          className="min-h-[60px] w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none field-sizing-content"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {onImageClick && (
              <IconButton
                aria-label="Add image"
                variant="ghost"
                size="sm"
                onClick={onImageClick}
                disabled={disabled}
              >
                <Image weight="regular" />
              </IconButton>
            )}
            {onGifClick && (
              <IconButton
                aria-label="Add GIF"
                variant="ghost"
                size="sm"
                onClick={onGifClick}
                disabled={disabled}
              >
                <Gif weight="regular" />
              </IconButton>
            )}
            {onEmojiClick && (
              <IconButton
                aria-label="Add emoji"
                variant="ghost"
                size="sm"
                onClick={onEmojiClick}
                disabled={disabled}
              >
                <Smiley weight="regular" />
              </IconButton>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}

export { ThoughtComposer, type ThoughtComposerProps };
