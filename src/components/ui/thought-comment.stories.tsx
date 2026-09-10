import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';

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
