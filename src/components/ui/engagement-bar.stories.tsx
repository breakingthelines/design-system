import preview from '#.storybook/preview';
import { EngagementBar, type EngagementAction } from './engagement-bar';

const meta = preview.meta({
  title: 'UI/EngagementBar',
  component: EngagementBar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'full'],
    },
  },
});

const defaultActions: EngagementAction[] = [
  { type: 'like', count: 3400 },
  { type: 'comment', count: 97 },
  { type: 'repost', count: 12 },
  { type: 'share' },
];

export const Compact = meta.story({
  args: {
    variant: 'compact',
    actions: defaultActions,
  },
});

export const Full = meta.story({
  args: {
    variant: 'full',
    actions: defaultActions,
  },
});

export const WithActiveStates = meta.story({
  name: 'Active States',
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Liked</p>
        <EngagementBar
          actions={[
            { type: 'like', count: 3401, active: true },
            { type: 'comment', count: 97 },
            { type: 'repost', count: 12 },
            { type: 'share' },
          ]}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Liked + Reposted</p>
        <EngagementBar
          actions={[
            { type: 'like', count: 3401, active: true },
            { type: 'comment', count: 97 },
            { type: 'repost', count: 13, active: true },
            { type: 'share' },
          ]}
        />
      </div>
    </div>
  ),
});

export const MinimalThought = meta.story({
  name: 'Thought Style (no share)',
  args: {
    variant: 'compact',
    actions: [
      { type: 'comment', count: 5 },
      { type: 'like', count: 3400 },
    ],
  },
});
