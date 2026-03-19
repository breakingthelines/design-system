'use client';

import * as React from 'react';
import { Image, Gif, SoccerBall, X, SpinnerGap } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { MiniEditor, type MiniEditorHandle } from '#/components/ui/mini-editor/index';
import { EmojiPicker } from '#/components/ui/emoji-picker';
import { GifPicker, type GifSelection, type GifItem } from '#/components/ui/gif-picker';

const MAX_CHARS = 500;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB client-side limit
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

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
  /** Upload handler — receives File, returns public URL. Replaces legacy onImageClick. */
  onImageUpload?: (file: File) => Promise<string>;
  /** Legacy: external image click handler (used when onImageUpload is not set) */
  onImageClick?: () => void;
  /** GIF items to display — enables built-in GIF picker when provided */
  gifs?: GifItem[];
  /** Whether GIFs are loading */
  gifsLoading?: boolean;
  /** Whether the GIF fetch errored */
  gifsError?: boolean;
  /** Called when the GIF search query changes */
  onGifSearch?: (query: string) => void;
  /** Called when the user wants to retry after a GIF error */
  onGifRetry?: () => void;
  /** Legacy: external GIF click handler (used when gifs prop is not set) */
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
  onImageUpload,
  onImageClick,
  gifs,
  gifsLoading,
  gifsError,
  onGifSearch,
  onGifRetry,
  onGifClick,
  emojiEnabled = false,
  onEmojiClick,
  userId,
  disabled = false,
  ...props
}: ThoughtComposerProps) {
  const editorRef = React.useRef<MiniEditorHandle>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [remaining, setRemaining] = React.useState(MAX_CHARS);
  const [hasText, setHasText] = React.useState(false);
  const [activePicker, setActivePicker] = React.useState<ActivePicker>(null);
  const [selectedGif, setSelectedGif] = React.useState<GifSelection | null>(null);

  // Image upload state
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageUploading, setImageUploading] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);

  const isOverLimit = remaining < 0;
  const hasContent = hasText || selectedGif !== null || imageUrl !== null;
  const canSubmit = hasContent && !isOverLimit && !disabled && !imageUploading;

  const showImageButton = !!onImageUpload || !!onImageClick;
  const useBuiltInGif = gifs !== undefined;
  const useBuiltInEmoji = emojiEnabled;
  const showGifButton = useBuiltInGif || !!onGifClick;
  const showEmojiButton = useBuiltInEmoji || !!onEmojiClick;

  function clearImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageUrl(null);
    setImageUploading(false);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    // Validate size
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 10MB');
      return;
    }

    // Clear any existing GIF (mutual exclusivity)
    setSelectedGif(null);
    setImageError(null);

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageUploading(true);

    // Expand if not already
    if (!expanded) {
      setExpanded(true);
      requestAnimationFrame(() => editorRef.current?.focus());
    }

    try {
      const publicUrl = await onImageUpload(file);
      setImageUrl(publicUrl);
    } catch {
      setImageError('Upload failed');
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setImageUploading(false);
    }
  }

  function handleSubmit(text: string) {
    if (!canSubmit) return;

    let media: ThoughtComposerMedia | undefined;
    if (selectedGif) {
      media = { gifUrl: selectedGif.url, gifId: selectedGif.id, gifPlatform: 'klipy' };
    } else if (imageUrl) {
      media = { imageUrl };
    }

    onSubmit?.(text, media);
    editorRef.current?.clear();
    setHasText(false);
    setSelectedGif(null);
    clearImage();
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
    // Clear any image (mutual exclusivity)
    clearImage();
    setSelectedGif(gif);
    setActivePicker(null);
  }

  function handleEmojiSelect(emoji: string) {
    editorRef.current?.insertText(emoji);
    setHasText(true);
  }

  function handleImageButtonClick() {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      onImageClick?.();
    }
  }

  // Preview for both GIF and image
  const hasMediaPreview = selectedGif || imagePreview;

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
      {/* Hidden file input for image uploads */}
      {onImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

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

      {/* Media preview (GIF or image — mutually exclusive) */}
      <AnimatePresence>
        {hasMediaPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative inline-block max-w-[240px] overflow-hidden rounded-[6px] border border-white/[0.06]">
              <img
                src={selectedGif ? selectedGif.previewUrl : (imagePreview ?? undefined)}
                alt={selectedGif ? selectedGif.title : 'Image preview'}
                className="block max-h-[180px] w-full object-cover"
              />
              {/* Upload spinner overlay */}
              {imageUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <SpinnerGap weight="bold" className="size-6 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (selectedGif) setSelectedGif(null);
                  else clearImage();
                }}
                className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                aria-label={selectedGif ? 'Remove GIF' : 'Remove image'}
              >
                <X weight="bold" className="size-2.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image error message */}
      {imageError && (
        <p className="text-xs text-red-100">{imageError}</p>
      )}

      {/* Bottom row — action icons + submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {showImageButton && (
            <button
              type="button"
              aria-label="Add image"
              className="flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] text-red-100 transition-colors hover:bg-red-100/10 hover:text-red-300 disabled:pointer-events-none disabled:opacity-50"
              onClick={handleImageButtonClick}
              disabled={disabled || imageUploading}
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
            {activePicker === 'gif' && gifs !== undefined && (
              <GifPicker
                gifs={gifs}
                loading={gifsLoading}
                error={gifsError}
                onSearch={onGifSearch}
                onRetry={onGifRetry}
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
