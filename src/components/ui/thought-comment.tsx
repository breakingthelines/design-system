'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PushPin,
  ThumbsUp,
  Bookmark,
  UploadSimple,
  Gif,
  Smiley,
  Image as ImageIcon,
  SpinnerGap,
  Clock,
} from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { Button } from '#/components/ui/button';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { Badge } from '#/components/ui/badge';
import { tierVariantMap } from '#/components/ui/author-line';
import { FromGradePill } from '#/components/ui/from-grade-pill';
import { ThoughtOverflowMenu } from '#/components/ui/thought-overflow-menu';
import { useLinkComponent } from '#/components/ui/link-context';
import { ThoughtBody } from '#/components/ui/thought-body';
import {
  MiniEditor,
  type MiniEditorHandle,
  type MentionItem,
} from '#/components/ui/mini-editor/index';
import { EmojiPicker } from '#/components/ui/emoji-picker';
import { GifPicker, type GifSelection, type GifItem } from '#/components/ui/gif-picker';
import type { ThoughtItem, ThoughtAnchor } from '#/types/content';

/* ────────────────────────────────────────────────────────────
 * Shared types (re-used by ThoughtsPanel)
 * ──────────────────────────────────────────────────────────── */

export type ThoughtCommentActivePicker = 'gif' | 'emoji' | null;

export interface ThoughtCommentMedia {
  gifUrl?: string;
  gifId?: string;
  gifPlatform?: 'klipy' | 'giphy';
  imageUrl?: string;
  /**
   * The full serialized Lexical editor state (`body_json`) of the reply,
   * carrying every inline MentionNode losslessly. See {@link ThoughtComposerMedia.bodyJson}.
   */
  bodyJson?: string;
  /** Ids of every `user`-kind mention (handy shorthand for the host). */
  mentionedUserIds?: string[];
  /**
   * Every inserted mention, in document order, across all kinds (user, squad,
   * and the football entities). Lets the host persist the football subjects a
   * reply's `@` mention names, not just users. See {@link ThoughtComposerMedia}.
   */
  mentions?: MentionItem[];
}

export interface ThoughtCommentThought extends ThoughtItem {
  /** If set, the comment is pinned and shows "Pinned by {name}" */
  pinnedBy?: string;
}

/* ────────────────────────────────────────────────────────────
 * Shared animation variant (matches ThoughtsPanel list item)
 * ──────────────────────────────────────────────────────────── */

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

/* ────────────────────────────────────────────────────────────
 * ThoughtComment — individual threaded comment
 *
 * Two author treatments:
 *   - isOriginalAuthor → grey pill (bg-[#807c7c]), Inter Regular 12px, verified badge
 *   - regular commenter → no pill, Inter Semi Bold 14px, no badge
 *
 * Supports one level of nested replies (renders reply children as flat,
 * without a further reply button — matches current UX).
 *
 * Layout is ThoughtCard's model (Figma 2142:9201), not a parallel one: a
 * COLUMN of rows at gap-3 — identity, then anchor/media/body, then actions
 * — with the avatar living only in the identity row and everything below
 * it full width. Before this pass the avatar sat beside a `flex-1`
 * content column that held every row (an outer gap-3 nested around an
 * inner gap-4), which is the two-column model the card moved off in
 * 0.79.0. A top-level comment keeps the card's own 40px avatar and text
 * sizes — it is a first-class entry in the thread, and the panel's
 * near-black surface already marks "this is a comment" without also
 * shrinking it. A reply drops to 32px / smaller type: that is the nesting
 * signal, not a thought-vs-comment one. See the identity-row and
 * `pl-[52px]` comments below for the rest of the reasoning.
 * ──────────────────────────────────────────────────────────── */

