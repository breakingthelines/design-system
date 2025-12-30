import preview from '#.storybook/preview';
import { Separator } from './separator';

const meta = preview.meta({
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
});

export const Default = meta.story({
  args: {
    orientation: 'horizontal',
  },
  render: (args) => (
    <div className="w-64">
      <Separator {...args} />
    </div>
  ),
});

export const AllOrientations = meta.story({
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <p className="text-sm font-medium">Horizontal</p>
        <div className="w-64">
          <p className="text-sm">Content above</p>
          <Separator orientation="horizontal" className="my-4" />
          <p className="text-sm">Content below</p>
        </div>
      </div>
      <div className="space-y-4">
        <p className="text-sm font-medium">Vertical</p>
        <div className="flex h-8 items-center gap-4">
          <span className="text-sm">Left</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Middle</span>
          <Separator orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </div>
    </div>
  ),
});

export const InNavigation = meta.story({
  render: () => (
    <div className="flex h-8 items-center gap-4 text-sm">
      <a href="#" className="hover:underline">
        Home
      </a>
      <Separator orientation="vertical" />
      <a href="#" className="hover:underline">
        About
      </a>
      <Separator orientation="vertical" />
      <a href="#" className="hover:underline">
        Contact
      </a>
    </div>
  ),
});
