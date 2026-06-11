import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  PageFlip as PageFlipEngine,
  type FlippingStateName,
  type OrientationName,
  type PageRect,
} from 'page-flip';

import { motion } from '#/tokens/motion';
import { positionCount, type FlipDirection } from './book';
import { prefersReducedMotion } from './capability';
import { SilentFlipAudioSource, SynthFlipAudioSource, type FlipAudioSource } from './flip-audio';
import { FlipHoverControl } from './flip-hover-control';
import { useBookLayout, type BookModePreference } from './use-book-layout';

/**
 * How the turn is rendered.
 *  - `curl`       the realistic paper page-turn from the StPageFlip engine. The
 *                 cover is shown alone (hard cover); it opens into a two-page
 *                 SPREAD on wide/landscape viewports, single page on
 *                 portrait/narrow. Edge hover shows a small page-curl; an
 *                 edge-click turns the page. There is NO drag-to-flip.
 *  - `flat`       no engine — a plain, scrollable single-page column. The SSR /
 *                 first-paint representation and the reduced-motion path.
 *                 Fully navigable (the hover control + edge clicks still work).
 *  - `cover-open` opt-in ceremony intent for the Issue #1 reveal. Behaves like
 *                 `curl` (cover shown alone, then opens) but is forced single so
 *                 the cover stays full-bleed; the reveal flow keys its
 *                 choreography off this intent. Degrades to `flat` under
 *                 reduced-motion.
 *
 * `skim` is retained as an accepted value for API compatibility (multi-page
 * jumps); it maps onto the engine's instant `turnToPage` under the hood.
 */
export type FlipMode = 'curl' | 'skim' | 'flat' | 'cover-open';

export interface PageFlipPage {
  /** Stable key for the page. */
  id: string;
  /** The page DOM. Rendered live in `flat` mode; handed to the engine on enhance. */
  render: () => React.ReactNode;
}

export interface PageFlipProps {
  pages: PageFlipPage[];
  initialIndex?: number;
  /**
   * Force a mode. Omit to let the runtime choose: `curl` (the StPageFlip engine)
   * on capable clients, `flat` on the server / first paint / reduced-motion.
   */
  mode?: FlipMode;
  /**
   * Single page or two-page spread. `'auto'` (default) resolves responsively:
   * spread on wide landscape, single on portrait / narrow — à la DearFlip
   * `pageMode: AUTO`. Force `'single'` / `'spread'` to override.
   */
  bookMode?: BookModePreference;
  /**
   * Curl tuning. `radius` is accepted for API compatibility (the engine derives
   * its own page geometry); `shadowStrength` maps to the engine's
   * `maxShadowOpacity` (0..1).
   */
  radius?: number;
  shadowStrength?: number;
  /** Accepted for API compatibility; the engine renders DOM directly (no raster freeze). */
  freezeDpr?: number;
  /** Background painted behind the book (defaults to the dark ground). */
  freezeBackground?: string;
  /** Fired when the visible page settles. */
  onIndexChange?: (index: number, direction: FlipDirection) => void;
  /** Accepted for API compatibility; unused by the DOM engine. */
  faceSource?: unknown;
  /**
   * Pluggable audio. Defaults to a synthesised paper-flip ({@link SynthFlipAudioSource}).
   * Pass your own (keyed by spread) for per-spread soundtracks, or omit + set
   * `sound={false}` for silence.
   */
  audioSource?: FlipAudioSource;
  /** Master switch for flip sound. Default `true` (with a persistent mute toggle). */
  sound?: boolean;
  /** Show the hover-to-advance control (reuses the article-detail floating bar). Default `true`. */
  showHoverControl?: boolean;
  /** Base page aspect ratio (width / height) the engine sizes against. Default 0.707 (≈A-series). */
  pageAspectRatio?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label for the flip region. */
  'aria-label'?: string;
}

export interface PageFlipHandle {
  next(): void;
  prev(): void;
  goTo(index: number): void;
  index: number;
}

const DEFAULT_FREEZE_BG = '#0d0d0d';
/**
 * The page LEAF's own surface — a subtly elevated material distinct from the
 * near-black stage, so an empty/transparent page still reads as a physical leaf
 * and not a hole in the backdrop. Deliberately dark (this is a dark-themed
 * magazine) but a clear step above {@link DEFAULT_FREEZE_BG}. The platform
 * supplies the page CONTENT and may paint its own background on top; the lift
 * that survives any content colour is the EDGE + SHADOW below, not this fill.
 */
