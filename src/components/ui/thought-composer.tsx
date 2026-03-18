'use client';

import * as React from 'react';
import { Image, Gif, SoccerBall, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { MiniEditor, type MiniEditorHandle } from '#/components/ui/mini-editor/index';
import { EmojiPicker } from '#/components/ui/emoji-picker';
import { GifPicker, type GifSelection } from '#/components/ui/gif-picker';

const MAX_CHARS = 500;

type ActivePicker = 'gif' | 'emoji' | null;

interface ThoughtComposerMedia {
  gifUrl?: string;
  gifId?: string;
  gifPlatform?: 'klipy' | 'giphy';
  imageUrl?: string;
}

interface ThoughtComposerProps extends Omit<React.ComponentProps<'div'>, 'onSubmit'> {
  avatarUrl?: string;
  initials?: string;
  placeholder?: string;
  /** Called on post — text + optional media attachments */
  onSubmit?: (text: string, media?: ThoughtComposerMedia) => void;
  /** Image attachment handler (opens external upload flow) */
  onImageClick?: () => void;
  /** GIF proxy base URL — enables built-in GIF picker when set */
  gifApiBaseUrl?: string;
  /** Legacy: external GIF click handler (used when gifApiBaseUrl is not set) */
  onGifClick?: () => void;
  /** Enables built-in emoji picker */
  emojiEnabled?: boolean;
  /** Legacy: external emoji click handler (used when emojiEnabled is not set) */
  onEmojiClick?: () => void;
  userId?: string;
  disabled?: boolean;
}

function ThoughtComposer({
  className,
  avatarUrl,
  initials,
  placeholder = 'Share your thoughts',
  onSubmit,
  onImageClick,
  gifApiBaseUrl,
  onGifClick,
  emojiEnabled = false,
  onEmojiClick,
  userId,
  disabled = false,
  ...props
}: ThoughtComposerProps) {
  const editorRef = React.useRef<MiniEditorHandle>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [remaining, setRemaining] = React.useState(MAX_CHARS);
  const [hasText, setHasText] = React.useState(false);
  const [activePicker, setActivePicker] = React.useState<ActivePicker>(null);
  const [selectedGif, setSelectedGif] = React.useState<GifSelection | null>(null);

  const isOverLimit = remaining < 0;
  const hasContent = hasText || selectedGif !== null;
  const canSubmit = hasContent && !isOverLimit && !disabled;

  const useBuiltInGif = !!gifApiBaseUrl;
  const useBuiltInEmoji = emojiEnabled;
  const showGifButton = useBuiltInGif || !!onGifClick;
  const showEmojiButton = useBuiltInEmoji || !!onEmojiClick;

  function handleSubmit(text: string) {
    if (!canSubmit) return;
    const media: ThoughtComposerMedia | undefined = selectedGif
      ? { gifUrl: selectedGif.url, gifId: selectedGif.id, gifPlatform: 'klipy' }
      : undefined;
    onSubmit?.(text, media);
    editorRef.current?.clear();
    setHasText(false);
    setSelectedGif(null);
    setActivePicker(null);
    setExpanded(false);
  }

  function handleExpand() {
    if (disabled || expanded) return;
    setExpanded(true);
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  function togglePicker(picker: ActivePicker) {
    if (!expanded) {
      setExpanded(true);
      requestAnimationFrame(() => editorRef.current?.focus());
    }
    setActivePicker((prev) => (prev === picker ? null : picker));
  }

  function handleGifSelect(gif: GifSelection) {
    setSelectedGif(gif);
    setActivePicker(null);
  }

  function handleEmojiSelect(emoji: string) {
    editorRef.current?.insertText(emoji);
    setHasText(true);
  }

  return (
    <div
      data-slot="thought-composer"
      className={cn(
        'flex flex-col gap-2 rounded-[4px] border border-grey-300 bg-grey-200 px-8 py-3 backdrop-blur-[15px]',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {/* Prompt row */}
      <div className="flex items-center gap-2 cursor-text" onClick={handleExpand}>
        <Avatar size="default" className="shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Your avatar" />}
          <AvatarFallback>{initials ?? '?'}</AvatarFallback>
        </Avatar>

        {expanded ? (
          <div className="flex-1 min-w-0">
            <MiniEditor
              placeholder={`${placeholder}...`}
              submitOn="mod-enter"
              maxLength={MAX_CHARS}
              multiline
              disabled={disabled}
              editorRef={editorRef}
              onSubmit={handleSubmit}
              onChange={(text) => setHasText(text.length > 0)}
              onRemainingChange={setRemaining}
              className="text-sm font-medium leading-6 tracking-[-0.42px] text-foreground min-h-0"
              placeholderClassName="text-white/30 font-medium tracking-[-0.42px]"
            />
          </div>
        ) : (
          <span className="text-sm font-medium leading-6 tracking-[-0.42px] text-white/30 select-none">
            {placeholder}...
          </span>
        )}
      </div>

      {/* GIF preview */}
      <AnimatePresence>
        {selectedGif && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden rounded-[4px]"
          >
            <img
              src={selectedGif.previewUrl}
              alt={selectedGif.title}
              className="w-full max-h-[200px] rounded-[4px] object-cover"
            />
            <button
              type="button"
              onClick={() => setSelectedGif(null)}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Remove GIF"
            >
              <X weight="bold" className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom row — action icons + submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {onImageClick && (
            <button
              type="button"
              aria-label="Add image"
              className="flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] text-red-100 transition-colors hover:bg-red-100/10 hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              onClick={onImageClick}
              disabled={disabled}
            >
              <Image weight="regular" className="size-[15px]" />
            </button>
          )}
          {showGifButton && (
            <button
              type="button"
              aria-label="Add GIF"
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] transition-colors disabled:pointer-events-none disabled:opacity-50',
                activePicker === 'gif'
                  ? 'bg-red-100/15 text-red-300'
                  : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
              )}
              onClick={() => {
                if (useBuiltInGif) togglePicker('gif');
                else onGifClick?.();
              }}
              disabled={disabled}
            >
              <Gif weight="regular" className="size-[15px]" />
            </button>
          )}
          {showEmojiButton && (
            <button
              type="button"
              aria-label="Add emoji"
              className={cn(
                'flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] transition-colors disabled:pointer-events-none disabled:opacity-50',
                activePicker === 'emoji'
                  ? 'bg-red-100/15 text-red-300'
                  : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
              )}
              onClick={() => {
                if (useBuiltInEmoji) togglePicker('emoji');
                else onEmojiClick?.();
              }}
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
              variant={canSubmit ? 'default' : 'outline'}
              data-shimmer="slow"
              disabled={!canSubmit}
              onClick={() => {
                const text = editorRef.current?.getText() ?? '';
                handleSubmit(text);
              }}
              className={cn(
                'w-[100px] rounded-[2px] px-6 py-2 backdrop-blur-[15px]',
                canSubmit
                  ? 'bg-red-300 border-red-100 hover:bg-red-100'
                  : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]'
              )}
            >
              Post
            </Button>
          </div>
        )}
      </div>

      {/* Picker panel */}
      <AnimatePresence>
        {activePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {activePicker === 'gif' && gifApiBaseUrl && (
              <GifPicker
                apiBaseUrl={gifApiBaseUrl}
                onGifSelect={handleGifSelect}
                className="w-full border-0 shadow-none"
              />
            )}
            {activePicker === 'emoji' && (
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                className="w-full border-0 shadow-none"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ThoughtComposer, type ThoughtComposerProps, type ThoughtComposerMedia };
