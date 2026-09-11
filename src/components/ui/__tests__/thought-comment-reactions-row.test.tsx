import { describe, expect, it } from 'vitest';

import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from '../thought-comment';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot } from './test-utils';

/*
 * `reactionsRow="stacked"` — the pills on their own row, directly under the
 * body, like left bare in the action row beside Reply/Bookmark/Share.
 *
 * `'combined'` (0.104.0's shape, and the default here) is right for a row
 * with nothing else beside like — the chat rail's `actions={['like']}` — but
 * wrong once Reply/Bookmark/Share are also on that row: a variable-width
 * stack between them slides the fixed controls sideways as people react.
 * `reaction-pills.test.tsx`'s "like and the reactions on one row" describe
 * block is the regression guard for `'combined'`, unchanged by this prop
 * existing; everything here is the new branch.
 */

const noop = () => {};

const thought: ThoughtCommentThought = {
  id: '1',
  body: 'That was never a corner.',
  author: { name: 'Zach Lowy', handle: 'zachlowy', initials: 'ZL' },
  createdAt: '2m',
  stats: { likes: 4, comments: 0 },
};

const stack = [
  { emoji: '🔥', count: 12, viewerHasReacted: true },
  { emoji: '👏', count: 5 },
];

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

describe('ThoughtComment — reactionsRow="stacked"', () => {
  it('puts the pills ahead of Reply, Like, Bookmark and Share, not between them', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: stack },
      user: { initials: 'ZL' },
      onLike: noop,
      onReact: noop,
      onUnreact: noop,
      reactionsRow: 'stacked',
    });

    const pillsAt = markup.indexOf('data-slot="reaction-pills"');
    const replyAt = markup.indexOf('>Reply<');
    const bookmarkAt = markup.indexOf('aria-label="Bookmark"');
    const shareAt = markup.indexOf('aria-label="Share"');

    expect(pillsAt).toBeGreaterThan(-1);
    expect(pillsAt).toBeLessThan(replyAt);
    expect(pillsAt).toBeLessThan(bookmarkAt);
    expect(pillsAt).toBeLessThan(shareAt);
  });

  it('leaves like bare in the action row rather than folding it into the band', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: stack },
      onLike: noop,
      onReact: noop,
      reactionsRow: 'stacked',
    });

    // No leading slot inside the pills row — like is not the band's own.
    expect(hasSlot(sliceSlot(markup, 'reaction-pills') ?? '', 'reaction-leading')).toBe(false);
    // The like count still renders, off the thought's own stats, outside the row.
    const pillsSlice = sliceSlot(markup, 'reaction-pills') ?? '';
    expect(pillsSlice).not.toContain('>4<');
    expect(markup).toContain('>4<');
  });

  it('renders one row, not two, and nothing extra when there is nothing to react with', () => {
    const markup = renderRow({
      onLike: noop,
      onBookmark: noop,
      onShare: noop,
      reactionsRow: 'stacked',
    });
    expect(hasSlot(markup, 'reaction-pills')).toBe(false);
    expect(markup).toContain('>4<');
    expect(markup).toContain('aria-label="Bookmark"');
  });

  it('spends no row on reactions alone with nothing else to draw', () => {
    // No reply, no like, no bookmark, no share — only a stack. 'combined'
    // would still need SOME action row to hold the band; 'stacked' draws
    // the pills and stops, rather than an empty action row under them.
    const markup = renderRow({
      thought: { ...thought, reactions: stack },
      actions: [],
      onReact: noop,
      reactionsRow: 'stacked',
    });
    expect(hasSlot(markup, 'reaction-pills')).toBe(true);
    expect(countSlot(markup, 'reaction-pill')).toBe(2);
  });

  it('wraps a long stack in its own row rather than pushing Bookmark and Share', () => {
    const markup = renderRow({
      thought: { ...thought, reactions: stack },
      onLike: noop,
      onBookmark: noop,
      onShare: noop,
      onReact: noop,
      reactionsRow: 'stacked',
    });
    expect(getSlotAttr(markup, 'reaction-pills', 'class')).toContain('flex-wrap');
    // Bookmark and Share sit in the action row, a sibling element to the
    // pills row rather than a neighbour inside it — nothing in that row's
    // own width is a function of how many pills the stack holds.
    expect(sliceSlot(markup, 'reaction-pills') ?? '').not.toContain('aria-label="Bookmark"');
  });

  it('gives a nested reply the same stacked row, not the combined band', () => {
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
      onLike: noop,
      onBookmark: noop,
      onShare: noop,
      onReact: noop,
      reactionsRow: 'stacked',
    });
    expect(countSlot(markup, 'reaction-pills')).toBe(2);
    // Neither row carries a leading slot: the reply inherited 'stacked' too,
    // not the default 'combined' the recursion used to fall back to.
    expect(hasSlot(markup, 'reaction-leading')).toBe(false);
  });

  it('changes nothing when left unset — the default is combined, byte for byte', () => {
    const shared: Partial<ThoughtCommentProps> = {
      thought: { ...thought, reactions: stack },
      density: 'compact',
      actions: ['like'],
      onLike: noop,
      onReact: noop,
    };
    expect(renderRow(shared)).toBe(renderRow({ ...shared, reactionsRow: 'combined' }));
  });
});
