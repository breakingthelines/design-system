import preview from '#.storybook/preview';
import { Label } from './label';
import { Input } from './input';

const meta = preview.meta({
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
});

export const Default = meta.story({
  args: {
    children: 'Label text',
  },
});

export const WithInput = meta.story({
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
  ),
});

export const WithCheckbox = meta.story({
  render: () => (
    <Label className="cursor-pointer">
      <input type="checkbox" id="terms" className="size-4" />
      Accept terms and conditions
    </Label>
  ),
});

export const Disabled = meta.story({
  render: () => (
    <div className="flex flex-col gap-2 w-64" data-disabled="true">
      <Label htmlFor="disabled-input">Disabled label</Label>
      <Input id="disabled-input" placeholder="Disabled input" disabled />
    </div>
  ),
});
