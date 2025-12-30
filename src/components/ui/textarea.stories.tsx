import preview from '#.storybook/preview';
import { Textarea } from './textarea';

const meta = preview.meta({
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: 'number' },
  },
});

export const Default = meta.story({
  args: {
    placeholder: 'Type your message here...',
  },
});

export const States = meta.story({
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Textarea placeholder="Default textarea" />
      <Textarea placeholder="With default value" defaultValue="Some existing text content" />
      <Textarea placeholder="Disabled textarea" disabled />
      <Textarea placeholder="Invalid textarea" aria-invalid />
    </div>
  ),
});

export const WithRows = meta.story({
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <Textarea placeholder="3 rows" rows={3} />
      <Textarea placeholder="6 rows" rows={6} />
      <Textarea placeholder="10 rows" rows={10} />
    </div>
  ),
});

export const AutoResize = meta.story({
  render: () => (
    <div className="w-80">
      <Textarea
        placeholder="This textarea uses field-sizing-content for auto-resize. Type more text to see it grow."
        className="min-h-16"
      />
    </div>
  ),
});
