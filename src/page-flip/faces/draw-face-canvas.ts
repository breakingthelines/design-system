// drawFaceCanvas — render a FaceSpec onto a 2D canvas, for use as a 3D page
// texture. Pure (no React); given a spec + the already-loaded images, it paints
// a crisp editorial page. Text is drawn in the real platform fonts (Inter +
// le-monde-journal-std, ensured loaded by the caller via document.fonts), real
// crests/photos via drawImage, and the hand-drawn tactical doodle composites
// faintly behind content pages (never the cover/photo).

import {
  BODY_FAMILY,
  FACE_ASPECT,
  FACE_COLORS as C,
  headingFamily,
  type CoverTransform,
  type FaceImage,
  type FaceSpec,
  type HeadingFont,
} from './face-spec';
import { whitenLogo } from './whiten-logo';

/** Texture resolution. 1024×1368 (page aspect) reads crisp with anisotropy. */
export const FACE_W = 1024;
export const FACE_H = Math.round(FACE_W / FACE_ASPECT);
const PAD = 88;

export interface DrawFaceOptions {
  /** Successfully-loaded images, keyed by URL. Missing → monogram/skip. */
  images: Map<string, HTMLImageElement>;
  /** The faint tactical doodle (transparent PNG), composited on content pages. */
  doodle?: HTMLImageElement | null;
  headingFont: HeadingFont;
}

// ── low-level text + image helpers ────────────────────────────────────────────

function font(ctx: CanvasRenderingContext2D, weight: number, px: number, family: string) {
  ctx.font = `${weight} ${px}px ${family}`;
}

/** Track letters (eyebrows) where supported; a no-op fallback otherwise. */
function withTracking(ctx: CanvasRenderingContext2D, px: string, fn: () => void) {
  const has = 'letterSpacing' in ctx;
  const c = ctx as CanvasRenderingContext2D & { letterSpacing: string };
  const prev = has ? c.letterSpacing : '';
  if (has) c.letterSpacing = px;
  fn();
  if (has) c.letterSpacing = prev || '0px';
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draw wrapped text from a top-left baseline anchor. Returns the y just past
 * the last line. `align` left|center.
 */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yTop: number,
  maxW: number,
  lineH: number,
  align: 'left' | 'center' = 'left'
): number {
  const lines = wrapLines(ctx, text, maxW);
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  let y = yTop + lineH * 0.8;
  for (const ln of lines) {
    ctx.fillText(ln, align === 'center' ? x + maxW / 2 : x, y);
    y += lineH;
  }
  return y - lineH + lineH * 0.2;
}

/** object-cover: fill (x,y,w,h) preserving aspect, cropping overflow. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  t?: CoverTransform
) {
  const base = Math.max(w / img.width, h / img.height);
  const scale = base * (t?.scale ?? 1);
  const dw = img.width * scale;
  const dh = img.height * scale;
  // Pan as a fraction of the overflow (clamped), 0 = centred.
  const ox = (t?.x ?? 0) * Math.max(0, (dw - w) / 2);
  const oy = (t?.y ?? 0) * Math.max(0, (dh - h) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2 + ox, y + (h - dh) / 2 + oy, dw, dh);
  ctx.restore();
}

/** Circular media tile: photo (cover) / crest (contain) / tinted monogram. */
function drawCircleMedia(
  ctx: CanvasRenderingContext2D,
  media: FaceImage,
  images: Map<string, HTMLImageElement>,
  cx: number,
  cy: number,
  r: number
) {
  const img = media.url ? images.get(media.url) : undefined;
  const fit = media.fit ?? 'cover';

  // Crests + competition logos (contain) → a flat WHITE badge, no disc, no ring.
  if (fit === 'contain') {
    if (img) {
      const box = r * 1.85;
      const s = Math.min(box / img.width, box / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      const light = whitenLogo(img, dw, dh);
      if (light) ctx.drawImage(light, cx - dw / 2, cy - dh / 2);
      else ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    } else {
      drawBTLPlaceholder(ctx, cx, cy, r);
    }
    return;
  }

  // Photos + avatars (cover) → a circular portrait with a hairline ring.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = media.tint ?? C.grey200;
  ctx.fill();
  ctx.clip();
  if (img) {
    drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = C.white;
    font(ctx, 700, r * 0.78, BODY_FAMILY);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(media.monogram, cx, cy + r * 0.04);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();
}

/** The BTL bracket mark (exact SVG path), scaled to `h` px at (x,y). */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  const s = h / 38.53;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = C.red;
  ctx.fill(new Path2D('M17.142 0V11.709H12.442V26.83H17.142V38.53H0V0H17.142Z'));
  ctx.fill(new Path2D('M40 0V38.53H22.863V26.83H27.563V11.709H22.863V0H40Z'));
  ctx.restore();
}

/**
 * BTL placeholder for a crest/logo we have no art for: a faint rounded tile with
 * the brand bracket mark centred. Used INSIDE the mag only (the cover drops
 * iconless marks entirely), so an unbadged club reads as a deliberate BTL slot
 * rather than a bare initial.
 */
function drawBTLPlaceholder(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 1.55;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - s / 2, cy - s / 2, s, s, s * 0.24);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.stroke();
  const markH = r * 0.86;
  const markW = markH * (40 / 38.53);
  drawMark(ctx, cx - markW / 2, cy - markH / 2, markH);
  ctx.restore();
}

