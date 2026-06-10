'use client';

import * as React from 'react';
import { Image, Smiley, X, SpinnerGap } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import {
  MiniEditor,
  type MiniEditorHandle,
  type MentionItem,
} from '#/components/ui/mini-editor/index';
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
  /**
   * The full serialized Lexical editor state (`body_json`) of the composed
   * thought. Carries every inline MentionNode losslessly so the rendered
   * thought links its mentions via the shared {@link MentionFromNode} path
   * rather than the legacy `@word` regex. The plain-text `content` stays as the
   * fallback + the search/preview text.
   */
  bodyJson?: string;
  /** Ids of every `user`-kind mention (handy shorthand for the host). */
  mentionedUserIds?: string[];
  /**
   * Every inserted mention, in document order, across all kinds (user, squad,
   * and the football entities). The host derives whatever persistence it needs:
   * `user` mentions → `mentionedUserIds`, football kinds → structured subject
   * refs on the thought's context envelope. Provided so a posted thought can
   * round-trip the football subjects a `@` mention names, not just users.
   */
  mentions?: MentionItem[];
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
  /**
   * Polymorphic @mention search — enables the single `@` autocomplete when
   * provided. The host wires its federated lane returning {@link MentionItem}s
   * across people and football entities; the dropdown groups them by kind and a
   * pick inserts a typed mention node. Inserted mentions surface back on submit
   * via {@link ThoughtComposerMedia.mentions}.
   */
  onMentionSearch?: (query: string) => Promise<MentionItem[]>;
  /** Enables built-in emoji picker */
  emojiEnabled?: boolean;
  /** Legacy: external emoji click handler (used when emojiEnabled is not set) */
  onEmojiClick?: () => void;
  userId?: string;
  disabled?: boolean;
  /**
   * Compact mode (Wave 6.4.10): the composer is always expanded, the avatar +
   * prompt chrome shrinks, and the internal Post button is hidden — the host
   * owns submission via its own button + the {@link onChange} callback. Built
   * for the grade-submission sheet (the modal's "Submit grade" CTA is the
   * canonical submit; the composer is just the input surface). Defaults to
   * `false` so existing consumers keep the click-to-expand behaviour.
   */
  compact?: boolean;
  /**
   * Continuous change callback (Wave 6.4.10): fires on every text change with
   * the plain text + the current mention list. Use this in compact mode where
   * the host owns the submit button — read the latest text + mentions here
   * and pass them into the host's submit handler. The legacy {@link onSubmit}
   * still fires when the user presses Cmd+Enter (or the internal button in
   * non-compact mode). Independent of the existing `onChange` MiniEditor wire
   * — this one bundles mentions so the host doesn't need to plumb an
   * editorRef in.
   */
  onChange?: (text: string, mentions: MentionItem[]) => void;
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
  onMentionSearch,
  emojiEnabled = false,
  onEmojiClick,
  userId: _userId,
  disabled = false,
  compact = false,
  onChange,
  ...props
}: ThoughtComposerProps) {
  const editorRef = React.useRef<MiniEditorHandle>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // In compact mode the composer is always expanded — there's no avatar/prompt
  // intermediary because the host (e.g. the grade-submit sheet) already has
  // its own context header. The internal Post button is also suppressed; the
  // host owns submit via the bundled `onChange(text, mentions)` callback.
  const [expanded, setExpanded] = React.useState(compact);
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

    const mentions = editorRef.current?.getMentions() ?? [];
    const mentionedUserIds = editorRef.current?.getMentionedUserIds() ?? [];
    const bodyJson = editorRef.current?.getBodyJson();

    let media: ThoughtComposerMedia | undefined;
    if (selectedGif) {
      media = { gifUrl: selectedGif.url, gifId: selectedGif.id, gifPlatform: 'klipy' };
    } else if (imageUrl) {
      media = { imageUrl };
    }

    // Carry the serialized Lexical state so the rendered thought keeps its
    // inline mentions structured (shared MentionFromNode path), not flattened.
    if (bodyJson) {
      media = { ...media, bodyJson };
    }

    // Surface every inserted mention so the host can persist both the user
    // mentions and the football subjects an `@` named.
    if (mentions.length > 0) {
      media = { ...media, mentions };
    }
    if (mentionedUserIds.length > 0) {
      media = { ...media, mentionedUserIds };
    }

    onSubmit?.(text, media);
    editorRef.current?.clear();
    editorRef.current?.blur();
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
  const toolbarButtonClass =
    'flex h-8 cursor-pointer items-center justify-center rounded-[4px] text-[#807c7c] transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-50';

  return (
    <div
      data-slot="thought-composer"
      data-compact={compact || undefined}
      className={cn(
        'flex flex-col rounded-[4px] border border-white/[0.05] bg-[#151515]/90 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-[18px]',
        compact ? 'min-h-[120px] gap-3 px-4 py-3' : 'min-h-[168px] gap-6 px-7 py-7',
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

      {/* Prompt row — compact mode drops the avatar + click-to-expand wrapper */}
      {compact ? (
        <div className="flex-1 min-w-0">
          <MiniEditor
            placeholder={`${placeholder}`}
            submitOn="mod-enter"
            maxLength={MAX_CHARS}
            multiline
            disabled={disabled}
            editorRef={editorRef}
            onSubmit={handleSubmit}
            onChange={(text) => {
              setHasText(text.length > 0);
              if (onChange) {
                const mentions = editorRef.current?.getMentions() ?? [];
                onChange(text, mentions);
              }
            }}
            onRemainingChange={setRemaining}
            onMentionSearch={onMentionSearch}
            className="min-h-[60px] text-sm font-medium leading-6 text-foreground"
            placeholderClassName="text-sm font-medium leading-6 text-white/45"
          />
        </div>
      ) : (
        <div className="flex cursor-text items-center gap-5" onClick={handleExpand}>
          <Avatar className="size-[42px] shrink-0">
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
                onChange={(text) => {
                  setHasText(text.length > 0);
                  if (onChange) {
                    const mentions = editorRef.current?.getMentions() ?? [];
                    onChange(text, mentions);
                  }
                }}
                onRemainingChange={setRemaining}
                onMentionSearch={onMentionSearch}
                className="min-h-[34px] text-sm font-medium leading-6 text-foreground"
                placeholderClassName="text-sm font-medium leading-6 text-white/45"
              />
            </div>
          ) : (
            <span className="text-sm font-medium leading-6 text-white/45 select-none">
              {placeholder}...
            </span>
          )}
        </div>
      )}

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
      {imageError && <p className="text-xs text-red-100">{imageError}</p>}

      {/* Bottom row — action icons + submit (submit hidden in compact mode) */}
      <div className="mt-auto flex items-center justify-between gap-4">
        <div className={cn('flex items-center', compact ? 'gap-6 pl-0' : 'gap-9 pl-[62px]')}>
          {showImageButton && (
            <button
              type="button"
              aria-label="Add image"
              className={toolbarButtonClass}
              onClick={handleImageButtonClick}
              disabled={disabled || imageUploading}
            >
              <Image weight="regular" className="size-4" />
            </button>
          )}
          {showGifButton && (
            <button
              type="button"
              aria-label="Add GIF"
              className={cn(
                toolbarButtonClass,
                'text-xs font-semibold tracking-[0.01em]',
                activePicker === 'gif' && 'text-white'
              )}
              onClick={() => {
                if (useBuiltInGif) togglePicker('gif');
                else onGifClick?.();
              }}
              disabled={disabled}
            >
              GIF
            </button>
          )}
          {showEmojiButton && (
            <button
              type="button"
              aria-label="Add emoji"
              className={cn(toolbarButtonClass, activePicker === 'emoji' && 'text-white')}
              onClick={() => {
                if (useBuiltInEmoji) togglePicker('emoji');
                else onEmojiClick?.();
              }}
              disabled={disabled}
            >
              <Smiley weight="regular" className="size-4" />
            </button>
          )}
        </div>

        {expanded && !compact && (
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

        {/* Compact mode: just show the remaining-chars counter — submit owned by host */}
        {compact && hasText && (
          <span
            data-slot="thought-composer-remaining"
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
