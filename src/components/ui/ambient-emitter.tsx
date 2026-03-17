'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';

type EmitterSize = 'sm' | 'md' | 'lg';

/**
 * Size presets control the image dimensions, blur, opacity, and overlay.
 * - sm: Subtle glow for heroes and banners
 * - md: Default — balanced for most contexts
 * - lg: Full detail-page glow (video/podcast detail)
 */
const sizePresets: Record<
  EmitterSize,
  { width: number; height: number; blur: number; opacity: number; scale: number; overlayHeight: number }
> = {
  sm: { width: 600, height: 400, blur: 80, opacity: 0.25, scale: 1, overlayHeight: 500 },
  md: { width: 700, height: 500, blur: 90, opacity: 0.32, scale: 1.15, overlayHeight: 650 },
  lg: { width: 789, height: 588, blur: 100, opacity: 0.4, scale: 1.3, overlayHeight: 800 },
};

interface AmbientEmitterProps extends React.ComponentProps<'div'> {
  /** Image URL to sample colours from. Preferred — creates a natural, content-aware glow. */
  src?: string;
  /**
   * Fallback colour when no image is available — e.g. `"#B48228"`.
   * Rendered as a radial gradient. Ignored when `src` is provided.
   */
  color?: string;
  /** Glow intensity preset. Default `'md'`. */
  size?: EmitterSize;
  /** Override preset opacity (0–1). Useful for fine-tuning per context. */
  opacity?: number;
  /** Override preset scale multiplier. */
  scale?: number;
}

/**
 * Ambient emitter — GPU-composited glow that bleeds colour behind content.
 *
 * Place inside a `position: relative` parent. When `src` is provided, renders
 * a massively blurred copy of the image for a natural, content-aware glow.
 * Falls back to a radial-gradient colour blob when only `color` is given.
 *
 * ```tsx
 * <div className="relative">
 *   <AmbientEmitter src={thumbnailUrl} size="lg" />
 *   <YourContent />
 * </div>
 * ```
 */
function AmbientEmitter({
  src,
  color,
  size = 'md',
  opacity,
  scale,
  className,
  ...props
}: AmbientEmitterProps) {
  const preset = sizePresets[size];
  const finalOpacity = opacity ?? preset.opacity;
  const finalScale = scale ?? preset.scale;

  if (!src && !color) return null;

  if (src) {
    return (
      <div
        data-slot="ambient-emitter"
        aria-hidden
        className={cn('pointer-events-none absolute inset-x-0 top-0', className)}
        {...props}
      >
        <img
          src={src}
          alt=""
          className="absolute top-0 left-1/2 -translate-x-[40%] object-cover"
          style={{
            width: preset.width,
            height: preset.height,
            opacity: finalOpacity,
            filter: `blur(${preset.blur}px)`,
            transform: `translateX(-40%) scale(${finalScale})`,
          }}
        />
        <div
          className="absolute inset-x-0 top-0 bg-[rgba(8,8,8,0.05)] backdrop-blur-[10px]"
          style={{ height: preset.overlayHeight }}
        />
      </div>
    );
  }

  // Colour fallback — subtle radial gradient
  return (
    <div
      data-slot="ambient-emitter"
      aria-hidden
      className={cn('pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10', className)}
      style={{
        background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${color} 0%, transparent 70%)`,
        opacity: finalOpacity,
        filter: `blur(${preset.blur}px)`,
      }}
      {...props}
    />
  );
}

export { AmbientEmitter, type AmbientEmitterProps, type EmitterSize };