export interface ThoughtCommentProps {
  thought: ThoughtCommentThought;
  /** Current user — enables Reply button and reply composer */
  user?: { avatarUrl?: string; initials?: string };
  /** ID of the thought being replied to (tracked by parent); open composer when it matches this thought */
  replyingTo: string | null;
  /** Called when user clicks the Reply button on this thought */
  onStartReply: (id: string) => void;
  /** Called when user cancels replying */
  onCancelReply: () => void;
  /** Called when user submits a reply. Parent is responsible for clearing `replyingTo`. */
  onReplySubmit: (text: string, parentId: string, media?: ThoughtCommentMedia) => void;
  /** Like handler for this comment or any nested reply */
  onLike?: (id: string) => void;
  /** Unlike handler for this comment or any nested reply */
  onUnlike?: (id: string) => void;
  /** Called when "View replies" is clicked on an unloaded thread */
  onLoadReplies?: (id: string) => void;
  /** Called when the user clicks a quoted passage or timestamp anchor */
  onAnchorClick?: (anchor: ThoughtAnchor) => void;
  /** Current bookmark state for this thought. */
  isBookmarked?: boolean;
  /** Optional lookup used by threaded callers so replies can render their own bookmark state. */
  getBookmarkState?: (id: string) => boolean;
  /** Called when the user bookmarks this thought. */
  onBookmark?: (id: string) => void;
  /** Called when the user removes this thought from bookmarks. */
  onUnbookmark?: (id: string) => void;
  /** Called when the user opens share for this thought. */
  onShare?: (thought: ThoughtCommentThought, event?: React.MouseEvent<HTMLElement>) => void;
  /** Whether this comment is itself a reply (hides reply button, uses smaller avatar, indents) */
  isReply?: boolean;
  /** GIF items — enables built-in GIF picker in the reply composer */
  gifs?: GifItem[];
  gifsLoading?: boolean;
  gifsError?: boolean;
  onGifSearch?: (query: string) => void;
  onGifRetry?: () => void;
  /** Legacy external GIF click handler (used when `gifs` is not provided) */
  onGifClick?: () => void;
  /** Image upload handler — enables image button in the reply composer */
  onImageUpload?: (file: File) => Promise<string>;
  /**
   * Polymorphic @mention autocomplete callback.
   * TODO(unified-mention): host wires federated searchMentions (users + squads +
   * football entities); today the platform passes only its user lookup here.
   */
  onMentionSearch?: (query: string) => Promise<MentionItem[]>;
  /** Enables built-in emoji picker in reply composer */
  emojiEnabled?: boolean;
  /**
   * Current viewer id. Drives the destructive Delete affordance in the
   * overflow menu (Wave 6.19). When omitted, Delete is never offered.
   */
  viewerId?: string;
  /** Fired when the viewer picks "Expand to article" from the overflow menu. */
  onExpandToArticle?: (thought: ThoughtCommentThought) => void;
  /** Fired when the viewer picks "Report". */
  onReport?: (thought: ThoughtCommentThought) => void;
  /** Fired when the author picks "Delete". */
  onDelete?: (thought: ThoughtCommentThought) => void;
  /**
   * Forwarded to the inner ThoughtBody so a host can render custom block types
   * (e.g. a lineup) read-only.
   */
  blockRenderers?: React.ComponentProps<typeof ThoughtBody>['blockRenderers'];
}

