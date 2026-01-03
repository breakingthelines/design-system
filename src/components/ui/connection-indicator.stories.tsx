import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { ConnectionIndicator, type ConnectionStatus } from './connection-indicator';
import { Button } from './button';

const meta: Meta<typeof ConnectionIndicator> = {
  title: 'Components/ConnectionIndicator',
  component: ConnectionIndicator,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionIndicator>;

export const Connected: Story = {
  args: {
    status: 'connected',
  },
  render: (args) => (
    <div className="text-muted-foreground text-sm">
      <ConnectionIndicator {...args} />
      <p className="mt-4">(Nothing shown when connected - this is intentional)</p>
    </div>
  ),
};

export const Connecting: Story = {
  args: {
    status: 'connecting',
    showDelay: 0, // Disable delay for demo
  },
};

export const Disconnected: Story = {
  args: {
    status: 'disconnected',
  },
};

export const Reconnecting: Story = {
  args: {
    status: 'reconnecting',
    showDelay: 0,
  },
};

export const WithoutLabel: Story = {
  args: {
    status: 'disconnected',
    showLabel: false,
  },
};

export const CustomLabels: Story = {
  args: {
    status: 'disconnected',
    labels: {
      disconnected: 'Connection lost',
      reconnecting: 'Attempting to reconnect...',
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [status, setStatus] = useState<ConnectionStatus>('connected');

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setStatus('connected')}>
            Connected
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStatus('connecting')}>
            Connecting
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStatus('disconnected')}>
            Disconnected
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStatus('reconnecting')}>
            Reconnecting
          </Button>
        </div>

        <div className="h-8 flex items-center">
          <ConnectionIndicator status={status} showDelay={0} />
        </div>
      </div>
    );
  },
};

export const SimulatedConnection: Story = {
  render: () => {
    const [status, setStatus] = useState<ConnectionStatus>('connecting');

    useEffect(() => {
      // Simulate connection lifecycle
      const timers = [
        setTimeout(() => setStatus('connected'), 1500),
        setTimeout(() => setStatus('disconnected'), 4000),
        setTimeout(() => setStatus('reconnecting'), 5000),
        setTimeout(() => setStatus('connected'), 7000),
      ];

      return () => timers.forEach(clearTimeout);
    }, []);

    return (
      <div className="flex flex-col items-center gap-4">
        <ConnectionIndicator status={status} showDelay={300} />
        <p className="text-muted-foreground text-xs">Watch the connection lifecycle simulation</p>
      </div>
    );
  },
};
