'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import { StatusDot } from './status-dot';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

const connectionIndicatorVariants = cva('inline-flex items-center gap-2 text-xs', {
  variants: {
    size: {
      sm: 'text-[10px] gap-1.5',
      default: 'text-xs gap-2',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface ConnectionIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof connectionIndicatorVariants> {
  /** Current connection status */
  status: ConnectionStatus;
  /** Show text label alongside indicator */
  showLabel?: boolean;
  /** Custom labels for each status */
  labels?: Partial<Record<ConnectionStatus, string>>;
  /** Delay before showing connecting/reconnecting state (avoids flicker) */
  showDelay?: number;
}

const defaultLabels: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Offline',
  reconnecting: 'Reconnecting...',
};

const statusConfig: Record<
  ConnectionStatus,
  { variant: 'success' | 'warning' | 'error'; pulse: boolean; show: boolean }
> = {
  connected: { variant: 'success', pulse: false, show: false }, // Hide when connected
  connecting: { variant: 'warning', pulse: true, show: true },
  disconnected: { variant: 'error', pulse: false, show: true },
  reconnecting: { variant: 'warning', pulse: true, show: true },
};

function ConnectionIndicator({
  status,
  showLabel = true,
  labels,
  showDelay = 500,
  size,
  className,
  ...props
}: ConnectionIndicatorProps) {
  const [showIndicator, setShowIndicator] = React.useState(false);

  const mergedLabels = { ...defaultLabels, ...labels };
  const config = statusConfig[status];

  // Delay showing connecting/reconnecting to avoid flicker on fast connections
  React.useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      const timeout = setTimeout(() => setShowIndicator(true), showDelay);
      return () => clearTimeout(timeout);
    } else {
      setShowIndicator(config.show);
    }
  }, [status, showDelay, config.show]);

  // Don't render anything when connected (normal state)
  if (!showIndicator) return null;

  return (
    <div
      data-slot="connection-indicator"
      data-status={status}
      className={cn(connectionIndicatorVariants({ size }), className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <StatusDot
        variant={config.variant}
        pulse={config.pulse}
        size={size === 'sm' ? 'sm' : 'default'}
      />
      {showLabel && <span className="text-muted-foreground">{mergedLabels[status]}</span>}
    </div>
  );
}

export { ConnectionIndicator, connectionIndicatorVariants };
