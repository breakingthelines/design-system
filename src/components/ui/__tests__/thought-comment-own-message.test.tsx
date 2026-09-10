import { describe, expect, it } from 'vitest';

import {
  ThoughtComment,
  type ThoughtCommentProps,
  type ThoughtCommentThought,
} from '../thought-comment';
import { render } from './test-utils';

/*
 * `isOwn` — the viewer's own message in a fast room.
 *
 * The treatment is the author's display NAME in brand red and nothing else,
 * so these assertions read the name element's own class string rather than
 * looking for `red-100` anywhere in the markup: the row already spends that
 * token on hover states, the anchor quote and the timestamp badge, and a
 * loose `toContain` would pass on any of them.
 *
 * Three things are pinned:
 *   1. red-100 lands on the name, at both densities, linked or not;
 *   2. the name is still the name — no rename, no extra chrome; and
 *   3. nothing moves without asking. `isOwn` defaults to false, and a row
 *      that does not set it renders byte-for-byte what it rendered before
 *      the prop existed.
 */

/* The linked name (the usual case — the name is a link to the profile). */
const OWN_NAME_LINK = 'class="text-red-100 transition-colors hover:text-red-300"';
const PLAIN_NAME_LINK = 'class="text-white transition-colors hover:text-red-100"';
/* The wrapper the colour falls back to when the author has no handle. */
const OWN_NAME = 'tracking-[-0.42px] text-red-100';
const PLAIN_NAME = 'tracking-[-0.42px] text-white';

const thought: ThoughtCommentThought = {
  id: '1',
  body: 'Give it to the left back and let him run at them.',
  author: {
    name: 'Tommy Adams',
    handle: 'tommy',
    initials: 'TA',
  },
  createdAt: '12s',
  permalinkHref: '/@tommy/thoughts/1',
  stats: { likes: 1, comments: 0 },
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

describe('ThoughtComment — the viewer’s own message', () => {
  it('renders the author name in brand red', () => {
    const markup = renderRow({ isOwn: true });
    expect(markup).toContain(OWN_NAME_LINK);
    expect(markup).not.toContain(PLAIN_NAME_LINK);
  });

  it('leaves somebody else’s name white', () => {
    const markup = renderRow();
    expect(markup).toContain(PLAIN_NAME_LINK);
    expect(markup).not.toContain(OWN_NAME_LINK);
  });

  it('marks the name at chat density too', () => {
    expect(renderRow({ isOwn: true, density: 'compact' })).toContain(OWN_NAME_LINK);
    expect(renderRow({ density: 'compact' })).toContain(PLAIN_NAME_LINK);
  });

  it('marks an unlinked name, which carries the colour on its own wrapper', () => {
    const noHandle = { ...thought, author: { ...thought.author, handle: undefined } };
    expect(renderRow({ isOwn: true, thought: noHandle })).toContain(OWN_NAME);
    expect(renderRow({ thought: noHandle })).toContain(PLAIN_NAME);
  });

  it('keeps the display name — it never becomes “You”', () => {
    const markup = renderRow({ isOwn: true, density: 'compact' });
    expect(markup).toContain('Tommy Adams');
    expect(markup).not.toContain('>You<');
  });

  it('adds no border, stripe or wash of its own', () => {
    const plain = renderRow({ density: 'compact' });
    const own = renderRow({ isOwn: true, density: 'compact' });
    // Put the two colour sites back to white and the rows are identical:
    // the whole treatment IS the name's colour. Explicitly not a left border
    // — that stripe is the thing this was asked not to be.
    expect(own.replaceAll(OWN_NAME_LINK, PLAIN_NAME_LINK).replaceAll(OWN_NAME, PLAIN_NAME)).toBe(
      plain
    );
    expect(own).not.toContain('border-l');
  });
});

describe('ThoughtComment — own messages in a thread', () => {
  const withReply: ThoughtCommentThought = {
    ...thought,
    id: 'parent',
    author: { name: 'Zach Lowy', handle: 'zachlowy', initials: 'ZL' },
    replyCount: 1,
    replies: [
      {
        id: 'reply',
        body: 'Told you.',
        author: { name: 'Tommy Adams', handle: 'tommy' },
        createdAt: 'now',
        stats: { likes: 0, comments: 0 },
      } as ThoughtCommentThought,
    ],
  };

  it('never inherits the parent’s ownership down to a reply', () => {
    const markup = renderRow({ thought: withReply, isOwn: true });
    // One red name: the parent's. The reply is somebody else's message and
    // this component has no way to know otherwise.
    expect(markup.split(OWN_NAME_LINK)).toHaveLength(2);
  });

  it('marks the reply the viewer wrote, and only that one, via getIsOwn', () => {
    const markup = renderRow({ thought: withReply, getIsOwn: (id) => id === 'reply' });
    expect(markup.split(OWN_NAME_LINK)).toHaveLength(2);
    expect(markup.indexOf(OWN_NAME_LINK)).toBeGreaterThan(markup.indexOf('Zach Lowy'));
  });

  it('lets getIsOwn resolve the top-level row as well', () => {
    expect(renderRow({ getIsOwn: () => true })).toContain(OWN_NAME_LINK);
  });
});

describe('ThoughtComment — the opt-in row tint', () => {
  it('washes an own row when asked, faintly and without a border', () => {
    const markup = renderRow({ isOwn: true, density: 'compact', ownRowTint: true });
    expect(markup).toContain('bg-red-100/[0.06]');
    expect(markup).not.toContain('border-l');
  });

  it('does nothing on a row that is not the viewer’s', () => {
    expect(renderRow({ density: 'compact', ownRowTint: true })).not.toContain('bg-red-100/[0.06]');
  });

  it('is off unless the caller asks, so the red name ships alone', () => {
    expect(renderRow({ isOwn: true, density: 'compact' })).not.toContain('bg-red-100/[0.06]');
  });
});

describe('ThoughtComment — the defaults are today’s rendering', () => {
  it('matches an explicit not-own, untinted row', () => {
    const props: Partial<ThoughtCommentProps> = { user: { initials: 'TA' } };
    expect(renderRow({ ...props, isOwn: false, ownRowTint: false })).toBe(renderRow(props));
  });

  it('leaves an original-author row alone — red does not read on the grey pill', () => {
    const op = { ...thought, isOriginalAuthor: true };
    expect(renderRow({ thought: op, isOwn: true })).toBe(renderRow({ thought: op }));
  });
});