/** The stacked wordmark: red mark + "breaking / the lines" (bold lowercase). */
function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const markH = 48;
  drawMark(ctx, x, y, markH);
  ctx.fillStyle = C.white;
  font(ctx, 800, 36, BODY_FAMILY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const tx = x + markH * (40 / 38.53) + 18;
  ctx.fillText('breaking', tx, y + 20);
  ctx.fillText('the lines', tx, y + 52);
}

/** A bare logo/crest (contain, no disc) or a legible monogram chip fallback. */
function drawBareLogo(
  ctx: CanvasRenderingContext2D,
  media: FaceImage,
  images: Map<string, HTMLImageElement>,
  x: number,
  y: number,
  size: number
) {
  const img = media.url ? images.get(media.url) : undefined;
  const cx = x + size / 2;
  const cy = y + size / 2;
  if (img) {
    const s = Math.min(size / img.width, size / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    const light = whitenLogo(img, dw, dh);
    if (light) ctx.drawImage(light, x + (size - dw) / 2, y + (size - dh) / 2);
    else ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
    return;
  }
  // No art → a bare white monogram (soft shadow keeps it legible over the photo).
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = C.white;
  font(ctx, 700, size * 0.42, BODY_FAMILY);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(media.monogram, cx, cy + 1);
  ctx.restore();
}

/** A right-aligned 2-column logo grid (rows of two, max 4). */
function drawLogoGrid(
  ctx: CanvasRenderingContext2D,
  items: FaceImage[],
  images: Map<string, HTMLImageElement>,
  rightX: number,
  anchorY: number,
  anchor: 'top' | 'bottom',
  cell: number,
  gap: number
) {
  const list = items.slice(0, 4);
  if (!list.length) return;
  const rows = Math.ceil(list.length / 2);
  const topY = anchor === 'top' ? anchorY : anchorY - (rows * cell + (rows - 1) * gap);
  list.forEach((media, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    // Right-align each row (handles a final odd item cleanly).
    const rowCount = Math.min(2, list.length - row * 2);
    const rowLeft = rightX - (rowCount * cell + (rowCount - 1) * gap);
    const x = rowLeft + col * (cell + gap);
    const y = topY + row * (cell + gap);
    drawBareLogo(ctx, media, images, x, y, cell);
  });
}

function paintBase(ctx: CanvasRenderingContext2D, doodle?: HTMLImageElement | null) {
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  // Subtle top vignette for depth.
  const g = ctx.createRadialGradient(FACE_W / 2, -FACE_H * 0.1, 0, FACE_W / 2, 0, FACE_H * 1.1);
  g.addColorStop(0, 'rgba(40,40,46,0.5)');
  g.addColorStop(0.7, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  if (doodle && doodle.width > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const s = Math.max(FACE_W / doodle.width, FACE_H / doodle.height);
    const dw = doodle.width * s;
    const dh = doodle.height * s;
    ctx.drawImage(doodle, (FACE_W - dw) / 2, (FACE_H - dh) / 2, dw, dh);
    ctx.restore();
  }
}

// ── per-kind layouts ──────────────────────────────────────────────────────────

function drawCoverFace(
  ctx: CanvasRenderingContext2D,
  spec: Extract<FaceSpec, { kind: 'cover' }>,
  o: DrawFaceOptions
) {
  const hf = headingFamily(o.headingFont);
  const img = spec.coverImage?.url ? o.images.get(spec.coverImage.url) : undefined;
  if (img) {
    drawCover(ctx, img, 0, 0, FACE_W, FACE_H, spec.coverImage?.transform);
  } else {
    // No photo (last resort): a dark textured cover (still on-brand).
    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, FACE_W, FACE_H);
    const rg = ctx.createRadialGradient(
      FACE_W / 2,
      -120,
      0,
      FACE_W / 2,
      FACE_H * 0.4,
      FACE_H * 1.15
    );
    rg.addColorStop(0, '#232327');
    rg.addColorStop(0.75, '#0b0b0d');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, FACE_W, FACE_H);
  }

  // Darker overlay so the white furniture always holds: a whole-page darken
  // plus stronger top + bottom gradients (the photo breathes through the middle).
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.fillRect(0, 0, FACE_W, FACE_H);
  const top = ctx.createLinearGradient(0, 0, 0, FACE_H * 0.34);
  top.addColorStop(0, 'rgba(0,0,0,0.58)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, FACE_W, FACE_H * 0.34);
  const bot = ctx.createLinearGradient(0, FACE_H * 0.56, 0, FACE_H);
  bot.addColorStop(0, 'rgba(0,0,0,0)');
  bot.addColorStop(1, 'rgba(0,0,0,0.94)');
  ctx.fillStyle = bot;
  ctx.fillRect(0, FACE_H * 0.56, FACE_W, FACE_H * 0.44);

  // Top-left: wordmark → kicker → date. Kicker + date are small, wide-tracked,
  // uppercase labels (clearly secondary to the wordmark) — per the programme ref.
  drawWordmark(ctx, PAD, PAD);
  let ty = PAD + 88;
  if (spec.kicker) {
    ctx.fillStyle = C.white;
    font(ctx, 500, 16, BODY_FAMILY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    withTracking(ctx, '4px', () => ctx.fillText(spec.kicker!.toUpperCase(), PAD, ty));
    ty += 23;
  }
  if (spec.date) {
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    font(ctx, 500, 16, BODY_FAMILY);
    ctx.textAlign = 'left';
    withTracking(ctx, '3px', () => ctx.fillText(spec.date!.toUpperCase(), PAD, ty));
  }

  // Top-right: clubs you like (rows of two, max 4).
  if (spec.clubs?.length) {
    drawLogoGrid(ctx, spec.clubs, o.images, FACE_W - PAD, PAD, 'top', 78, 18);
  }

  // Bottom-right: leagues you follow (rows of two, max 4).
  if (spec.leagues?.length) {
    drawLogoGrid(ctx, spec.leagues, o.images, FACE_W - PAD, FACE_H - PAD, 'bottom', 70, 18);
  }

  // Bottom-left: the @handle — small (≈1.5× the kicker), bold, UPPERCASE.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.white;
  font(ctx, 700, 24, hf);
  const handle = truncate(ctx, spec.handle.toUpperCase(), FACE_W - PAD * 2 - 200);
  withTracking(ctx, '1.5px', () => ctx.fillText(handle, PAD, FACE_H - PAD));
}

function eyebrow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillStyle = C.red;
  font(ctx, 700, 26, BODY_FAMILY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  withTracking(ctx, '3px', () => ctx.fillText(text.toUpperCase(), x, y));
}

function drawContentFace(
  ctx: CanvasRenderingContext2D,
  spec: Extract<FaceSpec, { kind: 'content' }>,
  o: DrawFaceOptions
) {
  paintBase(ctx, o.doodle);
  const hf = headingFamily(o.headingFont);
  let y = PAD + 30;
  eyebrow(ctx, spec.eyebrow, PAD, y);
  y += 30;
  if (spec.heading) {
    ctx.fillStyle = C.white;
    font(ctx, 700, 60, hf);
    y = drawWrapped(ctx, spec.heading, PAD, y, FACE_W - PAD * 2, 64);
  }
  y += 48;

  if (spec.body.type === 'list') {
    const items = spec.body.items.slice(0, 6);
    const r = 44;
    const rowH = Math.min(132, (FACE_H - y - PAD - 40) / Math.max(items.length, 1));
    for (const it of items) {
      const cy = y + r;
      drawCircleMedia(ctx, it.media, o.images, PAD + r, cy, r);
      ctx.fillStyle = C.white;
      font(ctx, 700, 38, BODY_FAMILY);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(
        truncate(ctx, it.name, FACE_W - PAD - (PAD + r * 2 + 28)),
        PAD + r * 2 + 28,
        cy - 2
      );
      if (it.secondary) {
        ctx.fillStyle = C.grey500;
        font(ctx, 500, 28, BODY_FAMILY);
        ctx.fillText(
          truncate(ctx, it.secondary, FACE_W - PAD - (PAD + r * 2 + 28)),
          PAD + r * 2 + 28,
          cy + 34
        );
      }
      y += rowH;
    }
  } else {
    // Big stat, vertically centred. Auto-fit to the column: a short grade ("4")
    // stays huge, a long predicted side ("Bosnia & Herzegovina") shrinks to fit
    // instead of clipping off the page edge.
    const cy = (y + (FACE_H - PAD)) / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const big = spec.body.big;
    const unitW = spec.body.unit ? 150 : 0;
    const maxBig = FACE_W - PAD * 2 - unitW;
    let bigSize = 230;
    font(ctx, 700, bigSize, hf);
    while (bigSize > 60 && ctx.measureText(big).width > maxBig) {
      bigSize -= 8;
      font(ctx, 700, bigSize, hf);
    }
    ctx.fillStyle = C.white;
    ctx.fillText(big, PAD - 4, cy);
    if (spec.body.unit) {
      const bw = ctx.measureText(big).width;
      ctx.fillStyle = C.grey500;
      font(ctx, 600, Math.min(70, Math.round(bigSize * 0.4)), BODY_FAMILY);
      ctx.fillText(spec.body.unit, PAD - 4 + bw + 16, cy);
    }
    if (spec.body.caption) {
      ctx.fillStyle = C.grey500;
      font(ctx, 500, 32, BODY_FAMILY);
      drawWrapped(ctx, spec.body.caption, PAD, cy + 40, FACE_W - PAD * 2 - 120, 44);
    }
  }

  if (spec.folio != null) {
    ctx.fillStyle = C.grey500;
    font(ctx, 500, 22, BODY_FAMILY);
    ctx.textAlign = 'left';
    ctx.fillText(String(spec.folio).padStart(2, '0'), PAD, FACE_H - PAD + 14);
  }
}

function drawPhotoFace(
  ctx: CanvasRenderingContext2D,
  spec: Extract<FaceSpec, { kind: 'photo' }>,
  o: DrawFaceOptions
) {
  const img = o.images.get(spec.url);
  if (img) {
    drawCover(ctx, img, 0, 0, FACE_W, FACE_H);
  } else {
    paintBase(ctx, o.doodle);
  }
  // Bottom scrim for the caption.
  const g = ctx.createLinearGradient(0, FACE_H * 0.55, 0, FACE_H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(0, FACE_H * 0.55, FACE_W, FACE_H * 0.45);
  let y = FACE_H - PAD;
  if (spec.caption) {
    ctx.fillStyle = C.white;
    font(ctx, 700, 56, headingFamily(o.headingFont));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(truncate(ctx, spec.caption, FACE_W - PAD * 2), PAD, y);
    y -= 64;
  }
  if (spec.eyebrow) eyebrow(ctx, spec.eyebrow, PAD, y);
}

function drawBackFace(
  ctx: CanvasRenderingContext2D,
  spec: Extract<FaceSpec, { kind: 'back' }>,
  o: DrawFaceOptions
) {
  // Doodle texture behind everything (same as the inner pages).
  paintBase(ctx, o.doodle);

  // Top-left cluster — matches the cover: wordmark → kicker → date.
  drawWordmark(ctx, PAD, PAD);
  let ty = PAD + 88;
  if (spec.kicker) {
    ctx.fillStyle = C.white;
    font(ctx, 500, 16, BODY_FAMILY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    withTracking(ctx, '4px', () => ctx.fillText(spec.kicker!.toUpperCase(), PAD, ty));
    ty += 23;
  }
  if (spec.date) {
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    font(ctx, 500, 16, BODY_FAMILY);
    ctx.textAlign = 'left';
    withTracking(ctx, '3px', () => ctx.fillText(spec.date!.toUpperCase(), PAD, ty));
  }

  // Closing copy, lower half: the line, then the CTA with a red accent.
  ctx.textAlign = 'left';
  let y = FACE_H * 0.6;
  ctx.fillStyle = C.white;
  font(ctx, 700, 58, headingFamily(o.headingFont));
  y = drawWrapped(ctx, spec.line, PAD, y, FACE_W - PAD * 2, 64);
  // CTA on ONE line, same size throughout: lead in white, accent in BTL red.
  if (spec.ctaLead || spec.ctaAccent) {
    y += 52;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    font(ctx, 700, 38, BODY_FAMILY);
    let cx = PAD;
    if (spec.ctaLead) {
      const lead = `${spec.ctaLead} `;
      ctx.fillStyle = C.white;
      ctx.fillText(lead, cx, y);
      cx += ctx.measureText(lead).width;
    }
    if (spec.ctaAccent) {
      ctx.fillStyle = C.red;
      ctx.fillText(spec.ctaAccent, cx, y);
    }
  }
  if (spec.colophon) {
    ctx.fillStyle = C.grey500;
    font(ctx, 500, 22, BODY_FAMILY);
    ctx.fillText(spec.colophon, PAD, FACE_H - PAD + 14);
  }
}

// ── shared small utils ────────────────────────────────────────────────────────

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

/**
 * Paint one FaceSpec to a fresh canvas and return it. The caller wraps it in a
 * CanvasTexture (kept out of here so this stays render-target-agnostic + unit
 * testable without three.js).
 */
export function drawFaceCanvas(spec: FaceSpec, o: DrawFaceOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  switch (spec.kind) {
    case 'cover':
      drawCoverFace(ctx, spec, o);
      break;
    case 'content':
      drawContentFace(ctx, spec, o);
      break;
    case 'photo':
      drawPhotoFace(ctx, spec, o);
      break;
    case 'back':
      drawBackFace(ctx, spec, o);
      break;
  }
  return canvas;
}
