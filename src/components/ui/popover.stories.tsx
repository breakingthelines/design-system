import preview from '#.storybook/preview';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const meta = preview.meta({
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open Popover</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Popover Title</PopoverTitle>
          <PopoverDescription>This is a description of the popover content.</PopoverDescription>
        </PopoverHeader>
        <p>Additional content can go here.</p>
      </PopoverContent>
    </Popover>
  ),
});

export const WithForm = meta.story({
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Update Dimensions</Button>} />
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="width">Width</Label>
            <Input id="width" defaultValue="100%" className="col-span-2" />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="height">Height</Label>
            <Input id="height" defaultValue="25px" className="col-span-2" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
});

export const AllSides = meta.story({
  render: () => (
    <div className="flex gap-8 p-16">
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Top</Button>} />
        <PopoverContent side="top">
          <PopoverHeader>
            <PopoverTitle>Top Popover</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Bottom</Button>} />
        <PopoverContent side="bottom">
          <PopoverHeader>
            <PopoverTitle>Bottom Popover</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Left</Button>} />
        <PopoverContent side="left">
          <PopoverHeader>
            <PopoverTitle>Left Popover</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Right</Button>} />
        <PopoverContent side="right">
          <PopoverHeader>
            <PopoverTitle>Right Popover</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
});

export const AllAlignments = meta.story({
  render: () => (
    <div className="flex gap-8 p-8">
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Start</Button>} />
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Aligned Start</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Center</Button>} />
        <PopoverContent align="center">
          <PopoverHeader>
            <PopoverTitle>Aligned Center</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger render={<Button variant="outline">End</Button>} />
        <PopoverContent align="end">
          <PopoverHeader>
            <PopoverTitle>Aligned End</PopoverTitle>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
});
