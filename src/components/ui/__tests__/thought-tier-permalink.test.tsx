import { describe, expect, it } from 'vitest';

import type { ThoughtItem } from '#/types/content';
import { ThoughtCard } from '../thought-card';
import { ThoughtComment } from '../thought-comment';
import { render } from './test-utils';

/*
 * Tier badge (Pro / Line Breaker) on the thought author + permalink-linked
 * timestamp in the panel comment. Author name carries none of the tier words,
 * so asserting the verbatim tier string is a reliable presence/absence check.
 */

const base: ThoughtItem = {
  id: '1',
  body: 'Great call.',
  author: { name: 'Zach Lowy', handle: 'zachlowy', initials: 'ZL', verified: true },
  createdAt: '2h ago',
  permalinkHref: '/@zachlowy/thoughts/1',
  stats: { likes: 1, comments: 0 },
};

function withTier(tier: ThoughtItem['author']['tier']): ThoughtItem {
  return { ...base, author: { ...base.author, tier } };
}

describe('ThoughtCard — tier badge', () => {
  it('renders a Line Breaker badge', () => {
    expect(render(<ThoughtCard thought={withTier('Line Breaker')} />)).toContain('Line Breaker');
  });

  it('renders a Pro badge', () => {
    expect(render(<ThoughtCard thought={withTier('Pro')} />)).toContain('Pro');
  });

  it('omits a badge for the Free tier', () => {
    // Free never renders a chip (mirrors AuthorLine), so the word never appears.
    expect(render(<ThoughtCard thought={withTier('Free')} />)).not.toContain('Free');
  });

  it('omits a badge when tier is undefined', () => {
    expect(render(<ThoughtCard thought={base} />)).not.toContain('Line Breaker');
  });
});

describe('ThoughtComment — tier badge + permalink timestamp', () => {
  it('links the timestamp to the thought permalink', () => {
    const markup = render(<ThoughtComment thought={withTier('Line Breaker')} />);
    expect(markup).toContain('href="/@zachlowy/thoughts/1"');
  });

  it('renders the tier badge beside the author', () => {
    expect(render(<ThoughtComment thought={withTier('Pro')} />)).toContain('Pro');
  });

  it('falls back to a plain timestamp when there is no permalink', () => {
    const markup = render(<ThoughtComment thought={{ ...base, permalinkHref: undefined }} />);
    expect(markup).toContain('2h ago');
    expect(markup).not.toContain('href="/@zachlowy/thoughts/1"');
  });
});
