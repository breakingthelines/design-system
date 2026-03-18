'use client';

import * as React from 'react';
import { Image, Gif, SoccerBall } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { MiniEditor, type MiniEditorHandle } from '#/components/ui/mini-editor/index';

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
  const editorRef = React.useRef<MiniEditorHandle>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [remaining, setRemaining] = React.useState(MAX_CHARS);
  const [hasText, setHasText] = React.useState(false);

  const isOverLimit = remaining < 0;
  const canSubmit = hasText && !isOverLimit && !disabled;

  function handleSubmit(text: string) {
    if (!canSubmit) return;
    onSubmit?.(text);
    editorRef.current?.clear();
    setHasText(false);
    setExpanded(false);
  }

  function handleExpand() {
    if (disabled || expanded) return;
    setExpanded(true);
    // Focus the MiniEditor after it mounts
    requestAnimationFrame(() => editorRef.current?.focus());
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
        className="flex items-start gap-2 cursor-text"
        onClick={handleExpand}
      >
        <Avatar size="default" className="shrink-0 mt-0.5">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Your avatar" />}
          <AvatarFallback>{initials ?? '?'}</AvatarFallback>
        </Avatar>

        {expanded ? (
          <div className="flex-1 min-w-0">
            <MiniEditor
              placeholder={placeholder}
              submitOn="mod-enter"
              maxLength={MAX_CHARS}
              multiline
              disabled={disabled}
              editorRef={editorRef}
              onSubmit={handleSubmit}
              onChange={(text) => setHasText(text.length > 0)}
              onRemainingChange={setRemaining}
              className="text-sm font-medium leading-6 tracking-[-0.42px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
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
            {hasText && (
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
            <Button
              variant="outline"
              data-shimmer="slow"
              disabled={!canSubmit}
              onClick={() => {
                const text = editorRef.current?.getText();
                if (text) handleSubmit(text);
              }}
              className="w-[100px] bg-grey-200 border-grey-300 backdrop-blur-[15px] rounded-[2px] px-6 py-2 hover:bg-grey-200 hover:border-[#807c7c]"
            >
              Post
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export { ThoughtComposer, type ThoughtComposerProps };
