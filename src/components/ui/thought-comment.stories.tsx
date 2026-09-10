import type { ReactNode } from 'react';

import preview from '#.storybook/preview';
import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from './thought-comment';

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
