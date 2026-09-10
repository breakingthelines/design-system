import { describe, expect, it } from 'vitest';

import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from '../thought-comment';
import { getSlotAttr, render } from './test-utils';

/*
 * The chat-density variant (design-system#228). Two things are pinned here:
 *
 * 1. the compact anatomy itself — 24px avatar, one 11px identity line
 *    carrying the time, a 12.5px body — so a later pass cannot quietly walk
 *    it back to discussion density; and
 * 2. that NOTHING moves without asking. Every existing call site renders at
 *    `comfortable` with the full action set, so the comfortable assertions
 *    below are the regression guard for the thoughts panel, and the last
 *    test pins that the defaults are exactly `comfortable` + all four
 *    actions.
 */

const thought: ThoughtCommentThought = {
  id: '1',
  body: 'That was never a corner.',
  author: {
    name: 'Zach Lowy',
    handle: 'zachlowy',
    initials: 'ZL',
    verified: true,
  },
  createdAt: '2m',
  permalinkHref: '/@zachlowy/thoughts/1',
  stats: { likes: 42, comments: 0 },
};

function renderRow(props: Partial<ThoughtCommentProps> = {}): string {
  return render(
    <ThoughtComment
      thought={thought}
      replyingTo={null}
      onStartReply={() => {}}
      onCancelReply={() => {}}
      onReplySubmit={() => {}}
      {...props}
    />
  );
}

describe('ThoughtComment — comfortable density (the default)', () => {
  it('keeps the 40px avatar', () => {
    expect(getSlotAttr(renderRow(), 'avatar', 'class')).toContain('size-10');
  });

  it('keeps the @handle on its own metadata line', () => {
    expect(renderRow()).toContain('>@zachlowy<');
  });

  it('keeps the 14px body', () => {
    expect(getSlotAttr(renderRow(), 'thought-body', 'class')).toContain('text-sm');
  });

  it('keeps bookmark and share', () => {
    const markup = renderRow();
    expect(markup).toContain('aria-label="Bookmark"');
    expect(markup).toContain('aria-label="Share"');
  });

  it('keeps the 52px reply indent', () => {
    expect(renderRow({ isReply: true })).toContain('pl-[52px]');
  });
});

describe('ThoughtComment — compact density (chat)', () => {
  it('renders the 24px avatar', () => {
    const avatar = getSlotAttr(renderRow({ density: 'compact' }), 'avatar', 'class');
    expect(avatar).toContain('size-6');
    expect(avatar).not.toContain('size-10');
  });

  it('renders the 11px identity line and the 12.5px body', () => {
    const markup = renderRow({ density: 'compact' });
    expect(markup).toContain('text-[11px]');
    expect(getSlotAttr(markup, 'thought-body', 'class')).toContain('text-[12.5px]');
    expect(getSlotAttr(markup, 'thought-body', 'class')).toContain('leading-[17px]');
  });

  it('drops the @handle line and carries the time on the identity line', () => {
    const markup = renderRow({ density: 'compact' });
    // The name still links to the profile; what goes is the metadata line
    // that printed the handle as text under it.
    expect(markup).not.toContain('>@zachlowy<');
    expect(markup).toContain('>2m<');
  });

  it('still links the time to the permalink', () => {
    expect(renderRow({ density: 'compact' })).toContain('href="/@zachlowy/thoughts/1"');
  });

  it('indents a reply by one compact avatar plus its gap', () => {
    const markup = renderRow({ density: 'compact', isReply: true });
    expect(markup).toContain('pl-8');
    expect(markup).not.toContain('pl-[52px]');
  });
});

describe('ThoughtComment — action affordances', () => {
  it('offers the full set by default', () => {
    const markup = renderRow({ user: { initials: 'TA' } });
    expect(markup).toContain('Reply');
    expect(markup).toContain('>42<');
    expect(markup).toContain('aria-label="Bookmark"');
    expect(markup).toContain('aria-label="Share"');
  });

  it('renders like alone when that is all the caller asked for', () => {
    const markup = renderRow({ user: { initials: 'TA' }, actions: ['like'] });
    expect(markup).toContain('>42<');
    expect(markup).not.toContain('Reply');
    expect(markup).not.toContain('aria-label="Bookmark"');
    expect(markup).not.toContain('aria-label="Share"');
  });

  it('drops the row entirely for an empty set', () => {
    const markup = renderRow({ user: { initials: 'TA' }, actions: [] });
    expect(markup).not.toContain('>42<');
    expect(markup).not.toContain('Reply');
    expect(markup).not.toContain('aria-label="Bookmark"');
    expect(markup).not.toContain('aria-label="Share"');
    // The body still renders — only the affordances went.
    expect(markup).toContain('That was never a corner.');
  });

  it('passes the caller’s set down to nested replies', () => {
    const markup = renderRow({
      actions: ['like'],
      thought: {
        ...thought,
        replyCount: 1,
        replies: [
          {
            id: '1a',
            body: 'Nowhere near.',
            author: { name: 'Gab', handle: 'gab' },
            createdAt: '1m',
            stats: { likes: 0, comments: 0 },
          },
        ],
      },
    });
    expect(markup).not.toContain('aria-label="Bookmark"');
    expect(markup).not.toContain('aria-label="Share"');
  });
});

describe('ThoughtComment — role badge', () => {
  it('renders HOST for the show host', () => {
    expect(renderRow({ thought: { ...thought, authorRole: 'host' } })).toContain('HOST');
  });

  it('renders MOD for a moderator', () => {
    expect(renderRow({ thought: { ...thought, authorRole: 'moderator' } })).toContain('MOD');
  });

  it('renders no role marker when the thought carries none', () => {
    const markup = renderRow();
    expect(markup).not.toContain('HOST');
    expect(markup).not.toContain('MOD');
  });

  it('sits beside the tier badge, not instead of it', () => {
    const markup = renderRow({
      thought: {
        ...thought,
        authorRole: 'host',
        author: { ...thought.author, tier: 'Line Breaker' },
      },
    });
    expect(markup).toContain('Line Breaker');
    expect(markup).toContain('HOST');
    expect(markup.indexOf('Line Breaker')).toBeLessThan(markup.indexOf('HOST'));
  });

  it('travels with the message, so a reply carries its own author’s role', () => {
    const markup = renderRow({
      thought: {
        ...thought,
        authorRole: 'host',
        replyCount: 1,
        replies: [
          {
            id: '1a',
            body: 'On it.',
            author: { name: 'Gab', handle: 'gab' },
            createdAt: '1m',
            stats: { likes: 0, comments: 0 },
          } as ThoughtCommentThought,
        ],
      },
    });
    // One HOST badge, on the parent — the reply inherits nothing.
    expect(markup.split('HOST')).toHaveLength(2);
  });
});

describe('ThoughtComment — the defaults are today’s rendering', () => {
  it('matches an explicit comfortable + full action set', () => {
    const props: Partial<ThoughtCommentProps> = { user: { initials: 'TA' } };
    expect(
      renderRow({
        ...props,
        density: 'comfortable',
        actions: ['reply', 'like', 'bookmark', 'share'],
      })
    ).toBe(renderRow(props));
  });
});
