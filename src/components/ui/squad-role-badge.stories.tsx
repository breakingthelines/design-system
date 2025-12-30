import preview from '#.storybook/preview';
import { SquadRoleBadge } from './squad-role-badge';

const meta = preview.meta({
  title: 'UI/SquadRoleBadge',
  component: SquadRoleBadge,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default'],
    },
    role: {
      control: 'text',
    },
  },
});

export const Default = meta.story({
  args: {
    role: 'editor',
    size: 'default',
  },
});

export const AllRoles = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-3">
      <SquadRoleBadge role="captain" />
      <SquadRoleBadge role="editor" />
      <SquadRoleBadge role="viewer" />
    </div>
  ),
});

export const SmallSize = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <SquadRoleBadge role="captain" size="sm" />
      <SquadRoleBadge role="editor" size="sm" />
      <SquadRoleBadge role="viewer" size="sm" />
    </div>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Small</p>
        <div className="flex gap-2">
          <SquadRoleBadge role="captain" size="sm" />
          <SquadRoleBadge role="editor" size="sm" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Default</p>
        <div className="flex gap-2">
          <SquadRoleBadge role="captain" size="default" />
          <SquadRoleBadge role="editor" size="default" />
        </div>
      </div>
    </div>
  ),
});

export const CustomRole = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-3">
      <SquadRoleBadge role="moderator" />
      <SquadRoleBadge role="admin" />
      <SquadRoleBadge role="guest" />
    </div>
  ),
});

export const InContext = meta.story({
  name: 'In Dark Context',
  render: () => (
    <div className="rounded-lg bg-grey-100 p-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-grey-300" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-white">John Smith</span>
          <SquadRoleBadge role="editor" size="sm" />
        </div>
      </div>
    </div>
  ),
});
