'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

import { BtlPlaceholder } from '#/components/ui/btl-placeholder';
import {
  isContainBleedPresentation,
  resolveContainedImageFrame,
  resolveImagePresentation,
  type ContainedImageFrame,
} from '#/lib/image-presentation';
import { cn } from '#/lib/utils';
import { extractYtVideoId, nextYtResolution, safeYtThumbnail } from '#/lib/yt-thumb';
import { skeletonVariants } from './skeleton';
import type { ImagePresentation } from '#/types/content';

/* ─────────────────────────────────────────────────────────────────────────────
 * Image — design-system image with shimmer loading and lazy viewport loading.
 *
 * Renders a shimmer placeholder (matching the Skeleton component) while the
 * image loads, then cross-fades to the real image. Uses IntersectionObserver
 * for lazy loading below-the-fold images.
 *
 * YouTube thumbnails are automatically validated via the oEmbed API. If the
 * video is deleted or private (404), the fallback placeholder is shown instead
 * of YouTube's grey "unavailable" image.
 *
 * Drop-in replacement for <img> — accepts the same props.
 * ───────────────────────────────────────────────────────────────────────────── */

type Loading = 'lazy' | 'eager';

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  /** 'lazy' (default) defers loading until the image is near the viewport.
   *  'eager' loads immediately (use for above-the-fold hero images). */
  loading?: Loading;
  /** Distance from viewport edge to start loading (IntersectionObserver rootMargin).
   *  Defaults to '200px' so images start loading slightly before scrolling into view. */
  rootMargin?: string;
  /** Duration of the cross-fade in ms. Defaults to 300. Set to 0 to disable. */
  fadeDuration?: number;
  /** Extra classes applied to the inner <img> element (e.g. hover transitions). */
  imgClassName?: string;
  /** Callback when the image finishes loading. */
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  /** Callback on load error. */
  onError?: React.ReactEventHandler<HTMLImageElement>;
  /** Placeholder shown when the image is missing or fails to load. */
  fallback?: React.ReactNode;
  /** Optional smart featured-image presentation controls. */
  presentation?: ImagePresentation;
}

/* ── YouTube thumbnail validation ──────────────────────────────────────────── */

/** Cache oEmbed results globally so each video ID is checked at most once. */
const ytCache = new Map<string, boolean>();

const CONTAIN_EDGE_MASKS: Record<'x' | 'y', string> = {
  x: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.68) 3%, #000 8%, #000 92%, rgba(0,0,0,0.68) 97%, transparent 100%)',
  y: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.68) 3%, #000 8%, #000 92%, rgba(0,0,0,0.68) 97%, transparent 100%)',
};

async function checkYtAvailability(videoId: string): Promise<boolean> {
  const cached = ytCache.get(videoId);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    );
    // 200 = public + embeddable, 401 = exists but restricted — both have valid thumbnails.
    // 404 = deleted or private — thumbnail is the grey "unavailable" placeholder.
    const available = res.status !== 404;
    ytCache.set(videoId, available);
    return available;
  } catch {
    // Network error — assume available to avoid false negatives.
    ytCache.set(videoId, true);
    return true;
  }
}

/* ── Component ─────────────────────────────────────────────────────────────── */