const LEAF_SURFACE = '#1a1a1a';
/** Default page aspect (width / height) — close to an A-series magazine page. */
const DEFAULT_PAGE_ASPECT = 0.707;
/** Base page width handed to the engine (it scales to the container via `stretch`). */
const ENGINE_BASE_WIDTH = 550;
/**
 * `minWidth` floor for the engine in a normal (responsive) build.
 */
const ENGINE_MIN_WIDTH = 220;
/**
 * `minWidth` used to LOCK the engine into portrait (single-page) layout.
 *
 * StPageFlip has no "force portrait" flag — in `stretch` mode it derives the
 * orientation purely from `blockWidth < minWidth * 2` (with `usePortrait`).
 * Our responsive `layout` (single vs spread) is computed in React and, for the
 * Issue-reveal ceremony, FORCED to `single`; but that decision never reached
 * the engine, so on any container wider than `minWidth * 2` (≈440px — i.e. most
 * desktops and the full-bleed reveal) the engine silently chose LANDSCAPE and
 * drew the lone hard cover on the RIGHT half only, leaving the left half blank
 * (the "cover renders empty" bug). Passing a `minWidth` larger than any sane
 * reader half-width makes `blockWidth < minWidth * 2` always true, pinning the
 * engine to portrait so the single cover fills the full frame.
 *
 * The matching `min-width` inline style the engine writes on its host is reset
 * immediately after construction (see the effect) so this large value cannot
 * leak out and overflow a narrow frame — the engine only consults the *setting*
 * for the orientation maths, never the host's computed box.
 */
const ENGINE_PORTRAIT_LOCK_MIN_WIDTH = 4000;

/**
 * Surface styling for the engine's page leaves, scoped under
 * `[data-page-flip-root]` so it only ever touches our flip. The engine rewrites
 * each leaf's inline `style.cssText` on every animation frame (position + size
 * only — see StPageFlip `HTMLPage.simpleDraw`), so per-leaf inline styling for
 * the surface would be wiped. A stylesheet rule survives: the engine never sets
 * `background`/`box-shadow`/`border-radius`, so these fill in cleanly and give
 * the leaf a real physical surface that lifts off the near-black stage.
 *
 * The platform owns the page CONTENT (which may paint its own background — the
 * current Issue content is `bg-black`); the lift that reads regardless of the
 * content fill is the drop SHADOW + the crisp edge, both of which render
 * outside the content box and so are never covered by it. The `background` here
 * is a fallback material for transparent / partially-filled pages.
 */
const LEAF_SURFACE_STYLE_ID = 'btl-page-flip-leaf-surface';
const LEAF_SURFACE_CSS = `
[data-page-flip-root] .stf__item {
  background-color: ${LEAF_SURFACE};
}
/* The page AT REST (static leaf): a crisp rounded edge + layered drop shadow so
   it reads as a lifted physical page against the near-black stage. We scope the
   edge + clip to the static leaf only — the FLIPPING leaf uses 3D transforms and
   absolutely-positioned curl shadows, so clipping it would cut the curl. */
[data-page-flip-root] .stf__item.--simple {
  border-radius: 2px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.07),
    0 2px 6px rgba(0, 0, 0, 0.55),
    0 18px 50px rgba(0, 0, 0, 0.7);
}
/* The hard cover leaf gets a touch more lift — it's the object the reveal opens.
   No overflow clip (a hard leaf can flip as a rigid panel). */
[data-page-flip-root] .stf__item.--hard {
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.09),
    0 4px 10px rgba(0, 0, 0, 0.6),
    0 24px 64px rgba(0, 0, 0, 0.78);
}
`;

/**
 * Inject the leaf-surface stylesheet once (client-side). Keyed by a constant id
 * so multiple `<PageFlip>` instances share a single `<style>` in `<head>`.
 */
function useLeafSurfaceStyle(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return;
    if (document.getElementById(LEAF_SURFACE_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = LEAF_SURFACE_STYLE_ID;
    el.textContent = LEAF_SURFACE_CSS;
    document.head.appendChild(el);
    // Intentionally left in place: it's a tiny shared rule, and tearing it down
    // would thrash if another flip is mounting. Harmless to persist.
  }, [active]);
}

