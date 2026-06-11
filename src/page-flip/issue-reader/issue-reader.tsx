import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { positionCount, type FlipDirection } from '../book';
import { PageFlip, type FlipMode, type PageFlipHandle, type PageFlipPage } from '../page-flip';
import type { BookModePreference } from '../use-book-layout';

/**
 * Programme Issue reader — the standalone "open an issue" experience.
 *
 * An Issue is a FROZEN snapshot: its spreads come from the page-composition
 * block renderers rendered to page faces (per the magazine build spec). This
 * component does NOT re-implement the page-flip — it composes the existing
 * {@link PageFlip} runtime (built on the MIT StPageFlip engine): it maps an
 * Issue's ordered faces onto `PageFlip`'s leaf model (cover → spreads → back
 * cover) and hands them straight to the engine, which renders the realistic
 * paper turn. The same reader powers the onboarding "Issue #1 reveal".
 *
 * Contract shape (why faces, not pre-merged spread images):
 *  - `PageFlip` models the book as **leaves** (a leaf = 2 faces): face 0 is the
 *    single cover (shown alone), then faces pair up into spreads, turning one
 *    leaf per spread. Passing FACES (cover first, back cover last) lets the
 *    layout resolve single-vs-spread responsively — exactly like a real
 *    magazine — with no double layout pass.
 *  - Each face is a frozen render: real, selectable DOM the engine turns as a
 *    page. The Issue is immutable, so a face's `render()` is pure.
 *
 * If a caller has truly pre-baked, full-bleed spread artwork (e.g. an OG-style
 * raster per spread) it can still drive this in `bookMode="single"` and supply
 * one face per spread image — the contract degrades cleanly to that.
 */

/** Editorial metadata describing the Issue being opened. */
export interface IssueMeta {
  /** Stable issue id (e.g. the Programme issue id). */
  id: string;
  /** Display title of the issue. */
  title: string;
  /** Issue number within its Programme (e.g. 1 for "Issue No. 01"). */
  issueNumber?: number;
  /** The `/@handle` (user or Squad) that published the issue. */
  handle?: string;
  /** Human display name of the publisher (creator / Squad). */
  byline?: string;
  /** ISO timestamp the snapshot was frozen, if known. */
  publishedAt?: string;
}

/**
 * One page face of the frozen Issue. The renderer output is the live DOM shown
 * at rest and rasterised on a turn. `id` must be stable for React keying and
 * for the flip's texture cache.
 */
export interface IssueFace {
  /** Stable key for this face (e.g. `${issue.id}:cover`, `${issue.id}:p3`). */
  id: string;
  /** The frozen page content. Rendered live at rest, frozen to a texture mid-turn. */
  render: () => React.ReactNode;
  /**
   * Optional role hint — purely advisory metadata for callers/telemetry; the
   * leaf/spread maths is driven by ORDER, not by role. The cover should be the
   * first face and the back cover the last.
   */
  role?: 'cover' | 'page' | 'back-cover';
}

/** How the Issue opens. `'reveal'` is the ceremony entry used by Issue #1. */
export type IssueReaderMode = 'read' | 'reveal';

