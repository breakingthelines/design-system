import { describe, expect, it, vi } from 'vitest';

import { render } from './test-utils';

/**
 * AvatarSourceProvider lets an app serve a resized avatar with the original
 * as its fallback, through every AvatarImage including the ones composite
 * components render. The unit project has no DOM, so this pins the wiring:
 * which address Avatar.Image is given first, and that a failure of an early
 * address is not reported to the caller as the avatar failing.
 */

type CapturedProps = {
  src?: string;
  onError?: (event: unknown) => void;
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

const { Avatar, AvatarImage, AvatarSourceProvider, ChainedAvatarImage } =
  await import('#/components/ui/avatar');

const original = 'https://cdn.test/media/visual_image/u1/a.png';
const resolve = vi.fn((src: string, size: string) =>
  src.startsWith('https://cdn.test/') ? [`${src}#${size}`, src] : [src]
);

describe('AvatarSourceProvider', () => {
  it('leaves AvatarImage alone without a provider', () => {
    captured.length = 0;
    render(
      <Avatar>
        <AvatarImage src={original} />
      </Avatar>
    );
    expect(captured.map((p) => p.src)).toEqual([original]);
  });

  it("starts at the resolver's first address, with the Avatar's size", () => {
    captured.length = 0;
    resolve.mockClear();
    render(
      <AvatarSourceProvider resolve={resolve}>
        <Avatar size="sm">
          <AvatarImage src={original} />
        </Avatar>
        <Avatar size="xxl">
          <AvatarImage src={original} />
        </Avatar>
        <AvatarImage src={original} />
      </AvatarSourceProvider>
    );
    expect(captured.map((p) => p.src)).toEqual([
      `${original}#sm`,
      `${original}#xxl`,
      `${original}#default`,
    ]);
    expect(resolve).toHaveBeenCalledWith(original, 'sm');
  });

  it('passes a single resolved address straight through', () => {
    captured.length = 0;
    render(
      <AvatarSourceProvider resolve={resolve}>
        <Avatar>
          <AvatarImage src="https://elsewhere.test/a.png" />
        </Avatar>
      </AvatarSourceProvider>
    );
    expect(captured.map((p) => p.src)).toEqual(['https://elsewhere.test/a.png']);
  });

  it('does not resolve a missing src or a ChainedAvatarImage chain', () => {
    captured.length = 0;
    resolve.mockClear();
    render(
      <AvatarSourceProvider resolve={resolve}>
        <Avatar>
          <AvatarImage src={undefined} />
        </Avatar>
        <Avatar>
          <ChainedAvatarImage
            sources={['https://cdn.test/crest.svg', 'https://cdn.test/crest.png']}
          />
        </Avatar>
      </AvatarSourceProvider>
    );
    expect(resolve).not.toHaveBeenCalled();
    expect(captured.map((p) => p.src)).toEqual([undefined, 'https://cdn.test/crest.svg']);
  });

  it("reports an early address's failure to the walk, not to the caller", () => {
    captured.length = 0;
    const onStatus = vi.fn();
    const onError = vi.fn();
    render(
      <AvatarSourceProvider resolve={resolve}>
        <Avatar>
          <AvatarImage src={original} onLoadingStatusChange={onStatus} onError={onError} />
        </Avatar>
      </AvatarSourceProvider>
    );
    const props = captured[0];
    props.onLoadingStatusChange?.('loaded');
    expect(onStatus).toHaveBeenCalledWith('loaded');
    // The variant failing advances the walk outside render; the caller must
    // not hear it as the avatar failing.
    props.onLoadingStatusChange?.('error');
    props.onError?.({});
    expect(onStatus).not.toHaveBeenCalledWith('error');
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports the last address's failure to the caller", () => {
    captured.length = 0;
    const onStatus = vi.fn();
    render(
      <Avatar>
        <ChainedAvatarImage sources={[original]} onLoadingStatusChange={onStatus} />
      </Avatar>
    );
    captured[0].onLoadingStatusChange?.('error');
    expect(onStatus).toHaveBeenCalledWith('error');
  });
});
