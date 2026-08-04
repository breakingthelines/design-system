import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveMediaQueryList } from '../use-media-query';

/**
 * This project runs in a node environment with no DOM, so `window` is
 * genuinely absent unless a test puts one there — which makes it the right
 * place to pin down what the hook does when the host cannot answer a media
 * query. The 0.85.0 regression was exactly this: `matchMedia` called with
 * nothing to call it on.
 */

const QUERY = '(max-width: 639px)';

function withWindow(stub: unknown) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: stub,
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
});

describe('resolveMediaQueryList — hosts that cannot answer', () => {
  it('returns null when there is no window at all (server render, node tests)', () => {
    expect(typeof window).toBe('undefined');
    expect(resolveMediaQueryList(QUERY)).toBeNull();
  });

  it('returns null when the window has no matchMedia (jsdom)', () => {
    withWindow({});
    expect(resolveMediaQueryList(QUERY)).toBeNull();
  });

  it('returns null when matchMedia is present but is not callable', () => {
    withWindow({ matchMedia: {} });
    expect(resolveMediaQueryList(QUERY)).toBeNull();
  });

  it('returns null when matchMedia answers with nothing usable', () => {
    withWindow({ matchMedia: () => null });
    expect(resolveMediaQueryList(QUERY)).toBeNull();

    withWindow({ matchMedia: () => undefined });
    expect(resolveMediaQueryList(QUERY)).toBeNull();
  });

  it('returns null when the answer has no boolean `matches`', () => {
    withWindow({ matchMedia: () => ({}) });
    expect(resolveMediaQueryList(QUERY)).toBeNull();

    withWindow({ matchMedia: () => ({ matches: 'yes' }) });
    expect(resolveMediaQueryList(QUERY)).toBeNull();
  });

  it('never throws for any of them, which is the whole point', () => {
    const hosts = [{}, { matchMedia: {} }, { matchMedia: () => null }, { matchMedia: () => ({}) }];
    for (const host of hosts) {
      withWindow(host);
      expect(() => resolveMediaQueryList(QUERY)).not.toThrow();
    }
  });
});

describe('resolveMediaQueryList — hosts that can answer', () => {
  it('passes the query through and returns the list', () => {
    const list = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const matchMedia = vi.fn(() => list);
    withWindow({ matchMedia });

    expect(resolveMediaQueryList(QUERY)).toBe(list);
    expect(matchMedia).toHaveBeenCalledWith(QUERY);
  });

  it('accepts the legacy addListener-only shape, the common hand-written stub', () => {
    // Rejecting this would move the crash from `matchMedia(...)` to
    // `.addEventListener(...)` rather than remove it.
    const list = { matches: false, addListener: vi.fn(), removeListener: vi.fn() };
    withWindow({ matchMedia: () => list });

    expect(resolveMediaQueryList(QUERY)).toBe(list);
  });

  it('accepts a list that reports a false match', () => {
    const list = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    withWindow({ matchMedia: () => list });

    expect(resolveMediaQueryList(QUERY)).toBe(list);
  });
});