export interface IssueReaderProps {
  /** The Issue being opened. */
  issue: IssueMeta;
  /**
   * Ordered page faces of the frozen Issue: cover first, then interior pages in
   * reading order, back cover last. `PageFlip` pairs these into spreads itself.
   */
  faces: IssueFace[];
  /**
   * Open mode. `'read'` (default) is the everyday "open an issue" experience;
   * `'reveal'` is the onboarding Issue #1 ceremony (starts on the cover and is
   * meant to be entered with a flourish — kept as an explicit mode so the
   * onboarding flow can key its choreography off it without forking this reader).
   */
  mode?: IssueReaderMode;
  /** Face index to open on. Defaults to 0 (the cover). */
  initialIndex?: number;
  /**
   * Single page or two-page spread. `'auto'` (default) → spread on wide
   * landscape, single on portrait/narrow (DearFlip `pageMode: AUTO`).
   */
  bookMode?: BookModePreference;
  /** Master switch for page-turn sound (persistent mute lives in the control). */
  sound?: boolean;
  /** Show the hover-to-advance control. Default `true`. */
  showHoverControl?: boolean;
  /** Fired when the reader settles on a new turn position. */
  onTurn?: (position: number, direction: FlipDirection) => void;
  /** Fired the first time the reader reaches the final position (issue finished). */
  onReachedEnd?: () => void;
  /**
   * Fired once, the first time the cover finishes opening (the reader settles at
   * position ≥ 1). Only meaningful in `mode="reveal"` — the Issue #1 ceremony —
   * where it lets the onboarding flow react to the cover having opened (e.g.
   * staging the standfirst) without coupling to the flip's render mode. The
   * cover-open never *gates* completion: "Enter the Arena" stays independent.
   */
  onCoverOpened?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Imperative controls, mirroring {@link PageFlipHandle}. */
export interface IssueReaderHandle {
  next(): void;
  prev(): void;
  /** Jump to a face index (uses skim for multi-page jumps inside `PageFlip`). */
  goTo(index: number): void;
  /** Current turn position. */
  position: number;
}

/**
 * `<IssueReader>` — open a frozen Programme Issue and flip through it.
 *
 * Thin, deliberate wrapper over {@link PageFlip}: it owns the Issue *contract*
 * (metadata + ordered faces + open mode) and delegates ALL motion, capability
 * gating, freezing, audio, and the curl itself to `PageFlip`. Nothing about the
 * flip is re-implemented here.
 */
export const IssueReader = forwardRef<IssueReaderHandle, IssueReaderProps>(function IssueReader(
  {
    issue,
    faces,
    mode = 'read',
    initialIndex = 0,
    bookMode = 'auto',
    sound = true,
    showHoverControl = true,
    onTurn,
    onReachedEnd,
    onCoverOpened,
    className,
    style,
  },
  ref
) {
  const flipRef = useRef<PageFlipHandle>(null);

  // Issue faces ARE PageFlip pages — same per-face render contract. Memoised so
  // the flip's page identity is stable across re-renders (the Issue is frozen).
  const pages = useMemo<PageFlipPage[]>(
    () => faces.map((f) => ({ id: f.id, render: f.render })),
    [faces]
  );

  useImperativeHandle(
    ref,
    () => ({
      next: () => flipRef.current?.next(),
      prev: () => flipRef.current?.prev(),
      goTo: (i: number) => flipRef.current?.goTo(i),
      get position() {
        return flipRef.current?.index ?? initialIndex;
      },
    }),
    [initialIndex]
  );

  // Final turn position (so we can fire onReachedEnd exactly once on arrival).
  // We can't read live layout here, but the reveal/read flows only need the
  // single-page count as the upper bound; PageFlip clamps either way.
  const lastSinglePosition = Math.max(positionCount(pages.length, 'single') - 1, 0);
  const reachedEndFired = useRef(false);
  const coverOpenedFired = useRef(false);

  // Reveal-only "close the book" ceremony. Reaching the back cover arms the
  // close; a beat later the issue folds shut to its FRONT cover (see
  // ClosingCover) — a real ending, not a flat back page. `read` never closes.
  const isReveal = mode === 'reveal';
  const [armedClose, setArmedClose] = useState(false);
  const [closed, setClosed] = useState(false);

  const handleIndexChange = (index: number, direction: FlipDirection) => {
    onTurn?.(index, direction);
    // The cover has opened once we settle anywhere past the cover (position ≥ 1).
    // Fire exactly once; only relevant to the reveal ceremony.
    if (!coverOpenedFired.current && index >= 1) {
      coverOpenedFired.current = true;
      onCoverOpened?.();
    }
    if (!reachedEndFired.current && index >= lastSinglePosition && direction === 'forward') {
      reachedEndFired.current = true;
      onReachedEnd?.();
      if (isReveal) setArmedClose(true);
    }
  };

  // Let the back cover sit for a beat, then fold the issue shut.
  useEffect(() => {
    if (!isReveal || !armedClose || closed) return;
    const t = setTimeout(() => setClosed(true), 1100);
    return () => clearTimeout(t);
  }, [isReveal, armedClose, closed]);

  // Re-open from the closed cover: flip back to the front and re-arm.
  const reopen = () => {
    setClosed(false);
    setArmedClose(false);
    reachedEndFired.current = false;
    flipRef.current?.goTo(0);
  };

  const ariaLabel = issue.issueNumber
    ? `${issue.title} — Issue No. ${String(issue.issueNumber).padStart(2, '0')}`
    : issue.title;

  // The reveal is the Issue #1 ceremony: it opens from the cover and MUST be
  // single-leaf. `bookMode:'auto'` would resolve to a two-page spread on wide
  // viewports, which renders the cover as a half-width leaf (the collapsed
  // half-spread reveal bug). Forcing single keeps the cover full-bleed; passing
  // `mode='cover-open'` runs the slower cover-open turn (and degrades to the
  // flat reader under reduced motion). `read` keeps the responsive engine turn.
  const effectiveBookMode: BookModePreference = isReveal ? 'single' : bookMode;
  const flipMode: FlipMode | undefined = isReveal ? 'cover-open' : undefined;

  // `mode` is the Issue *open* intent (read vs the Issue #1 reveal ceremony).
  // We expose the intent as a data attribute on the wrapper so onboarding
  // choreography can hook the reveal without this reader forking the flip.
  return (
    <div
      data-issue-reader=""
      data-issue-mode={mode}
      data-issue-id={issue.id}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <PageFlip
        ref={flipRef}
        pages={pages}
        initialIndex={initialIndex}
        mode={flipMode}
        bookMode={effectiveBookMode}
        sound={sound}
        showHoverControl={showHoverControl}
        onIndexChange={handleIndexChange}
        aria-label={ariaLabel}
        className={className}
        style={style}
      />
      {isReveal && faces[0] ? (
        <AnimatePresence>
          {closed ? <ClosingCover key="closed" face={faces[0]} onReopen={reopen} /> : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
});

/**
 * The Issue #1 "close the book" ceremony. When the reader reaches the back
 * cover in reveal mode, the issue folds shut to its FRONT cover — a satisfying
 * "that's your issue" beat rather than sitting on a flat back page. Clicking the
 * closed issue opens it again from the cover. Pure CSS 3D + a spring.
 */
function ClosingCover({ face, onReopen }: { face: IssueFace; onReopen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: '#0d0d0d',
        perspective: 1600,
        zIndex: 20,
      }}
    >
      <motion.button
        type="button"
        onClick={onReopen}
        aria-label="Open the issue again"
        initial={{ rotateY: -98, opacity: 0.35 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.9 }}
        style={{
          position: 'relative',
          height: '88%',
          maxHeight: '88%',
          maxWidth: '92%',
          aspectRatio: '0.707',
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          border: 'none',
          padding: 0,
          margin: 0,
          background: 'transparent',
          cursor: 'pointer',
          borderRadius: '3px',
          overflow: 'hidden',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.7), 0 10px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>{face.render()}</div>
        {/* A spine shadow down the binding edge sells the closed book. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            insetBlock: 0,
            left: 0,
            width: '12px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(0,0,0,0))',
          }}
        />
      </motion.button>
    </motion.div>
  );
}
