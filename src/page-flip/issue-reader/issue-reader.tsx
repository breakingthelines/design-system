import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { hasWebGL, prefersReducedMotion } from '../capability';
import { Book3D } from '../book-3d/book-3d';
import { FaceDOM } from '../faces/face-dom';
import type { FaceSpec, HeadingFont } from '../faces/face-spec';
import { useFaceTextures } from '../faces/use-face-textures';

/**
 * Programme Issue reader — the standalone "open an issue" experience, and the
 * onboarding "Issue #1 reveal".
 *
 * The reader takes the issue as structured {@link FaceSpec}s (one source of
 * truth for page content) and renders them one of two ways:
 *
 *  • **3D** (capable client): a genuinely-3D {@link Book3D} — SkinnedMesh pages
 *    bent by a bone chain, real lighting + contact shadows. Faces are drawn to
 *    CanvasTextures (crisp type, real crests/photos, the owner's doodle
 *    composited into inner pages).
 *  • **Static fallback** (no WebGL / reduced-motion / SSR): a flat scroll-snap
 *    column of the same faces as DOM. No flip, no curl — deliberately calm.
 *
 * There is no StPageFlip and no page-curl chrome. A `faces` (render-DOM) path
 * remains for callers that pre-render arbitrary page DOM (the shelved Programme
 * reader); those always use the static fallback.
 */

/** Editorial metadata describing the Issue being opened. */
export interface IssueMeta {
  id: string;
  title: string;
  issueNumber?: number;
  handle?: string;
  byline?: string;
  publishedAt?: string;
}

/** Legacy render-DOM face (Programme reader). Prefer {@link FaceSpec}. */
export interface IssueFace {
  id: string;
  render: () => React.ReactNode;
  role?: 'cover' | 'page' | 'back-cover';
}

export type IssueReaderMode = 'read' | 'reveal';

export interface IssueReaderProps {
  issue: IssueMeta;
  /** Structured page content (preferred) → 3D book + DOM fallback. */
  specs?: FaceSpec[];
  /** Legacy pre-rendered DOM faces → static fallback only. */
  faces?: IssueFace[];
  mode?: IssueReaderMode;
  /** Heading typeface; body copy is always Inter. Default `'inter'`. */
  headingFont?: HeadingFont;
  /** Faint tactical doodle composited onto inner pages. */
  doodleUrl?: string;
  /** Fired once when the cover first opens (reveal choreography). */
  onCoverOpened?: () => void;
  /** Fired once when the reader reaches the final leaf. */
  onReachedEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

export interface IssueReaderHandle {
  next(): void;
  prev(): void;
  goTo(leaf: number): void;
  position: number;
}

const DEFAULT_DOODLE = '/textures/mag-doodle.png';

export const IssueReader = forwardRef<IssueReaderHandle, IssueReaderProps>(function IssueReader(
  {
    issue,
    specs,
    faces,
    mode = 'read',
    headingFont = 'inter',
    doodleUrl = DEFAULT_DOODLE,
    onCoverOpened,
    onReachedEnd,
    className,
    style,
    'aria-label': ariaLabelProp,
  },
  ref
) {
  // Capability resolved once on mount. This component is mounted client-only
  // (the platform lazy-imports it), so `window` exists; no hydration flash.
  const [use3D] = useState(
    () => typeof window !== 'undefined' && !!specs?.length && hasWebGL() && !prefersReducedMotion()
  );

  const ariaLabel =
    ariaLabelProp ??
    (issue.issueNumber
      ? `${issue.title} — Issue No. ${String(issue.issueNumber).padStart(2, '0')}`
      : issue.title);

  return (
    <div
      data-issue-reader=""
      data-issue-mode={mode}
      data-issue-id={issue.id}
      aria-label={ariaLabel}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      {use3D && specs ? (
        <Reader3D
          specs={specs}
          headingFont={headingFont}
          doodleUrl={doodleUrl}
          onCoverOpened={onCoverOpened}
          onReachedEnd={onReachedEnd}
          forwardedRef={ref}
        />
      ) : (
        <StaticReader
          specs={specs}
          faces={faces}
          headingFont={headingFont}
          onCoverOpened={onCoverOpened}
          onReachedEnd={onReachedEnd}
        />
      )}
    </div>
  );
});

// ── 3D path ───────────────────────────────────────────────────────────────────

function Reader3D({
  specs,
  headingFont,
  doodleUrl,
  onCoverOpened,
  onReachedEnd,
  forwardedRef,
}: {
  specs: FaceSpec[];
  headingFont: HeadingFont;
  doodleUrl: string;
  onCoverOpened?: () => void;
  onReachedEnd?: () => void;
  forwardedRef: React.ForwardedRef<IssueReaderHandle>;
}) {
  const { pages, ready } = useFaceTextures(specs, { headingFont, doodleUrl });
  const maxLeaf = ready ? pages.length : Math.ceil(specs.length / 2);
  const [page, setPageState] = useState(0);
  const coverOpenedFired = useRef(false);
  const reachedEndFired = useRef(false);

  const setPage = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, maxLeaf));
      setPageState(clamped);
      if (!coverOpenedFired.current && clamped >= 1) {
        coverOpenedFired.current = true;
        onCoverOpened?.();
      }
      if (!reachedEndFired.current && clamped >= maxLeaf && maxLeaf > 0) {
        reachedEndFired.current = true;
        onReachedEnd?.();
      }
    },
    [maxLeaf, onCoverOpened, onReachedEnd]
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      next: () => setPage(page + 1),
      prev: () => setPage(page - 1),
      goTo: (leaf: number) => setPage(leaf),
      get position() {
        return page;
      },
    }),
    [page, setPage]
  );

  // No auto-close: the reader rests on the back cover when it reaches the end.
  // Leaving is the explicit "Enter the Arena" action, owned by the host.
  const coverSpec = specs[0];

  return (
    <>
      <AnimatePresence initial={false}>
        {ready ? (
          <motion.div
            key="book"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Book3D pages={pages} page={page} onPageChange={setPage} />
          </motion.div>
        ) : (
          <motion.div
            key="poster"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: '#08080a',
            }}
          >
            <CoverPoster spec={coverSpec} headingFont={headingFont} />
          </motion.div>
        )}
      </AnimatePresence>

      {ready ? <PageControl page={page} maxLeaf={maxLeaf} onPage={setPage} /> : null}
    </>
  );
}

