import { describe, expect, it } from 'vitest';

import { ThoughtComposer, type ThoughtComposerProps } from '../thought-composer';
import { hasSlot, render } from './test-utils';

/*
 * `showAvatar` — the composer's viewer avatar, made suppressible for a
 * surface where it says nothing (the 332px live chat rail always posts as
 * the signed-in user).
 *
 * The default is `true`, so this file's last block is the regression guard
 * for every existing call site.
 */

function renderComposer(props: ThoughtComposerProps = {}): string {
  return render(<ThoughtComposer {...props} />);
}

describe('ThoughtComposer — the avatar is on by default', () => {
  it('renders the header row and the avatar with nothing asked for', () => {
    const markup = renderComposer();
    expect(hasSlot(markup, 'thought-composer-header')).toBe(true);
    expect(hasSlot(markup, 'avatar')).toBe(true);
    expect(markup).toContain('size-9');
  });

  it('falls back to initials', () => {
    // AvatarImage only mounts once the image loads, so the fallback is what
    // any server render shows regardless of `avatarUrl`.
    expect(renderComposer({ initials: 'ZL' })).toContain('ZL');
  });
});

describe('ThoughtComposer — the avatar suppressed', () => {
  it('drops the avatar', () => {
    const markup = renderComposer({ showAvatar: false, avatarUrl: 'https://example.test/z.png' });
    expect(hasSlot(markup, 'avatar')).toBe(false);
    expect(markup).not.toContain('size-9');
  });

  it('drops the whole header row when nothing else would fill it', () => {
    expect(hasSlot(renderComposer({ showAvatar: false }), 'thought-composer-header')).toBe(false);
  });

  it('keeps the header row when a name or handle still has to live there', () => {
    const markup = renderComposer({
      showAvatar: false,
      displayName: 'Zach Lowy',
      handle: 'zachlowy',
    });
    expect(hasSlot(markup, 'thought-composer-header')).toBe(true);
    expect(markup).toContain('Zach Lowy');
    expect(markup).toContain('@zachlowy');
    expect(hasSlot(markup, 'avatar')).toBe(false);
  });

  it('leaves the composer itself alone — placeholder and shell still render', () => {
    const markup = renderComposer({ showAvatar: false, placeholder: 'Say something' });
    expect(markup).toContain('Say something...');
  });
});

describe('ThoughtComposer — the default is today’s rendering', () => {
  it('matches an explicit showAvatar', () => {
    const props = { initials: 'ZL', displayName: 'Zach Lowy', handle: 'zachlowy' };
    expect(renderComposer({ ...props, showAvatar: true })).toBe(renderComposer(props));
  });

  it('is a no-op in compact mode, which never had an avatar', () => {
    expect(renderComposer({ compact: true, showAvatar: false })).toBe(
      renderComposer({ compact: true })
    );
  });
});
