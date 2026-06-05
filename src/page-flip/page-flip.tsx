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
/** Default page aspect (width / height) — close to an A-series magazine page. */
const DEFAULT_PAGE_ASPECT = 0.707;
/** Base page width handed to the engine (it scales to the container via `stretch`). */
const ENGINE_BASE_WIDTH = 550;

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

  // ── Index (single source of truth for the hover control + flat layer). ─────
  const [index, setIndex] = useState(() => clampIndex(initialIndex, Math.max(positions, 1)));
  const [isTurning, setIsTurning] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  // ── Audio (synthesised paper flip, persistent mute). ──────────────────────
  const audio = useMemo<FlipAudioSource>(
    () => audioSource ?? (sound ? new SynthFlipAudioSource() : new SilentFlipAudioSource()),
    [audioSource, sound]
  );
  const [muted, setMutedState] = useState(false);
  useEffect(() => {
    setMutedState(audio.muted);
    return () => audio.dispose();
  }, [audio]);
  const toggleMute = useCallback(() => {
    const next = !audio.muted;
    audio.setMuted(next);
    setMutedState(next);
  }, [audio]);

  // ── The engine instance + its mount host. ─────────────────────────────────
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PageFlipEngine | null>(null);

  // Fire onIndexChange exactly once per settle, deriving direction from the move.
  const commitIndex = useCallback(
    (next: number) => {
      const prev = indexRef.current;
      if (next === prev) return;
      const dir: FlipDirection = next > prev ? 'forward' : 'backward';
      setIndex(next);
      onIndexChange?.(next, dir);
    },
    [onIndexChange]
  );

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

    const pageEls = Array.from(
      book.querySelectorAll<HTMLElement>('[data-page-flip-leaf]')
    );
    if (pageEls.length === 0) return;

    let engine: PageFlipEngine | null = null;
    try {
      engine = new PageFlipEngine(host, {
        // Stretch to the container, bounded — the book fills the reader frame.
        size: 'stretch',
        width: ENGINE_BASE_WIDTH,
        height: Math.round(ENGINE_BASE_WIDTH / pageAspectRatio),
        minWidth: 220,
        maxWidth: 2000,
        minHeight: Math.round(220 / pageAspectRatio),
        maxHeight: 2400,
        // Cover shown alone, then opens to a spread.
        showCover: true,
        usePortrait: true,
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
      });
      engine.on('changeState', (e) => {
        const state = e.data as FlippingStateName;
        const turning = state === 'flipping' || state === 'user_fold';
        setIsTurning(turning);
        if (turning) audio.playFlip(indexRef.current);
      });

      engine.loadFromHTML(pageEls);
      engineRef.current = engine;
    } catch {
      // The engine threw (locked-down env, zero-size container, etc.). Fall back
      // to the flat column — the page DOM is already rendered, so reading is
      // uninterrupted; we just won't animate.
      engineRef.current = null;
      setEnhanced(false);
    }

    return () => {
      try {
        engine?.destroy();
      } catch {
        // destroy() can throw if the container was already torn down by React;
        // safe to ignore on unmount.
      }
      engineRef.current = null;
    };
  }, [
    usingEngine,
    pageKey,
    pages.length,
    pageAspectRatio,
    shadowStrength,
    resolvedMode,
    initialIndex,
    commitIndex,
    audio,
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

      {/* The mount host the engine renders into (kept empty until enhanced). */}
      {usingEngine && (
        <div
          ref={hostRef}
          data-page-flip-stage=""
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        />
      )}

      {/* Edge interaction layer: hover shows a small page-curl; click turns. NO
          drag. Only when the engine is active (flat mode navigates via the
          control + page scroll). */}
      {usingEngine && (
        <EdgeAffordances
          atStart={atStart}
          atEnd={atEnd}
          isTurning={isTurning}
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
          muted={muted}
          onPrev={prev}
          onNext={next}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
});

/**
 * Edge hover-curl + click-to-turn affordances. Two narrow hot-zones hug the
 * left and right edges; hovering one lifts a small paper "peel" triangle from
 * the corner (a hint that the page can be turned), and clicking it turns. This
 * replaces the engine's own corner-fold (we keep `useMouseEvents: false` so
 * there is no drag), giving a deterministic edge-click model.
 *
 * The zones are `data-page-flip-exclude` so the rest of the flip chrome ignores
 * them, and they sit above the engine canvas but only along the edges, leaving
 * the page body free for selection / link clicks (which the engine forwards).
 */
function EdgeAffordances({
  atStart,
  atEnd,
  isTurning,
  onPrev,
  onNext,
}: {
  atStart: boolean;
  atEnd: boolean;
  isTurning: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <EdgeZone
        side="left"
        disabled={atStart || isTurning}
        onActivate={onPrev}
        label="Previous page"
      />
      <EdgeZone side="right" disabled={atEnd || isTurning} onActivate={onNext} label="Next page" />
    </>
  );
}

function EdgeZone({
  side,
  disabled,
  onActivate,
  label,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onActivate: () => void;
  label: string;
}) {
  const [hover, setHover] = useState(false);
  const isRight = side === 'right';
  // The peel triangle sits at the outer-bottom corner and grows on hover.
  const peelSize = hover && !disabled ? 56 : 0;

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
        top: 0,
        bottom: 0,
        [side]: 0,
        width: '12%',
        maxWidth: 96,
        minWidth: 40,
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
        cursor: disabled ? 'default' : 'pointer',
        zIndex: 4,
        // Let pointer events through the body of the zone except where we want
        // the click target; keeping it a button gives keyboard + a11y for free.
        pointerEvents: disabled ? 'none' : 'auto',
        outline: 'none',
      }}
    >
      {/* The page-curl peel hint — a soft folded-corner triangle. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          bottom: 0,
          [isRight ? 'right' : 'left']: 0,
          width: peelSize,
          height: peelSize,
          transition: `width ${motion.duration.standard}ms ${motion.easing.entrance}, height ${motion.duration.standard}ms ${motion.easing.entrance}`,
          // A diagonal gradient reads as a lifted paper corner with a soft shadow.
          background: isRight
            ? 'linear-gradient(225deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 45%, transparent 55%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 45%, transparent 55%)',
          boxShadow:
            peelSize > 0
              ? `${isRight ? '-' : ''}6px -6px 12px rgba(0,0,0,0.45)`
              : 'none',
          borderRadius: isRight ? '0 0 2px 0' : '0 0 0 2px',
          pointerEvents: 'none',
        }}
      />
    </button>
  );
}

function clampIndex(i: number, count: number): number {
  return Math.max(0, Math.min(i, Math.max(count - 1, 0)));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Re-export the OrientationName type for consumers that key off orientation.
export type { OrientationName };
