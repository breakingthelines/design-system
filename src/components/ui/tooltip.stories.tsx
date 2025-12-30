import preview from '#.storybook/preview';
import { Plus, Info } from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Button } from './button';

const meta = preview.meta({
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
});

export const Default = meta.story({
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
      <TooltipContent>Tooltip content</TooltipContent>
    </Tooltip>
  ),
});

export const AllSides = meta.story({
  render: () => (
    <div className="flex gap-8 p-12">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Top</Button>} />
        <TooltipContent side="top">Top tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
        <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Left</Button>} />
        <TooltipContent side="left">Left tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Right</Button>} />
        <TooltipContent side="right">Right tooltip</TooltipContent>
      </Tooltip>
    </div>
  ),
});

export const WithIconButton = meta.story({
  render: () => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="outline" size="icon">
            <Plus />
          </Button>
        }
      />
      <TooltipContent>Add new item</TooltipContent>
    </Tooltip>
  ),
});

export const WithLongContent = meta.story({
  render: () => (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon">
            <Info />
          </Button>
        }
      />
      <TooltipContent>
        This is a longer tooltip that provides more detailed information about the element.
      </TooltipContent>
    </Tooltip>
  ),
});

export const AllAlignments = meta.story({
  render: () => (
    <div className="flex gap-8 p-8">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Start</Button>} />
        <TooltipContent align="start">Aligned to start</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Center</Button>} />
        <TooltipContent align="center">Aligned to center</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">End</Button>} />
        <TooltipContent align="end">Aligned to end</TooltipContent>
      </Tooltip>
    </div>
  ),
});
