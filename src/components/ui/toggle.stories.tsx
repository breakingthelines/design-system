import preview from '#.storybook/preview';
import { TextB, TextItalic, Moon, Sun } from '@phosphor-icons/react';
import { Toggle } from './toggle';

const meta = preview.meta({
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
});

export const Default = meta.story({
  render: () => (
    <Toggle>
      <TextB />
    </Toggle>
  ),
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default</p>
        <Toggle variant="default">
          <TextB />
        </Toggle>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Outline</p>
        <Toggle variant="outline">
          <TextB />
        </Toggle>
      </div>
    </div>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex items-end gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Small</p>
        <Toggle size="sm">
          <TextB />
        </Toggle>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Default</p>
        <Toggle size="default">
          <TextB />
        </Toggle>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Large</p>
        <Toggle size="lg">
          <TextB />
        </Toggle>
      </div>
    </div>
  ),
});

export const WithText = meta.story({
  render: () => (
    <div className="flex gap-4">
      <Toggle>
        <TextB /> Bold
      </Toggle>
      <Toggle>
        <TextItalic /> Italic
      </Toggle>
    </div>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="flex gap-4">
      <Toggle disabled>
        <TextB />
      </Toggle>
      <Toggle variant="outline" disabled>
        <TextItalic />
      </Toggle>
    </div>
  ),
});

export const Pressed = meta.story({
  render: () => (
    <div className="flex gap-4">
      <Toggle defaultPressed>
        <Sun /> Light
      </Toggle>
      <Toggle>
        <Moon /> Dark
      </Toggle>
    </div>
  ),
});
