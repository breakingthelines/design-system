import { SoccerBall } from '@phosphor-icons/react';
import { userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';
import { ThoughtComposer } from './thought-composer';

const meta = preview.meta({
  title: 'UI/ThoughtComposer',
  component: ThoughtComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
});

export const Default = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
});

export const WithAvatar = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        avatarUrl="https://i.pravatar.cc/150?u=zach"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        initials="ZL"
        disabled
        placeholder="Log in to share your thoughts"
        onSubmit={() => {}}
      />
    </div>
  ),
});

/**
 * The grade-submission sheet's split layout (`submit-rating-sheet.tsx`) — a
 * narrow host (~320-335px regardless of viewport, since it's capped by the
 * sheet's own `max-w-xl` modal, not the screen). No Post button; the host
 * owns submit. The footer-gap fix below is scoped to `!compact` only, so
 * this must render byte-identical to before the fix — this story exists so
 * a visual diff catches it if that guard ever slips.
 */
export const Compact = meta.story({
  render: () => (
    <div style={{ width: 330 }}>
      <ThoughtComposer compact placeholder="Why this grade? Optional." onChange={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textbox = canvas.getByRole('textbox');
    await userEvent.click(textbox);
    await userEvent.type(textbox, 'Great turn from the fullback.');
  },
});

/**
 * Stand-in for the tier-gated `composerActions` slot a real host (the
 * `/thoughts` feed) passes for Pro+ viewers — see platform's
 * `GameBlockToolbar` in `app/components/lineup-thought.tsx`. Same markup:
 * an `h-8` icon button, no extra padding, a single `size-4` phosphor icon.
 * Free-tier viewers get `composerActions={undefined}`, so the toolbar is
 * three icons (image/GIF/emoji) instead of four — the two configs this
 * component must render tight at every width, since design-system can't
 * assume which tier a given host's viewer is on.
 */
function ProComposerAction() {
  return (
    <button
      type="button"
      aria-label="Add a game block"
      className="flex h-8 cursor-pointer items-center justify-center rounded-[4px] text-[#807c7c] transition-colors hover:text-white"
    >
      <SoccerBall weight="regular" className="size-4" />
    </button>
  );
}

/**
 * Expands the composer and types a short thought so the char-count + Post
 * button render — both only mount once `expanded && hasText`, which is
 * exactly the footer configuration the width-variant stories below exist to
 * check: with the count and Post visible, the toolbar and the count/Post
 * cluster are the two clusters that must sit close together with no dead
 * gap between them, at every container width a host can realistically give
 * this component.
 */
async function expandAndType(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByText(/Share your thoughts\.\.\./));
  const textbox = canvas.getByRole('textbox');
  await userEvent.click(textbox);
  await userEvent.type(textbox, text);
}

const FOOTER_GAP_PLAY_TEXT = 'Checking the footer layout';

// Footer-gap width matrix (see CHANGELOG / thought-composer.tsx footer row
// comment): the footer row must sit tight, with no dead gap between the
// toolbar cluster and the count+Post cluster, at every realistic composer
// width design-system can be hosted at, in both the free (3-icon) and Pro
// (4-icon, composerActions present) toolbar configurations. Widths mirror
// the real production range: ~335-345px is the actual mobile width across
// every platform host page; ~430px and ~600px stand in for the narrower and
// wider ends of the desktop range (permalink reply ~612px up to the
// sidebar-less entity Thoughts tab at ~1112px). 320px is the classic
// smallest-supported-viewport floor.

export const FooterGap320Free = meta.story({
  name: 'Footer – 320px, free tier',
  render: () => (
    <div style={{ width: 320 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap320Pro = meta.story({
  name: 'Footer – 320px, Pro tier',
  render: () => (
    <div style={{ width: 320 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap375Free = meta.story({
  name: 'Footer – 375px, free tier',
  render: () => (
    <div style={{ width: 375 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap375Pro = meta.story({
  name: 'Footer – 375px, Pro tier',
  render: () => (
    <div style={{ width: 375 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap430Free = meta.story({
  name: 'Footer – 430px, free tier',
  render: () => (
    <div style={{ width: 430 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap430Pro = meta.story({
  name: 'Footer – 430px, Pro tier',
  render: () => (
    <div style={{ width: 430 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap600Free = meta.story({
  name: 'Footer – 600px, free tier',
  render: () => (
    <div style={{ width: 600 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});

export const FooterGap600Pro = meta.story({
  name: 'Footer – 600px, Pro tier',
  render: () => (
    <div style={{ width: 600 }}>
      <ThoughtComposer
        initials="ZL"
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_GAP_PLAY_TEXT);
  },
});
