import preview from '#.storybook/preview';

import { GatedAction } from './gated-action';

const meta = preview.meta({
  title: 'GameCentre/GatedAction',
  component: GatedAction,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['inline', 'sheet', 'overlay'],
    },
  },
});

function RateButton() {
  return (
    <button
      type="button"
      className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
      onClick={() => console.log('rate clicked')}
    >
      Rate this match
    </button>
  );
}

function InlineSignInCta() {
  return (
    <a
      href="/auth/sign-in"
      className="inline-flex items-center gap-1.5 text-sm text-red-100 hover:text-white"
    >
      Sign in to rate this match
    </a>
  );
}

export const Default = meta.story({
  name: 'Authed (children render)',
  args: {
    viewerAuthed: true,
    action: 'rate',
    children: <RateButton />,
  },
  render: (args) => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <GatedAction {...args} />
    </div>
  ),
});

export const Empty = meta.story({
  name: 'Anon (inline CTA)',
  args: {
    viewerAuthed: false,
    action: 'rate',
    mode: 'inline',
    signInCta: <InlineSignInCta />,
    children: <RateButton />,
  },
  render: (args) => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <GatedAction {...args} />
    </div>
  ),
});

export const Fallback = meta.story({
  name: 'Authed (role missing)',
  args: {
    viewerAuthed: true,
    requiresRoles: ['squad-member'],
    rolesSatisfied: false,
    action: 'rate',
    children: <RateButton />,
  },
  render: (args) => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <GatedAction {...args} />
    </div>
  ),
});

export const AnonOverlay = meta.story({
  name: 'Anon (overlay intercept)',
  args: {
    viewerAuthed: false,
    action: 'rate',
    mode: 'overlay',
    onRequireAuth: (action: string) => console.log('require auth for', action),
    children: <RateButton />,
  },
  render: (args) => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <GatedAction {...args} />
    </div>
  ),
});

export const AnonSheet = meta.story({
  name: 'Anon (sheet intercept)',
  args: {
    viewerAuthed: false,
    action: 'predict',
    mode: 'sheet',
    onRequireAuth: (action: string) => console.log('require auth for', action),
    children: <RateButton />,
  },
  render: (args) => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <GatedAction {...args} />
    </div>
  ),
});

export const Loading = meta.story({
  name: 'Loading (skeleton)',
  render: () => (
    <div className="w-[420px] rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="h-9 w-40 animate-pulse rounded bg-white/[0.06]" />
    </div>
  ),
});