export function ThoughtComment({
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
  isBookmarked = false,
  getBookmarkState,
  onBookmark,
  onUnbookmark,
  onShare,
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
  viewerId,
  onExpandToArticle,
  onReport,
  onDelete,
  blockRenderers,
}: ThoughtCommentProps) {
  const Link = useLinkComponent();
  const isOP = thought.isOriginalAuthor;
  const isReplying = replyingTo === thought.id;
  const replyEditorRef = React.useRef<MiniEditorHandle>(null);
  const [replyHasText, setReplyHasText] = React.useState(false);

  // Reply media state
  const [replyPicker, setReplyPicker] = React.useState<ThoughtCommentActivePicker>(null);
  const [replyGif, setReplyGif] = React.useState<GifSelection | null>(null);
  const [replyImagePreview, setReplyImagePreview] = React.useState<string | null>(null);
  const [replyImageUrl, setReplyImageUrl] = React.useState<string | null>(null);
  const [replyImageUploading, setReplyImageUploading] = React.useState(false);
  const replyFileInputRef = React.useRef<HTMLInputElement>(null);

  const useBuiltInGif = gifs !== undefined;
  const useBuiltInEmoji = emojiEnabled;
  const showReplyGifBtn = useBuiltInGif || !!onGifClick;
  const showReplyEmojiBtn = useBuiltInEmoji;

  const clearReplyImage = React.useCallback(() => {
    if (replyImagePreview) URL.revokeObjectURL(replyImagePreview);
    setReplyImagePreview(null);
    setReplyImageUrl(null);
    setReplyImageUploading(false);
  }, [replyImagePreview]);

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
      .then((url) => {
        setReplyImageUrl(url);
        setReplyImageUploading(false);
      })
      .catch(() => {
        setReplyImagePreview(null);
        setReplyImageUrl(null);
        setReplyImageUploading(false);
      });
  }

  const resetReplyMedia = React.useCallback(() => {
    setReplyGif(null);
    clearReplyImage();
    setReplyPicker(null);
    setReplyHasText(false);
  }, [clearReplyImage]);

  // Auto-focus reply editor when it opens
  React.useEffect(() => {
    if (isReplying) {
      requestAnimationFrame(() => replyEditorRef.current?.focus());
    } else {
      resetReplyMedia();
    }
  }, [isReplying, resetReplyMedia]);

  const replies = thought.replies ?? [];
  const replyCount = thought.replyCount ?? 0;
  const hasUnloadedReplies = replyCount > 0 && replies.length === 0;
  const thoughtIsBookmarked = getBookmarkState?.(thought.id) ?? isBookmarked;
  const handleShare = React.useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      event?.stopPropagation();
      if (onShare) {
        onShare(thought, event);
        return;
      }
      if (!thought.permalinkHref || typeof window === 'undefined') return;
      const url = new URL(thought.permalinkHref, window.location.origin).toString();
      if (navigator.share) {
        void navigator.share({ title: `Thought by ${thought.author.name}`, url }).catch(() => {});
        return;
      }
      void navigator.clipboard?.writeText(url).catch(() => {});
    },
    [onShare, thought]
  );

  // Nesting indent: one avatar-width (40) + one gap-3 (12) = 52px per
  // reply level — the same "avatar + gap" unit the identity row below
  // spends between its own avatar and name column. The body and actions
  // rows no longer live in an avatar gutter (see ThoughtCard 0.79.0), so
  // this indent isn't continuing a column that starts above it; it is a
  // block-level nesting device applied once per level, parking a reply's
  // own avatar under roughly where its parent's name began — the same
  // idiom threaded UIs (Reddit, Twitter replies) use.
  return (
    <motion.div
      className={cn('flex flex-col', isReply && 'pl-[52px]')}
      variants={itemVariants}
      data-thought-id={thought.id}
    >
      {/* Figma parity with ThoughtCard 2142:9201 — a COLUMN of rows at the
          same gap-3 rhythm: identity, then anchor/media/body, then
          actions. The body used to sit beside a persistent avatar in a
          `flex-1` content column (an outer gap-3 nested around an inner
          gap-4); now the avatar appears once, in the identity row, and
          every row below it runs full width, exactly like the card. */}
      <div className="flex flex-col gap-3">
        {/* Pinned indicator */}
        {thought.pinnedBy && (
          <div className="flex items-center gap-1">
            <PushPin size={14} className="text-[#807c7c]" />
            <span className="font-body text-[10px] font-medium leading-6 text-[#807c7c]">
              Pinned by {thought.pinnedBy}
            </span>
          </div>
        )}

        {/* Identity row — avatar beside the stacked name / @handle · time,
            the same shape as ThoughtCard's identity row.

            Avatar size is the nesting signal here, not a thought-vs-comment
            one: a top-level comment keeps the card's own 40px so it reads
            as a first-class entry in the thread — the panel itself
            (near-black, versus the card's light surface) already carries
            "this is a comment", so shrinking the avatar too would be
            double-signalling the same fact with a second variable. A reply
            drops to 32px; that is what marks it one level down from its
            parent, same as before this pass. */}
        <div className="flex items-center gap-3">
          <Avatar className={cn(isReply ? 'size-8' : 'size-10', 'shrink-0')}>
            {thought.author.avatarUrl && (
              <AvatarImage src={thought.author.avatarUrl} alt={thought.author.name} />
            )}
            <AvatarFallback>
              {thought.author.initials ?? thought.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5">
              <div className="flex min-w-0 items-center gap-1">
                {isOP ? (
                  /* Original author: grey pill + regular weight + verified badge */
                  <span className="inline-flex items-center gap-1 rounded-[25px] bg-[#807c7c] px-2 py-1">
                    {thought.author.handle ? (
                      <Link
                        href={`/@${thought.author.handle}`}
                        className="font-content text-xs font-normal leading-none tracking-[-0.36px] text-white transition-colors hover:text-red-100"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {thought.author.name}
                      </Link>
                    ) : (
                      <span className="font-content text-xs font-normal leading-none tracking-[-0.36px] text-white">
                        {thought.author.name}
                      </span>
                    )}
                    {thought.author.verified && <VerifiedBadge size="sm" />}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 truncate font-content font-semibold leading-none tracking-[-0.42px] text-white',
                      isReply ? 'text-xs' : 'text-sm'
                    )}
                  >
                    {thought.author.handle ? (
                      <Link
                        href={`/@${thought.author.handle}`}
                        className="text-white transition-colors hover:text-red-100"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {thought.author.name}
                      </Link>
                    ) : (
                      thought.author.name
                    )}
                    {thought.author.verified && <VerifiedBadge size="sm" />}
                  </span>
                )}
                {/* Tier badge — shared AuthorLine treatment (Pro = secondary,
                    Line Breaker = tinted brand red); `dark` flips the
                    secondary tokens so it reads on the panel's black
                    surface, `ml-1` matches the card's extra breathing room
                    ahead of the badge. */}
                {thought.author.tier && thought.author.tier !== 'Free' && (
                  <Badge variant={tierVariantMap[thought.author.tier]} className="dark ml-1">
                    {thought.author.tier}
                  </Badge>
                )}
              </div>
              {/* Overflow `…` — pinned right of the name row, level with
                  the name rather than floating between the two lines.
                  Dark tone so it reads on the panel's near-black
                  background. */}
              <ThoughtOverflowMenu
                thought={thought}
                canDelete={!!viewerId && !!thought.publisherId && thought.publisherId === viewerId}
                onExpandToArticle={onExpandToArticle ? () => onExpandToArticle(thought) : undefined}
                onReport={onReport ? () => onReport(thought) : undefined}
                onDelete={onDelete ? () => onDelete(thought) : undefined}
                tone="dark"
                className="ml-auto"
              />
            </div>

            {/* Second line: @handle · time (Figma parity with ThoughtCard
                3000:10971). The handle line didn't exist before this pass —
                createdAt sat inline next to the name instead. Moving it
                onto its own line matches the card's info architecture (name
                is identity, handle/time is metadata) and, same as the
                card, stops a long display name pushing the timestamp off
                the row.

                Same leading-none + zero-gap treatment as the card, and for
                the same reason: gap alone cannot close the two lines. The
                half-leading either side of a non-`none` leading sets a
                floor gap-0 cannot go under, so both lines need
                leading-none before removing the gap does anything. */}
            {(thought.author.handle || thought.createdAt) && (
              <div className="flex items-center gap-2">
                {thought.author.handle && (
                  <Link
                    href={`/@${thought.author.handle}`}
                    className="whitespace-nowrap font-content text-xs leading-none tracking-[-0.36px] text-[#807c7c] transition-colors hover:text-white"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    @{thought.author.handle}
                  </Link>
                )}
                {thought.author.handle && thought.createdAt && (
                  <span className="size-0.5 shrink-0 rounded-full bg-[#807c7c]" />
                )}
                {thought.createdAt &&
                  (thought.permalinkHref ? (
                    <Link
                      href={thought.permalinkHref}
                      className="whitespace-nowrap font-content text-xs leading-none tracking-[-0.36px] text-[#807c7c] transition-colors hover:text-white"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      {thought.createdAt}
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap font-content text-xs leading-none tracking-[-0.36px] text-[#807c7c]">
                      {thought.createdAt}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Content anchor quote — clickable when onAnchorClick provided */}
        {thought.anchor?.type === 'text' && thought.anchor.text?.selectedText && (
          <div
            className={cn(
              'rounded-md border-l-2 border-red-100/40 bg-white/[0.03] py-1.5 pl-3 pr-2',
              onAnchorClick &&
                'cursor-pointer transition-colors hover:bg-white/[0.06] hover:border-red-100/60'
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
              onAnchorClick && 'cursor-pointer transition-colors hover:bg-red-100/20'
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

        {/* From-grade pill — Wave 6.16. Marks a comment that was spawned
            by a GLOBAL grade fan-out (game-service). Same primitive as
            ThoughtCard's pill, dark-tone so it reads on the match panel's
            near-black background. PRIVATE grades never reach this path —
            privacy is enforced upstream in the fan-out. */}
        {thought.fromGrade && <FromGradePill data={thought.fromGrade} tone="dark" />}

        {/* Body — full width, no longer inset into an avatar gutter. */}
        {thought.body && (
          <ThoughtBody
            body={thought.body}
            bodyJson={thought.bodyJson}
            blockRenderers={blockRenderers}
            className={cn(
              'font-content font-normal leading-[18px] tracking-[-0.126px] text-white',
              isReply ? 'text-xs' : 'text-sm'
            )}
          />
        )}

        {/* GIF / Image attachment — a direct sibling row now, spaced by
            the row's own gap-3 rather than a bolted-on mt-1.5. */}
        {(thought.gifUrl || thought.imageUrl) && (
          <div className="max-w-[240px] overflow-hidden rounded-[6px] border border-white/[0.06]">
            <img
              src={thought.gifUrl || thought.imageUrl}
              alt=""
              className="block max-h-[180px] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Actions: Reply + ThumbsUp + utility icons */}
        <div className="flex items-center gap-4">
          {!isReply && user && (
            <button
              type="button"
              onClick={() => onStartReply(thought.id)}
              className="cursor-pointer font-content text-xs font-normal leading-[18px] tracking-[-0.36px] text-white transition-colors hover:text-red-100"
            >
              Reply{replyCount > 0 ? ` (${replyCount})` : ''}
            </button>
          )}
          {!isReply && !user && replyCount > 0 && (
            <span className="font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]">
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (thought.liked ? onUnlike?.(thought.id) : onLike?.(thought.id))}
              className={cn(
                'cursor-pointer transition-colors',
                thought.liked ? 'text-white' : 'text-[#807c7c] hover:text-white'
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
          <button
            type="button"
            onClick={() =>
              thoughtIsBookmarked ? onUnbookmark?.(thought.id) : onBookmark?.(thought.id)
            }
            className={cn(
              'cursor-pointer transition-colors',
              thoughtIsBookmarked ? 'text-white' : 'text-[#807c7c] hover:text-white'
            )}
            aria-label="Bookmark"
            aria-pressed={thoughtIsBookmarked}
          >
            <Bookmark size={14} weight={thoughtIsBookmarked ? 'fill' : 'regular'} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="cursor-pointer text-[#807c7c] transition-colors hover:text-white"
            aria-label="Share"
          >
            <UploadSimple size={14} weight="regular" />
          </button>
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
                  const mentions = replyEditorRef.current?.getMentions() ?? [];
                  const mentionedIds = replyEditorRef.current?.getMentionedUserIds() ?? [];
                  const bodyJson = replyEditorRef.current?.getBodyJson();
                  let media: ThoughtCommentMedia | undefined = replyGif
                    ? { gifUrl: replyGif.url, gifId: replyGif.id, gifPlatform: 'klipy' }
                    : replyImageUrl
                      ? { imageUrl: replyImageUrl }
                      : undefined;
                  if (bodyJson) {
                    media = { ...media, bodyJson };
                  }
                  if (mentions.length > 0) {
                    media = { ...media, mentions };
                  }
                  if (mentionedIds.length > 0) {
                    media = { ...media, mentionedUserIds: mentionedIds };
                  }
                  onReplySubmit(text, thought.id, media);
                  replyEditorRef.current?.blur();
                  resetReplyMedia();
                }}
                onChange={(text) => setReplyHasText(text.length > 0)}
                onMentionSearch={onMentionSearch}
                className="font-body text-base font-medium leading-6 text-white sm:text-sm"
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
                  <img
                    src={replyGif.previewUrl}
                    alt={replyGif.title}
                    className="block max-h-[100px] w-full object-cover"
                  />
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
                  <img
                    src={replyImagePreview}
                    alt=""
                    className="block max-h-[100px] w-full object-cover"
                  />
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
                      : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
                  )}
                  onClick={() => {
                    if (useBuiltInGif) setReplyPicker((p) => (p === 'gif' ? null : 'gif'));
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
                      : 'text-red-100 hover:bg-red-100/10 hover:text-red-300'
                  )}
                  onClick={() => {
                    if (useBuiltInEmoji) setReplyPicker((p) => (p === 'emoji' ? null : 'emoji'));
                  }}
                >
                  <Smiley weight="regular" className="size-[13px]" />
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
                onClick={() => {
                  replyEditorRef.current?.blur();
                  resetReplyMedia();
                  onCancelReply();
                }}
                className="rounded-[4px] px-4 py-1.5 text-xs bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]"
              >
                Cancel
              </Button>
              <Button
                variant={replyHasText || replyGif || replyImageUrl ? 'default' : 'outline'}
                data-shimmer="slow"
                disabled={(!replyHasText && !replyGif && !replyImageUrl) || replyImageUploading}
                onClick={() => {
                  const text = replyEditorRef.current?.getText() ?? '';
                  const mentions = replyEditorRef.current?.getMentions() ?? [];
                  const mentionedIds = replyEditorRef.current?.getMentionedUserIds() ?? [];
                  const bodyJson = replyEditorRef.current?.getBodyJson();
                  let media: ThoughtCommentMedia | undefined = replyGif
                    ? { gifUrl: replyGif.url, gifId: replyGif.id, gifPlatform: 'klipy' }
                    : replyImageUrl
                      ? { imageUrl: replyImageUrl }
                      : undefined;
                  if (bodyJson) {
                    media = { ...media, bodyJson };
                  }
                  if (mentions.length > 0) {
                    media = { ...media, mentions };
                  }
                  if (mentionedIds.length > 0) {
                    media = { ...media, mentionedUserIds: mentionedIds };
                  }
                  if (text || media) {
                    onReplySubmit(text, thought.id, media);
                    replyEditorRef.current?.blur();
                    resetReplyMedia();
                  }
                }}
                className={cn(
                  'rounded-[4px] px-4 py-1.5 text-xs',
                  replyHasText || replyGif || replyImageUrl
                    ? 'bg-red-300 border-red-100 hover:bg-red-100'
                    : 'bg-grey-200 border-grey-300 hover:bg-grey-200 hover:border-[#807c7c]'
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
            <ThoughtComment
              key={reply.id}
              thought={reply as ThoughtCommentThought}
              user={user}
              replyingTo={replyingTo}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onReplySubmit={onReplySubmit}
              onLike={onLike}
              onUnlike={onUnlike}
              onAnchorClick={onAnchorClick}
              isBookmarked={getBookmarkState?.(reply.id) ?? false}
              getBookmarkState={getBookmarkState}
              onBookmark={onBookmark}
              onUnbookmark={onUnbookmark}
              onShare={onShare}
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
              viewerId={viewerId}
              onExpandToArticle={onExpandToArticle}
              onReport={onReport}
              onDelete={onDelete}
              blockRenderers={blockRenderers}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
