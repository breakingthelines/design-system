import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, SkeletonGroup } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark max-w-xl space-y-8 bg-[#0d0d0d] p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

/* ── Variants ── */

export const Rect: Story = {
  render: () => <Skeleton className="h-40 w-full" />,
};

export const Circle: Story = {
  render: () => <Skeleton variant="circle" className="size-16" />,
};

export const Text: Story = {
  render: () => (
    <div className="space-y-2.5">
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" style={{ width: '60%' }} />
    </div>
  ),
};

/* ── SkeletonGroup ── */

export const Group: Story = {
  name: 'SkeletonGroup',
  render: () => <SkeletonGroup lines={4} lastLineWidth="45%" />,
};

/* ── Cascading Shimmer ── */

export const CascadingShimmer: Story = {
  name: 'Cascading Shimmer',
  render: () => (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{ animationDelay: `${i * 100}ms`, width: i === 4 ? '50%' : '100%' }}
        />
      ))}
    </div>
  ),
};

/* ── Composed: Thought Row ── */

export const ThoughtRow: Story = {
  name: 'Composed — Thought Row',
  render: () => (
    <div className="flex gap-3 py-5">
      <Skeleton variant="circle" className="size-12 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <SkeletonGroup lines={2} lastLineWidth="80%" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  ),
};

/* ── Composed: Content Card Grid ── */

export const ContentGrid: Story = {
  name: 'Composed — Content Card Grid',
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <Skeleton className="aspect-video w-full" style={{ animationDelay: `${i * 120}ms` }} />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-3/4" style={{ animationDelay: `${i * 120 + 60}ms` }} />
            <Skeleton className="h-3 w-1/2" style={{ animationDelay: `${i * 120 + 120}ms` }} />
          </div>
        </div>
      ))}
    </div>
  ),
};

/* ── Composed: Article Body ── */

export const ArticleBody: Story = {
  name: 'Composed — Article Body',
  render: () => {
    const paragraphs = [
      [100, 100, 100, 78],
      [100, 92, 100, 85],
      [100, 100, 97, 64],
      [100, 55],
    ];
    return (
      <div className="max-w-[644px] space-y-5">
        {paragraphs.map((lines, pi) => (
          <div key={pi} className="space-y-2.5">
            {lines.map((w, li) => (
              <Skeleton
                key={li}
                variant="text"
                style={{
                  width: `${w}%`,
                  animationDelay: `${(pi * 4 + li) * 80}ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  },
};
