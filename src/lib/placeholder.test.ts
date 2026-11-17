import { describe, expect, it } from 'vitest';

import { withEllipsis } from './placeholder';

describe('withEllipsis', () => {
  it('appends an ellipsis to a short placeholder', () => {
    expect(withEllipsis("What's happening")).toBe("What's happening...");
  });

  it.each([
    'Liverpool 2-1 Arsenal. Who stood out?',
    'Great game!',
    'Say something.',
    'Reply to Zach...',
    'Search…',
    'Your take:',
  ])('leaves %j alone', (value) => {
    expect(withEllipsis(value)).toBe(value);
  });

  it('looks past trailing whitespace', () => {
    expect(withEllipsis('Who stood out? ')).toBe('Who stood out? ');
  });

  it('does not decorate an empty placeholder', () => {
    expect(withEllipsis('')).toBe('');
  });
});
