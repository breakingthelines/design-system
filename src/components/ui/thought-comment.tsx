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
import { ReactionPills, hasReactionRow } from '#/components/ui/reaction-pills';
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
  /**
   * Chat role marker for the author of THIS message — rendered beside the
   * tier badge, never instead of it. It lives on the thought rather than on
   * the component so a nested reply carries its own author's role instead of
   * inheriting its parent's.
   */
  authorRole?: ThoughtCommentRole;
}

/**
 * Row density.
 *
 * `comfortable` is the discussion anatomy every existing caller renders, and
 * stays the default: 40px avatar, a 14px name line over `@handle · time`, a
 * 14px body, the full engagement row.
 *
 * `compact` is the approved chat anatomy (design boards; platform#955's 332px
 * live rail): 24px avatar, ONE 11px identity line that carries the time
 * inline, a 12.5px body. The handle is dropped there — the name is already a
 * link to the profile, and a second metadata line costs a third of a message.
 * Stack compact rows at a 14px gap: the list owns the space between messages,
 * the row owns the space inside one.
 */
export type ThoughtCommentDensity = 'comfortable' | 'compact';

/**
 * An affordance the action row can offer, named. This row wires its own
 * handlers from `onLike`/`onBookmark`/`onShare` (unlike ThoughtCard, which
 * takes whole `EngagementAction`s), so a caller picks names from this list
 * rather than building the actions itself.
 */
export type ThoughtCommentAction = 'reply' | 'like' | 'bookmark' | 'share';

/** Today's set, and the default — so no existing call site changes. */
const DEFAULT_ACTIONS: ThoughtCommentAction[] = ['reply', 'like', 'bookmark', 'share'];

/**
 * Where the reaction stack sits relative to the action row.
 *
 * `'combined'` (default, 0.104.0's shape) — like leads the pill row, and
 * the whole band sits INSIDE the action row, wrapping together with
 * Reply/Bookmark/Share. Right when the action row has nothing else beside
 * like (the chat rail passes `actions={['like']}`): one band, one row, and
 * a stack that grows without anything to push. Wrong when the row also
 * carries Reply/Bookmark/Share — a variable-width stack between them slides
 * the fixed controls sideways as people react.
 *
 * `'stacked'` — the pills are their OWN row, directly under the body (and
 * above the action row), and like stays in the action row bare, beside
 * Reply/Bookmark/Share exactly as it sat before 0.104.0. The Discord/Slack
 * pattern. Threaded through the reply recursion below like `density` and
 * `actions` are, so a threaded caller gets it on every reply too, not only
 * the top-level row.
 */
export type ThoughtCommentReactionsRow = 'combined' | 'stacked';

/**
 * Author role in a chat room. A role is not a tier: it says what this person
 * is doing in the room, so it reads as a marker — quiet neutral chip, 10px
 * uppercase — beside the tier's tinted chip rather than competing with it.
 */
export type ThoughtCommentRole = 'host' | 'moderator';

