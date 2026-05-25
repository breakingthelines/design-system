import preview from '#.storybook/preview';

import { ExternalMediaPicker } from './external-media-picker';

const meta = preview.meta({
  title: 'UI/ExternalMediaPicker',
  component: ExternalMediaPicker,
  tags: ['autodocs'],
});

export const Idle = meta.story({
  name: 'Idle (no preview)',
  render: () => (
    <div className="w-[640px]">
      <ExternalMediaPicker
        kind="publisher_url"
        url=""
        resolveCta={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Resolve
          </button>
        }
      />
    </div>
  ),
});

export const Video = meta.story({
  name: 'Video kind',
  render: () => (
    <div className="w-[640px]">
      <ExternalMediaPicker
        kind="video"
        url="https://www.youtube.com/watch?v=abc123"
        resolveCta={
          <button
            type="button"
            className="h-9 rounded bg-[var(--color-red-100)] px-3 text-sm font-semibold text-white"
          >
            Resolve
          </button>
        }
      />
    </div>
  ),
});

export const Resolved = meta.story({
  name: 'Resolved preview',
  render: () => (
    <div className="w-[640px]">
      <ExternalMediaPicker
        kind="podcast"
        url="https://open.spotify.com/episode/abc123"
        previewNode={
          <div className="rounded border border-white/[0.12] bg-white/[0.04] p-3 text-sm text-white">
            <p className="font-semibold">Episode 42 — Rebuilding from the back</p>
            <p className="text-white/60">
              A 48-minute conversation about Arsenal's defensive shape.
            </p>
          </div>
        }
      />
    </div>
  ),
});

export const Error = meta.story({
  name: 'Error (FallbackState wired by caller)',
  render: () => (
    <div className="w-[640px]">
      <ExternalMediaPicker
        kind="publisher_url"
        url="https://example.com/article"
        errorNode={
          <div className="rounded border border-white/[0.12] bg-white/[0.04] p-3 text-sm text-white">
            <p className="font-semibold">Couldn&apos;t resolve URL</p>
            <p className="text-white/60">The publisher didn&apos;t return any preview metadata.</p>
          </div>
        }
      />
    </div>
  ),
});
