import preview from '#.storybook/preview';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, waitFor } from 'storybook/test';

import { EntityImage, useSourceChain } from './entity-asset-image';

const meta = preview.meta({
  title: 'Components/EntityImage',
  component: EntityImage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The single entity-image primitive. It walks an ordered list of CDN addresses and ' +
          'stops at the first that returns an image, falling back to a tinted monogram once ' +
          'every address has missed. These stories are the chain’s regression tests: the ' +
          'client-rendered walk, and — the one that matters — the walk recovering from a ' +
          'failure that happened before React ever hydrated.',
      },
    },
  },
});

/* ─────────────────────────────────────────────────────────────────────────────
 * Fixtures
 *
 * Both addresses are data URIs so the walk is decided by the browser's own
 * image decoder rather than by a dev server, a network round trip, or a cache:
 * BROKEN is a well-formed `image/png` URI whose bytes are not a PNG, so
 * Chromium fires `error` and leaves the element `complete` with
 * `naturalWidth === 0` — byte for byte the state the live ORB block leaves
 * behind. GOOD is a real 1x1 WebP, matching the format the owner uploaded.
 * ────────────────────────────────────────────────────────────────────────── */

const BROKEN = 'data:image/png;base64,Zm9v';
const BROKEN_TOO = 'data:image/png;base64,YmFy';
const GOOD = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

/** A minimal consumer of the shared hook — the same three things every seam in
 *  the library does with it (render `src`, hand back `onError`, hand back
 *  `imgRef`), and nothing else, so a failure here is the chain's fault and not
 *  a component's. */
function ChainProbe({ sources }: { sources: readonly string[] }) {
  const { src, onError, imgRef } = useSourceChain(sources);
  if (!src) return <span data-slot="probe-monogram">?</span>;
  return (
    <img
      key={src}
      src={src}
      alt=""
      data-slot="probe"
      ref={imgRef}
      onError={onError}
      className="size-16 object-contain"
    />
  );
}

/** The settled `<img>` currently in the host, whatever address it is on. */
function probeIn(host: Element): HTMLImageElement {
  const img = host.querySelector('img');
  if (!img) throw new Error('the chain rendered no <img> (it exhausted to the monogram)');
  return img;
}

/**
 * Server-render `sources` into `host` and let the browser SETTLE the first
 * address before React is anywhere near it. This is the whole bug in four
 * lines: on a real SSR'd page the `<img>` arrives in the HTML, the browser
 * requests it during parse, and it can fail before hydration attaches
 * `onError`. The error event fires into a document with no listener for it and
 * is not replayed.
 */
async function renderServerSideAndLetItFail(host: Element, sources: readonly string[]) {
  host.innerHTML = renderToString(<ChainProbe sources={sources} />);
  const img = probeIn(host);
  // No handler is attached here — deliberately. This is pre-hydration.
  await waitFor(() => {
    expect(img.complete, 'the SSR’d image should have settled before hydration').toBe(true);
  });
  expect(img.naturalWidth, 'it should have settled FAILED').toBe(0);
  expect(img.getAttribute('src')).toBe(sources[0]);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * The stories
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * The client-rendered walk: React mounts the `<img>` itself, so `onError` is
 * attached long before the address fails and the handler alone is enough. This
 * is the path the library always had, and it is the control for the story
 * below — deleting the mount check must leave THIS one green.
 */
export const AdvancesOnClientSideFailure = meta.story({
  render: () => <ChainProbe sources={[BROKEN, GOOD]} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const img = probeIn(canvasElement);
      expect(img.getAttribute('src')).toBe(GOOD);
      expect(img.naturalWidth).toBeGreaterThan(0);
    });
  },
});

/**
 * THE REGRESSION TEST (the live bug).
 *
 * The first address fails BEFORE hydration, exactly as it does on a
 * server-rendered competition page: the browser answers the badge's `.svg` with
 * something it will not decode, the error event is lost because React has not
 * attached anything yet, and the element is left `complete` with
 * `naturalWidth === 0` on a dead address. Without the mount check the walk
 * never starts and the uploaded WebP one candidate down is never requested —
 * the empty 64x64 box the owner reported.
 *
 * Mutation check: remove the `complete && naturalWidth === 0` branch from
 * `useSourceChain`'s `imgRef` and this story fails (the img stays on BROKEN)
 * while every other story here stays green.
 */
