// useFaceTextures — turn FaceSpec[] into the paired front/back CanvasTextures
// the Book3D engine renders. Preloads every referenced image (CORS-safe, with a
// per-image timeout so one slow crest can't stall the reveal), ensures the
// platform fonts are ready (canvas text would otherwise fall back to a system
// face), draws each face, and pairs faces into physical pages.
//
// useEffect is the right tool here: this is genuinely imperative resource work
// (image decode → canvas raster → GPU texture upload → dispose), not data
// fetching or derived state.

import { useEffect, useMemo, useRef, useState } from 'react';

import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';

import { collectFaceImageUrls, type FaceSpec, type HeadingFont } from './face-spec';
import { drawFaceCanvas } from './draw-face-canvas';

/** A physical leaf of the book: a front face and a back face. */
export interface BookTexturePage {
  front: Texture;
  back: Texture;
}

export interface UseFaceTexturesOptions {
  headingFont: HeadingFont;
  /** Faint tactical-doodle texture for content pages. */
  doodleUrl?: string;
  /** Per-image load cap (ms). After this, the image is treated as failed. */
  imageTimeoutMs?: number;
}

function loadImage(url: string, timeoutMs: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let done = false;
    const onLoad = () => finish(true);
    const onError = () => finish(false);
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve(ok && img.width > 0 ? img : null);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    img.src = url;
  });
}

async function ensureFonts(): Promise<void> {
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.load) return;
  const faces = [
    "700 64px 'Inter'",
    "500 28px 'Inter'",
    "600 22px 'Inter'",
    "700 64px 'le-monde-journal-std'",
  ];
  await Promise.race([
    Promise.allSettled(faces.map((f) => fonts.load(f))),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
}

/** Cheap signature so the effect re-runs only when content actually changes. */
function specsSignature(specs: FaceSpec[], headingFont: HeadingFont, doodleUrl?: string): string {
  return `${headingFont}|${doodleUrl ?? ''}|${JSON.stringify(specs)}`;
}

export function useFaceTextures(
  specs: FaceSpec[],
  options: UseFaceTexturesOptions
): { pages: BookTexturePage[]; ready: boolean } {
  const { headingFont, doodleUrl, imageTimeoutMs = 2500 } = options;
  const [state, setState] = useState<{ pages: BookTexturePage[]; ready: boolean }>({
    pages: [],
    ready: false,
  });
  const sig = useMemo(
    () => specsSignature(specs, headingFont, doodleUrl),
    [specs, headingFont, doodleUrl]
  );
  const disposeRef = useRef<Texture[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState((s) => (s.ready ? { pages: s.pages, ready: false } : s));

    (async () => {
      const urls = collectFaceImageUrls(specs);
      const [pairs] = await Promise.all([
        Promise.all(urls.map(async (u) => [u, await loadImage(u, imageTimeoutMs)] as const)),
        ensureFonts(),
      ]);
      const doodle = doodleUrl ? await loadImage(doodleUrl, imageTimeoutMs) : null;
      if (cancelled) return;

      const images = new Map<string, HTMLImageElement>();
      for (const [u, img] of pairs) if (img) images.set(u, img);

      const textures = specs.map((spec) => {
        const tex = new CanvasTexture(drawFaceCanvas(spec, { images, doodle, headingFont }));
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return tex;
      });

      // Pair faces into physical pages; pad to even with a blank ink page so the
      // back cover lands on a real leaf and the book closes cleanly.
      const padded = [...textures];
      if (padded.length % 2 === 1) {
        const blank = document.createElement('canvas');
        blank.width = 8;
        blank.height = 8;
        const c = blank.getContext('2d');
        if (c) {
          c.fillStyle = '#0b0b0d';
          c.fillRect(0, 0, 8, 8);
        }
        const blankTex = new CanvasTexture(blank);
        blankTex.colorSpace = SRGBColorSpace;
        padded.push(blankTex);
      }
      const pages: BookTexturePage[] = [];
      for (let i = 0; i < padded.length; i += 2) {
        pages.push({ front: padded[i], back: padded[i + 1] });
      }

      disposeRef.current = padded;
      setState({ pages, ready: true });
    })();

    return () => {
      cancelled = true;
      for (const t of disposeRef.current) t.dispose();
      disposeRef.current = [];
    };
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps -- sig captures specs/font/doodle

  return state;
}
