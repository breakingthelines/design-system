'use client';

import * as React from 'react';
import { cn } from '#/lib/utils';

type EmitterSize = 'sm' | 'md' | 'lg';
type EmitterPosition = 'top' | 'center';

const sizePresets: Record<
  EmitterSize,
  { width: number; height: number; blur: number; opacity: number; scale: number; overlayHeight: number }
> = {
  sm: { width: 600, height: 400, blur: 80, opacity: 0.25, scale: 1, overlayHeight: 500 },
  md: { width: 700, height: 500, blur: 90, opacity: 0.32, scale: 1.15, overlayHeight: 650 },
  lg: { width: 789, height: 588, blur: 100, opacity: 0.4, scale: 1.3, overlayHeight: 800 },
};

/* -------------------------------------------------------------------------- */
/*  Image analysis — luminance adaptation + dominant colour extraction         */
/* -------------------------------------------------------------------------- */

interface ImageAnalysis {
  brightness: number;
  opacityMultiplier: number;
  saturation: number;
  /** Dominant colour as "R, G, B" string for use in rgba(). */
  dominantColor: string;
}

const DEFAULT_ANALYSIS: ImageAnalysis = {
  brightness: 1,
  opacityMultiplier: 1,
  saturation: 1,
  dominantColor: '128, 128, 128',
};

/** Module-level cache — survives remounts, shared across all emitters. */
const analysisCache = new Map<string, ImageAnalysis>();

/**
 * Analyse a 4×4 canvas (16 pixels) for luminance + dominant colour.
 *
 * - **Luminance** → adaptive brightness / opacity / saturation boost for dark images
 * - **Dominant colour** → gradient base layer in center mode (guarantees glow visibility
 *   even when the blurred image edge is too faint against a dark background)
 *
 * Results are cached by URL. Cached values initialise synchronously (no flash).
 * Fresh URLs compute asynchronously; CSS transitions smooth the visual change.
 */
function useImageAnalysis(src?: string): ImageAnalysis {
  const [analysis, setAnalysis] = React.useState<ImageAnalysis>(() => {
    if (src) return analysisCache.get(src) ?? DEFAULT_ANALYSIS;
    return DEFAULT_ANALYSIS;
  });

  React.useEffect(() => {
    if (!src) return;

    // Cache hit — apply synchronously (covers src changes after mount)
    const cached = analysisCache.get(src);
    if (cached) {
      setAnalysis(cached);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const c = document.createElement('canvas');
        c.width = 4;
        c.height = 4;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 4, 4);
        const data = ctx.getImageData(0, 0, 4, 4).data;

        let totalLum = 0;
        let rSum = 0, gSum = 0, bSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          totalLum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        }

        const lum = totalLum / 16;
        // darkness: 0 for bright (lum ≥ 0.5), 1 for black
        const darkness = Math.max(0, 1 - lum * 2);

        // Dominant colour — average RGB boosted away from gray for vibrancy
        const avgR = rSum / 16, avgG = gSum / 16, avgB = bSum / 16;
        const gray = (avgR + avgG + avgB) / 3;
        const colorBoost = 1.4; // push colours away from neutral
        const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));

        const result: ImageAnalysis = {
          brightness: 1 + darkness * 0.8,
          opacityMultiplier: 1 + darkness * 0.5,
          saturation: 1 + darkness * 0.4,
          dominantColor: `${clamp(gray + (avgR - gray) * colorBoost)}, ${clamp(gray + (avgG - gray) * colorBoost)}, ${clamp(gray + (avgB - gray) * colorBoost)}`,
        };

        analysisCache.set(src, result);
        if (!cancelled) setAnalysis(result);
      } catch {
        // CORS or canvas taint — defaults remain
      }
    };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);

  return analysis;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

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

/** Shared CSS transition — smooths filter/opacity/background changes between images. */
const TRANSITION = 'filter 0.6s ease-out, opacity 0.6s ease-out, background 0.6s ease-out, transform 0.6s ease-out';

/**
 * Ambient emitter — GPU-composited glow that bleeds colour behind content.
 *
 * Place inside a `position: relative` parent. When `src` is provided, renders
 * a massively blurred copy of the image for a natural, content-aware glow.
 * Dark images are automatically boosted (brightness + opacity + saturation).
 *
 * **Center mode** renders two layers:
 * 1. A radial gradient using the image's dominant colour (guarantees minimum
 *    glow visibility even when a full-bleed card covers the blurred image)
 * 2. The blurred image itself (adds natural colour variation)
 *
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
  const { brightness, opacityMultiplier, saturation, dominantColor } = useImageAnalysis(src);
  const finalOpacity = Math.min(1, (opacity ?? preset.opacity) * opacityMultiplier);

  // Fade in from opacity 0 on mount so the blurred image doesn't flash bright
  // before the GPU composites the filter chain. Also suppress transitions on
  // src changes to avoid bloom/flicker on image swap.
  const [mounted, setMounted] = React.useState(false);
  const [transitionEnabled, setTransitionEnabled] = React.useState(true);
  const prevSrcRef = React.useRef(src);

  React.useEffect(() => {
    // Delay mount fade-in by two frames so filter is composited before opacity rises
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  React.useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      setTransitionEnabled(false);
      setMounted(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setMounted(true);
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [src]);
  const transition = transitionEnabled ? TRANSITION : 'none';
  const mountedOpacity = mounted ? finalOpacity : 0;

  if (!src && !color) return null;

  if (src) {
    const isCenter = position === 'center';
    const filterChain = `blur(${preset.blur}px) brightness(${brightness}) saturate(${saturation})`;

    if (isCenter) {
      // Center mode — dual layer: gradient base + blurred image
      return (
        <div
          data-slot="ambient-emitter"
          aria-hidden
          className={cn('pointer-events-none absolute inset-0', className)}
          {...props}
        >
          {/* Layer 1: Gradient base — dominant colour, always vivid, extends beyond via scale */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 55% at 50% 50%, rgba(${dominantColor}, ${Math.min(1, mountedOpacity * 1.2)}) 0%, transparent 70%)`,
              filter: `blur(${Math.round(preset.blur * 0.7)}px) saturate(1.5) brightness(${brightness})`,
              transform: `scale(${finalScale * 1.3})`,
              transition,
            }}
          />
          {/* Layer 2: Blurred image — organic colour variation on top */}
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity: mountedOpacity,
              filter: filterChain,
              transform: `scale(${finalScale})`,
              transition,
            }}
          />
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
            opacity: mountedOpacity,
            filter: filterChain,
            transform: `translateX(-40%) scale(${finalScale})`,
            transition: TRANSITION,
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
        opacity: mountedOpacity,
        filter: `blur(${preset.blur}px)`,
        transition: TRANSITION,
      }}
      {...props}
    />
  );
}

export { AmbientEmitter, useImageAnalysis, type AmbientEmitterProps, type ImageAnalysis, type EmitterSize, type EmitterPosition };
