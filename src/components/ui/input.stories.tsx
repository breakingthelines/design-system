import preview from '#.storybook/preview';
import { Input } from './input';

const meta = preview.meta({
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
});

export const Default = meta.story({
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
});

export const AllTypes = meta.story({
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="tel" placeholder="Phone input" />
      <Input type="url" placeholder="URL input" />
    </div>
  ),
});

export const States = meta.story({
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <Input placeholder="Default" />
      <Input placeholder="With value" defaultValue="Some text" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Invalid" aria-invalid />
    </div>
  ),
});

export const WithFile = meta.story({
  render: () => (
    <div className="w-64">
      <Input type="file" />
    </div>
  ),
});
