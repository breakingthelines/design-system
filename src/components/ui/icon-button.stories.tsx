import preview from '#.storybook/preview'
import {
  CaretLeft,
  Plus,
  Heart,
  DotsThree,
  PencilSimple,
} from '@phosphor-icons/react'
import { IconButton } from './icon-button'

const meta = preview.meta({
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['ghost', 'outline', 'solid'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
})

export const Default = meta.story({
  render: () => (
    <IconButton aria-label="Add item" variant="ghost" size="md">
      <Plus weight="bold" />
    </IconButton>
  ),
})

export const Ghost = meta.story({
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton aria-label="Go back" variant="ghost" size="sm">
        <CaretLeft weight="bold" />
      </IconButton>
      <IconButton aria-label="Add item" variant="ghost" size="md">
        <Plus weight="bold" />
      </IconButton>
      <IconButton aria-label="Edit" variant="ghost" size="lg">
        <PencilSimple weight="bold" />
      </IconButton>
      <IconButton aria-label="More options" variant="ghost" size="xl">
        <DotsThree weight="bold" />
      </IconButton>
    </div>
  ),
})

export const Outline = meta.story({
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton aria-label="Go back" variant="outline" size="sm">
        <CaretLeft weight="bold" />
      </IconButton>
      <IconButton aria-label="Add item" variant="outline" size="md">
        <Plus weight="bold" />
      </IconButton>
      <IconButton aria-label="Edit" variant="outline" size="lg">
        <PencilSimple weight="bold" />
      </IconButton>
      <IconButton aria-label="More options" variant="outline" size="xl">
        <DotsThree weight="bold" />
      </IconButton>
    </div>
  ),
})

export const Solid = meta.story({
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton aria-label="Like" variant="solid" size="sm">
        <Heart weight="bold" />
      </IconButton>
      <IconButton aria-label="Like" variant="solid" size="md">
        <Heart weight="bold" />
      </IconButton>
      <IconButton aria-label="Like" variant="solid" size="lg">
        <Heart weight="bold" />
      </IconButton>
      <IconButton aria-label="Like" variant="solid" size="xl">
        <Heart weight="bold" />
      </IconButton>
    </div>
  ),
})

export const AllSizes = meta.story({
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <IconButton aria-label="Small" variant="ghost" size="sm">
          <Plus weight="bold" />
        </IconButton>
        <span className="text-white/50 text-xs">sm (18px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton aria-label="Medium" variant="ghost" size="md">
          <Plus weight="bold" />
        </IconButton>
        <span className="text-white/50 text-xs">md (24px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton aria-label="Large" variant="ghost" size="lg">
          <Plus weight="bold" />
        </IconButton>
        <span className="text-white/50 text-xs">lg (32px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconButton aria-label="Extra large" variant="ghost" size="xl">
          <Plus weight="bold" />
        </IconButton>
        <span className="text-white/50 text-xs">xl (40px)</span>
      </div>
    </div>
  ),
})

export const GoBackButton = meta.story({
  name: 'Go Back (from Figma)',
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton aria-label="Go back" variant="ghost" size="sm">
        <CaretLeft weight="bold" />
      </IconButton>
      <span className="text-white text-sm font-bold">Go back</span>
    </div>
  ),
})

export const EditorPlusButton = meta.story({
  name: 'Editor Plus (from Figma)',
  render: () => (
    <IconButton aria-label="Add block" variant="ghost" size="lg">
      <Plus weight="regular" />
    </IconButton>
  ),
})

export const Disabled = meta.story({
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton aria-label="Disabled ghost" variant="ghost" size="md" disabled>
        <Plus weight="bold" />
      </IconButton>
      <IconButton aria-label="Disabled outline" variant="outline" size="md" disabled>
        <Plus weight="bold" />
      </IconButton>
      <IconButton aria-label="Disabled solid" variant="solid" size="md" disabled>
        <Plus weight="bold" />
      </IconButton>
    </div>
  ),
})
