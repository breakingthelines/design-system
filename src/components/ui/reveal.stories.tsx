import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Reveal, RevealGroup, RevealItem, LoadingTransition } from './reveal';
import { Skeleton, SkeletonGroup } from './skeleton';

const meta: Meta = {
  title: 'UI/Reveal',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark max-w-xl bg-[#0d0d0d] p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

/* ── Single Reveal ── */

export const SingleReveal: Story = {
  name: 'Reveal',
  render: () => (
    <Reveal>
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-white">This element fades in with a Y offset.</p>
      </div>
    </Reveal>
  ),
};

/* ── RevealGroup + RevealItem stagger ── */

export const StaggeredList: Story = {
  name: 'RevealGroup + RevealItem',
  render: () => (
    <RevealGroup stagger={0.08} delay={0.15} className="space-y-3">
      {['First item', 'Second item', 'Third item', 'Fourth item', 'Fifth item'].map((text) => (
        <RevealItem key={text}>
          <div className="rounded border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm text-white">{text}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  ),
};

/* ── LoadingTransition toggle ── */

export const LoadingTransitionDemo: Story = {
  name: 'LoadingTransition',
  render: () => {
    const [loading, setLoading] = useState(true);

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setLoading(!loading)}
          className="rounded bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
        >
          Toggle: {loading ? 'Loading' : 'Loaded'}
        </button>

        <LoadingTransition
          isLoading={loading}
          skeleton={
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <SkeletonGroup lines={3} />
            </div>
          }
        >
          <RevealGroup stagger={0.06} className="space-y-4">
            <RevealItem>
              <div className="h-48 w-full rounded-lg bg-gradient-to-br from-red-500/20 to-red-900/20" />
            </RevealItem>
            <RevealItem>
              <p className="text-sm leading-relaxed text-white/80">
                This content replaces the skeleton with a smooth crossfade. The skeleton fades out
                in 150ms, then the content fades in over 200ms with staggered reveals.
              </p>
            </RevealItem>
            <RevealItem>
              <p className="text-sm leading-relaxed text-white/80">
                The asymmetric timing (fast out, normal in) makes the transition feel snappy rather
                than sluggish.
              </p>
            </RevealItem>
          </RevealGroup>
        </LoadingTransition>
      </div>
    );
  },
};