/**
 * `<PageFlip>` — the BTL "magazine" page-flip runtime, built on the MIT
 * {@link https://github.com/Nodlik/StPageFlip StPageFlip} engine (`page-flip`).
 *
 * Architecture: pages are real DOM. On the server and at first paint we render a
 * plain, scrollable single-page column (`flat` mode) — crawlable, accessible,
 * and fully navigable with zero JS animation. On a capable client (not
 * reduced-motion) we hand the same page elements to the StPageFlip engine, which
 * renders a realistic paper turn with proper edge shadows.
 *
 * Interaction (per product direction):
 *  - the cover is shown **alone** (a hard cover), then opens into a two-page
 *    **spread** on wide/landscape viewports (single page on portrait/narrow);
 *  - hovering near a page edge shows a small **page-curl** affordance;
 *  - **clicking** the edge turns the page;
 *  - there is **no drag-to-flip** (the engine's own mouse/touch handling is off;
 *    we drive turns via edge-clicks, the hover control, and arrow keys).
 *
 * The flip is pure progressive enhancement: if the engine can't run (SSR,
 * reduced motion) the flat column is the experience and nothing is blocked.
 */
export const PageFlip = forwardRef<PageFlipHandle, PageFlipProps>(function PageFlip(
  {
    pages,
    initialIndex = 0,
    mode,
    bookMode = 'auto',
    // `radius`/`freezeDpr`/`faceSource` are accepted for back-compat with the
    // old WebGL runtime's prop surface; the DOM engine ignores them.
    radius: _radius,
    shadowStrength = motion.ceremony.pageCurl.shadowStrength,
    freezeDpr: _freezeDpr,
    freezeBackground = DEFAULT_FREEZE_BG,
    onIndexChange,
    faceSource: _faceSource,
    audioSource,
    sound = true,
    showHoverControl = true,
    pageAspectRatio = DEFAULT_PAGE_ASPECT,
    className,
    style,
    'aria-label': ariaLabel = 'Magazine pages',
  },
  ref
) {
  // ── Responsive book layout (single vs two-page spread). ───────────────────
  const layout = useBookLayout(bookMode);

  // Turn positions collapse the leaf model so the index stays page-index based:
  // one position per turn (see book.ts). Used for the hover control's progress.
  const positions = positionCount(pages.length, layout);

  // ── Mode resolution. Flat for SSR/first paint (safe, crawlable); upgrade to
  // the engine on the client unless the caller forced a mode or reduced-motion.
  const [enhanced, setEnhanced] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const reduce = prefersReducedMotion();
    setReduceMotion(reduce);
    // Only enhance to the engine when motion is allowed. `flat`/`skim` callers
    // stay flat; `curl`/`cover-open`/undefined enhance.
    const wantsEngine = mode === undefined || mode === 'curl' || mode === 'cover-open';
    setEnhanced(!reduce && wantsEngine);
  }, [mode]);

  const resolvedMode: FlipMode = useMemo(() => {
    if (mode === 'flat' || mode === 'skim') return mode;
    if (reduceMotion) return 'flat';
    if (!enhanced) return 'flat';
    return mode === 'cover-open' ? 'cover-open' : 'curl';
  }, [mode, reduceMotion, enhanced]);

  const usingEngine = resolvedMode === 'curl' || resolvedMode === 'cover-open';

  // Give the engine's leaves a visible physical surface (edge + shadow) once the
  // engine is in play. No-op in flat mode (the flat deck styles its own pages).
  useLeafSurfaceStyle(usingEngine);

  // ── Index (single source of truth for the hover control + flat layer). ─────
  const [index, setIndex] = useState(() => clampIndex(initialIndex, Math.max(positions, 1)));
  const [isTurning, setIsTurning] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  // ── Audio. Off by contract for the reveal (sound={false} → silent source).
  // No in-UI mute toggle anymore; we just dispose the source on unmount.
  const audio = useMemo<FlipAudioSource>(
    () => audioSource ?? (sound ? new SynthFlipAudioSource() : new SilentFlipAudioSource()),
    [audioSource, sound]
  );
  useEffect(() => {
    return () => audio.dispose();
  }, [audio]);

  // ── The engine instance + its mount host. ─────────────────────────────────
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PageFlipEngine | null>(null);

  // ── Live geometry of the VISIBLE page, in this root's coordinate space. ────
  // The engine renders the page as a centred rectangle inside its `.stf__block`
  // (a portrait page is a narrow centred column; a landscape spread is wider),
  // sized by the engine's own bounds maths — NOT the full frame. The edge
  // affordances must hug *that* rectangle's left/right edges, not the host's, or
  // the hover-curl and click target sit out on the empty stage (the edge-broken
  // bug). We read the engine's authoritative `getBoundsRect()` and project it to
  // the visible page box; `null` until measured (or in flat mode).
  const [pageBox, setPageBox] = useState<VisiblePageBox | null>(null);

  // Read the engine's current geometry and store the visible page box. Cheap
  // (the engine caches its bounds rect); called on init, on every turn settle,
  // and on container resize. `.stf__block` is `inset:0` inside the host which is
  // `inset:0` inside this root, so the engine's block-space rect IS root-space.
  //
  // `portraitHint` lets a caller assert the orientation we forced (single-lock):
  // immediately after construction the engine hasn't run its first frame yet, so
  // `getOrientation()` can still be `null` — but `getBoundsRect()` already
  // returns a valid rect. Trusting the hint avoids a one-frame mis-projection of
  // a portrait page as a spread. Resize/turn callers omit it and read the
  // engine's settled orientation.
  const measurePageBox = useCallback((portraitHint?: boolean) => {
    const engine = engineRef.current;
    if (!engine) return;
    let rect: PageRect | null = null;
    try {
      rect = engine.getBoundsRect();
    } catch {
      rect = null;
    }
    if (!rect) return;
    const reported = safeOrientation(engine);
    const portrait = portraitHint ?? reported === 'portrait';
    setPageBox(visiblePageBox(rect, portrait));
  }, []);

  // Fire onIndexChange exactly once per settle, deriving direction from the move.
  // The callback is read through a ref so commitIndex stays referentially STABLE
  // even when the parent passes a fresh onIndexChange each render. Otherwise the
  // engine effect (which depends on commitIndex) tears down + rebuilds StPageFlip
  // from leaf DOM the previous engine already moved — on every parent re-render —
  // which blanks the reader. (Surfaced when IssueReader's reveal ceremony state,
  // e.g. the nav hint, re-rendered this component mid-flow.)
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const commitIndex = useCallback((next: number) => {
    const prev = indexRef.current;
    if (next === prev) return;
    const dir: FlipDirection = next > prev ? 'forward' : 'backward';
    setIndex(next);
    onIndexChangeRef.current?.(next, dir);
  }, []);

  // Build the engine once enhanced + the page DOM is in place. We deliberately
  // depend on the page IDS (a frozen Issue's faces are immutable) so the engine
  // is rebuilt only when the actual page set changes, not on every render.
  const pageKey = useMemo(() => pages.map((p) => p.id).join('|'), [pages]);

  useEffect(() => {
    if (!usingEngine) return;
    const host = hostRef.current;
    const book = bookRef.current;
    if (!host || !book) return;
    if (typeof window === 'undefined') return;

    const pageEls = Array.from(book.querySelectorAll<HTMLElement>('[data-page-flip-leaf]'));
    if (pageEls.length === 0) return;

    // Drive the ENGINE's orientation from the same `layout` signal the rest of
    // the component uses (the engine has no orientation flag of its own):
    //  - `spread`  → `usePortrait: false`, so the engine is always LANDSCAPE
    //                (a true two-page spread).
    //  - `single`  → `usePortrait: true` + a `minWidth` larger than any sane
    //                reader half-width, so `blockWidth < minWidth * 2` is always
    //                true and the engine is pinned to PORTRAIT. This is what
    //                makes the lone hard cover fill the WHOLE frame instead of
    //                collapsing onto the right half (the cover-blank bug).
    const lockPortrait = layout === 'single';
    const engineMinWidth = lockPortrait ? ENGINE_PORTRAIT_LOCK_MIN_WIDTH : ENGINE_MIN_WIDTH;

    let engine: PageFlipEngine | null = null;
    let ro: ResizeObserver | null = null;
    let rafId = 0;
    try {
      engine = new PageFlipEngine(host, {
        // Stretch to the container, bounded — the book fills the reader frame.
        size: 'stretch',
        width: ENGINE_BASE_WIDTH,
        height: Math.round(ENGINE_BASE_WIDTH / pageAspectRatio),
        minWidth: engineMinWidth,
        maxWidth: 2000,
        minHeight: Math.round(ENGINE_MIN_WIDTH / pageAspectRatio),
        maxHeight: 2400,
        // Cover shown alone, then opens to a spread (landscape) — or stays a
        // single full-frame page (portrait), per `layout` above.
        showCover: true,
        usePortrait: lockPortrait,
        autoSize: true,
        // Realistic edge shadows.
        drawShadow: true,
        maxShadowOpacity: clamp01(shadowStrength),
        flippingTime:
          resolvedMode === 'cover-open'
            ? motion.ceremony.pageCurl.duration + 180
            : motion.ceremony.pageCurl.duration,
        startPage: clampIndex(initialIndex, pages.length),
        // NO drag-to-flip: the engine's own pointer handling is off; we drive
        // turns ourselves (edge clicks, hover control, arrow keys). This also
        // disables the engine's corner-fold-on-hover — we render our own.
        useMouseEvents: false,
        showPageCorners: false,
        // Let clicks on <a>/<button> inside a page reach the control.
        clickEventForward: true,
        mobileScrollSupport: true,
      });

      engine.on('flip', (e) => {
        commitIndex(typeof e.data === 'number' ? e.data : engine!.getCurrentPageIndex());
        // The visible page can change side/size across a turn (e.g. cover →
        // first spread); re-measure so the edge affordances follow it.
        measurePageBox();
      });
      engine.on('changeState', (e) => {
        const state = e.data as FlippingStateName;
        const turning = state === 'flipping' || state === 'user_fold';
        setIsTurning(turning);
        if (turning) audio.playFlip(indexRef.current);
        // On settle, the engine has re-laid the static pages — measure then.
        if (state === 'read') measurePageBox();
      });

      engine.loadFromHTML(pageEls);

      // ── Two post-construction corrections the engine's own styles need. ────

      // (1) The engine writes `min-width: <minWidth>px` on its host in its UI
      // constructor. When we inflate `minWidth` to lock portrait, that style
      // would otherwise force the host wider than a narrow frame and overflow.
      // The engine never reads this style back for orientation (it uses the
      // numeric *setting*), so it's safe to clear it — the host is
      // `position: absolute; inset: 0` and fills the frame regardless.
      if (lockPortrait) host.style.minWidth = '0px';

      // (2) Defeat the upstream stylesheet typo. StPageFlip's CSS intends
      // `.stf__wrapper { position: relative; width: 100%; ... }` but ships it
      // as `.sft__wrapper`, so the rule never matches and the wrapper collapses
      // to zero width. On its own that's harmless (the absolutely-positioned
      // `.stf__block` is sized/positioned against the host, which fills the
      // frame), but give the wrapper its intended width so any layout reading
      // the wrapper box is correct. We deliberately do NOT set
      // `position: relative` here: the block must keep sizing against the
      // full-frame host, not the wrapper (whose height is only a
      // padding-bottom ratio — making it the block's containing block would
      // size the page off the wrong axis and overflow the frame).
      const wrapper = host.querySelector<HTMLElement>('.stf__wrapper');
      if (wrapper) wrapper.style.width = '100%';

      engineRef.current = engine;

      // Measure the visible page now that it's laid out (trusting the
      // orientation we forced via `lockPortrait`, since the engine's first frame
      // — which sets `getOrientation()` — hasn't run yet), then again on the
      // next frame once the engine has settled its bounds (the source of truth
      // for the spread case), and on every container resize. A ResizeObserver on
      // the host keeps the edges glued to the page at any size — including the
      // portrait column growing as the stage gets taller.
      measurePageBox(lockPortrait);
      rafId = requestAnimationFrame(() => measurePageBox(lockPortrait));
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => measurePageBox(lockPortrait));
        ro.observe(host);
      }
    } catch {
      // The engine threw (locked-down env, zero-size container, etc.). Fall back
      // to the flat column — the page DOM is already rendered, so reading is
      // uninterrupted; we just won't animate.
      engineRef.current = null;
      setPageBox(null);
      setEnhanced(false);
    }

    return () => {
      ro?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      try {
        engine?.destroy();
      } catch {
        // destroy() can throw if the container was already torn down by React;
        // safe to ignore on unmount.
      }
      engineRef.current = null;
      setPageBox(null);
    };
  }, [
    usingEngine,
    pageKey,
    pages.length,
    pageAspectRatio,
    shadowStrength,
    resolvedMode,
    // `layout` drives the engine's orientation (portrait vs landscape), so a
    // single↔spread re-resolution must rebuild the engine with the right mode.
    layout,
    initialIndex,
    commitIndex,
    audio,
    measurePageBox,
  ]);

  // ── Imperative controls. Route through the engine when present, else flat. ──
  // These are only ever called from user gestures (edge click, arrow key, the
  // hover control), so they're the right place to unlock the audio backend
  // (browser autoplay policy requires a gesture before the first sound).
  const next = useCallback(() => {
    audio.resume();
    const engine = engineRef.current;
    if (engine) {
      engine.flipNext('top');
      return;
    }
    commitIndex(clampIndex(indexRef.current + 1, Math.max(positions, 1)));
  }, [commitIndex, positions, audio]);

  const prev = useCallback(() => {
    audio.resume();
    const engine = engineRef.current;
    if (engine) {
      engine.flipPrev('top');
      return;
    }
    commitIndex(clampIndex(indexRef.current - 1, Math.max(positions, 1)));
  }, [commitIndex, positions, audio]);

  const goTo = useCallback(
    (to: number) => {
      const engine = engineRef.current;
      if (engine) {
        // Multi-page jump → instant turn (the old `skim`), no per-leaf curl.
        engine.turnToPage(clampIndex(to, pages.length));
        commitIndex(clampIndex(to, pages.length));
        return;
      }
      commitIndex(clampIndex(to, Math.max(positions, 1)));
    },
    [commitIndex, pages.length, positions]
  );

  useImperativeHandle(
    ref,
    () => ({
      next,
      prev,
      goTo,
      get index() {
        return indexRef.current;
      },
    }),
    [next, prev, goTo]
  );

  // ── Keyboard: ArrowLeft / ArrowRight turn the page. ───────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // ── Flat-mode navigation (no engine): show one page at a time. ────────────
  // In flat mode the index maps 1:1 to a page (single layout); we render the
  // whole deck but only reveal the current page, so it's a clean, scrollable
  // single-column reader that always works.
  const atStart = index <= 0;
  const atEnd = index >= Math.max(positions, 1) - 1;

  const total = Math.max(positions, 1);

  return (
    <div
      role="group"
      aria-roledescription="magazine"
      aria-label={ariaLabel}
      data-page-flip-root=""
      data-mode={resolvedMode}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: freezeBackground,
        overflow: 'hidden',
        ...style,
      }}
    >
      {/*
        The page DOM. In flat mode this column IS the reader (one page shown at a
        time). When enhanced, the engine takes these elements over (it moves them
        into its own `.stf__*` structure on `loadFromHTML`), so we hide this
        flat presentation and let the engine render. We always render the leaf
        elements so the engine has DOM to load and so SSR/no-JS shows real pages.
      */}
      <div
        ref={bookRef}
        data-page-flip-deck=""
        aria-hidden={usingEngine ? true : undefined}
        style={{
          position: usingEngine ? 'absolute' : 'relative',
          inset: usingEngine ? 0 : undefined,
          width: '100%',
          height: '100%',
          // When the engine is active the flat deck is fully hidden — the engine
          // owns the visual. When flat, the deck is the experience.
          visibility: usingEngine ? 'hidden' : 'visible',
          pointerEvents: usingEngine ? 'none' : 'auto',
          overflow: usingEngine ? 'hidden' : 'auto',
        }}
      >
        {pages.map((page, i) => (
          <div
            key={page.id}
            data-page-flip-leaf=""
            data-page-index={i}
            style={
              usingEngine
                ? // Sizing for engine pages is driven by the engine; keep them
                  // block-level with the page background so a hard cover/edge
                  // reads cleanly.
                  { width: '100%', height: '100%', background: freezeBackground }
                : // Flat: only the current page is visible; it scrolls if tall.
                  {
                    display: i === index ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    background: freezeBackground,
                  }
            }
          >
            {page.render()}
          </div>
        ))}
      </div>

      {/*
        The mount host the engine renders into (kept empty until enhanced). The
        engine positions and sizes the book itself (it writes `width:100%` +
        `padding-bottom` on its own `.stf__wrapper`), so the host must be a
        plain full-frame block. It must NOT centre its child with grid/flex:
        the engine's wrapper has a `.stf__wrapper` rule that the upstream
        stylesheet misspells as `.sft__wrapper`, so the wrapper has no width of
        its own and a centring host collapses it to zero width — which shifts
        the absolutely-positioned `.stf__block` off-centre (the cover then spills
        past the frame edge). We restore the wrapper geometry imperatively after
        load (see the effect) and keep this host a simple positioned block.
      */}
      {usingEngine && (
        <div
          ref={hostRef}
          data-page-flip-stage=""
          style={{
            position: 'absolute',
            inset: 0,
          }}
        />
      )}

      {/* Edge interaction layer: hover shows a small page-curl; click turns. NO
          drag. Only when the engine is active (flat mode navigates via the
          control + page scroll). The zones are positioned on the ACTUAL visible
          page rectangle (`pageBox`), measured from the engine — so the curl and
          the click target sit on the page's real edges, not the host's. */}
      {usingEngine && (
        <EdgeAffordances
          atStart={atStart}
          atEnd={atEnd}
          isTurning={isTurning}
          pageBox={pageBox}
          onPrev={prev}
          onNext={next}
        />
      )}

      {showHoverControl && (
        <FlipHoverControl
          position={index}
          positionCount={total}
          atStart={atStart}
          atEnd={atEnd}
          isTurning={isTurning}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
});

