import { useState, type ReactNode } from 'react';
import { expect, screen, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';
import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from './thought-comment';
import type { ThoughtReaction } from '#/types/content';

const meta = preview.meta({
  title: 'UI/ThoughtComment',
  component: ThoughtComment,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

/* Every ThoughtComment lives on the panel's near-black surface, so the
   stories supply it rather than letting the rows float on the Storybook
   canvas. The chat stories also pin the real rail width (332px) and the
   14px list gap: the row owns the space inside one message, the list owns
   the space between two, and the anatomy only reads correctly together. */
function Panel({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div className="bg-black p-4" style={{ width }}>
      {children}
    </div>
  );
}

function Rail({ children }: { children: ReactNode }) {
  return (
    <Panel width={332}>
      <div className="flex flex-col gap-[14px]">{children}</div>
    </Panel>
  );
}

const noop = () => {};

/** Fills in the thread plumbing every story shares. */
function Row(props: Partial<ThoughtCommentProps> & { thought: ThoughtCommentThought }) {
  return (
    <ThoughtComment
      replyingTo={null}
      onStartReply={noop}
      onCancelReply={noop}
      onReplySubmit={noop}
      {...props}
    />
  );
}

const host: ThoughtCommentThought = {
  id: '1',
  body: 'Second half is where this gets decided. Watch the left channel.',
  author: {
    name: 'Zach Lowy',
    handle: 'zachlowy',
    initials: 'ZL',
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    verified: true,
    tier: 'Line Breaker',
  },
  authorRole: 'host',
  createdAt: '2m',
  permalinkHref: '/@zachlowy/thoughts/1',
  stats: { likes: 12, comments: 0 },
};

const mod: ThoughtCommentThought = {
  id: '2',
  body: 'Keep the transfer chat for the post-match room please.',
  author: {
    name: 'Gab',
    handle: 'gab',
    initials: 'G',
    avatarUrl: 'https://i.pravatar.cc/150?u=gab',
  },
  authorRole: 'moderator',
  createdAt: '1m',
  stats: { likes: 2, comments: 0 },
};

const viewer: ThoughtCommentThought = {
  id: '3',
  body: 'That was never a corner.',
  author: { name: 'Tommy Adams', handle: 'tommy', initials: 'TA', tier: 'Pro' },
  createdAt: '48s',
  stats: { likes: 0, comments: 0 },
};

const viewerTwo: ThoughtCommentThought = {
  id: '4',
  body: 'Bellingham has been the only one asking questions of that back four all half.',
  author: { name: 'Nadia', handle: 'nadia', initials: 'N' },
  createdAt: 'now',
  liked: true,
  stats: { likes: 3, comments: 0 },
};

export const Default = meta.story({
  name: 'Comfortable (default)',
  render: () => (
    <Panel width={520}>
      <Row thought={{ ...host, authorRole: undefined }} user={{ initials: 'TA' }} />
    </Panel>
  ),
});

export const ChatRail = meta.story({
  name: 'Compact chat rail',
  render: () => (
    <Rail>
      {/* onReport wires the overflow menu, which a chat rail keeps: it is
          where report and delete live once the room is moderated. */}
      <Row thought={host} density="compact" actions={['like']} onReport={noop} />
      <Row thought={mod} density="compact" actions={['like']} onReport={noop} />
      <Row thought={viewer} density="compact" actions={['like']} onReport={noop} />
      <Row thought={viewerTwo} density="compact" actions={['like']} onReport={noop} />
    </Rail>
  ),
});

export const RoleBadges = meta.story({
  name: 'Role badges',
  render: () => (
    <Rail>
      {/* Host who is also a Line Breaker: both chips, tier first, role second. */}
      <Row thought={host} density="compact" actions={['like']} />
      {/* Host with no tier. */}
      <Row
        thought={{ ...host, id: '1b', author: { ...host.author, tier: undefined } }}
        density="compact"
        actions={['like']}
      />
      {/* Moderator, no tier. */}
      <Row thought={mod} density="compact" actions={['like']} />
      {/* Moderator who pays for Pro. */}
      <Row
        thought={{
          ...mod,
          id: '2b',
          authorRole: 'moderator',
          author: { ...mod.author, tier: 'Pro' },
        }}
        density="compact"
        actions={['like']}
      />
      {/* Tier only, no role. */}
      <Row thought={viewer} density="compact" actions={['like']} />
      {/* Neither. */}
      <Row thought={viewerTwo} density="compact" actions={['like']} />
    </Rail>
  ),
});

export const Affordances = meta.story({
  name: 'Compact affordances',
  render: () => (
    <Rail>
      {/* What a chat rail asks for: like only. Bookmark and share have no
          handlers there, so they never render. */}
      <Row thought={host} density="compact" actions={['like']} />
      {/* The default set, at chat density. */}
      <Row thought={mod} density="compact" />
      {/* Read-only rail: no action row at all. */}
      <Row thought={viewer} density="compact" actions={[]} />
    </Rail>
  ),
});

export const DensityComparison = meta.story({
  name: 'Density comparison',
  render: () => (
    <div className="flex items-start gap-6">
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">comfortable</p>
        <Panel width={332}>
          <div className="flex flex-col gap-8">
            <Row thought={host} />
            <Row thought={viewerTwo} />
          </div>
        </Panel>
      </div>
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">compact</p>
        <Rail>
          <Row thought={host} density="compact" actions={['like']} />
          <Row thought={viewerTwo} density="compact" actions={['like']} />
        </Rail>
      </div>
    </div>
  ),
});

export const CompactThread = meta.story({
  name: 'Compact with a reply',
  render: () => (
    <Rail>
      <Row
        thought={{ ...host, replyCount: 1, replies: [{ ...viewer, id: '3a' }] }}
        density="compact"
        actions={['like']}
      />
      <Row thought={mod} density="compact" actions={['like']} />
    </Rail>
  ),
});

/* ── The viewer's own messages ─────────────────────────────────────────
   `isOwn` colours the display NAME brand red and changes nothing else.
   The name stays the name — a room where the viewer's line reads "You"
   is a room where nobody else can be told apart from them either.
   ──────────────────────────────────────────────────────────────────── */

/** Tommy is the signed-in viewer in every story below. */
const own: ThoughtCommentThought = {
  id: '5',
  body: 'Give it to the left back and let him run at them.',
  author: { name: 'Tommy Adams', handle: 'tommy', initials: 'TA', tier: 'Pro' },
  createdAt: '12s',
  stats: { likes: 1, comments: 0 },
};

const ownTwo: ThoughtCommentThought = {
  ...own,
  id: '6',
  body: 'Told you.',
  createdAt: 'now',
  stats: { likes: 0, comments: 0 },
};

export const OwnMessagesRail = meta.story({
  name: 'Own messages — compact rail',
  render: () => (
    <Rail>
      <Row thought={host} density="compact" actions={['like']} />
      <Row thought={own} density="compact" actions={['like']} isOwn />
      <Row thought={mod} density="compact" actions={['like']} />
      <Row thought={viewerTwo} density="compact" actions={['like']} />
      <Row thought={ownTwo} density="compact" actions={['like']} isOwn />
    </Rail>
  ),
});

export const OwnMessagesDensityComparison = meta.story({
  name: 'Own messages — density comparison',
  render: () => (
    <div className="flex items-start gap-6">
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">comfortable</p>
        <Panel width={332}>
          <div className="flex flex-col gap-8">
            <Row thought={viewerTwo} />
            <Row thought={own} isOwn />
          </div>
        </Panel>
      </div>
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">compact</p>
        <Rail>
          <Row thought={viewerTwo} density="compact" actions={['like']} />
          <Row thought={own} density="compact" actions={['like']} isOwn />
        </Rail>
      </div>
    </div>
  ),
});

/**
 * `ownRowTint` — the opt-in second marker. OFF everywhere in platform; the
 * red name is what ships. Here so a surface that needs an own message found
 * without being read can ask for it.
 */
export const OwnMessageTint = meta.story({
  name: 'Own messages — opt-in row tint',
  render: () => (
    <Rail>
      <Row thought={host} density="compact" actions={['like']} />
      <Row thought={own} density="compact" actions={['like']} isOwn ownRowTint />
      <Row thought={mod} density="compact" actions={['like']} />
      <Row thought={ownTwo} density="compact" actions={['like']} isOwn ownRowTint />
    </Rail>
  ),
});

/**
 * A thread resolves ownership per message with `getIsOwn`. The parent is
 * somebody else's, the reply is the viewer's, and only the reply is marked.
 */
export const OwnMessageInAThread = meta.story({
  name: 'Own messages — resolved per reply',
  render: () => (
    <Rail>
      <Row
        thought={{ ...host, replyCount: 1, replies: [{ ...own, id: '5a' }] }}
        density="compact"
        actions={['like']}
        getIsOwn={(id) => id === '5a'}
      />
    </Rail>
  ),
});

/* ── Reactions ─────────────────────────────────────────────────────────
   The stack is thought data: the server hydrates it on every read that
   returns a thought, ordered highest count first with the emoji as
   tiebreak, so these fixtures are written in the order they arrive and
   the row maps them as given. The callbacks are the host's.
   ──────────────────────────────────────────────────────────────────── */

const stack: ThoughtReaction[] = [
  { emoji: '🔥', count: 12, viewerHasReacted: true },
  { emoji: '👏', count: 5 },
  { emoji: '😂', count: 2 },
];

/** Twenty distinct emoji — the server's per-thought ceiling. */
const fullStack: ThoughtReaction[] = [
  '🔥',
  '👏',
  '😂',
  '😮',
  '😢',
  '🙌',
  '💯',
  '⚽',
  '🥶',
  '🤝',
  '🧠',
  '🎯',
  '🚀',
  '👀',
  '💔',
  '🫡',
  '🤯',
  '🏆',
  '🥵',
  '😴',
].map((emoji, i) => ({ emoji, count: 20 - i, viewerHasReacted: i < 6 }));

export const ReactionsNone = meta.story({
  name: 'Reactions — none',
  render: () => (
    <Rail>
      {/* No stack, and no host handler: the row does not render, so a
          caller that knows nothing about reactions is untouched. */}
      <Row thought={host} density="compact" actions={['like']} />
      {/* No stack, host handler present: just the add control. */}
      <Row thought={mod} density="compact" actions={['like']} onReact={noop} />
    </Rail>
  ),
});

export const ReactionsFew = meta.story({
  name: 'Reactions — a few',
  render: () => (
    <Rail>
      <Row
        thought={{ ...host, reactions: stack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
      <Row
        thought={{ ...mod, reactions: [{ emoji: '👏', count: 1 }] }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
      <Row thought={viewer} density="compact" actions={['like']} onReact={noop} />
    </Rail>
  ),
});

export const ReactionsMine = meta.story({
  name: 'Reactions — mine vs not',
  render: () => (
    <Rail>
      {/* Same emoji, same count, one held by the viewer and one not. */}
      <Row
        thought={{ ...host, reactions: [{ emoji: '🔥', count: 7, viewerHasReacted: true }] }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
      <Row
        thought={{ ...mod, reactions: [{ emoji: '🔥', count: 7 }] }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
    </Rail>
  ),
});

export const ReactionsFull = meta.story({
  name: 'Reactions — a full stack',
  render: () => (
    <Rail>
      {/* Twenty distinct emoji, six of them the viewer's. The row wraps
          inside the 332px column: a long stack makes a message taller,
          never wider. */}
      <Row
        thought={{ ...host, reactions: fullStack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
        reactionNotice="Reaction limit reached."
      />
      <Row thought={mod} density="compact" actions={['like']} onReact={noop} />
    </Rail>
  ),
});

export const ReactionsLongCounts = meta.story({
  name: 'Reactions — long counts',
  render: () => (
    <Rail>
      <Row
        thought={{
          ...host,
          reactions: [
            { emoji: '🔥', count: 1284000, viewerHasReacted: true },
            { emoji: '👏', count: 92400 },
            { emoji: '😂', count: 1284 },
            { emoji: '😮', count: 999 },
          ],
        }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
    </Rail>
  ),
});

export const ReactionsRefused = meta.story({
  name: 'Reactions — refused',
  render: () => (
    <Rail>
      {/* Reacting takes the same read access as the thought, so a refusal
          is a normal outcome. The stack stays legible, nothing toggles,
          the add control is gone, and one quiet line says why. */}
      <Row
        thought={{ ...host, reactions: stack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
        reactionsDisabled
        reactionNotice="Reactions are closed."
      />
    </Rail>
  ),
});

export const ReactionsDensityComparison = meta.story({
  name: 'Reactions — density comparison',
  render: () => (
    <div className="flex items-start gap-6">
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">comfortable</p>
        <Panel width={520}>
          <div className="flex flex-col gap-8">
            <Row
              thought={{ ...host, authorRole: undefined, reactions: stack }}
              user={{ initials: 'TA' }}
              onReact={noop}
              onUnreact={noop}
            />
            <Row
              thought={{ ...viewerTwo, reactions: fullStack }}
              user={{ initials: 'TA' }}
              onReact={noop}
              onUnreact={noop}
            />
          </div>
        </Panel>
      </div>
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">compact</p>
        <Rail>
          <Row
            thought={{ ...host, reactions: stack }}
            density="compact"
            actions={['like']}
            onReact={noop}
            onUnreact={noop}
          />
          <Row
            thought={{ ...viewerTwo, reactions: fullStack }}
            density="compact"
            actions={['like']}
            onReact={noop}
            onUnreact={noop}
          />
        </Rail>
      </div>
    </div>
  ),
});

/**
 * Toggling, with the stack held where the host holds it. The play function
 * clicks a pill the viewer already holds and then one they do not, so the
 * two directions are exercised against real state rather than a spy.
 */
function ToggleHarness() {
  const [reactions, setReactions] = useState<ThoughtReaction[]>(stack);
  const toggle = (_id: string, emoji: string) =>
    setReactions((current) =>
      current.map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              count: r.viewerHasReacted ? r.count - 1 : r.count + 1,
              viewerHasReacted: !r.viewerHasReacted,
            }
          : r
      )
    );
  return (
    <Rail>
      <Row
        thought={{ ...host, reactions }}
        density="compact"
        actions={['like']}
        onReact={toggle}
        onUnreact={toggle}
      />
    </Rail>
  );
}

/**
 * The add control opens the composer's own EmojiPicker, in a Popover. The
 * play function pins two things a chat rail depends on: that the picker
 * actually mounts from this trigger, and that it is portalled out of the
 * 332px column rather than laid out inside it.
 */
export const ReactionsPicker = meta.story({
  name: 'Reactions — the picker',
  render: () => (
    <Rail>
      <Row
        thought={{ ...host, reactions: [{ emoji: '🔥', count: 2 }] }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
    </Rail>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add reaction' }));

    // The picker is the one the reply composer already ships, so it is found
    // by its own search field rather than by anything this row invented.
    const search = await screen.findByPlaceholderText('Search emoji…');
    await expect(search).toBeVisible();

    // Portalled: the panel is 320px and the rail is 332px, so it must not be
    // laid out inside the message row that opened it.
    await expect(canvasElement.contains(search)).toBe(false);
  },
});

export const ReactionsToggle = meta.story({
  name: 'Reactions — toggle',
  render: () => <ToggleHarness />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mine = canvas.getByRole('button', { name: '🔥 12' });
    await expect(mine).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(mine);
    await expect(canvas.getByRole('button', { name: '🔥 11' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    const theirs = canvas.getByRole('button', { name: '👏 5' });
    await userEvent.click(theirs);
    await expect(canvas.getByRole('button', { name: '👏 6' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  },
});

/* ── One row ───────────────────────────────────────────────────────────
   Like and the stacks share a band: like first, then the emoji stacks,
   then the add control. The band is the only part of the row that wraps,
   so a long stack makes a message taller and never wider.
   ──────────────────────────────────────────────────────────────────── */

export const OneRowLikeAlone = meta.story({
  name: 'One row — like alone',
  render: () => (
    <Rail>
      {/* No stack and no handler: like renders on its own, exactly as it
          did before the band existed. */}
      <Row thought={host} density="compact" actions={['like']} />
      <Row thought={viewerTwo} density="compact" actions={['like']} />
    </Rail>
  ),
});

export const OneRowLikeAndPills = meta.story({
  name: 'One row — like and the stacks',
  render: () => (
    <Rail>
      <Row
        thought={{ ...host, reactions: stack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
      <Row
        thought={{ ...viewerTwo, reactions: [{ emoji: '👏', count: 1 }] }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
    </Rail>
  ),
});

export const OneRowPillsAlone = meta.story({
  name: 'One row — the stacks alone',
  render: () => (
    <Rail>
      {/* Like withheld by the caller. The band is the stacks and the add
          control, and nothing shifts to fill the space like left. */}
      <Row
        thought={{ ...host, reactions: stack }}
        density="compact"
        actions={[]}
        onReact={noop}
        onUnreact={noop}
      />
      <Row thought={mod} density="compact" actions={[]} onReact={noop} />
    </Rail>
  ),
});

export const OneRowWrapping = meta.story({
  name: 'One row — wrapping at 332px',
  render: () => (
    <Rail>
      {/* Twenty distinct emoji behind a like, in the real rail width. Like
          leads the band and the stacks wrap after it. */}
      <Row
        thought={{ ...host, reactions: fullStack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
      <Row
        thought={{ ...viewerTwo, reactions: stack }}
        density="compact"
        actions={['like']}
        onReact={noop}
        onUnreact={noop}
      />
    </Rail>
  ),
});

export const OneRowDensities = meta.story({
  name: 'One row — both densities',
  render: () => (
    <div className="flex items-start gap-6">
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">comfortable</p>
        <Panel width={520}>
          <div className="flex flex-col gap-8">
            {/* The discussion row keeps reply, bookmark and share around the
                band; the band sits where like always sat. */}
            <Row
              thought={{ ...host, authorRole: undefined, reactions: stack }}
              user={{ initials: 'TA' }}
              onReact={noop}
              onUnreact={noop}
            />
            <Row thought={{ ...viewerTwo, authorRole: undefined }} user={{ initials: 'TA' }} />
          </div>
        </Panel>
      </div>
      <div>
        <p className="mb-2 font-content text-xs text-[#807c7c]">compact</p>
        <Rail>
          <Row
            thought={{ ...host, reactions: stack }}
            density="compact"
            actions={['like']}
            onReact={noop}
            onUnreact={noop}
          />
          <Row thought={viewerTwo} density="compact" actions={['like']} />
        </Rail>
      </div>
    </div>
  ),
});

/* ── Stacked row (reactionsRow="stacked") ─────────────────────────────
   Right when the action row carries MORE than like: Reply/Bookmark/Share
   are fixed controls, and a variable-width stack sharing their row pushes
   them sideways as people react. Here the pills get their own row, directly
   under the body, and the action row keeps its width regardless of the
   stack. Discussion density only in these stories — the chat rail has
   nothing beside like to push, which is why `'combined'` stays its default.
   ──────────────────────────────────────────────────────────────────── */

export const StackedRowDiscussion = meta.story({
  name: 'Stacked row — reply, bookmark and share stay put',
  render: () => (
    <Panel width={520}>
      <div className="flex flex-col gap-8">
        <Row
          thought={{ ...host, authorRole: undefined, reactions: stack }}
          user={{ initials: 'TA' }}
          onReact={noop}
          onUnreact={noop}
          onBookmark={noop}
          onShare={noop}
          reactionsRow="stacked"
        />
        <Row
          thought={{ ...viewerTwo, authorRole: undefined }}
          user={{ initials: 'TA' }}
          onBookmark={noop}
          onShare={noop}
          reactionsRow="stacked"
        />
      </div>
    </Panel>
  ),
});

export const StackedRowWrapping = meta.story({
  name: 'Stacked row — a full stack still does not move Bookmark or Share',
  render: () => (
    <Panel width={520}>
      <Row
        thought={{ ...host, authorRole: undefined, reactions: fullStack }}
        user={{ initials: 'TA' }}
        onReact={noop}
        onUnreact={noop}
        onBookmark={noop}
        onShare={noop}
        reactionsRow="stacked"
      />
    </Panel>
  ),
});