function Image({
  src,
  alt = '',
  loading = 'lazy',
  rootMargin = '200px',
  fadeDuration = 300,
  imgClassName,
  className,
  style,
  onLoad,
  onError,
  fallback,
  presentation,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === 'eager');
  const [errored, setErrored] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const prevSrcRef = useRef(src);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containFrame, setContainFrame] = useState<ContainedImageFrame | null>(null);

  const normalizedSrc = typeof src === 'string' ? src.trim() : src;
  const hasSource = typeof normalizedSrc === 'string' ? normalizedSrc.length > 0 : !!normalizedSrc;
  const containBleed = isContainBleedPresentation(presentation);
  const imagePresentation = resolveImagePresentation(presentation, {
    containForeground: containBleed,
  });
  const imageSource = resolvedSrc ?? normalizedSrc;
  const imgStyle: React.CSSProperties | undefined =
    imagePresentation || fadeDuration > 0
      ? {
          objectFit: imagePresentation?.objectFit,
          objectPosition: imagePresentation?.objectPosition,
          transform: imagePresentation?.transform,
          transformOrigin: imagePresentation?.transformOrigin,
          transitionDuration: fadeDuration > 0 ? `${fadeDuration}ms` : undefined,
        }
      : undefined;
  const bleedStyle: React.CSSProperties | undefined = imagePresentation
    ? {
        objectFit: 'cover',
        objectPosition: imagePresentation.objectPosition,
        transform: imagePresentation.transform ?? 'scale(1.08)',
        transformOrigin: imagePresentation.transformOrigin,
      }
    : undefined;
  const containObjectPosition = imagePresentation?.objectPosition ?? '50% 50%';
  const edgeMask = containFrame?.edgeFadeAxis
    ? CONTAIN_EDGE_MASKS[containFrame.edgeFadeAxis]
    : undefined;
  const containFrameStyle: React.CSSProperties | undefined = containBleed
    ? containFrame
      ? {
          left: containFrame.left,
          top: containFrame.top,
          width: containFrame.width,
          height: containFrame.height,
          transform: imagePresentation?.transform,
          transformOrigin: imagePresentation?.transformOrigin,
        }
      : {
          inset: 0,
        }
    : undefined;
  const containForegroundStyle: React.CSSProperties | undefined =
    containBleed || fadeDuration > 0
      ? {
          objectFit: containFrame ? 'cover' : imagePresentation?.objectFit,
          objectPosition: containFrame ? '50% 50%' : imagePresentation?.objectPosition,
          transform: containFrame ? undefined : imagePresentation?.transform,
          transformOrigin: containFrame ? undefined : imagePresentation?.transformOrigin,
          transitionDuration: fadeDuration > 0 ? `${fadeDuration}ms` : undefined,
          WebkitMaskImage: edgeMask,
          maskImage: edgeMask,
        }
      : undefined;

  // Extract YouTube video ID (null for non-YouTube images).
  const ytVideoId = useMemo(
    () => (typeof normalizedSrc === 'string' ? extractYtVideoId(normalizedSrc) : null),
    [normalizedSrc]
  );

  // Whether we're waiting for the YouTube oEmbed check to complete.
  const [ytChecking, setYtChecking] = useState(() => {
    if (!ytVideoId) return false;
    return ytCache.get(ytVideoId) === undefined; // only check if not cached
  });

  // Synchronous state reset when src changes (no useEffect needed —
  // React supports setting state during render for derived-from-props patterns).
  if (prevSrcRef.current !== src) {
    prevSrcRef.current = src;
    setLoaded(false);
    setErrored(false);
    setResolvedSrc(undefined);
    setYtChecking(!!ytVideoId && ytCache.get(ytVideoId) === undefined);
    setNaturalSize(null);
    setContainFrame(null);
  }

  const recordNaturalSize = useCallback((node: HTMLImageElement) => {
    if (node.naturalWidth <= 0 || node.naturalHeight <= 0) return;
    setNaturalSize((current) => {
      if (current?.width === node.naturalWidth && current.height === node.naturalHeight) {
        return current;
      }
      return { width: node.naturalWidth, height: node.naturalHeight };
    });
  }, []);

  useEffect(() => {
    if (!containBleed || !naturalSize || !containerNodeRef.current) {
      setContainFrame(null);
      return;
    }

    const node = containerNodeRef.current;
    const updateFrame = () => {
      const rect = node.getBoundingClientRect();
      const nextFrame =
        resolveContainedImageFrame(
          { width: rect.width, height: rect.height },
          naturalSize,
          containObjectPosition
        ) ?? null;

      setContainFrame((current) => {
        if (
          current?.width === nextFrame?.width &&
          current?.height === nextFrame?.height &&
          current?.left === nextFrame?.left &&
          current?.top === nextFrame?.top &&
          current?.edgeFadeAxis === nextFrame?.edgeFadeAxis
        ) {
          return current;
        }
        return nextFrame;
      });
    };

    updateFrame();

    if (typeof ResizeObserver === 'undefined') return;
    const resizeObserver = new ResizeObserver(updateFrame);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, [containBleed, naturalSize, containObjectPosition]);

  // YouTube oEmbed validation — fires only for ytimg.com thumbnails.
  // If the video exists, rewrites the URL to hqdefault (guaranteed to exist).
  useEffect(() => {
    if (!ytVideoId || typeof normalizedSrc !== 'string') return;

    const oembedCached = ytCache.get(ytVideoId);
    if (oembedCached === false) {
      setYtChecking(false);
      setErrored(true);
      return;
    }
    if (oembedCached === true) {
      setResolvedSrc(safeYtThumbnail(normalizedSrc));
      setYtChecking(false);
      return;
    }

    let cancelled = false;
    checkYtAvailability(ytVideoId).then((available) => {
      if (cancelled) return;
      if (!available) {
        setErrored(true);
      } else {
        setResolvedSrc(safeYtThumbnail(normalizedSrc));
      }
      setYtChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ytVideoId, normalizedSrc]);

  // Container ref callback — sets up IntersectionObserver for lazy loading.
  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      containerNodeRef.current = node;
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node || loading === 'eager') return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { rootMargin }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [loading, rootMargin]
  );

  // Img ref callback — detects cache hits where onLoad fires before
  // React attaches the synthetic event handler.
  const imgRefCallback = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) {
        recordNaturalSize(node);
        setLoaded(true);
      }
    },
    [recordNaturalSize]
  );

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      recordNaturalSize(e.currentTarget);
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad, recordNaturalSize]
  );

  const handleAuxiliaryLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      recordNaturalSize(e.currentTarget);
      setLoaded(true);
    },
    [recordNaturalSize]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // For YouTube thumbnails, try the next lower resolution before giving up.
      const currentUrl = resolvedSrc ?? (typeof normalizedSrc === 'string' ? normalizedSrc : '');
      const fallbackUrl = nextYtResolution(currentUrl);
      if (fallbackUrl) {
        setResolvedSrc(fallbackUrl);
        return;
      }
      setErrored(true);
      onError?.(e);
    },
    [onError, resolvedSrc, normalizedSrc]
  );

  // Don't start loading the image while the YouTube check is in-flight —
  // avoids briefly flashing the grey "unavailable" thumbnail.
  const shouldLoad = inView && hasSource && !errored && !ytChecking;
  const showFallback = !hasSource || errored;

  return (
    <div
      ref={containerRefCallback}
      data-slot="image"
      className={cn('relative isolate overflow-hidden', className)}
      style={style}
    >
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && !showFallback && (
        <div
          aria-hidden
          className={cn(
            skeletonVariants({ variant: 'rect' }),
            'absolute inset-0 h-full w-full rounded-[inherit]'
          )}
        />
      )}

      {showFallback ? (
        <div className="absolute inset-0 h-full w-full overflow-hidden rounded-[inherit]">
          {fallback ?? <BtlPlaceholder className="rounded-[inherit]" />}
        </div>
      ) : null}

      {/* Actual image — transparent until loaded, then fades in */}
      {shouldLoad && containBleed && (
        <img
          aria-hidden
          src={imageSource}
          alt=""
          className={cn(
            'pointer-events-none absolute inset-0 h-full w-full blur-xl saturate-110',
            loaded ? 'opacity-55' : 'opacity-0'
          )}
          onLoad={handleAuxiliaryLoad}
          style={bleedStyle}
          draggable={false}
        />
      )}

      {shouldLoad && containBleed ? (
        <div
          className="pointer-events-none absolute z-10"
          style={containFrameStyle}
          data-slot="image-contain-foreground"
        >
          <img
            aria-hidden
            src={imageSource}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full scale-[1.018] object-cover blur-md saturate-110',
              loaded ? 'opacity-60' : 'opacity-0'
            )}
            onLoad={handleAuxiliaryLoad}
            draggable={false}
          />
          <img
            ref={imgRefCallback}
            src={imageSource}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'relative z-10 h-full w-full object-cover',
              fadeDuration > 0 && 'transition-opacity',
              loaded ? 'opacity-100' : 'opacity-0',
              imgClassName
            )}
            style={containForegroundStyle}
            draggable={false}
            {...props}
          />
        </div>
      ) : shouldLoad ? (
        <img
          ref={imgRefCallback}
          src={imageSource}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover',
            fadeDuration > 0 && 'transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
          style={imgStyle}
          draggable={false}
          {...props}
        />
      ) : null}
    </div>
  );
}

export { Image };
export type { ImageProps };
