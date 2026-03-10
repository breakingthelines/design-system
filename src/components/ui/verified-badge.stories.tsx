import preview from '#.storybook/preview';
import { VerifiedBadge } from './verified-badge';

const meta = preview.meta({
  title: 'UI/VerifiedBadge',
  component: VerifiedBadge,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default'],
    },
  },
});

export const Default = meta.story({
  args: {
    size: 'default',
  },
});

export const Sizes = meta.story({
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <VerifiedBadge size="sm" />
        <span className="text-xs text-muted-foreground">sm (12px)</span>
      </div>
      <div className="flex items-center gap-2">
        <VerifiedBadge size="default" />
        <span className="text-xs text-muted-foreground">default (16px)</span>
      </div>
    </div>
  ),
});

export const InlineWithName = meta.story({
  name: 'Inline with Username',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-foreground">Zach Lowy</span>
        <VerifiedBadge size="sm" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-semibold text-foreground">Zach Lowy</span>
        <VerifiedBadge />
      </div>
    </div>
  ),
});