export const RecoversFromAPreHydrationFailure = meta.story({
  render: () => <div data-slot="ssr-host" />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('[data-slot="ssr-host"]')!;

    await renderServerSideAndLetItFail(host, [BROKEN, GOOD]);

    // Hydrate onto the already-failed markup. The error event is long gone;
    // only the settled state is left to read.
    hydrateRoot(host, <ChainProbe sources={[BROKEN, GOOD]} />);

    await waitFor(() => {
      const img = probeIn(host);
      expect(img.getAttribute('src'), 'the chain should have advanced past the dead address').toBe(
        GOOD
      );
      expect(img.naturalWidth, 'and the WebP should have decoded').toBeGreaterThan(0);
    });
  },
});

/**
 * Recovery advances ONE address, not two.
 *
 * The mount check and a late `onError` can both fire for the same element, so
 * both compute their next index from the render's own cursor rather than
 * incrementing the previous state. With a dead address in the middle of the
 * chain, a double-advance would skip `BROKEN_TOO` — invisible here — but the
 * same arithmetic would skip a LIVE candidate and monogram a crest that exists.
 * Landing on GOOD (and not on the monogram) is the proof the walk stepped once
 * per failure.
 */
export const RecoveryAdvancesOneAddressAtATime = meta.story({
  render: () => <div data-slot="ssr-host" />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('[data-slot="ssr-host"]')!;

    await renderServerSideAndLetItFail(host, [BROKEN, BROKEN_TOO, GOOD]);

    hydrateRoot(host, <ChainProbe sources={[BROKEN, BROKEN_TOO, GOOD]} />);

    await waitFor(() => {
      const img = probeIn(host);
      expect(img.getAttribute('src')).toBe(GOOD);
      expect(img.naturalWidth).toBeGreaterThan(0);
    });
  },
});

/**
 * The settled-SUCCESS state is left alone.
 *
 * The mount check reads the same two properties for a loaded image as for a
 * failed one, so it has to tell them apart by pixels: an image that arrived in
 * the SSR'd HTML and DECODED is `complete` with `naturalWidth > 0`, and
 * advancing it would throw away a perfectly good asset and request the next
 * address for nothing. The first address here is the good one; the chain must
 * stay on it.
 */
export const KeepsAnImageThatLoadedBeforeHydration = meta.story({
  render: () => <div data-slot="ssr-host" />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('[data-slot="ssr-host"]')!;

    host.innerHTML = renderToString(<ChainProbe sources={[GOOD, BROKEN]} />);
    const served = probeIn(host);
    await waitFor(() => {
      expect(served.complete).toBe(true);
      expect(served.naturalWidth).toBeGreaterThan(0);
    });

    hydrateRoot(host, <ChainProbe sources={[GOOD, BROKEN]} />);

    // Give the mount check every chance to misfire before asserting it did not.
    await waitFor(() => expect(probeIn(host).naturalWidth).toBeGreaterThan(0));
    expect(probeIn(host).getAttribute('src'), 'a loaded image must not be advanced').toBe(GOOD);
  },
});

/**
 * The same recovery through the real `EntityImage`, not the bare hook — the
 * component every surface actually renders. Its own chain is built from
 * `cdnBase`, so every BTL address here is a 404 from the dev server (a real
 * network answer, not a data URI) and `fallbackSources` supplies the address
 * that resolves. Proves the fix reaches consumers that never touch
 * `useSourceChain` themselves.
 */
export const EntityImageRecoversAfterHydration = meta.story({
  render: () => <div data-slot="ssr-host" />,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('[data-slot="ssr-host"]')!;
    const node = (
      <EntityImage
        kind="team"
        role="crest"
        id="btl_football_team_tstorybook"
        label="Storybook FC"
        cdnBase="/__no-such-cdn"
        fallbackSources={[GOOD]}
        className="size-16"
      />
    );

    host.innerHTML = renderToString(node);
    const first = probeIn(host);
    await waitFor(() => expect(first.complete).toBe(true));
    expect(first.naturalWidth).toBe(0);

    hydrateRoot(host, node);

    await waitFor(
      () => {
        const img = probeIn(host);
        expect(img.getAttribute('src')).toBe(GOOD);
        expect(img.naturalWidth).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  },
});
