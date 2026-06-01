/**
 * Capability gating for the WebGL page-flip.
 *
 * The flip is pure progressive enhancement over live DOM, so it must never
 * block a flow. We start in flat mode (no WebGL) whenever the device looks
 * under-powered or the user has asked for reduced motion, and the runtime can
 * additionally drop to flat mode mid-session via an FPS watchdog.
 */

export interface CapabilityReport {
  /** Whether the WebGL curl should be attempted at all. */
  canUseWebGLFlip: boolean;
  /** Individual signals, for debugging / telemetry. */
  reasons: {
    prefersReducedMotion: boolean;
    hasWebGL: boolean;
    lowMemory: boolean;
    lowConcurrency: boolean;
  };
}

/** Min `navigator.deviceMemory` (GB) before we trust the device with WebGL. */
export const MIN_DEVICE_MEMORY_GB = 4;
/** Min `navigator.hardwareConcurrency` (logical cores) before we trust WebGL. */
export const MIN_HARDWARE_CONCURRENCY = 4;
/** FPS floor; sustained reads below this drop the runtime to flat mode. */
export const FPS_FLOOR = 30;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Probe for a usable WebGL context. Creates a throwaway canvas; some locked-
 * down environments expose the API but fail to allocate a context.
 */
export function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return gl != null;
  } catch {
    return false;
  }
}

function lowMemory(): boolean {
  if (typeof navigator === 'undefined') return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  // `deviceMemory` is undefined in Safari/Firefox — absence is NOT a fail
  // signal (we don't want to punish privacy-preserving browsers), only an
  // explicit low value gates us out.
  return typeof mem === 'number' && mem < MIN_DEVICE_MEMORY_GB;
}

function lowConcurrency(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === 'number' && cores > 0 && cores < MIN_HARDWARE_CONCURRENCY;
}

/**
 * One-shot cold-start capability check. Run before mounting the WebGL layer;
 * if `canUseWebGLFlip` is false, render flat mode and never mount the Canvas.
 */
export function detectCapability(): CapabilityReport {
  const reasons = {
    prefersReducedMotion: prefersReducedMotion(),
    hasWebGL: hasWebGL(),
    lowMemory: lowMemory(),
    lowConcurrency: lowConcurrency(),
  };
  const canUseWebGLFlip =
    !reasons.prefersReducedMotion &&
    reasons.hasWebGL &&
    !reasons.lowMemory &&
    !reasons.lowConcurrency;
  return { canUseWebGLFlip, reasons };
}
