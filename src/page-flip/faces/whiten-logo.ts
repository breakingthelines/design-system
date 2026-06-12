// Whiten a coloured crest/competition mark into a CONSISTENT light, engraved mark
// for the near-black editorial page. Shared by the canvas renderer (the 3D book)
// and the DOM renderer (the static poster / no-WebGL fallback) so a crest looks
// identical in either path.
//
// The technique is polarity-free, so a near-black mark (the Premier League lion)
// and a near-white one both land in the same light register:
//   1. per-image auto-levels (3rd–97th percentile of opaque luminance) normalize
//      each mark's own tonal range — the step a single CSS filter can't do;
//   2. multi-scale high-pass `|L − blur(L)|` (absolute, so it reads internal
//      structure regardless of dark-on-light vs light-on-dark);
//   3. white fill MINUS that detail, capped + floored so interiors carve to grey
//      engraving lines (never black holes) and the mark stays light;
//   4. an alpha-gradient rim so even a featureless solid mark keeps its shape.

/** Edge-clamped separable box blur over a Float32 luminance plane (O(n)). */
function boxBlur(srcPlane: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r <= 0) return srcPlane.slice();
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const win = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += srcPlane[row + Math.min(w - 1, Math.max(0, i))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / win;
      acc += srcPlane[row + Math.min(w - 1, x + r + 1)] - srcPlane[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / win;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/**
 * Returns an offscreen canvas with the mark whitened at the SOURCE'S OWN
 * resolution (capped at `maxDim`), or null if there is no 2D context or the
 * source tainted the canvas (cross-origin without CORS). Processing at source
 * res (not the small on-page layout size) keeps the engraving crisp — the caller
 * draws the returned canvas scaled to its display box, so a 150px crest stays
 * sharp instead of being pre-shrunk to ~78px and then re-enlarged (pixelated).
 */
export function whitenLogo(
  img: HTMLImageElement | HTMLCanvasElement,
  maxDim = 512
): HTMLCanvasElement | null {
  const srcW = ('naturalWidth' in img ? img.naturalWidth : img.width) || maxDim;
  const srcH = ('naturalHeight' in img ? img.naturalHeight : img.height) || maxDim;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const cw = Math.max(1, Math.round(srcW * scale));
  const ch = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, cw, ch);

  let src: ImageData;
  try {
    src = ctx.getImageData(0, 0, cw, ch);
  } catch {
    return null; // tainted source: caller falls back to the raw image
  }

  const px = src.data;
  const N = cw * ch;

  const L = new Float32Array(N);
  const A = new Float32Array(N);
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    A[i] = px[p + 3] / 255;
    L[i] = 0.2126 * px[p] + 0.7152 * px[p + 1] + 0.0722 * px[p + 2];
  }

  // Per-image auto-levels over the opaque pixels.
  const opaque: number[] = [];
  for (let i = 0; i < N; i++) if (A[i] > 0.3) opaque.push(L[i]);
  if (opaque.length >= 16) {
    opaque.sort((a, b) => a - b);
    const lo = opaque[(opaque.length * 0.03) | 0];
    let hi = opaque[(opaque.length * 0.97) | 0];
    if (hi - lo < 5) hi = lo + 5;
    const inv = 255 / (hi - lo);
    for (let i = 0; i < N; i++) {
      const v = (L[i] - lo) * inv;
      L[i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }

  const b1 = boxBlur(L, cw, ch, 2);
  const b2 = boxBlur(L, cw, ch, 5);

  // Alpha-gradient silhouette rim.
  const ag = new Float32Array(N);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      const ax = A[y * cw + Math.min(cw - 1, x + 1)] - A[y * cw + Math.max(0, x - 1)];
      const ay = A[Math.min(ch - 1, y + 1) * cw + x] - A[Math.max(0, y - 1) * cw + x];
      ag[i] = Math.sqrt(ax * ax + ay * ay) * 255;
    }
  }

  // White fill minus detail; capped + floored so it stays a light mark.
  const S1 = 2.2;
  const S2 = 1.2;
  const RIM = 0.35;
  const CLIP = 185;
  const FLOOR = 42;
  const out = ctx.createImageData(cw, ch);
  const o = out.data;
  for (let i = 0, p = 0; i < N; i++, p += 4) {
    let hp = Math.abs(L[i] - b1[i]) * S1 + Math.abs(L[i] - b2[i]) * S2 + ag[i] * RIM;
    if (hp > CLIP) hp = CLIP;
    let val = 255 - hp;
    if (val < FLOOR) val = FLOOR;
    o[p] = o[p + 1] = o[p + 2] = val;
    o[p + 3] = px[p + 3]; // preserve the original anti-aliased alpha
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}
