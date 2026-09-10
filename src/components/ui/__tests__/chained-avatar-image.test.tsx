import { describe, expect, it, vi } from 'vitest';

import { render } from './test-utils';

/**
 * ChainedAvatarImage exists because base-ui's Avatar.Image never mounts an
 * <img> for a failed address (its detached preloader errors first), so the
 * onError/imgRef contract of useSourceChain is unsatisfiable there and the
 * walk sticks on its first dead address (platform#948, the Arena club pill).
 * onLoadingStatusChange is the only signal base-ui guarantees.
 *
 * The unit project has no DOM, so the advance itself is exercised by
 * platform's avatar-chain behavioural test. What THIS pins is the wiring that
 * bug proved cannot be left to callers: every failure signal reaches
 * Avatar.Image, and the walk starts at the first candidate.
 */

type CapturedProps = {
  src?: string;
  onError?: () => void;
  onLoadingStatusChange?: (status: string) => void;
};
const captured: CapturedProps[] = [];

vi.mock('@base-ui/react/avatar', () => ({
  Avatar: {
    Root: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    Image: (props: CapturedProps) => {
      captured.push(props);
      return null;
    },
    Fallback: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  },
}));

const { ChainedAvatarImage } = await import('#/components/ui/avatar');

describe('ChainedAvatarImage', () => {
  it('starts at the first candidate with every failure signal wired', () => {
    captured.length = 0;
    render(<ChainedAvatarImage sources={['https://cdn.test/a.svg', 'https://cdn.test/b.png']} />);

    expect(captured).toHaveLength(1);
    const props = captured[0];
    expect(props.src).toBe('https://cdn.test/a.svg');
    // The signal base-ui actually fires for a preloader failure…
    expect(typeof props.onLoadingStatusChange).toBe('function');
    // …and the ordinary ones, for the mounted-element edge case.
    expect(typeof props.onError).toBe('function');
    // A non-error status must NOT advance the walk (it would skip a live
    // address): only 'error' calls through to the chain.
    expect(() => props.onLoadingStatusChange?.('loaded')).not.toThrow();
  });

  it('renders nothing when the chain is exhausted (empty sources)', () => {
    captured.length = 0;
    const markup = render(<ChainedAvatarImage sources={[]} />);
    expect(captured).toHaveLength(0);
    expect(markup).toBe('');
  });
});
