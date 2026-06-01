import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

import { positionCount } from '../book';
import { PageFlip, type PageFlipHandle, type PageFlipPage } from '../page-flip';
import type { BookModePreference } from '../use-book-layout';
import type { FlipDirection } from '../use-page-flip-controller';

/**
 * Programme Issue reader — the standalone "open an issue" experience.
 *
 * An Issue is a FROZEN snapshot: its spreads come from the page-composition
 * block renderers rendered to page faces (per the WebGL-magazine build spec).
 * This component does NOT re-implement the page-flip — it composes the existing
 * {@link PageFlip} runtime: it maps an Issue's ordered faces onto `PageFlip`'s
 * leaf model (cover → spreads → back cover) and hands them straight to the
 * fragment-shader curl. The same reader powers the onboarding "Issue #1 reveal".
 *
 * Contract shape (why faces, not pre-merged spread images):
 *  - `PageFlip` already models the book as **leaves** (a leaf = 2 faces) and
 *    pairs faces into spreads itself (`book.ts`): face 0 is the single cover,
 *    then faces pair up, turning one leaf per spread. Passing FACES (cover
 *    first, back cover last) lets `bookMode` resolve single-vs-spread
 *    responsively — exactly like a real magazine — with no double layout pass.
 *  - Each face is a frozen render: live, crisp, selectable DOM at rest, frozen
 *    to a texture only during a turn (the `PageFaceSource` boundary inside
 *    `PageFlip`). The Issue is immutable, so a face's `render()` is pure.
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

  const handleIndexChange = (index: number, direction: FlipDirection) => {
    onTurn?.(index, direction);
    if (!reachedEndFired.current && index >= lastSinglePosition && direction === 'forward') {
      reachedEndFired.current = true;
      onReachedEnd?.();
    }
  };

  const ariaLabel = issue.issueNumber
    ? `${issue.title} — Issue No. ${String(issue.issueNumber).padStart(2, '0')}`
    : issue.title;

  // `mode` is the Issue *open* intent (read vs the Issue #1 reveal ceremony);
  // the flip's own render mode (curl / skim / flat) stays capability-driven.
  // We expose the intent as a data attribute on the wrapper so onboarding
  // choreography can hook the reveal without this reader forking the flip.
  return (
    <div
      data-issue-reader=""
      data-issue-mode={mode}
      data-issue-id={issue.id}
      style={{ width: '100%', height: '100%' }}
    >
      <PageFlip
        ref={flipRef}
        pages={pages}
        initialIndex={initialIndex}
        bookMode={bookMode}
        sound={sound}
        showHoverControl={showHoverControl}
        onIndexChange={handleIndexChange}
        aria-label={ariaLabel}
        className={className}
        style={style}
      />
    </div>
  );
});
