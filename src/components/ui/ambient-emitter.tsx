'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';

type EmitterPosition =
  | 'top'
  | 'center'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const positionMap: Record<EmitterPosition, string> = {
  top: '50% 15%',
  center: '50% 50%',
  bottom: '50% 85%',
  'top-left': '25% 20%',
  'top-right': '75% 20%',
  'bottom-left': '25% 80%',
  'bottom-right': '75% 80%',
};

interface AmbientEmitterProps extends React.ComponentProps<'div'> {
  /**
   * Opaque colour to emit — e.g. `"#B48228"` or `"rgb(180, 130, 40)"`.
   * Don't include alpha here; use `intensity` to control opacity.
   */
  color: string;
  /** Opacity 0-1, default 0.35 */
  intensity?: number;
  /** Blur radius in px, default 90 */
  blur?: number;
  /** Gradient focal point within the element, default 'center' */
  position?: EmitterPosition;
  /** Size multiplier — 1 = parent size, 1.5 = 150%, default 1.5 */
  scale?: number;
  /** Ellipse shape: 'wide' (120% × 80%), 'tall' (80% × 120%), 'round' (100% × 100%) */
  shape?: 'wide' | 'tall' | 'round';
  /**
   * When true, adds a slow 8s breathing animation that subtly pulses
   * the emitter's opacity. Gives the glow a living quality.
   */
  breathing?: boolean;
}

const shapeMap: Record<string, string> = {
  wide: '120% 80%',
  tall: '80% 120%',
  round: '100% 100%',
};

/**
 * Ambient colour emitter — a zero-interaction, GPU-composited glow blob.
 *
 * Place inside a `position: relative` parent. The emitter bleeds colour
 * behind sibling content via a large, blurred radial gradient.
 *
 * Expects **opaque** colours; control visibility via `intensity` (opacity).
 *
 * ```tsx
 * <div className="relative">
 *   <AmbientEmitter color="#B48228" intensity={0.35} position="top" breathing />
 *   <YourContent />
 * </div>
 * ```
 */
function AmbientEmitter({
  color,
  intensity = 0.35,
  blur = 90,
  position = 'center',
  scale = 1.5,
  shape = 'wide',
  breathing = false,
  className,
  style,
  ...props
}: AmbientEmitterProps) {
  const overflow = ((scale - 1) / 2) * 100;

  return (
    <div
      data-slot="ambient-emitter"
      aria-hidden
      className={cn(
        'pointer-events-none absolute',
        breathing && 'animate-[ambient-breathe_8s_ease-in-out_infinite]',
        className
      )}
      style={{
        inset: `-${overflow}%`,
        zIndex: -2,
        background: `radial-gradient(ellipse ${shapeMap[shape]} at ${positionMap[position]}, ${color} 0%, transparent 70%)`,
        opacity: intensity,
        filter: `blur(${blur}px)`,
        willChange: 'filter, opacity',
        ...style,
      }}
      {...props}
    />
  );
}

export { AmbientEmitter, type AmbientEmitterProps };
