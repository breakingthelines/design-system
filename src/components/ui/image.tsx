'use client';

import * as React from 'react';
import { useState, useRef, useCallback } from 'react';

import { BtlPlaceholder } from '#/components/ui/btl-placeholder';
import { cn } from '#/lib/utils';
import { skeletonVariants } from './skeleton';

/* ─────────────────────────────────────────────────────────────────────────────
 * Image — design-system image with shimmer loading and lazy viewport loading.
 *
 * Renders a shimmer placeholder (matching the Skeleton component) while the
 * image loads, then cross-fades to the real image. Uses IntersectionObserver
 * for lazy loading below-the-fold images.
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
}

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
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === 'eager');
  const [errored, setErrored] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prevSrcRef = useRef(src);

  // Synchronous state reset when src changes (no useEffect needed —
  // React supports setting state during render for derived-from-props patterns).
  if (prevSrcRef.current !== src) {
    prevSrcRef.current = src;
    setLoaded(false);
    setErrored(false);
  }

  // Container ref callback — sets up IntersectionObserver for lazy loading.
  const containerRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
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
  const imgRefCallback = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setErrored(true);
      onError?.(e);
    },
    [onError]
  );

  const normalizedSrc = typeof src === 'string' ? src.trim() : src;
  const hasSource = typeof normalizedSrc === 'string' ? normalizedSrc.length > 0 : !!normalizedSrc;
  const shouldLoad = inView && hasSource && !errored;
  const showFallback = !hasSource || errored;

  return (
    <div
      ref={containerRefCallback}
      data-slot="image"
      className={cn('relative overflow-hidden', className)}
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
      {shouldLoad && (
        <img
          ref={imgRefCallback}
          src={normalizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover',
            fadeDuration > 0 && 'transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
          style={fadeDuration > 0 ? { transitionDuration: `${fadeDuration}ms` } : undefined}
          draggable={false}
          {...props}
        />
      )}
    </div>
  );
}

export { Image };
export type { ImageProps };
