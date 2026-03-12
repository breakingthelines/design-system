'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PushPin, ThumbsUp, ThumbsDown } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
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
  /** New comment submit handler */
  onSubmit?: (text: string) => void;
  /** Like (thumbs up) handler */
  onLike?: (thoughtId: string) => void;
  /** Unlike (remove thumbs up) handler */
  onUnlike?: (thoughtId: string) => void;
  /** Reply handler — e.g. scroll to or focus reply input */
  onReply?: (thoughtId: string) => void;
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
  onReply,
  isLoading = false,
  className,
}: ThoughtsPanelProps) {
  const composerRef = React.useRef<MiniEditorHandle>(null);

  function handleSubmit(text: string) {
    onSubmit?.(text);
    composerRef.current?.clear();
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

              {/* Composer — avatar + minimal input line */}
              {user && (
                <div className="mt-6 flex items-center gap-6">
                  <Avatar className="size-10 shrink-0">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="You" />}
                    <AvatarFallback>{user.initials ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 border-b border-[#807c7c]/50 pb-2">
                    <MiniEditor
                      placeholder="Add a thought..."
                      submitOn="enter"
                      editorRef={composerRef}
                      onSubmit={handleSubmit}
                      className="font-body text-[10px] font-medium leading-6 text-white placeholder:text-[#807c7c]"
                    />
                  </div>
                </div>
              )}
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
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onReply={onReply}
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
  onLike,
  onUnlike,
  onReply,
}: {
  thought: PanelThought;
  onLike?: (id: string) => void;
  onUnlike?: (id: string) => void;
  onReply?: (id: string) => void;
}) {
  const isOP = thought.isOriginalAuthor;

  return (
    <motion.div className="flex gap-3" variants={itemVariants}>
      {/* Avatar */}
      <Avatar className="size-10 shrink-0">
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
              /* Original author: grey pill + 12px regular + verified badge */
              <span className="inline-flex items-center gap-1 rounded-[25px] bg-[#807c7c] px-2 py-1">
                <span className="font-content text-xs font-normal tracking-[-0.36px] text-white">
                  {thought.author.name}
                </span>
                {thought.author.verified && <VerifiedBadge size="sm" />}
              </span>
            ) : (
              /* Regular commenter: no pill, 14px semibold, no badge */
              <span className="py-[3.5px] font-content text-sm font-semibold tracking-[-0.42px] text-white">
                {thought.author.name}
              </span>
            )}
            {thought.createdAt && (
              <span className="font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]">
                {thought.createdAt}
              </span>
            )}
          </div>

          {/* Body */}
          <p className="font-content text-sm font-normal leading-[18px] tracking-[-0.126px] text-white">
            {thought.body}
          </p>
        </div>

        {/* Actions: Reply + ThumbsUp + count + ThumbsDown */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onReply?.(thought.id)}
            className="cursor-pointer font-content text-xs font-normal leading-[18px] tracking-[-0.36px] text-white transition-colors hover:text-red-100"
          >
            Reply
          </button>
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
                <ThumbsUp size={20} weight={thought.liked ? 'fill' : 'regular'} />
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
              <ThumbsDown size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ThoughtsPanel, type ThoughtsPanelProps, type PanelThought };
