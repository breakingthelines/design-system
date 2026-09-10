import { describe, expect, it } from 'vitest';

import { ReactionPills, hasReactionRow } from '../reaction-pills';
import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from '../thought-comment';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

/*
 * The stacked reaction row (design-system#230), and the one row it shares
 * with like (design-system#232).
 *
 * Three properties are pinned here. First the row itself: server order kept,
 * "mine" marked, counts formatted, a full 20-emoji stack still wrapping
 * inside the rail. Second — and this is the regression guard the thoughts
 * panel depends on — that a caller which knows nothing about reactions
 * renders exactly what it rendered before the row existed. No stack and no
 * `onReact` means no element, not an empty div taking a gap.
 *
 * Third, the band: like, then the stacks, then the add control, in ONE
 * wrapping container rather than a like row under a pill row.
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

  it('renders the host affordance first, ahead of the stacks and the add control', () => {
    const markup = render(
      <ReactionPills
        reactions={[{ emoji: '🔥', count: 9 }]}
        onReact={noop}
        leading={<button type="button">Like</button>}
      />
    );
    expect(markup.indexOf('data-slot="reaction-leading"')).toBeLessThan(
      markup.indexOf('data-slot="reaction-pill"')
    );
    expect(markup.indexOf('data-slot="reaction-pill"')).toBeLessThan(
      markup.indexOf('data-slot="reaction-add"')
    );
  });

  it('draws the row for a host affordance with no stack behind it', () => {
    const markup = render(<ReactionPills leading={<button type="button">Like</button>} />);
    expect(hasSlot(markup, 'reaction-pills')).toBe(true);
    expect(countSlot(markup, 'reaction-pill')).toBe(0);
    expect(slotText(markup, 'reaction-leading')).toBe('Like');
  });

  it('still renders nothing when there is no stack and no affordance', () => {
    expect(render(<ReactionPills leading={null} />)).toBe('');
    expect(hasReactionRow({})).toBe(false);
    expect(hasReactionRow({ leading: <span /> })).toBe(true);
    expect(hasReactionRow({ reactions: [{ emoji: '🔥', count: 1 }] })).toBe(true);
    expect(hasReactionRow({ onReact: noop })).toBe(true);
    expect(hasReactionRow({ onReact: noop, disabled: true })).toBe(false);
    expect(hasReactionRow({ notice: 'Reactions are full.' })).toBe(true);
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

/* ── One row: like and the stacks together ────────────────────────────── */

const bandStack = [
  { emoji: '🔥', count: 12, viewerHasReacted: true },
  { emoji: '👏', count: 5 },
];

describe('ThoughtComment — like and the reactions on one row', () => {
  it('puts like inside the pill row, ahead of the stacks and the add control', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: bandStack },
      density: 'compact',
      actions: ['like'],
      onReact: noop,
      onUnreact: noop,
    });
    const band = sliceSlot(markup, 'reaction-pills') ?? '';

    // The like count lives inside the band, not in a row of its own.
    expect(slotText(band, 'reaction-leading')).toBe('4');
    expect(band.indexOf('data-slot="reaction-leading"')).toBeLessThan(
      band.indexOf('data-slot="reaction-pill"')
    );
    expect(band.indexOf('data-slot="reaction-pill"')).toBeLessThan(
      band.indexOf('data-slot="reaction-add"')
    );
  });

  it('wraps as one band rather than stacking two', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: bandStack },
      density: 'compact',
      actions: ['like'],
      onReact: noop,
    });
    expect(countSlot(markup, 'reaction-pills')).toBe(1);
    expect(getSlotAttr(markup, 'reaction-pills', 'class')).toContain('flex-wrap');
  });

  it('carries like on the band at both densities', () => {
    for (const density of ['comfortable', 'compact'] as const) {
      const markup = renderRow({
        thought: { ...thought, reactions: bandStack },
        density,
        actions: ['like'],
        onReact: noop,
      });
      expect(hasSlot(sliceSlot(markup, 'reaction-pills') ?? '', 'reaction-leading')).toBe(true);
    }
  });

  it('renders the stacks alone when the caller hides like', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: bandStack },
      density: 'compact',
      actions: [],
      onReact: noop,
    });
    expect(countSlot(markup, 'reaction-pill')).toBe(2);
    expect(hasSlot(markup, 'reaction-leading')).toBe(false);
  });

  it('renders like alone, with no band around it, when there are no reactions', () => {
    const markup = renderRow({ density: 'compact', actions: ['like'] });
    expect(hasSlot(markup, 'reaction-pills')).toBe(false);
    // Like is still there: the count off the thought's own stats.
    expect(markup).toContain('>4<');
  });

  it('emits no row at all when there is neither', () => {
    const markup = renderRow({ density: 'compact', actions: [] });
    expect(hasSlot(markup, 'reaction-pills')).toBe(false);
    expect(markup).not.toContain('>4<');
    expect(markup).toContain('That was never a corner.');
  });
});
