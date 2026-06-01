import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modern-screenshot so freeze() doesn't touch a real DOM/canvas.
vi.mock('modern-screenshot', () => ({
  domToCanvas: vi.fn(async () => ({ width: 2, height: 2 }) as unknown as HTMLCanvasElement),
}));

// Mock three's CanvasTexture to a tiny disposable stand-in we can assert on.
vi.mock('three', () => {
  class CanvasTexture {
    flipY = true;
    colorSpace = '';
    minFilter = 0;
    magFilter = 0;
    generateMipmaps = true;
    anisotropy = 0;
    needsUpdate = false;
    disposed = false;
    dispose() {
      this.disposed = true;
    }
  }
  return {
    CanvasTexture,
    SRGBColorSpace: 'srgb',
    LinearFilter: 1006,
  };
});

import { MAX_LIVE_TEXTURES, ScreenshotPageFaceSource } from './page-face-source';

interface Disposable {
  disposed: boolean;
}

function el(id: string): HTMLElement {
  // A bare object is enough — the source only uses identity + dataset (unused here).
  return { id } as unknown as HTMLElement;
}

describe('ScreenshotPageFaceSource', () => {
  let source: ScreenshotPageFaceSource;

  beforeEach(() => {
    source = new ScreenshotPageFaceSource();
  });

  it('freezes a DOM element to a configured CanvasTexture', async () => {
    const tex = (await source.freeze(el('a'))) as unknown as {
      flipY: boolean;
      colorSpace: string;
      generateMipmaps: boolean;
      needsUpdate: boolean;
    };
    expect(tex.flipY).toBe(true);
    expect(tex.colorSpace).toBe('srgb');
    expect(tex.generateMipmaps).toBe(false);
    expect(tex.needsUpdate).toBe(true);
  });

  it('returns the same cached texture for a repeated freeze of one element', async () => {
    const a = el('a');
    const t1 = await source.freeze(a);
    const t2 = await source.freeze(a);
    expect(t1).toBe(t2);
  });

  it('keeps at most MAX_LIVE_TEXTURES live and disposes the evicted ones', async () => {
    const a = (await source.freeze(el('a'))) as unknown as Disposable;
    const b = (await source.freeze(el('b'))) as unknown as Disposable;
    const c = (await source.freeze(el('c'))) as unknown as Disposable;
    expect(MAX_LIVE_TEXTURES).toBe(3);
    // A 4th freeze evicts the least-recently-frozen (a).
    const d = (await source.freeze(el('d'))) as unknown as Disposable;
    expect(a.disposed).toBe(true);
    expect(b.disposed).toBe(false);
    expect(c.disposed).toBe(false);
    expect(d.disposed).toBe(false);
  });

  it('release disposes a single cached texture', async () => {
    const a = el('a');
    const tex = (await source.freeze(a)) as unknown as Disposable;
    source.release(a);
    expect(tex.disposed).toBe(true);
    // Releasing an unknown element is a no-op (must not throw).
    expect(() => source.release(el('unknown'))).not.toThrow();
  });

  it('dispose tears down every live texture', async () => {
    const a = (await source.freeze(el('a'))) as unknown as Disposable;
    const b = (await source.freeze(el('b'))) as unknown as Disposable;
    source.dispose();
    expect(a.disposed).toBe(true);
    expect(b.disposed).toBe(true);
  });

  it('thaw is a no-op for the screenshot strategy (DOM never mutated)', () => {
    expect(() => source.thaw(el('a'))).not.toThrow();
  });
});
