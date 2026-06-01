import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { hasWebGL } from './capability';
import { PageCurlMaterialImpl } from './page-curl-material';
import type { FreezeOptions, PageFaceSource } from './page-face-source';

interface PrewarmOptions {
  source: PageFaceSource;
  /** Only pre-warm when the curl renderer is live (flat mode needs no textures). */
  enabled: boolean;
  /** Don't rasterise while a turn is mid-flight (the turn owns the GPU + the LRU). */
  isTurning: boolean;
  /** Face indices to keep paint-ready (current spread + adjacent). */
  faces: number[];
  /** Resolve a face index to its live DOM element. */
  getEl: (face: number) => HTMLElement | null;
  freezeOpts: FreezeOptions;
}

/**
 * Pre-warm the page-flip so a turn never rasterises on-demand at grab-time
 * (the on-demand `freeze()` is the start-of-flip jitter).
 *
 * Two pre-warms:
 *  1. **Adjacent textures.** When the book is at rest, rasterise the current
 *     spread + the faces on either side into the source's LRU during idle time
 *     (`requestIdleCallback`, rAF fallback). The instant the user grabs a
 *     corner, `freeze()` hits the cache and returns synchronously — the curl
 *     starts on the first frame. The LRU caps live textures (≤3) and disposes
 *     the rest, so this stays within budget.
 *  2. **Shader pre-compile.** Compile the curl `ShaderMaterial` once on mount in
 *     a throwaway offscreen WebGL context, so the first real flip doesn't pay a
 *     shader-compile stall.
 */
export function usePrewarmTextures({
  source,
  enabled,
  isTurning,
  faces,
  getEl,
  freezeOpts,
}: PrewarmOptions): void {
  // Pre-compile the curl material once, on mount, off-screen.
  useEffect(() => {
    if (!enabled) return;
    precompileCurlMaterial();
  }, [enabled]);

  // Keep `getEl` current without re-running the idle effect on every render.
  const getElRef = useRef(getEl);
  getElRef.current = getEl;
  const freezeRef = useRef(freezeOpts);
  freezeRef.current = freezeOpts;

  const facesKey = faces.join(',');
  useEffect(() => {
    if (!enabled || isTurning) return;
    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      for (const face of faces) {
        const el = getElRef.current(face);
        if (!el) continue;
        // freeze() promotes/serves from the LRU; errors (e.g. tainted canvas)
        // are non-fatal here — the on-mount freeze in TurnScene will retry.
        void source.freeze(el, freezeRef.current).catch(() => {});
      }
    };

    const handle = scheduleIdle(warm);
    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
    // facesKey stands in for the faces array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isTurning, facesKey, source]);
}

// ── Idle scheduling (requestIdleCallback with a rAF fallback) ────────────────

type IdleHandle = { type: 'idle'; id: number } | { type: 'raf'; id: number };

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

function scheduleIdle(cb: () => void): IdleHandle {
  if (typeof window === 'undefined') return { type: 'raf', id: 0 };
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    return { type: 'idle', id: w.requestIdleCallback(cb, { timeout: 400 }) };
  }
  return { type: 'raf', id: requestAnimationFrame(cb) };
}

function cancelIdle(handle: IdleHandle): void {
  if (typeof window === 'undefined' || !handle.id) return;
  const w = window as IdleWindow;
  if (handle.type === 'idle' && typeof w.cancelIdleCallback === 'function') {
    w.cancelIdleCallback(handle.id);
  } else if (handle.type === 'raf') {
    cancelAnimationFrame(handle.id);
  }
}

// ── Shader pre-compile ───────────────────────────────────────────────────────

let precompiled = false;

/**
 * Force the curl shader through a real GLSL compile once, so the first visible
 * flip doesn't hitch on `compileShader`. We render a 1×1 quad with the material
 * into a tiny offscreen renderer, then tear it down. Idempotent per session.
 */
function precompileCurlMaterial(): void {
  if (precompiled || typeof document === 'undefined') return;
  // Skip where there's no usable WebGL (e.g. headless test runners) — the live
  // flip already gates to flat mode there, so a pre-compile would only error.
  if (!hasWebGL()) return;
  precompiled = true;
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(2, 2, false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;
    const material = new PageCurlMaterialImpl();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), material);
    scene.add(mesh);
    renderer.compile(scene, camera); // synchronous program link
    renderer.render(scene, camera);
    // Tidy up the throwaway context.
    mesh.geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  } catch {
    // No WebGL / context exhaustion — the live flip falls back to flat mode
    // via capability gating, so a failed pre-compile is harmless.
  }
}
