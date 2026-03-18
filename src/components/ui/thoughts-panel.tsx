'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PushPin, ThumbsUp, ThumbsDown, Gif, SoccerBall } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { useLinkComponent } from '#/components/ui/link-context';
import { MiniEditor, type MiniEditorHandle } from '#/components/ui/mini-editor/index';
import type { ThoughtItem } from '#/types/content';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface PanelThought extends ThoughtItem {
  /** If set, the comment is pinned and shows "Pinned by {name}" */
  pinnedBy?: string;
  /** True when the thought author is the article/content author (gets pill treatment) */
  isOriginalAuthor?: boolean;
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
  /** New comment submit handler — parentId is set when replying */
  onSubmit?: (text: string, parentId?: string) => void;
  /** Like (thumbs up) handler */
  onLike?: (thoughtId: string) => void;
  /** Unlike (remove thumbs up) handler */
  onUnlike?: (thoughtId: string) => void;
  /** Load replies for a thought — called when "View replies" is clicked */
  onLoadReplies?: (thoughtId: string) => void;
  /** GIF picker handler — shows GIF icon in composer when set */
  onGifClick?: () => void;
  /** Emoji/football picker handler — shows icon in composer when set */
  onEmojiClick?: () => void;
  /** Loading state */
  isLoading?: boolean;
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
  isLoading = false,
  className,
}: ThoughtsPanelProps) {
  const composerRef = React.useRef<MiniEditorHandle>(null);
  const [hasText, setHasText] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);

  function handleSubmit(text: string) {
    if (!user) return;
    onSubmit?.(text);
    composerRef.current?.clear();
    setHasText(false);
  }

  function handleReplySubmit(text: string, parentId: string) {
    if (!user) return;
    onSubmit?.(text, parentId);
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
                      disabled={!user}
                      className="font-body text-sm font-medium leading-6 text-white"
                      placeholderClassName="text-[#807c7c] font-medium"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pl-14">
                  <div className="flex items-center gap-2">
                    {onGifClick && (
                      <button
                        type="button"
                        aria-label="Add GIF"
                        className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300"
                        onClick={onGifClick}
                      >
                        <Gif weight="regular" className="size-[15px]" />
                      </button>
                    )}
                    {onEmojiClick && (
                      <button
                        type="button"
                        aria-label="Add emoji"
                        className="flex items-center justify-center p-[9.5px] text-red-100 transition-colors hover:text-red-300"
                        onClick={onEmojiClick}
                      >
                        <SoccerBall weight="regular" className="size-[15px]" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant={hasText ? 'default' : 'outline'}
                    data-shimmer="slow"
                    disabled={!hasText || !user}
                    onClick={() => {
                      const text = composerRef.current?.getText();
                      if (text) handleSubmit(text);
                    }}
                    className={cn(
                      'w-[100px] rounded-[2px] px-6 py-2',
                      hasText
                        ? 'bg-red-300 border-red-100 hover:bg-red-100'
                        : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]'
                    )}
                  >
                    Post
                  </Button>
                </div>
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
  isReply = false,
}: {
  thought: PanelThought;
  user?: { avatarUrl?: string; initials?: string };
  replyingTo: string | null;
  onStartReply: (id: string) => void;
  onCancelReply: () => void;
  onReplySubmit: (text: string, parentId: string) => void;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  onLoadReplies?: (id: string) => void;
  isReply?: boolean;
}) {
  const Link = useLinkComponent();
  const isOP = thought.isOriginalAuthor;
  const isReplying = replyingTo === thought.id;
  const replyEditorRef = React.useRef<MiniEditorHandle>(null);
  const [replyHasText, setReplyHasText] = React.useState(false);

  // Auto-focus reply editor when it opens
  React.useEffect(() => {
    if (isReplying) {
      requestAnimationFrame(() => replyEditorRef.current?.focus());
    }
  }, [isReplying]);

  const replies = thought.replies ?? [];
  const replyCount = thought.replyCount ?? 0;
  const hasUnloadedReplies = replyCount > 0 && replies.length === 0;

  return (
    <motion.div className="flex flex-col" variants={itemVariants}>
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

            {/* Body */}
            <p className={cn(
              'font-content font-normal leading-[18px] tracking-[-0.126px] text-white',
              isReply ? 'text-xs' : 'text-sm',
            )}>
              {thought.body}
            </p>
          </div>

          {/* Actions: Reply + ThumbsUp + count + ThumbsDown */}
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
            <div className="flex items-center gap-3">
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
                  <ThumbsUp size={isReply ? 16 : 20} weight={thought.liked ? 'fill' : 'regular'} />
                </button>
                {(thought.stats.likes ?? 0) > 0 && (
                  <span className="font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]">
                    {thought.stats.likes}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="cursor-pointer text-[#807c7c] transition-colors hover:text-white"
              >
                <ThumbsDown size={isReply ? 16 : 20} />
              </button>
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
                  onReplySubmit(text, thought.id);
                  setReplyHasText(false);
                }}
                onChange={(text) => setReplyHasText(text.length > 0)}
                className="font-body text-sm font-medium leading-6 text-white"
                placeholderClassName="text-[#807c7c] font-medium"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pl-11">
            <Button
              variant="outline"
              onClick={onCancelReply}
              className="rounded-[2px] px-4 py-1.5 text-xs bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]"
            >
              Cancel
            </Button>
            <Button
              variant={replyHasText ? 'default' : 'outline'}
              data-shimmer="slow"
              disabled={!replyHasText}
              onClick={() => {
                const text = replyEditorRef.current?.getText();
                if (text) {
                  onReplySubmit(text, thought.id);
                  setReplyHasText(false);
                }
              }}
              className={cn(
                'rounded-[2px] px-4 py-1.5 text-xs',
                replyHasText
                  ? 'bg-red-300 border-red-100 hover:bg-red-100'
                  : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]',
              )}
            >
              Reply
            </Button>
          </div>
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
              isReply
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export { ThoughtsPanel, type ThoughtsPanelProps, type PanelThought };