/**
 * The visible page rectangle, in this root's coordinate space (px). Derived
 * from the engine's bounds rect — the box the user actually sees and whose
 * left/right edges the affordances must hug.
 */
interface VisiblePageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Project the engine's `getBoundsRect()` onto the box the user actually sees.
 *
 * The engine's bounds rect spans the WHOLE book area (`width = pageWidth * 2`)
 * centred in its block, but in portrait only ONE page is drawn — on the right
 * slot, at `[left + pageWidth, left + 2*pageWidth]` (see StPageFlip's
 * `HTMLPage.simpleDraw`). In landscape the full two-page spread is visible.
 * The block fills the host which fills this root, so the rect's block-space
 * coordinates are already this root's coordinates.
 */
function visiblePageBox(rect: PageRect, portrait: boolean): VisiblePageBox {
  return {
    left: portrait ? rect.left + rect.pageWidth : rect.left,
    top: rect.top,
    width: portrait ? rect.pageWidth : rect.width,
    height: rect.height,
  };
}

/** Read the engine orientation defensively (it can throw pre-init). */
function safeOrientation(engine: PageFlipEngine): OrientationName | null {
  try {
    return engine.getOrientation();
  } catch {
    return null;
  }
}

/**
 * Edge hover-curl + click-to-turn affordances. Two narrow hot-zones hug the
 * left and right edges of the VISIBLE page; hovering one lifts a small paper
 * "peel" triangle from the corner (a hint that the page can be turned), and
 * clicking it turns. This replaces the engine's own corner-fold (we keep
 * `useMouseEvents: false` so there is no drag), giving a deterministic
 * edge-click model.
 *
 * Crucially the zones are positioned on `pageBox` — the engine's measured page
 * rectangle — not on the host. The rendered page is a centred column (portrait)
 * or spread (landscape) that rarely fills the host; pinning the zones to the
 * host edges (the old behaviour) put the curl + click target out on the empty
 * stage, so hovering/clicking the real page edge did nothing. Tracking the page
 * rect glues them to the edges the user actually sees, at any size/position.
 *
 * The zones are `data-page-flip-exclude` so the rest of the flip chrome ignores
 * them, and they sit above the engine canvas but only along the page edges,
 * leaving the page body free for selection / link clicks (which the engine
 * forwards).
 */
