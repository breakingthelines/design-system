'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PushPin, ThumbsUp, Gif, SoccerBall, Image as ImageIcon, SpinnerGap, Clock } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { useLinkComponent } from '#/components/ui/link-context';
import { useRenderMentions } from '#/lib/render-mentions';
import { MiniEditor, type MiniEditorHandle, type MentionSuggestion } from '#/components/ui/mini-editor/index';
import { EmojiPicker } from '#/components/ui/emoji-picker';
import { GifPicker, type GifSelection, type GifItem } from '#/components/ui/gif-picker';
import type { ThoughtItem } from '#/types/content';

type PanelActivePicker = 'gif' | 'emoji' | null;

interface PanelMedia {
  gifUrl?: string;
  gifId?: string;
  gifPlatform?: 'klipy' | 'giphy';
  imageUrl?: string;
  mentionedUserIds?: string[];
}

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface PanelThought extends ThoughtItem {
  /** If set, the comment is pinned and shows "Pinned by {name}" */
  pinnedBy?: string;
}

interface ThoughtsPanelProps {
  /** Controls panel visibility */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Total comment count displayed in header */
  count: number;
  /** Thought/comment items to render */
  thoughts: PanelThought[];
  /** Current user info for the composer — omit to hide composer */
  user?: { avatarUrl?: string; initials?: string };
  /** New comment submit handler — parentId is set when replying, media when GIF/image attached */
  onSubmit?: (text: string, parentId?: string, media?: PanelMedia) => void;
  /** Like (thumbs up) handler */
  onLike?: (thoughtId: string) => void;
  /** Unlike (remove thumbs up) handler */
  onUnlike?: (thoughtId: string) => void;
  /** Load replies for a thought — called when "View replies" is clicked */
  onLoadReplies?: (thoughtId: string) => void;
  /** Legacy: external GIF click handler (used when gifs prop is not set) */
  onGifClick?: () => void;
  /** Legacy: external emoji click handler (used when emojiEnabled is not set) */
  onEmojiClick?: () => void;
  /** GIF items — enables built-in GIF picker when provided */
  gifs?: GifItem[];
  /** Whether GIFs are loading */
  gifsLoading?: boolean;
  /** Whether the GIF fetch errored */
  gifsError?: boolean;
  /** Called when the GIF search query changes */
  onGifSearch?: (query: string) => void;
  /** Called when the user wants to retry after a GIF error */
  onGifRetry?: () => void;
  /** Image upload handler — enables image button when provided. Returns public URL. */
  onImageUpload?: (file: File) => Promise<string>;
  /** @mention search callback — enables @mention autocomplete when provided */
  onMentionSearch?: (query: string) => Promise<MentionSuggestion[]>;
  /** Enables built-in emoji picker in composer */
  emojiEnabled?: boolean;
  /** User ID */
  userId?: string;
  /** Loading state */
  isLoading?: boolean;
  /** When set, scrolls to and highlights the thought with this ID on open */
  scrollToThoughtId?: string;
  /** Called when user clicks a quoted passage or timestamp anchor on a thought */
  onAnchorClick?: (anchor: import('#/types/content').ThoughtAnchor) => void;
  /** Additional class names on the panel container */
  className?: string;
}

/* ────────────────────────────────────────────────────────────
 * Animation variants
 * ──────────────────────────────────────────────────────────── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: {
    x: '100%',
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
};

const listVariants = {
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

/* ────────────────────────────────────────────────────────────
 * ThoughtsPanel
 * ──────────────────────────────────────────────────────────── */

