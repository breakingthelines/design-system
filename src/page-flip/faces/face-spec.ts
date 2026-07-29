// FaceSpec — the single source of truth for what an Issue page *contains*.
//
// One structured descriptor per page, consumed by TWO pure renderers:
//   • `drawFaceCanvas` → a CanvasTexture for the genuinely-3D `Book3D` engine.
//   • `FaceDOM`        → real DOM for the static (no-WebGL / reduced-motion)
//                        fallback reader.
//
// Keeping content as data (not bespoke JSX or pre-baked images) means the 3D
// book and the flat fallback render the SAME issue from one source — no
// double authoring, no drift — and the canvas path can draw crisp type + real
// crests/photos at any zoom. This is the onboarding "First Touch" vocabulary
// (cover, content, full-bleed photo, back); it is intentionally NOT a general
// article-spread model.

/** Heading typeface choice. Body copy is always Inter. */
export type HeadingFont = 'inter' | 'le-monde';

/** Page aspect (width / height) — matches the `Book3D` page geometry. */
export const FACE_ASPECT = 1.28 / 1.71;

/** Token colours (mirror of design-system CSS variables, for the canvas path). */
export const FACE_COLORS = {
  black: '#0d0d0d',
  ink: '#0b0b0d',
  grey500: '#807c7c',
  grey300: '#2b2b2b',
  grey200: '#151515',
  white: '#ffffff',
  red: '#eb0000',
} as const;

/**
 * Canvas family string for the chosen heading font.
 *
 * The serif is `lemonde-journal`, not `le-monde-journal-std`. The typekit kit
 * (use.typekit.net/vfh2lle.css) publishes three Le Monde families —
 * `lemonde-journal`, `le-monde-journal-std-2` and `le-monde-livre-std` — and
 * `le-monde-journal-std` is not one of them, so every reference to that name
 * fell back to Georgia. Of the two journal cuts only `lemonde-journal` ships a
 * real 700, which headings need; `-std-2` is 400-only and would be faux-bolded.
 */
export function headingFamily(font: HeadingFont): string {
  return font === 'le-monde' ? "'lemonde-journal', Georgia, serif" : "'Inter', sans-serif";
}

/** The body / UI family (always Inter). */
export const BODY_FAMILY = "'Inter', system-ui, sans-serif";

/**
 * A resolved image with a graceful fallback. `url` is the CORS-clean source (a
 * crest, logo, avatar, or photo); `null` means draw the tinted `monogram`
 * instead. The 3D path loads `url` with `crossOrigin='anonymous'`, so a
 * non-CORS or 404 image fails closed to the monogram — it never taints the
 * canvas, so the WebGL texture upload can't throw.
 */
export interface FaceImage {
  url: string | null;
  /** 1–2 letter fallback (e.g. initials). */
  monogram: string;
  /** Photo/portrait → `cover`; crest/logo → `contain`. Default `cover`. */
  fit?: 'cover' | 'contain';
  /** Background tint behind a contained mark / while empty. */
  tint?: string;
}

/** A media + name (+ secondary) row, used by `your football` / `who you read`. */
export interface FaceListItem {
  media: FaceImage;
  name: string;
  secondary?: string;
}

/** Cover photo crop/pan, authored in the cover editor. */
export interface CoverTransform {
  /** Zoom; 1 = cover-fit, >1 zoomed in. */
  scale: number;
  /** Pan as a fraction of the overflow, -1..1 (0 = centred). */
  x: number;
  y: number;
}

export interface CoverFaceSpec {
  kind: 'cover';
  issueNumber: number;
  /** Kicker under the wordmark, e.g. "OFFICIAL FIRST TOUCH". */
  kicker?: string;
  /** Date the first touch was taken, preformatted (e.g. "12 JUN 2026"). */
  date?: string;
  /** The reader's @handle — the small bottom-left credit line. */
  handle: string;
  /** Clubs the reader likes — top-right crest grid (rows of two, max 4). */
  clubs?: FaceImage[];
  /** Leagues the reader follows — bottom-right logo grid (rows of two, max 4). */
  leagues?: FaceImage[];
  /**
   * Cover photo — an upload OR an auto-picked high-quality photo of someone the
   * reader follows. Absent → a dark textured cover (last resort).
   */
  coverImage?: { url: string; transform?: CoverTransform };
}

export type ContentBody =
  | { type: 'list'; items: FaceListItem[] }
  | {
      type: 'stat';
      big: string;
      unit?: string;
      caption?: string;
      /** Vertical anchor of the stat block. Default 'center'. Use 'top'/'bottom'
       *  to stagger two stat faces across a spread so they don't collide. */
      align?: 'top' | 'center' | 'bottom';
    };

export interface ContentFaceSpec {
  kind: 'content';
  /** Section kicker (red, tracked, small). */
  eyebrow: string;
  heading?: string;
  /** Page number; omit to hide. */
  folio?: number;
  body: ContentBody;
}

/** A full-bleed filler photo of a followed entity — the "padding" page. */
export interface PhotoFaceSpec {
  kind: 'photo';
  url: string;
  /** Bottom-left label (entity name). */
  caption?: string;
  /** Small eyebrow above the caption (e.g. "In your corner"). */
  eyebrow?: string;
}

export interface BackFaceSpec {
  kind: 'back';
  /** Kicker under the wordmark, top-left (matches the cover), e.g. "OFFICIAL FIRST TOUCH". */
  kicker?: string;
  /** Date under the kicker, top-left (matches the cover). */
  date?: string;
  /** The closing line, e.g. "This is your First Touch". */
  line: string;
  /** CTA lead-in (white), e.g. "Time to start". */
  ctaLead?: string;
  /** CTA accent rendered in BTL red, e.g. "Breaking The Lines". */
  ctaAccent?: string;
  /** Footer colophon (e.g. "First Touch · @handle"). */
  colophon?: string;
}

export type FaceSpec = CoverFaceSpec | ContentFaceSpec | PhotoFaceSpec | BackFaceSpec;

/** All distinct image URLs referenced across the given specs (for preloading). */
export function collectFaceImageUrls(specs: FaceSpec[]): string[] {
  const urls = new Set<string>();
  for (const s of specs) {
    if (s.kind === 'cover') {
      if (s.coverImage?.url) urls.add(s.coverImage.url);
      s.clubs?.forEach((m) => m.url && urls.add(m.url));
      s.leagues?.forEach((m) => m.url && urls.add(m.url));
    } else if (s.kind === 'content' && s.body.type === 'list') {
      s.body.items.forEach((it) => it.media.url && urls.add(it.media.url));
    } else if (s.kind === 'photo') {
      urls.add(s.url);
    }
  }
  return [...urls];
}
