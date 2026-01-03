import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from './status-dot';

const meta: Meta<typeof StatusDot> = {
  title: 'Components/StatusDot',
  component: StatusDot,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
    pulse: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const Default: Story = {
  args: {
    variant: 'success',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusDot variant="success" />
      <StatusDot variant="warning" />
      <StatusDot variant="error" />
      <StatusDot variant="info" />
      <StatusDot variant="neutral" />
    </div>
  ),
};

export const Pulsing: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusDot variant="success" pulse />
      <StatusDot variant="warning" pulse />
      <StatusDot variant="error" pulse />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <StatusDot variant="success" size="sm" />
      <StatusDot variant="success" size="default" />
      <StatusDot variant="success" size="lg" />
    </div>
  ),
};
