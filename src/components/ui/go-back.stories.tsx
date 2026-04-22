import preview from '#.storybook/preview';
import { GoBack } from './go-back';

const meta = preview.meta({
  title: 'UI/GoBack',
  component: GoBack,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'subtle'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    animated: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
});

export const Default = meta.story({
  args: {
    onClick: () => console.log('go back'),
  },
});

export const CustomLabel = meta.story({
  args: {
    label: 'Back to drafts',
    onClick: () => console.log('go back'),
  },
});

export const Subtle = meta.story({
  args: {
    variant: 'subtle',
    onClick: () => console.log('go back'),
  },
});

export const Small = meta.story({
  args: {
    size: 'sm',
    onClick: () => console.log('go back'),
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <span className="font-display text-xs text-white/50 w-20">default md</span>
        <GoBack onClick={() => {}} />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-display text-xs text-white/50 w-20">default sm</span>
        <GoBack size="sm" onClick={() => {}} />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-display text-xs text-white/50 w-20">subtle md</span>
        <GoBack variant="subtle" onClick={() => {}} />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-display text-xs text-white/50 w-20">custom</span>
        <GoBack label="Back to drafts" onClick={() => {}} />
      </div>
      <div className="flex items-center gap-4">
        <span className="font-display text-xs text-white/50 w-20">disabled</span>
        <GoBack disabled onClick={() => {}} />
      </div>
    </div>
  ),
});
