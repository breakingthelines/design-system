'use client';

import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

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
  /** Callback when the image finishes loading. */
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  /** Callback on load error. */
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

function Image({
  src,
  alt = '',
  loading = 'lazy',
  rootMargin = '200px',
  fadeDuration = 300,
  className,
  style,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === 'eager');
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading === 'eager' || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [loading, rootMargin]);

  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setErrored(true);
      onError?.(e);
    },
    [onError],
  );

  const shouldLoad = inView && src && !errored;

  return (
    <div
      ref={containerRef}
      data-slot="image"
      className={cn('relative overflow-hidden', className)}
      style={style}
    >
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && (
        <div
          aria-hidden
          className={cn(
            skeletonVariants({ variant: 'rect' }),
            'absolute inset-0 h-full w-full rounded-[inherit]',
          )}
        />
      )}

      {/* Actual image — transparent until loaded, then fades in */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover',
            fadeDuration > 0 && 'transition-opacity',
            loaded ? 'opacity-100' : 'opacity-0',
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
