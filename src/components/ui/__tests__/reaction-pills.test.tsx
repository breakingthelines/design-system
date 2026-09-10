import { describe, expect, it } from 'vitest';

import { ReactionPills } from '../reaction-pills';
import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from '../thought-comment';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

/*
 * The stacked reaction row (design-system#230).
 *
 * Two properties are pinned here. First the row itself: server order kept,
 * "mine" marked, counts formatted, a full 20-emoji stack still wrapping
 * inside the rail. Second — and this is the regression guard the thoughts
 * panel depends on — that a caller which knows nothing about reactions
 * renders exactly what it rendered before the row existed. No stack and no
 * `onReact` means no element, not an empty div taking a gap.
 */

const noop = () => {};

function pills(markup: string): string[] {
  return markup
    .split('data-slot="reaction-pill"')
    .slice(1)
    .map((chunk) => {
      const match = /data-emoji="([^"]*)"/.exec(chunk);
      return match ? match[1] : '';
    });
}

describe('ReactionPills', () => {
  it('renders one pill per emoji, in the order the server gave', () => {
    const markup = render(
      <ReactionPills
        reactions={[
          { emoji: '🔥', count: 9 },
          { emoji: '👏', count: 4 },
          { emoji: '😂', count: 1 },
        ]}
      />
    );
    expect(pills(markup)).toEqual(['🔥', '👏', '😂']);
  });

  it('marks the viewer’s own reactions and leaves the rest alone', () => {
    const markup = render(
      <ReactionPills
        reactions={[
          { emoji: '🔥', count: 9, viewerHasReacted: true },
          { emoji: '👏', count: 4 },
        ]}
      />
    );
    const mine = sliceSlot(markup, 'reaction-pill') ?? '';
    expect(mine).toContain('data-mine="true"');
    expect(mine).toContain('aria-pressed="true"');
    expect(markup).toContain('data-emoji="👏" data-mine="false"');
  });

  it('formats a long count rather than widening the pill', () => {
    const markup = render(<ReactionPills reactions={[{ emoji: '🔥', count: 1284 }]} />);
    expect(slotText(markup, 'reaction-pill')).toContain('1.3k');
  });

  it('wraps a full 20-emoji stack instead of running off the row', () => {
    const stack = '🔥👏😂😮😢🙌💯⚽🥶🤝🧠🎯🚀👀💔🫡🤯🏆🥵😴'
      .split(/(?=[\s\S])/u)
      .filter(Boolean)
      .map((emoji, i) => ({ emoji, count: 20 - i }));
    const markup = render(<ReactionPills reactions={stack} />);
    expect(countSlot(markup, 'reaction-pill')).toBe(20);
    expect(getSlotAttr(markup, 'reaction-pills', 'class')).toContain('flex-wrap');
  });

  it('offers the add control only when the host can take a new emoji', () => {
    expect(
      hasSlot(render(<ReactionPills reactions={[{ emoji: '🔥', count: 1 }]} />), 'reaction-add')
    ).toBe(false);
    expect(
      hasSlot(
        render(<ReactionPills reactions={[{ emoji: '🔥', count: 1 }]} onReact={noop} />),
        'reaction-add'
      )
    ).toBe(true);
  });

  it('renders a refused row calmly: pills stay, nothing toggles, no add control', () => {
    const markup = render(
      <ReactionPills
        reactions={[{ emoji: '🔥', count: 9, viewerHasReacted: true }]}
        onReact={noop}
        onUnreact={noop}
        disabled
        notice="Reactions are full."
      />
    );
    expect(countSlot(markup, 'reaction-pill')).toBe(1);
    expect(sliceSlot(markup, 'reaction-pill')).toContain('disabled=""');
    expect(hasSlot(markup, 'reaction-add')).toBe(false);
    expect(slotText(markup, 'reaction-notice')).toBe('Reactions are full.');
  });

  it('renders nothing at all when there is no stack and nothing to add', () => {
    expect(render(<ReactionPills />)).toBe('');
    expect(render(<ReactionPills reactions={[]} />)).toBe('');
  });

  it('keeps the compact pill smaller than the comfortable one', () => {
    const reactions = [{ emoji: '🔥', count: 9 }];
    expect(
      getSlotAttr(render(<ReactionPills reactions={reactions} />), 'reaction-pill', 'class')
    ).toContain('h-6');
    expect(
      getSlotAttr(
        render(<ReactionPills reactions={reactions} density="compact" />),
        'reaction-pill',
        'class'
      )
    ).toContain('h-[18px]');
  });
});

/* ── The row inside a comment ─────────────────────────────────────────── */

const thought: ThoughtCommentThought = {
  id: '1',
  body: 'That was never a corner.',
  author: { name: 'Zach Lowy', handle: 'zachlowy', initials: 'ZL' },
  createdAt: '2m',
  stats: { likes: 4, comments: 0 },
};

function renderRow(props: Partial<ThoughtCommentProps> = {}): string {
  return render(
    <ThoughtComment
      thought={thought}
      replyingTo={null}
      onStartReply={noop}
      onCancelReply={noop}
      onReplySubmit={noop}
      {...props}
    />
  );
}

describe('ThoughtComment — reactions', () => {
  it('renders the stack carried on the thought', () => {
    const markup = renderRow({
      thought: {
        ...thought,
        reactions: [
          { emoji: '🔥', count: 3, viewerHasReacted: true },
          { emoji: '👏', count: 1 },
        ],
      },
    });
    expect(pills(markup)).toEqual(['🔥', '👏']);
  });

  it('renders nothing for a caller that never heard of reactions', () => {
    expect(hasSlot(renderRow(), 'reaction-pills')).toBe(false);
    expect(hasSlot(renderRow({ density: 'compact', actions: ['like'] }), 'reaction-pills')).toBe(
      false
    );
  });

  it('follows the row density', () => {
    const withStack = { ...thought, reactions: [{ emoji: '🔥', count: 3 }] };
    expect(getSlotAttr(renderRow({ thought: withStack }), 'reaction-pill', 'class')).toContain(
      'h-6'
    );
    expect(
      getSlotAttr(
        renderRow({ thought: withStack, density: 'compact', actions: ['like'] }),
        'reaction-pill',
        'class'
      )
    ).toContain('h-[18px]');
  });

  it('gives a nested reply its own stack rather than its parent’s', () => {
    const markup = renderRow({
      thought: {
        ...thought,
        reactions: [{ emoji: '🔥', count: 3 }],
        replyCount: 1,
        replies: [
          {
            id: '2',
            body: 'It was.',
            author: { name: 'Gab', handle: 'gab', initials: 'G' },
            createdAt: '1m',
            stats: { likes: 0, comments: 0 },
            reactions: [{ emoji: '😂', count: 2, viewerHasReacted: true }],
          },
        ],
      },
      onReact: noop,
    });
    expect(pills(markup)).toEqual(['🔥', '😂']);
  });

  it('marks one row without marking its neighbours', () => {
    const markup = renderRow({
      thought: {
        ...thought,
        reactions: [{ emoji: '🔥', count: 3 }],
        replyCount: 1,
        replies: [
          {
            id: '2',
            body: 'It was.',
            author: { name: 'Gab', handle: 'gab', initials: 'G' },
            createdAt: '1m',
            stats: { likes: 0, comments: 0 },
            reactions: [{ emoji: '😂', count: 2 }],
          },
        ],
      },
      onReact: noop,
      getReactionNotice: (id) => (id === '2' ? 'Six is the limit.' : undefined),
    });
    expect(countSlot(markup, 'reaction-notice')).toBe(1);
    expect(markup).toContain('Six is the limit.');
  });
});
