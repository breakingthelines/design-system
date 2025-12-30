import preview from '#.storybook/preview';
import {
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextB,
  TextItalic,
  TextUnderline,
} from '@phosphor-icons/react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta = preview.meta({
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
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
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
});

export const Default = meta.story({
  render: () => (
    <ToggleGroup type="single" defaultValue="center">
      <ToggleGroupItem value="left">
        <TextAlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <TextAlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <TextAlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

export const Multiple = meta.story({
  render: () => (
    <ToggleGroup type="multiple" defaultValue={['bold']}>
      <ToggleGroupItem value="bold">
        <TextB />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic">
        <TextItalic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline">
        <TextUnderline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default</p>
        <ToggleGroup type="single" variant="default" defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Outline</p>
        <ToggleGroup type="single" variant="outline" defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Small</p>
        <ToggleGroup type="single" size="sm" defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Default</p>
        <ToggleGroup type="single" size="default" defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Large</p>
        <ToggleGroup type="single" size="lg" defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
});

export const Vertical = meta.story({
  render: () => (
    <ToggleGroup type="single" orientation="vertical" defaultValue="center">
      <ToggleGroupItem value="left">
        <TextAlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <TextAlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <TextAlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
});

export const WithSpacing = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">No spacing (connected)</p>
        <ToggleGroup type="single" variant="outline" spacing={0} defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">With spacing</p>
        <ToggleGroup type="single" variant="outline" spacing={1} defaultValue="center">
          <ToggleGroupItem value="left">
            <TextAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center">
            <TextAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right">
            <TextAlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  ),
});

export const WithText = meta.story({
  render: () => (
    <ToggleGroup type="single" defaultValue="day">
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  ),
});
