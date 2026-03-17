'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';

type EmitterSize = 'sm' | 'md' | 'lg';
type EmitterPosition = 'top' | 'center';

/**
 * Size presets control the image dimensions, blur, base opacity, and overlay.
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

interface ImageAdaptation {
  brightness: number;
  opacityMultiplier: number;
  saturation: number;
}

/**
 * Analyse image luminance via a 4×4 canvas (16 pixels — essentially free).
 * Returns adaptive CSS values: dark images get boosted brightness, opacity,
 * and saturation so the glow stays visible against dark backgrounds.
 * Bright images pass through unchanged.
 *
 * Runs once per `src` change. No extra network request (browser image cache).
 */
function useImageAdaptation(src?: string): ImageAdaptation {
  const [adaptation, setAdaptation] = React.useState<ImageAdaptation>({
    brightness: 1,
    opacityMultiplier: 1,
    saturation: 1,
  });

  React.useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 4;
        c.height = 4;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 4, 4);
        const data = ctx.getImageData(0, 0, 4, 4).data;
        // Average perceived luminance across 16 samples (ITU-R BT.601)
        let totalLum = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalLum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        }
        const lum = totalLum / 16;
        // darkness factor: 0 for bright images (lum ≥ 0.5), 1 for black
        const darkness = Math.max(0, 1 - lum * 2);
        setAdaptation({
          // Dark → 1.8x brightness, bright → 1.0x
          brightness: 1 + darkness * 0.8,
          // Dark → 1.5x opacity boost, bright → 1.0x
          opacityMultiplier: 1 + darkness * 0.5,
          // Dark → 1.4x saturation, bright → 1.0x
          saturation: 1 + darkness * 0.4,
        });
      } catch {
        // CORS or canvas taint — fall back to defaults
      }
    };
    img.src = src;
  }, [src]);

  return adaptation;
}

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
  /** Glow origin. `'top'` for detail pages, `'center'` for heroes/cards. Default `'top'`. */
  position?: EmitterPosition;
}

/**
 * Ambient emitter — GPU-composited glow that bleeds colour behind content.
 *
 * Place inside a `position: relative` parent. When `src` is provided, renders
 * a massively blurred copy of the image for a natural, content-aware glow.
 * Dark images are automatically boosted (brightness + opacity + saturation).
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
  position = 'top',
  className,
  ...props
}: AmbientEmitterProps) {
  const preset = sizePresets[size];
  const finalScale = scale ?? preset.scale;
  const { brightness, opacityMultiplier, saturation } = useImageAdaptation(src);
  const finalOpacity = Math.min(1, (opacity ?? preset.opacity) * opacityMultiplier);

  if (!src && !color) return null;

  if (src) {
    const isCenter = position === 'center';
    const filterChain = `blur(${preset.blur}px) brightness(${brightness}) saturate(${saturation})`;

    if (isCenter) {
      // Center mode — fills parent shape, adapts to any aspect ratio
      return (
        <div
          data-slot="ambient-emitter"
          aria-hidden
          className={cn('pointer-events-none absolute inset-0', className)}
          {...props}
        >
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: finalOpacity,
              filter: filterChain,
              transform: `scale(${finalScale})`,
            }}
          />
          <div className="absolute inset-0 bg-[rgba(8,8,8,0.05)] backdrop-blur-[10px]" />
        </div>
      );
    }

    // Top mode — fixed dimensions for page-level detail glows
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
          className="absolute top-0 left-1/2 object-cover"
          style={{
            width: preset.width,
            height: preset.height,
            opacity: finalOpacity,
            filter: filterChain,
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

export { AmbientEmitter, type AmbientEmitterProps, type EmitterSize, type EmitterPosition };