function EdgeAffordances({
  atStart,
  atEnd,
  isTurning,
  pageBox,
  onPrev,
  onNext,
}: {
  atStart: boolean;
  atEnd: boolean;
  isTurning: boolean;
  pageBox: VisiblePageBox | null;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Until the engine has been measured we have no page rectangle to hug —
  // render nothing rather than guess at the host edges (the old bug).
  if (!pageBox) return null;
  return (
    <>
      <EdgeZone
        side="left"
        disabled={atStart || isTurning}
        pageBox={pageBox}
        onActivate={onPrev}
        label="Previous page"
      />
      <EdgeZone
        side="right"
        disabled={atEnd || isTurning}
        pageBox={pageBox}
        onActivate={onNext}
        label="Next page"
      />
    </>
  );
}

/** Width of the edge hot-zone, as a fraction of the visible page width. */
const EDGE_ZONE_FRACTION = 0.16;
const EDGE_ZONE_MIN = 36;
const EDGE_ZONE_MAX = 88;
/** Peel-triangle size on hover, as a fraction of page width (clamped). */
const PEEL_FRACTION = 0.14;
const PEEL_MIN = 44;
const PEEL_MAX = 72;

function EdgeZone({
  side,
  disabled,
  pageBox,
  onActivate,
  label,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  pageBox: VisiblePageBox;
  onActivate: () => void;
  label: string;
}) {
  const [hover, setHover] = useState(false);
  const isRight = side === 'right';

  // The hot-zone is a slim band on the page's real edge — sized to the page, so
  // it stays a sensible touch target whether the page is a wide spread or a
  // narrow portrait column. We position it absolutely against the page box.
  const zoneWidth = clampPx(pageBox.width * EDGE_ZONE_FRACTION, EDGE_ZONE_MIN, EDGE_ZONE_MAX);
  const peelBase = clampPx(pageBox.width * PEEL_FRACTION, PEEL_MIN, PEEL_MAX);
  const peelSize = hover && !disabled ? peelBase : 0;

  // Left/right offset of the band, measured from the root's left edge: the
  // left band starts at the page's left edge; the right band ends at the page's
  // right edge.
  const leftPx = isRight ? pageBox.left + pageBox.width - zoneWidth : pageBox.left;

  return (
    <button
      type="button"
      data-page-flip-exclude="true"
      data-edge={side}
      aria-label={label}
      disabled={disabled}
      onClick={onActivate}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        top: pageBox.top,
        height: pageBox.height,
        left: leftPx,
        width: zoneWidth,
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
        cursor: disabled ? 'default' : 'pointer',
        zIndex: 4,
        // A button gives keyboard + a11y for free; the body is transparent so
        // the page underneath reads through, only the edge band is interactive.
        pointerEvents: disabled ? 'none' : 'auto',
        outline: 'none',
        // Smoothly follow the page when it resizes/repositions between turns.
        transition: `left ${motion.duration.standard}ms ${motion.easing.standard}, width ${motion.duration.standard}ms ${motion.easing.standard}, top ${motion.duration.standard}ms ${motion.easing.standard}, height ${motion.duration.standard}ms ${motion.easing.standard}`,
      }}
    >
      {/* The page-curl peel hint — a soft folded corner that lifts from the
          TOP-outer corner of the VISIBLE page on hover. Top (not bottom) keeps
          it clear of the hover band that arms the bottom nav control, so the
          first hover always reads as a curl. Gray, not white — it reads as a
          lifted dark page rather than paper. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          [isRight ? 'right' : 'left']: 0,
          width: peelSize,
          height: peelSize,
          transition: `width ${motion.duration.standard}ms ${motion.easing.entrance}, height ${motion.duration.standard}ms ${motion.easing.entrance}`,
          background: isRight
            ? 'linear-gradient(315deg, rgba(160,160,165,0.5) 0%, rgba(40,40,44,0.28) 46%, transparent 62%)'
            : 'linear-gradient(45deg, rgba(160,160,165,0.5) 0%, rgba(40,40,44,0.28) 46%, transparent 62%)',
          boxShadow: peelSize > 0 ? `${isRight ? '-' : ''}6px 6px 16px rgba(0,0,0,0.5)` : 'none',
          borderRadius: isRight ? '0 3px 0 0' : '3px 0 0 0',
          pointerEvents: 'none',
        }}
      />
    </button>
  );
}

function clampPx(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampIndex(i: number, count: number): number {
  return Math.max(0, Math.min(i, Math.max(count - 1, 0)));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Re-export the OrientationName type for consumers that key off orientation.
export type { OrientationName };