/** A closed-book poster shown while textures + fonts load — no blank canvas. */
function CoverPoster({ spec, headingFont }: { spec?: FaceSpec; headingFont: HeadingFont }) {
  if (!spec) return null;
  return (
    <div
      style={{
        height: '86%',
        aspectRatio: '0.748',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <FaceDOM spec={spec} headingFont={headingFont} />
    </div>
  );
}

/** Slim, calm page control: chevrons + a dot progress rail. */
function PageControl({
  page,
  maxLeaf,
  onPage,
}: {
  page: number;
  maxLeaf: number;
  onPage: (p: number) => void;
}) {
  const btn: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.35)',
    color: '#fff',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
  };
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 10,
      }}
    >
      <button
        type="button"
        aria-label="Previous page"
        style={{ ...btn, opacity: page <= 0 ? 0.35 : 1 }}
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
      >
        ‹
      </button>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: maxLeaf + 1 }, (_, i) => (
          <span
            key={i}
            style={{
              width: i === page ? 18 : 6,
              height: 6,
              borderRadius: 999,
              background: i === page ? '#eb0000' : 'rgba(255,255,255,0.28)',
              transition: 'width 0.25s, background 0.25s',
            }}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Next page"
        style={{ ...btn, opacity: page >= maxLeaf ? 0.35 : 1 }}
        disabled={page >= maxLeaf}
        onClick={() => onPage(page + 1)}
      >
        ›
      </button>
    </div>
  );
}

// ── static fallback ─────────────────────────────────────────────────────────

function StaticReader({
  specs,
  faces,
  headingFont,
  onCoverOpened,
  onReachedEnd,
}: {
  specs?: FaceSpec[];
  faces?: IssueFace[];
  headingFont: HeadingFont;
  onCoverOpened?: () => void;
  onReachedEnd?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const panels = useMemo(() => {
    if (specs?.length)
      return specs.map((spec, i) => <FaceDOM key={i} spec={spec} headingFont={headingFont} />);
    if (faces?.length) return faces.map((f) => <div key={f.id}>{f.render()}</div>);
    return [];
  }, [specs, faces, headingFont]);

  // Non-gating choreography: fire onCoverOpened/onReachedEnd as panels scroll in.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const children = Array.from(root.querySelectorAll('[data-face-panel]'));
    if (!children.length) return;
    let coverFired = false;
    let endFired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = Number((e.target as HTMLElement).dataset.faceIndex);
          if (!coverFired && idx >= 1) {
            coverFired = true;
            onCoverOpened?.();
          }
          if (!endFired && idx >= children.length - 1) {
            endFired = true;
            onReachedEnd?.();
          }
        }
      },
      { root, threshold: 0.6 }
    );
    children.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [panels, onCoverOpened, onReachedEnd]);

  return (
    <div
      ref={scrollRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '24px 0',
        background: '#08080a',
      }}
    >
      {panels.map((panel, i) => (
        <div
          key={i}
          data-face-panel=""
          data-face-index={i}
          style={{
            scrollSnapAlign: 'center',
            flex: '0 0 auto',
            height: 'min(86%, 720px)',
            aspectRatio: '0.748',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 18px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
