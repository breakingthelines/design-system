import preview from '#.storybook/preview';
import { Heart, Plus } from '@phosphor-icons/react';
import { Button } from './button';

const meta = preview.meta({
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
  },
});

export const Default = meta.story({
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
});

export const IconSizes = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="icon-xs">
        <Plus />
      </Button>
      <Button size="icon-sm">
        <Plus />
      </Button>
      <Button size="icon">
        <Plus />
      </Button>
      <Button size="icon-lg">
        <Plus />
      </Button>
    </div>
  ),
});

export const WithIcon = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button>
        <Plus /> Add Item
      </Button>
      <Button variant="outline">
        <Heart /> Like
      </Button>
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button disabled>Default</Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
    </div>
  ),
});
