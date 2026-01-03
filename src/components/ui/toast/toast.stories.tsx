import type { Meta, StoryObj } from '@storybook/react';
import { ArrowsClockwise, CloudArrowUp } from '@phosphor-icons/react';
import { ToastProvider } from './toast-context';
import { Toaster, type ToasterPosition } from './toaster';
import { useToast } from './use-toast';
import { Button } from '../button';

const meta: Meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <Toaster position="bottom-center" />
      </ToastProvider>
    ),
  ],
};

export default meta;

function ToastDemo() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast.success('Changes saved successfully')}>Success</Button>
      <Button onClick={() => toast.error('Failed to upload file')}>Error</Button>
      <Button onClick={() => toast.warning('Your session expires in 5 minutes')}>Warning</Button>
      <Button onClick={() => toast.info('New version available')}>Info</Button>
      <Button
        onClick={() =>
          toast.toast({
            variant: 'default',
            title: 'Scheduled',
            description: 'Your post will be published at 9:00 AM',
          })
        }
      >
        With Title
      </Button>
      <Button
        onClick={() =>
          toast.toast({
            variant: 'success',
            description: 'File uploaded',
            action: {
              label: 'View',
              onClick: () => console.log('View clicked'),
            },
          })
        }
      >
        With Action
      </Button>
      <Button
        onClick={() =>
          toast.custom({
            icon: <ArrowsClockwise weight="fill" className="size-5 text-cursor-sky" />,
            description: 'Your changes were merged with Sarah',
          })
        }
      >
        Custom Icon
      </Button>
    </div>
  );
}

export const Default: StoryObj = {
  render: () => <ToastDemo />,
};

function PositionDemo({ position }: { position: ToasterPosition }) {
  const toast = useToast();

  return (
    <Button variant="outline" size="sm" onClick={() => toast.info(`Toast at ${position}`)}>
      {position}
    </Button>
  );
}

export const Positions: StoryObj = {
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <Toaster position="top-left" />
        <Toaster position="top-center" />
        <Toaster position="top-right" />
        <Toaster position="bottom-left" />
        <Toaster position="bottom-center" />
        <Toaster position="bottom-right" />
      </ToastProvider>
    ),
  ],
  render: () => {
    const positions: ToasterPosition[] = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    return (
      <div className="grid grid-cols-3 gap-4">
        {positions.map((position) => (
          <PositionDemo key={position} position={position} />
        ))}
      </div>
    );
  },
};

export const CollaborationToasts: StoryObj = {
  render: () => {
    const toast = useToast();

    return (
      <div className="flex flex-col gap-4 items-center">
        <p className="text-muted-foreground text-sm">Common toasts for collaboration features</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => toast.warning('Connection lost - editing offline')}
          >
            Disconnected
          </Button>
          <Button variant="outline" onClick={() => toast.success('Reconnected - changes synced')}>
            Reconnected
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.custom({
                icon: <ArrowsClockwise weight="fill" className="size-5 text-cursor-sky" />,
                description: 'Your changes were merged with Sarah, Marcus',
              })
            }
          >
            Merged
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.custom({
                icon: <CloudArrowUp weight="fill" className="size-5 text-cursor-mint" />,
                description: 'Draft auto-saved',
              })
            }
          >
            Auto-saved
          </Button>
        </div>
      </div>
    );
  },
};