const roleLabels: Record<ThoughtCommentRole, string> = {
  host: 'HOST',
  moderator: 'MOD',
};

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
  /**
   * Row density. Defaults to `comfortable` — the discussion anatomy — so an
   * existing call site renders exactly what it rendered before the variant
   * existed. A chat rail passes `compact`.
   */
  density?: ThoughtCommentDensity;
  /**
   * Which affordances the action row offers, by name. Defaults to today's
   * full set, so nothing regresses. A chat rail passes `['like']`: bookmark
   * and share have no handlers there and sit dead. `[]` drops the row.
   */
  actions?: ThoughtCommentAction[];
  /**
   * Viewer adds an emoji to this comment or any nested reply. Supplying it
   * is what turns the add-reaction control on; without it the stack renders
   * read-only. Send the emoji back to the server exactly as given.
   */
  onReact?: (id: string, emoji: string) => void;
  /** Viewer removes their own reaction from this comment or a reply. */
  onUnreact?: (id: string, emoji: string) => void;
  /**
   * Renders the reaction row read-only. Reacting takes the same read access
   * as the thought itself, so a viewer can hold a stack they may not add to.
   */
  reactionsDisabled?: boolean;
  /**
   * Quiet inline line beside this comment's pills — the cap, or a refusal.
   * The host owns the copy and clears it on the next success.
   */
  reactionNotice?: string;
  /** Same, resolved by id, so a threaded caller can mark one reply's row. */
  getReactionNotice?: (id: string) => string | undefined;
  /**
   * `'combined'` (default) or `'stacked'` — see {@link ThoughtCommentReactionsRow}.
   * Defaults to `'combined'`, so no existing call site changes.
   */
  reactionsRow?: ThoughtCommentReactionsRow;
  /**
   * This message is the viewer's own. The author's display NAME renders in
   * brand red instead of white, and nothing else moves: no stripe, no badge,
   * no rename. In a room running at a message a second, colour on the name
   * is what a person's eye can find while scrolling, and the name has to
   * stay legible as a name while it does.
   *
   * Defaults to `false`, so every existing call site renders exactly what it
   * rendered before this prop existed. A caller rendering a thread resolves
   * it per message with {@link getIsOwn} instead.
   *
   * No effect on an `isOriginalAuthor` row: that name sits on a grey pill,
   * where red-100 lands at 1.2:1 and stops being readable. The pill is
   * already an author marker, so it keeps its own treatment.
   */
  isOwn?: boolean;
  /**
   * Same, resolved by id. Ownership is a fact about ONE message's author, so
   * unlike a display option it is never inherited down a thread — a reply is
   * marked only when this lookup says the viewer wrote that reply.
   */
  getIsOwn?: (id: string) => boolean;
  /**
   * Adds a faint red wash behind an own row, under the red name. Very low
   * alpha, no border, no stripe.
   *
   * Opt-in and off by default, including in the live chat rail: the red name
   * is the shipped treatment, and two markers for one fact is one too many.
   * Here for a surface that needs an own message found without being read —
   * a dense transcript, a long scrollback. Does nothing unless the row is
   * already own.
   */
  ownRowTint?: boolean;
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
  density = 'comfortable',
  actions = DEFAULT_ACTIONS,
  onReact,
  onUnreact,
  reactionsDisabled = false,
  reactionNotice,
  getReactionNotice,
  reactionsRow = 'combined',
  isOwn = false,
  getIsOwn,
  ownRowTint = false,
}: ThoughtCommentProps) {
  const Link = useLinkComponent();
  const isOP = thought.isOriginalAuthor;
  const isReplying = replyingTo === thought.id;
  const isCompact = density === 'compact';
  const stackedReactions = reactionsRow === 'stacked';

  /* ── Density tokens ───────────────────────────────────────────────
     Each density spells its whole class string instead of layering an
     override onto a shared base. That is deliberate: it keeps the
     `comfortable` markup byte-identical to what this component emitted
     before the variant existed, which is the property every existing
     call site is relying on, and it keeps both anatomies readable in
     one place rather than as a diff you have to run tailwind-merge in
     your head to resolve. */
  const avatarClass = isCompact ? (isReply ? 'size-5' : 'size-6') : isReply ? 'size-8' : 'size-10';
  const nameSizeClass = isCompact ? 'text-[11px]' : isReply ? 'text-xs' : 'text-sm';
  const badgeSizeClass = isCompact ? 'h-4 px-1.5 text-[10px]' : undefined;
  const opNameClass = isCompact
    ? 'font-content text-[11px] font-normal leading-none tracking-[-0.36px] text-white'
    : 'font-content text-xs font-normal leading-none tracking-[-0.36px] text-white';
  const opNameLinkClass = `${opNameClass} transition-colors hover:text-red-100`;
  const metaLinkClass = isCompact
    ? 'whitespace-nowrap font-content text-[11px] leading-none tracking-[-0.36px] text-[#807c7c] transition-colors hover:text-white'
    : 'whitespace-nowrap font-content text-xs leading-none tracking-[-0.36px] text-[#807c7c] transition-colors hover:text-white';
  const metaTextClass = isCompact
    ? 'whitespace-nowrap font-content text-[11px] leading-none tracking-[-0.36px] text-[#807c7c]'
    : 'whitespace-nowrap font-content text-xs leading-none tracking-[-0.36px] text-[#807c7c]';
  const bodyClass = isCompact
    ? 'font-content text-[12.5px] font-normal leading-[17px] tracking-[-0.126px] text-white'
    : cn(
        'font-content font-normal leading-[18px] tracking-[-0.126px] text-white',
        isReply ? 'text-xs' : 'text-sm'
      );
  const replyButtonClass = isCompact
    ? 'cursor-pointer font-content text-[11px] font-normal leading-none tracking-[-0.36px] text-white transition-colors hover:text-red-100'
    : 'cursor-pointer font-content text-xs font-normal leading-[18px] tracking-[-0.36px] text-white transition-colors hover:text-red-100';
  const actionMetaClass = isCompact
    ? 'font-content text-[11px] leading-none tracking-[-0.36px] text-[#807c7c]'
    : 'font-content text-xs leading-[18px] tracking-[-0.36px] text-[#807c7c]';
  const actionIconSize = isCompact ? 12 : 14;
  const indentClass = isCompact ? 'pl-8' : 'pl-[52px]';
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
  const thoughtReactionNotice = getReactionNotice?.(thought.id) ?? reactionNotice;
  /* Resolved the same way as the bookmark state above: the by-id lookup wins
     where a threaded caller supplies one, the single boolean otherwise. */
  const thoughtIsOwn = getIsOwn?.(thought.id) ?? isOwn;

  /* Which affordances this row offers. Bookmark and share used to render
     unconditionally, which is right in the thoughts panel and wrong in a
     chat rail, where neither has a handler and both are just noise. The
     caller names what it wants; the default is today's full set. */
  const showsReply = actions.includes('reply') && !isReply && (!!user || replyCount > 0);
  const showsLike = actions.includes('like');
  const showsBookmark = actions.includes('bookmark');
  const showsShare = actions.includes('share');

  /* One object, so the pill row and the question "does the pill row draw
     anything" are answered from exactly the same inputs. */
  const reactionProps = {
    reactions: thought.reactions,
    onReact: onReact ? (emoji: string) => onReact(thought.id, emoji) : undefined,
    onUnreact: onUnreact ? (emoji: string) => onUnreact(thought.id, emoji) : undefined,
    disabled: reactionsDisabled,
    notice: thoughtReactionNotice,
    density,
  };
  const showsReactions = hasReactionRow(reactionProps);
  /* In 'stacked' mode the pills are their own element (below), so their
     presence does not by itself require the action row — a stacked row
     with reactions and nothing else (no reply, no like, no bookmark, no
     share) draws the pills alone and no empty action row beneath them. */
  const showsActionRow = stackedReactions
    ? showsReply || showsLike || showsBookmark || showsShare
    : showsReply || showsLike || showsBookmark || showsShare || showsReactions;

  /* Like and the reaction stacks are ONE band, not two: like first, then the
     emoji stacks, then the add control, wrapping together.

     The affordance is the same node in both places. Where there is a pill row
     to share it goes in as ReactionPills' `leading`, so it flows in that row's
     wrap context; where there is not, it renders bare in the action row
     exactly as it did in 0.103.0. That second path is the point — a caller
     that knows nothing about reactions still emits the markup it always did,
     and a row with neither reactions nor like still emits no row at all. */
  const likeAffordance = showsLike ? (
    <div className={cn('flex items-center', isCompact ? 'gap-1.5' : 'gap-2')}>
      <button
        type="button"
        onClick={() => (thought.liked ? onUnlike?.(thought.id) : onLike?.(thought.id))}
        className={cn(
          'cursor-pointer transition-colors',
          thought.liked ? 'text-white' : 'text-[#807c7c] hover:text-white'
        )}
      >
        <ThumbsUp size={actionIconSize} weight={thought.liked ? 'fill' : 'regular'} />
      </button>
      {(thought.stats.likes ?? 0) > 0 && (
        <span className={actionMetaClass}>{thought.stats.likes}</span>
      )}
    </div>
  ) : null;
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
      className={cn('flex flex-col', isReply && indentClass)}
      variants={itemVariants}
      data-thought-id={thought.id}
    >
      {/* Figma parity with ThoughtCard 2142:9201 — a COLUMN of rows at the
          same gap-3 rhythm: identity, then anchor/media/body, then
          actions. The body used to sit beside a persistent avatar in a
          `flex-1` content column (an outer gap-3 nested around an inner
          gap-4); now the avatar appears once, in the identity row, and
          every row below it runs full width, exactly like the card.

          Compact tightens that rhythm to 6px: at chat density the three rows
          are one utterance, not three sections.

          `ownRowTint` washes this column, not the outer element, so a reply's
          indent gutter stays outside the wash. Negative margins let the wash
          bleed past the text without the row moving relative to its
          neighbours. 6% alpha and a radius, never a border: the moment it
          gets an edge it becomes a second piece of chrome competing with the
          red name. Off by default. */}
      <div
        className={cn(
          'flex flex-col',
          isCompact ? 'gap-1.5' : 'gap-3',
          thoughtIsOwn && ownRowTint && '-mx-2 rounded-[6px] bg-red-100/[0.06] px-2 py-1.5'
        )}
      >
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
        <div className={cn('flex items-center', isCompact ? 'gap-2' : 'gap-3')}>
          <Avatar className={cn(avatarClass, 'shrink-0')}>
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
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-[25px] bg-[#807c7c]',
                      isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'
                    )}
                  >
                    {thought.author.handle ? (
                      <Link
                        href={`/@${thought.author.handle}`}
                        className={opNameLinkClass}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {thought.author.name}
                      </Link>
                    ) : (
                      <span className={opNameClass}>{thought.author.name}</span>
                    )}
                    {thought.author.verified && <VerifiedBadge size="sm" />}
                  </span>
                ) : (
                  /* The viewer's own message is marked here and only here:
                     the display name goes brand red, at the same weight and
                     size it already had. red-100 (#eb0000), not red-300
                     (#bf0000) — every surface this row renders on is
                     near-black, where red-100 clears 4.5:1 against it and
                     red-300 sits around 3.2:1, and red-100 is already the
                     accent red the rest of this component uses. An own name
                     that links hovers DOWN to red-300, since the usual
                     hover target is the colour it is resting at. */
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 truncate font-content font-semibold leading-none tracking-[-0.42px]',
                      thoughtIsOwn ? 'text-red-100' : 'text-white',
                      nameSizeClass
                    )}
                  >
                    {thought.author.handle ? (
                      <Link
                        href={`/@${thought.author.handle}`}
                        className={
                          thoughtIsOwn
                            ? 'text-red-100 transition-colors hover:text-red-300'
                            : 'text-white transition-colors hover:text-red-100'
                        }
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
                  <Badge
                    variant={tierVariantMap[thought.author.tier]}
                    className={cn('dark ml-1', badgeSizeClass)}
                  >
                    {thought.author.tier}
                  </Badge>
                )}
                {/* Role badge — HOST / MOD. Beside the tier chip, never in
                    place of it: a Line Breaker who hosts the show is both.
                    Same Badge primitive as the tier, one step quieter in
                    colour (neutral tint, not brand red) and one step
                    sharper in letterform (10px uppercase), so it reads as
                    "what this person is doing here" rather than as a
                    louder tier. */}
                {thought.authorRole && (
                  <Badge
                    variant="tintedNeutral"
                    className={cn(
                      'ml-1 text-[10px] font-semibold tracking-[0.04em]',
                      badgeSizeClass
                    )}
                  >
                    {roleLabels[thought.authorRole]}
                  </Badge>
                )}
                {/* Compact carries the time on the identity line — one line
                    is the whole point of the chat anatomy, and a rail this
                    narrow cannot spend a row on metadata. */}
                {isCompact && thought.createdAt && (
                  <>
                    <span className="size-0.5 shrink-0 rounded-full bg-[#807c7c]" />
                    {thought.permalinkHref ? (
                      <Link
                        href={thought.permalinkHref}
                        className={metaLinkClass}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {thought.createdAt}
                      </Link>
                    ) : (
                      <span className={metaTextClass}>{thought.createdAt}</span>
                    )}
                  </>
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
                /* Compact shrinks the trigger to the avatar's own 24px so
                   the identity line is not set by a control that is taller
                   than everything beside it. */
                className={cn('ml-auto', isCompact && 'size-6 [&>svg]:size-4')}
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
            {!isCompact && (thought.author.handle || thought.createdAt) && (
              <div className="flex items-center gap-2">
                {thought.author.handle && (
                  <Link
                    href={`/@${thought.author.handle}`}
                    className={metaLinkClass}
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
                      className={metaLinkClass}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      {thought.createdAt}
                    </Link>
                  ) : (
                    <span className={metaTextClass}>{thought.createdAt}</span>
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
            className={bodyClass}
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

        {/* The reaction row, on its OWN line — 'stacked' mode only. Directly
            under the body/attachment and above the action row, so a stack
            that grows never pushes Reply/Bookmark/Share sideways: the
            Discord/Slack pattern. Threaded through the reply recursion below
            exactly like `density`, so a nested reply gets the same row
            rather than falling back to the combined band. */}
        {stackedReactions && showsReactions && <ReactionPills {...reactionProps} />}

        {/* Actions: Reply, then the engagement band — like and the reaction
            stacks together in 'combined' mode, like alone in 'stacked' mode
            (the pills already had their own row above) — then the utility
            icons. Each one only when the caller asked for it, and the row
            itself disappears when nothing is left, so an empty set costs no
            gap.

            The stack is thought data (the server hydrates it on every read),
            so a nested reply carries its own; the callbacks come from the
            host. In 'combined' mode the band is the only part that wraps: at
            compact it wraps inside the rail column and the picker opens in a
            portal, so a long stack lengthens the message without widening
            it. */}
        {showsActionRow && (
          <div className={cn('flex items-center', isCompact ? 'gap-3' : 'gap-4')}>
            {showsReply && user && (
              <button
                type="button"
                onClick={() => onStartReply(thought.id)}
                className={replyButtonClass}
              >
                Reply{replyCount > 0 ? ` (${replyCount})` : ''}
              </button>
            )}
            {showsReply && !user && replyCount > 0 && (
              <span className={actionMetaClass}>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
            {!stackedReactions && showsReactions ? (
              <ReactionPills {...reactionProps} leading={likeAffordance} />
            ) : (
              likeAffordance
            )}
            {showsBookmark && (
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
                <Bookmark size={actionIconSize} weight={thoughtIsBookmarked ? 'fill' : 'regular'} />
              </button>
            )}
            {showsShare && (
              <button
                type="button"
                onClick={handleShare}
                className="cursor-pointer text-[#807c7c] transition-colors hover:text-white"
                aria-label="Share"
              >
                <UploadSimple size={actionIconSize} weight="regular" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline reply composer — shown when replying to this thought */}
      {isReplying && user && (
        <div className={cn(isCompact ? 'mt-2 pl-8' : 'mt-4 pl-[52px]', 'flex flex-col gap-2')}>
          <div className="flex items-start gap-3">
            <Avatar className={cn(isCompact ? 'size-6' : 'size-8', 'shrink-0')}>
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
                className={cn('overflow-hidden', isCompact ? 'pl-8' : 'pl-11')}
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
                className={cn('overflow-hidden', isCompact ? 'pl-8' : 'pl-11')}
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

          <div className={cn('flex items-center justify-between', isCompact ? 'pl-8' : 'pl-11')}>
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
                className={cn('overflow-hidden', isCompact ? 'pl-8' : 'pl-11')}
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
          className={cn(
            isCompact ? 'mt-1 pl-8' : 'mt-2 pl-[52px]',
            'cursor-pointer font-content text-xs font-medium text-red-100 transition-colors hover:text-red-300 text-left'
          )}
        >
          View {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Replies — flat, 1 level deep, no nested reply button */}
      {replies.length > 0 && (
        <div
          className={cn(
            isCompact ? 'mt-2' : 'mt-4',
            'flex flex-col',
            isCompact ? 'gap-2' : 'gap-4'
          )}
        >
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
              density={density}
              actions={actions}
              onReact={onReact}
              onUnreact={onUnreact}
              reactionsDisabled={reactionsDisabled}
              getReactionNotice={getReactionNotice}
              reactionsRow={reactionsRow}
              /* Never `isOwn` — the parent's ownership says nothing about
                 who wrote the reply. Same shape as the bookmark state
                 above: resolved per reply, or not marked at all. */
              isOwn={getIsOwn?.(reply.id) ?? false}
              getIsOwn={getIsOwn}
              ownRowTint={ownRowTint}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
