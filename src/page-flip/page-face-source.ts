import { domToCanvas } from 'modern-screenshot';
import * as THREE from 'three';

/**
 * PageFaceSource — the freeze/thaw swap boundary.
 *
 * Onboarding pages (and issue spreads) are *interactive* live DOM at rest:
 * forms work, text is selectable, screen-readers see real content. Nothing can
 * keep DOM interactive on a deforming WebGL mesh, so during a turn we rasterise
 * the page to a `THREE.CanvasTexture`, animate the curl, and restore the live
 * DOM on settle.
 *
 * This interface is the *strategy* boundary: today it's implemented with
 * `modern-screenshot`; a future native `html-in-canvas` source (Chrome origin
 * trial as of 2026-06) drops in behind the same contract with no change to
 * callers.
 *
 * Texture-budget contract: at most three live textures (prev / current / next).
 * Implementations MUST dispose textures they no longer hand out — see
 * {@link freeze} and {@link release}.
 */
export interface PageFaceSource {
  /**
   * Rasterise a live DOM element to a GPU texture for the duration of a turn.
   *
   * The returned texture is owned by the source's internal LRU (max 3 live).
   * Calling `freeze` for the same element returns the cached texture if still
   * live. Older textures beyond the budget are disposed automatically.
   */
  freeze(element: HTMLElement, opts?: FreezeOptions): Promise<THREE.CanvasTexture>;

  /**
   * Restore the live DOM. With the screenshot strategy this is a no-op on the
   * DOM itself (the element was never mutated) and simply signals the runtime
   * to swap the texture layer back out for the interactive layer. A native
   * `html-in-canvas` source would tear down its live-canvas binding here.
   */
  thaw(element: HTMLElement): void;

  /**
   * Drop a single cached texture early (e.g. the page that just left the
   * prev/cur/next window). Safe to call with an unknown element.
   */
  release(element: HTMLElement): void;

  /** Dispose every live texture and clear the cache. Call on unmount. */
  dispose(): void;
}

export interface FreezeOptions {
  /**
   * Device-pixel-ratio for the raster. Capped at {@link MAX_FREEZE_DPR} to keep
   * texture memory bounded; on mobile callers should pass a lower value (≤1.5).
   */
  dpr?: number;
  /** Background painted behind the element before raster (avoids transparent fringes). */
  backgroundColor?: string;
  /**
   * `flipY` on the resulting texture. Defaults to `true` to match three's
   * texture convention so the shader samples in the expected orientation.
   */
  flipY?: boolean;
}

/** DPR ceiling for freezes — hard cap regardless of `window.devicePixelRatio`. */
export const MAX_FREEZE_DPR = 2;

/** The prev/current/next window — at most this many textures stay resident. */
export const MAX_LIVE_TEXTURES = 3;

interface CacheEntry {
  element: HTMLElement;
  texture: THREE.CanvasTexture;
}

/**
 * Default {@link PageFaceSource} backed by `modern-screenshot`.
 *
 * `modern-screenshot` clones the node into an inline SVG `<foreignObject>` and
 * paints it to a canvas — it never mutates the source DOM, so the live element
 * stays interactive throughout (the runtime just hides it behind the WebGL
 * layer during the turn). All referenced images must be CORS-clean
 * (`crossOrigin="anonymous"`) or the underlying `toDataURL`/canvas paint taints
 * and throws.
 */
export class ScreenshotPageFaceSource implements PageFaceSource {
  private cache: CacheEntry[] = [];

  async freeze(element: HTMLElement, opts: FreezeOptions = {}): Promise<THREE.CanvasTexture> {
    const existing = this.cache.find((e) => e.element === element);
    if (existing) {
      // Promote to most-recent and reuse the live texture.
      this.cache = this.cache.filter((e) => e !== existing);
      this.cache.push(existing);
      return existing.texture;
    }

    const dpr = Math.min(opts.dpr ?? deviceDpr(), MAX_FREEZE_DPR);
    const canvas = await domToCanvas(element, {
      scale: dpr,
      backgroundColor: opts.backgroundColor,
      // Filter out the WebGL canvas itself and anything explicitly excluded, so
      // a freeze never tries to rasterise the renderer that triggered it.
      filter: (node) => !(node instanceof HTMLElement && node.dataset.pageFlipExclude === 'true'),
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = opts.flipY ?? true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 1;
    texture.needsUpdate = true;

    this.cache.push({ element, texture });
    this.evict();
    return texture;
  }

  thaw(_element: HTMLElement): void {
    // No-op for the screenshot strategy: the DOM was never frozen in place.
    // Present so callers code against the same contract a native
    // html-in-canvas source would honour.
  }

  release(element: HTMLElement): void {
    const idx = this.cache.findIndex((e) => e.element === element);
    if (idx === -1) return;
    this.cache[idx].texture.dispose();
    this.cache.splice(idx, 1);
  }

  dispose(): void {
    for (const entry of this.cache) entry.texture.dispose();
    this.cache = [];
  }

  /** Evict least-recently-frozen textures beyond the budget, disposing them. */
  private evict(): void {
    while (this.cache.length > MAX_LIVE_TEXTURES) {
      const stale = this.cache.shift();
      stale?.texture.dispose();
    }
  }
}

function deviceDpr(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}

/**
 * Convenience singleton. Most callers want one source per `<PageFlip>` instance
 * (so texture budgets don't collide), so the component creates its own; this is
 * here for ad-hoc/test use.
 */
export function createPageFaceSource(): PageFaceSource {
  return new ScreenshotPageFaceSource();
}
