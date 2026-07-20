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

// A stand-in viewer for the header row. The real host passes the signed-in
// user's display name + @handle (AuthUser.displayName / AuthUser.username);
// the avatar falls back to initials when no URL is given.
const DEMO_USER = {
  avatarUrl: 'https://i.pravatar.cc/150?u=zach',
  initials: 'ZL',
  displayName: 'Zach Lowy',
  handle: 'zachlowy',
} as const;

export const Default = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
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
        avatarUrl={DEMO_USER.avatarUrl}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
});

/**
 * Option B header layout, expanded with text: the avatar + name/@handle sit in
 * a header ROW at the top, and the input (plus anything a host inserts into the
 * editor, e.g. a lineup card) spans the FULL composer width below it — no
 * avatar side-gutter. Footer is full width: media toolbar left, count + Post
 * right.
 */
export const HeaderExpanded = meta.story({
  render: () => (
    <div className="w-[600px]">
      <ThoughtComposer
        avatarUrl={DEMO_USER.avatarUrl}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(/Share your thoughts\.\.\./));
    const textbox = canvas.getByRole('textbox');
    await userEvent.click(textbox);
    await userEvent.type(textbox, 'Full-width input now that the avatar lives in the header.');
  },
});

/**
 * Avatar-only header fallback — a host that has no name/handle to pass (or the
 * content-detail path where it isn't threaded through) still gets the Option B
 * full-width layout, just with the avatar alone in the header.
 */
export const HeaderAvatarOnly = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ThoughtComposer
        avatarUrl={DEMO_USER.avatarUrl}
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
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
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
 * sheet's own `max-w-xl` modal, not the screen). No Post button, no header;
 * the host owns submit. Compact is deliberately untouched by the Option B
 * header redesign (the redesign is `!compact` only) — this story exists so a
 * visual diff catches it if that guard ever slips.
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
 * three icons (image/GIF/emoji) instead of four — the two configs the footer
 * must render without overflow at every width, since design-system can't
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
 * button render — both only mount once `expanded && hasText`, which is the
 * footer configuration the width-variant stories below check: full-width
 * footer, media toolbar left, count + Post right, no overflow at any width in
 * either the free (3-icon) or Pro (4-icon) toolbar config.
 */
async function expandAndType(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByText(/Share your thoughts\.\.\./));
  const textbox = canvas.getByRole('textbox');
  await userEvent.click(textbox);
  await userEvent.type(textbox, text);
}

const FOOTER_PLAY_TEXT = 'Checking the footer layout';

// Footer width matrix (Option B, full-width footer): media toolbar sits at the
// left content edge, count + Post are pushed right with `ml-auto`, and the row
// must never overflow or overlap. Widths mirror the real production range:
// ~335-345px is the actual mobile composer width across platform host pages;
// ~430px and ~600px stand in for the narrower and wider ends of the desktop
// range. 320px is the classic smallest-supported-viewport floor, and the Pro
// (4-icon) config at ≤~340px is where the count+Post cluster wraps to its own
// line (still right-aligned via ml-auto).

export const FooterGap320Free = meta.story({
  name: 'Footer – 320px, free tier',
  render: () => (
    <div style={{ width: 320 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap320Pro = meta.story({
  name: 'Footer – 320px, Pro tier',
  render: () => (
    <div style={{ width: 320 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap375Free = meta.story({
  name: 'Footer – 375px, free tier',
  render: () => (
    <div style={{ width: 375 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap375Pro = meta.story({
  name: 'Footer – 375px, Pro tier',
  render: () => (
    <div style={{ width: 375 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap430Free = meta.story({
  name: 'Footer – 430px, free tier',
  render: () => (
    <div style={{ width: 430 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap430Pro = meta.story({
  name: 'Footer – 430px, Pro tier',
  render: () => (
    <div style={{ width: 430 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap600Free = meta.story({
  name: 'Footer – 600px, free tier',
  render: () => (
    <div style={{ width: 600 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});

export const FooterGap600Pro = meta.story({
  name: 'Footer – 600px, Pro tier',
  render: () => (
    <div style={{ width: 600 }}>
      <ThoughtComposer
        initials={DEMO_USER.initials}
        displayName={DEMO_USER.displayName}
        handle={DEMO_USER.handle}
        onSubmit={(text) => console.log('Submit:', text)}
        onImageClick={() => {}}
        onGifClick={() => {}}
        onEmojiClick={() => {}}
        composerActions={<ProComposerAction />}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expandAndType(canvasElement, FOOTER_PLAY_TEXT);
  },
});