function ThoughtsPanel({
  open,
  onClose,
  count,
  thoughts,
  user,
  onSubmit,
  onLike,
  onUnlike,
  onLoadReplies,
  onGifClick,
  onEmojiClick,
  gifs,
  gifsLoading,
  gifsError,
  onGifSearch,
  onGifRetry,
  onMentionSearch,
  onImageUpload,
  emojiEnabled = false,
  userId,
  isLoading = false,
  scrollToThoughtId,
  onAnchorClick,
  className,
}: ThoughtsPanelProps) {
  const composerRef = React.useRef<MiniEditorHandle>(null);
  const [hasText, setHasText] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [panelPicker, setPanelPicker] = React.useState<PanelActivePicker>(null);
  const [selectedGif, setSelectedGif] = React.useState<GifSelection | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageUploading, setImageUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const useBuiltInGif = gifs !== undefined;
  const useBuiltInEmoji = emojiEnabled;
  const showGifBtn = useBuiltInGif || !!onGifClick;
  const showEmojiBtn = useBuiltInEmoji || !!onEmojiClick;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    // Client-side 10 MB limit
    if (file.size > 10 * 1024 * 1024) return;
    // Clear GIF (mutual exclusivity)
    setSelectedGif(null);
    setPanelPicker(null);
    // Show local preview
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setImageUploading(true);
    onImageUpload(file)
      .then((url) => { setImageUrl(url); setImageUploading(false); })
      .catch(() => { setImagePreview(null); setImageUrl(null); setImageUploading(false); });
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
    setImageUploading(false);
  }

  function handleSubmit(text: string) {
    if (!user) return;
    const mentionedUserIds = composerRef.current?.getMentionedUserIds() ?? [];
    let media: PanelMedia | undefined = selectedGif
      ? { gifUrl: selectedGif.url, gifId: selectedGif.id, gifPlatform: 'klipy' }
      : imageUrl
        ? { imageUrl }
        : undefined;
    if (mentionedUserIds.length > 0) {
      media = { ...media, mentionedUserIds };
    }
    onSubmit?.(text, undefined, media);
    composerRef.current?.clear();
    setHasText(false);
    setSelectedGif(null);
    clearImage();
    setPanelPicker(null);
  }

  function handleReplySubmit(text: string, parentId: string, media?: PanelMedia) {
    if (!user) return;
    onSubmit?.(text, parentId, media);
    setReplyingTo(null);
  }

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Clear reply state when panel closes
  React.useEffect(() => {
    if (!open) setReplyingTo(null);
  }, [open]);

  // Scroll to and highlight a specific thought when deep-linked.
  // Re-runs when thoughts change (e.g. after async load) so the target
  // is found even if the panel opens before data arrives.
  React.useEffect(() => {
    if (!scrollToThoughtId || !open || isLoading) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-thought-id="${scrollToThoughtId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-1', 'ring-red-100/50', 'ring-offset-4', 'ring-offset-background', 'rounded-lg');
        setTimeout(() => el.classList.remove('ring-1', 'ring-red-100/50', 'ring-offset-4', 'ring-offset-background', 'rounded-lg'), 2000);
      } else if (onLoadReplies) {
        // Target not found — it's likely a reply that's collapsed.
        // Auto-expand replies for all thoughts that have unloaded replies.
        for (const t of thoughts) {
          const hasUnloaded = (t.replyCount ?? 0) > 0 && (!t.replies || t.replies.length === 0);
          if (hasUnloaded) onLoadReplies(t.id);
        }
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [scrollToThoughtId, open, isLoading, thoughts, onLoadReplies]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className={cn(
              'fixed top-0 right-0 z-50 flex h-full w-full flex-col bg-black sm:w-[740px]',
              className,
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ── Header area ── */}
            <div className="shrink-0 px-8 pt-12 sm:px-[70px] sm:pt-[70px]">
              {/* Title row */}
              <div className="flex items-center justify-between">
                <h2 className="font-content text-xl font-semibold tracking-[-0.6px] text-white">
                  {count} {count === 1 ? 'Thought' : 'Thoughts'}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 cursor-pointer items-center justify-center text-white/60 transition-colors hover:text-white"
                  aria-label="Close thoughts"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              {/* Composer — avatar + input + actions */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <Avatar className="size-10 shrink-0">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="You" />}
                    <AvatarFallback>{user?.initials ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 border-b border-[#807c7c]/50 pb-2">
                    <MiniEditor
                      placeholder={user ? 'Add a thought...' : 'Log in to share your thoughts...'}
                      submitOn="mod-enter"
                      editorRef={composerRef}
                      onSubmit={handleSubmit}
                      onChange={(text) => setHasText(text.length > 0)}
                      onMentionSearch={onMentionSearch}
                      disabled={!user}
                      className="font-body text-sm font-medium leading-6 text-white"
                      placeholderClassName="text-[#807c7c] font-medium"
                    />
                  </div>
                </div>
                {/* GIF preview */}
                <AnimatePresence>
                  {selectedGif && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden pl-14"
                    >
                      <div className="relative inline-block max-w-[200px] overflow-hidden rounded-[6px] border border-white/[0.06]">
                        <img
                          src={selectedGif.previewUrl}
                          alt={selectedGif.title}
                          className="block max-h-[140px] w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedGif(null)}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                          aria-label="Remove GIF"
                        >
                          <X weight="bold" className="size-2.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Image preview */}
                <AnimatePresence>
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden pl-14"
                    >
                      <div className="relative inline-block max-w-[200px] overflow-hidden rounded-[6px] border border-white/[0.06]">
                        <img
                          src={imagePreview}
                          alt=""
                          className="block max-h-[140px] w-full object-cover"
                        />
                        {imageUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <SpinnerGap className="size-5 animate-spin text-white" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                          aria-label="Remove image"
                        >
                          <X weight="bold" className="size-2.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pl-14">
                  <div className="flex items-center gap-1">
                    {showGifBtn && (
                      <button
                        type="button"
                        aria-label="Add GIF"
                        className={cn(
                          'flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] transition-colors',
                          panelPicker === 'gif'
                            ? 'bg-red-100/15 text-red-300'
                            : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
                        )}
                        onClick={() => {
                          if (useBuiltInGif) setPanelPicker(p => p === 'gif' ? null : 'gif');
                          else onGifClick?.();
                        }}
                      >
                        <Gif weight="regular" className="size-[15px]" />
                      </button>
                    )}
                    {showEmojiBtn && (
                      <button
                        type="button"
                        aria-label="Add emoji"
                        className={cn(
                          'flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] transition-colors',
                          panelPicker === 'emoji'
                            ? 'bg-red-100/15 text-red-300'
                            : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
                        )}
                        onClick={() => {
                          if (useBuiltInEmoji) setPanelPicker(p => p === 'emoji' ? null : 'emoji');
                          else onEmojiClick?.();
                        }}
                      >
                        <SoccerBall weight="regular" className="size-[15px]" />
                      </button>
                    )}
                    {onImageUpload && user && (
                      <button
                        type="button"
                        aria-label="Add image"
                        className="flex cursor-pointer items-center justify-center rounded-[4px] p-[9.5px] text-red-100 transition-colors hover:bg-red-100/10 hover:text-red-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon weight="regular" className="size-[15px]" />
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant={(hasText || selectedGif || imageUrl) ? 'default' : 'outline'}
                    data-shimmer="slow"
                    disabled={(!hasText && !selectedGif && !imageUrl) || imageUploading || !user}
                    onClick={() => {
                      const text = composerRef.current?.getText() ?? '';
                      handleSubmit(text);
                    }}
                    className={cn(
                      'w-[100px] rounded-[2px] px-6 py-2',
                      (hasText || selectedGif || imageUrl)
                        ? 'bg-red-300 border-red-100 hover:bg-red-100'
                        : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]'
                    )}
                  >
                    Post
                  </Button>
                </div>

                {/* Built-in picker panel */}
                <AnimatePresence>
                  {panelPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-14"
                    >
                      {panelPicker === 'gif' && gifs !== undefined && (
                        <GifPicker
                          gifs={gifs}
                          loading={gifsLoading}
                          error={gifsError}
                          onSearch={onGifSearch}
                          onRetry={onGifRetry}
                          onGifSelect={(gif) => {
                            setSelectedGif(gif);
                            clearImage();
                            setPanelPicker(null);
                          }}
                          className="w-full border-0 shadow-none"
                        />
                      )}
                      {panelPicker === 'emoji' && (
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            composerRef.current?.insertText(emoji);
                            setHasText(true);
                          }}
                          className="w-full border-0 shadow-none"
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Thoughts list ── */}
            <div className="flex-1 overflow-y-auto px-8 pt-10 pb-[140px] sm:px-[70px] sm:pt-11">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <span className="font-content text-sm text-[#807c7c]">Loading thoughts...</span>
                </div>
              ) : thoughts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="font-content text-sm text-[#807c7c]">
                    No thoughts yet. Be the first to share yours.
                  </p>
                </div>
              ) : (
                <motion.div
                  className="flex flex-col gap-8"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {thoughts.map((thought) => (
                    <CommentItem
                      key={thought.id}
                      thought={thought}
                      user={user}
                      replyingTo={replyingTo}
                      onStartReply={(id) => setReplyingTo(id)}
                      onCancelReply={() => setReplyingTo(null)}
                      onReplySubmit={handleReplySubmit}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onLoadReplies={onLoadReplies}
                      onAnchorClick={onAnchorClick}
                      gifs={gifs}
                      gifsLoading={gifsLoading}
                      gifsError={gifsError}
                      onGifSearch={onGifSearch}
                      onGifRetry={onGifRetry}
                      onGifClick={onGifClick}
                      onImageUpload={onImageUpload}
                      onMentionSearch={onMentionSearch}
                      emojiEnabled={emojiEnabled}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────
 * CommentItem — individual thought inside the panel
 *
 * Two author treatments:
 *   - isOriginalAuthor → grey pill (bg-[#807c7c]), Inter Regular 12px, verified badge
 *   - regular commenter → no pill, Inter Semi Bold 14px, no badge
 * ──────────────────────────────────────────────────────────── */

function CommentItem({
  thought,
  user,
  replyingTo,
  onStartReply,
  onCancelReply,
  onReplySubmit,
  onLike,
  onUnlike,
  onLoadReplies,
  onAnchorClick,
  isReply = false,
  gifs,
  gifsLoading,
  gifsError,
  onGifSearch,
  onGifRetry,
  onGifClick,
  onImageUpload,
  onMentionSearch,
  emojiEnabled = false,
}: {
  thought: PanelThought;
  user?: { avatarUrl?: string; initials?: string };
  replyingTo: string | null;
  onStartReply: (id: string) => void;
  onCancelReply: () => void;
  onReplySubmit: (text: string, parentId: string, media?: PanelMedia) => void;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  onLoadReplies?: (id: string) => void;
  onAnchorClick?: (anchor: import('#/types/content').ThoughtAnchor) => void;
  isReply?: boolean;
  gifs?: GifItem[];
  gifsLoading?: boolean;
  gifsError?: boolean;
  onGifSearch?: (query: string) => void;
  onGifRetry?: () => void;
  onGifClick?: () => void;
  onImageUpload?: (file: File) => Promise<string>;
  onMentionSearch?: (query: string) => Promise<MentionSuggestion[]>;
  emojiEnabled?: boolean;
}) {
  const Link = useLinkComponent();
  const renderMentions = useRenderMentions();
  const isOP = thought.isOriginalAuthor;
  const isReplying = replyingTo === thought.id;
  const replyEditorRef = React.useRef<MiniEditorHandle>(null);
  const [replyHasText, setReplyHasText] = React.useState(false);

  // Reply media state
  const [replyPicker, setReplyPicker] = React.useState<PanelActivePicker>(null);
  const [replyGif, setReplyGif] = React.useState<GifSelection | null>(null);
  const [replyImagePreview, setReplyImagePreview] = React.useState<string | null>(null);
  const [replyImageUrl, setReplyImageUrl] = React.useState<string | null>(null);
  const [replyImageUploading, setReplyImageUploading] = React.useState(false);
  const replyFileInputRef = React.useRef<HTMLInputElement>(null);

  const useBuiltInGif = gifs !== undefined;
  const useBuiltInEmoji = emojiEnabled;
  const showReplyGifBtn = useBuiltInGif || !!onGifClick;
  const showReplyEmojiBtn = useBuiltInEmoji;

  function clearReplyImage() {
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    setReplyImagePreview(null);
    setReplyImageUrl(null);
    setReplyImageUploading(false);
  }

  function handleReplyFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    e.target.value = '';
    if (file.size > 10 * 1024 * 1024) return;
    setReplyGif(null);
    setReplyPicker(null);
    const preview = URL.createObjectURL(file);
    setReplyImagePreview(preview);
    setReplyImageUploading(true);
    onImageUpload(file)
      .then((url) => { setReplyImageUrl(url); setReplyImageUploading(false); })
      .catch(() => { setReplyImagePreview(null); setReplyImageUrl(null); setReplyImageUploading(false); });
  }

  function resetReplyMedia() {
    setReplyGif(null);
    clearReplyImage();
    setReplyPicker(null);
    setReplyHasText(false);
  }

  // Auto-focus reply editor when it opens
  React.useEffect(() => {
    if (isReplying) {
      requestAnimationFrame(() => replyEditorRef.current?.focus());
    } else {
      resetReplyMedia();
    }
  }, [isReplying]);

  const replies = thought.replies ?? [];
  const replyCount = thought.replyCount ?? 0;
  const hasUnloadedReplies = replyCount > 0 && replies.length === 0;

  return (
    <motion.div className="flex flex-col" variants={itemVariants} data-thought-id={thought.id}>
      <div className={cn('flex gap-3', isReply && 'pl-[52px]')}>
        {/* Avatar */}
        <Avatar className={cn(isReply ? 'size-8' : 'size-10', 'shrink-0')}>
          {thought.author.avatarUrl && (
            <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
          )}
          <AvatarFallback>{thought.author.initials ?? thought.author.name.charAt(0)}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Pinned indicator */}
          {thought.pinnedBy && (
            <div className="flex items-center gap-1">
              <PushPin size={14} className="text-[#807c7c]" />
              <span className="font-body text-[10px] font-medium leading-6 text-[#807c7c]">
                Pinned by {thought.pinnedBy}
              </span>
            </div>
          )}

          {/* Author + timestamp — two treatments */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {isOP ? (
                /* Original author: grey pill + regular weight + verified badge */
                <span className="inline-flex items-center gap-1 rounded-[25px] bg-[#807c7c] px-2 py-1">
                  {thought.author.handle ? (
                    <Link
                      href={`/@${thought.author.handle}`}
                      className="font-content text-xs font-normal tracking-[-0.36px] text-white transition-colors hover:text-red-100"
                    >
                      {thought.author.name}
                    </Link>
                  ) : (
                    <span className="font-content text-xs font-normal tracking-[-0.36px] text-white">
                      {thought.author.name}
                    </span>
                  )}
                  {thought.author.verified && <VerifiedBadge size="sm" />}
                </span>
              ) : (
                <span className={cn(
                  'inline-flex items-center gap-1 font-content font-semibold tracking-[-0.42px] text-white',
                  isReply ? 'py-[2px] text-xs' : 'py-[3.5px] text-sm',
                )}>
                  {thought.author.handle ? (
                    <Link
                      href={`/@${thought.author.handle}`}
                      className="text-white transition-colors hover:text-red-100"
                    >
                      {thought.author.name}
                    </Link>
                  ) : (
                    thought.author.name
                  )}
                  {thought.author.verified && <VerifiedBadge size="sm" />}
                </span>
              )}
              {thought.createdAt && (
                <span className="font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]">
                  {thought.createdAt}
                </span>
              )}
            </div>

            {/* Content anchor quote — clickable when onAnchorClick provided */}
            {thought.anchor?.type === 'text' && thought.anchor.text?.selectedText && (
              <div
                className={cn(
                  'rounded-md border-l-2 border-red-100/40 bg-white/[0.03] py-1.5 pl-3 pr-2',
                  onAnchorClick && 'cursor-pointer transition-colors hover:bg-white/[0.06] hover:border-red-100/60',
                )}
                onClick={onAnchorClick ? () => onAnchorClick(thought.anchor!) : undefined}
                role={onAnchorClick ? 'button' : undefined}
                tabIndex={onAnchorClick ? 0 : undefined}
              >
                <p className="font-content text-[11px] leading-relaxed text-white/40 italic line-clamp-3">
                  &ldquo;{thought.anchor.text.selectedText}&rdquo;
                </p>
              </div>
            )}

            {/* Timestamp anchor badge — clickable when onAnchorClick provided */}
            {thought.anchor?.type === 'timestamp' && thought.anchor.label && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 self-start rounded-full bg-red-100/10 px-2 py-0.5 text-red-100',
                  onAnchorClick && 'cursor-pointer transition-colors hover:bg-red-100/20',
                )}
                onClick={onAnchorClick ? () => onAnchorClick(thought.anchor!) : undefined}
                role={onAnchorClick ? 'button' : undefined}
                tabIndex={onAnchorClick ? 0 : undefined}
              >
                <Clock size={10} weight="bold" />
                <span className="font-content text-[10px] font-semibold tabular-nums">
                  {thought.anchor.label}
                </span>
              </span>
            )}

            {/* Body */}
            {thought.body && (
              <p className={cn(
                'font-content font-normal leading-[18px] tracking-[-0.126px] text-white',
                isReply ? 'text-xs' : 'text-sm',
              )}>
                {renderMentions(thought.body)}
              </p>
            )}

            {/* GIF / Image attachment */}
            {(thought.gifUrl || thought.imageUrl) && (
              <div className="mt-1.5 max-w-[240px] overflow-hidden rounded-[6px] border border-white/[0.06]">
                <img
                  src={thought.gifUrl || thought.imageUrl}
                  alt=""
                  className="block max-h-[180px] w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Actions: Reply + ThumbsUp + count */}
          <div className="flex items-center gap-4">
            {!isReply && (
              <button
                type="button"
                onClick={() => onStartReply(thought.id)}
                className="cursor-pointer font-content text-xs font-normal leading-[18px] tracking-[-0.36px] text-white transition-colors hover:text-red-100"
              >
                Reply{replyCount > 0 ? ` (${replyCount})` : ''}
              </button>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  thought.liked ? onUnlike?.(thought.id) : onLike?.(thought.id)
                }
                className={cn(
                  'cursor-pointer transition-colors',
                  thought.liked ? 'text-white' : 'text-[#807c7c] hover:text-white',
                )}
              >
                <ThumbsUp size={14} weight={thought.liked ? 'fill' : 'regular'} />
              </button>
              {(thought.stats.likes ?? 0) > 0 && (
                <span className="font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]">
                  {thought.stats.likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline reply composer — shown when replying to this thought */}
      {isReplying && user && (
        <div className="mt-4 pl-[52px] flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Avatar className="size-8 shrink-0">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="You" />}
              <AvatarFallback>{user.initials ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 border-b border-[#807c7c]/50 pb-2">
              <MiniEditor
                placeholder={`Reply to ${thought.author.name}...`}
                submitOn="mod-enter"
                editorRef={replyEditorRef}
                onSubmit={(text) => {
                  const mentionedIds = replyEditorRef.current?.getMentionedUserIds() ?? [];
                  let media: PanelMedia | undefined = replyGif
                    ? { gifUrl: replyGif.url, gifId: replyGif.id, gifPlatform: 'klipy' }
                    : replyImageUrl
                      ? { imageUrl: replyImageUrl }
                      : undefined;
                  if (mentionedIds.length > 0) {
                    media = { ...media, mentionedUserIds: mentionedIds };
                  }
                  onReplySubmit(text, thought.id, media);
                  resetReplyMedia();
                }}
                onChange={(text) => setReplyHasText(text.length > 0)}
                onMentionSearch={onMentionSearch}
                className="font-body text-sm font-medium leading-6 text-white"
                placeholderClassName="text-[#807c7c] font-medium"
              />
            </div>
          </div>

          {/* Reply GIF preview */}
          <AnimatePresence>
            {replyGif && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-11"
              >
                <div className="relative inline-block max-w-[160px] overflow-hidden rounded-[6px] border border-white/[0.06]">
                  <img src={replyGif.previewUrl} alt={replyGif.title} className="block max-h-[100px] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setReplyGif(null)}
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                    aria-label="Remove GIF"
                  >
                    <X weight="bold" className="size-2.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reply image preview */}
          <AnimatePresence>
            {replyImagePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-11"
              >
                <div className="relative inline-block max-w-[160px] overflow-hidden rounded-[6px] border border-white/[0.06]">
                  <img src={replyImagePreview} alt="" className="block max-h-[100px] w-full object-cover" />
                  {replyImageUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <SpinnerGap className="size-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearReplyImage}
                    className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                    aria-label="Remove image"
                  >
                    <X weight="bold" className="size-2.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pl-11">
            <div className="flex items-center gap-1">
              {showReplyGifBtn && (
                <button
                  type="button"
                  aria-label="Add GIF"
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-[4px] p-[7px] transition-colors',
                    replyPicker === 'gif'
                      ? 'bg-red-100/15 text-red-300'
                      : 'text-red-100 hover:bg-red-100/10 hover:text-red-300',
                  )}
                  onClick={() => {
                    if (useBuiltInGif) setReplyPicker(p => p === 'gif' ? null : 'gif');
                    else onGifClick?.();
                  }}
                >
                  <Gif weight="regular" className="size-[13px]" />
                </button>
              )}
              {showReplyEmojiBtn && (
                <button
                  type="button"
                  aria-label="Add emoji"
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-[4px] p-[7px] transition-colors',
                    replyPicker === 'emoji'
                      ? 'bg-red-100/15 text-red-300'
                      : 'text-red-100 hover:bg-red-100/10 hover:text-red-300',
                  )}
                  onClick={() => {
                    if (useBuiltInEmoji) setReplyPicker(p => p === 'emoji' ? null : 'emoji');
                  }}
                >
                  <SoccerBall weight="regular" className="size-[13px]" />
                </button>
              )}
              {onImageUpload && (
                <button
                  type="button"
                  aria-label="Add image"
                  className="flex cursor-pointer items-center justify-center rounded-[4px] p-[7px] text-red-100 transition-colors hover:bg-red-100/10 hover:text-red-300"
                  onClick={() => replyFileInputRef.current?.click()}
                >
                  <ImageIcon weight="regular" className="size-[13px]" />
                </button>
              )}
            </div>
            <input
              ref={replyFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={handleReplyFileSelect}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => { resetReplyMedia(); onCancelReply(); }}
                className="rounded-[2px] px-4 py-1.5 text-xs bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]"
              >
                Cancel
              </Button>
              <Button
                variant={(replyHasText || replyGif || replyImageUrl) ? 'default' : 'outline'}
                data-shimmer="slow"
                disabled={(!replyHasText && !replyGif && !replyImageUrl) || replyImageUploading}
                onClick={() => {
                  const text = replyEditorRef.current?.getText() ?? '';
                  const mentionedIds = replyEditorRef.current?.getMentionedUserIds() ?? [];
                  let media: PanelMedia | undefined = replyGif
                    ? { gifUrl: replyGif.url, gifId: replyGif.id, gifPlatform: 'klipy' }
                    : replyImageUrl
                      ? { imageUrl: replyImageUrl }
                      : undefined;
                  if (mentionedIds.length > 0) {
                    media = { ...media, mentionedUserIds: mentionedIds };
                  }
                  if (text || media) {
                    onReplySubmit(text, thought.id, media);
                    resetReplyMedia();
                  }
                }}
                className={cn(
                  'rounded-[2px] px-4 py-1.5 text-xs',
                  (replyHasText || replyGif || replyImageUrl)
                    ? 'bg-red-300 border-red-100 hover:bg-red-100'
                    : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]',
                )}
              >
                Reply
              </Button>
            </div>
          </div>

          {/* Reply picker panel */}
          <AnimatePresence>
            {replyPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pl-11"
              >
                {replyPicker === 'gif' && gifs !== undefined && (
                  <GifPicker
                    gifs={gifs}
                    loading={gifsLoading}
                    error={gifsError}
                    onSearch={onGifSearch}
                    onRetry={onGifRetry}
                    onGifSelect={(gif) => {
                      setReplyGif(gif);
                      clearReplyImage();
                      setReplyPicker(null);
                    }}
                    className="w-full border-0 shadow-none"
                  />
                )}
                {replyPicker === 'emoji' && (
                  <EmojiPicker
                    onEmojiSelect={(emoji) => {
                      replyEditorRef.current?.insertText(emoji);
                      setReplyHasText(true);
                    }}
                    className="w-full border-0 shadow-none"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* "View replies" link — when replies exist but aren't loaded */}
      {hasUnloadedReplies && !isReplying && (
        <button
          type="button"
          onClick={() => onLoadReplies?.(thought.id)}
          className="mt-2 pl-[52px] cursor-pointer font-content text-xs font-medium text-red-100 transition-colors hover:text-red-300 text-left"
        >
          View {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Replies — flat, 1 level deep, no nested reply button */}
      {replies.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              thought={reply as PanelThought}
              user={user}
              replyingTo={replyingTo}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onReplySubmit={onReplySubmit}
              onLike={onLike}
              onUnlike={onUnlike}
              onAnchorClick={onAnchorClick}
              isReply
              gifs={gifs}
              gifsLoading={gifsLoading}
              gifsError={gifsError}
              onGifSearch={onGifSearch}
              onGifRetry={onGifRetry}
              onGifClick={onGifClick}
              onImageUpload={onImageUpload}
              onMentionSearch={onMentionSearch}
              emojiEnabled={emojiEnabled}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export { ThoughtsPanel, type ThoughtsPanelProps, type PanelThought };
