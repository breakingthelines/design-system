import { useSpring } from '@react-spring/three';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';

import { motion } from '#/tokens/motion';
import { facesAt, positionCount, turnFaces } from './book';
import { detectCapability, FPS_FLOOR, prefersReducedMotion } from './capability';
import { SilentFlipAudioSource, SynthFlipAudioSource, type FlipAudioSource } from './flip-audio';
import { PageCurlMaterialImpl } from './page-curl-material';
import {
  ScreenshotPageFaceSource,
  type FreezeOptions,
  type PageFaceSource,
} from './page-face-source';
import { FlipHoverControl } from './flip-hover-control';
import { usePrewarmTextures } from './use-prewarm-textures';
import { useBookLayout, type BookModePreference } from './use-book-layout';
import {
  usePageFlipController,
  type FlipDirection,
  type PageFlipController,
} from './use-page-flip-controller';

/** How the turn is rendered. */
export type FlipMode = 'curl' | 'skim' | 'flat';

export interface PageFlipPage {
  /** Stable key for the page. */
  id: string;
  /** The live, interactive DOM for this page. Rendered at rest; frozen on flip. */
  render: () => React.ReactNode;
}

export interface PageFlipProps {
  pages: PageFlipPage[];
  initialIndex?: number;
  /**
   * Force a mode. Omit to let capability detection choose between `curl` and
   * `flat`, with `skim` engaged automatically for multi-page jumps.
   */
  mode?: FlipMode;
  /**
   * Single page or two-page spread. `'auto'` (default) resolves responsively:
   * spread on wide landscape, single on portrait / narrow — à la DearFlip
   * `pageMode: AUTO`. Force `'single'` / `'spread'` to override.
   */
  bookMode?: BookModePreference;
  /** Curl tuning (defaults pulled from the Tier-3 ceremony tokens). */
  radius?: number;
  shadowStrength?: number;
  /** DPR cap for page freezes (mobile should pass ≤1.5). */
  freezeDpr?: number;
  /** Background painted behind a page during freeze (defaults to the dark ground). */
  freezeBackground?: string;
  /** Fired when the visible page settles. */
  onIndexChange?: (index: number, direction: FlipDirection) => void;
  /** Inject a face source (e.g. a future html-in-canvas one, or a test stub). */
  faceSource?: PageFaceSource;
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
 * Hard ceiling (ms) for a single turn. The curl spring settles in ~620ms and
 * skim in ~320ms, so any turn still "turning" past this has stalled — most
 * likely the freeze rasteriser (`modern-screenshot`) never resolved (a hung
 * `domToCanvas`, a tainted cross-origin image, or a face element that never
 * mounted), so the spring's `onRest` never fired and `settle()` was never
 * called. Left unhandled this wedges the flip permanently: `isTurning` stays
 * true, the interaction surface keeps pointer-events, and the deck never
 * re-activates. The watchdog force-settles so the turn always completes — the
 * GL flourish is best-effort, advancing the page is not.
 */
const TURN_WATCHDOG_MS = 2500;

/**
 * `<PageFlip>` — the WebGL "magazine" page-flip runtime.
 *
 * Architecture: pages are live, interactive DOM at rest. On a turn we freeze the
 * outgoing and incoming faces to `CanvasTexture`s (via {@link PageFaceSource}),
 * animate a single-quad fragment-shader curl, then restore live DOM on settle.
 * Adjacent faces are pre-warmed on idle so a grab never rasterises on-demand,
 * and the curl material is pre-compiled on mount — both kill the start-of-flip
 * jitter.
 *
 * Layout: the book is modelled as **leaves** (a leaf = 2 faces). After a single
 * cover it opens to a two-page **spread** with a centre gutter/spine shadow;
 * turning curls one leaf to the next spread. Responsive: spread on wide
 * landscape, single page on portrait / narrow.
 *
 * Modes:
 *  - `curl`  paper page-curl (hero turns) — fragment-shader cylindrical remap.
 *  - `skim`  rigid rotateY turn for fast skimming.
 *  - `flat`  cross-fade, no WebGL — the fallback and reduced-motion path.
 *
 * Capability gating starts in `flat` on reduced-motion / no-WebGL / low-spec
 * devices, and a `<PerformanceMonitor>` watchdog drops to `flat` if the curl
 * can't hold ~30fps. Because the at-rest layer is already live DOM, flat mode
 * is nearly free — only the curl layer is conditionally mounted.
 */
export const PageFlip = forwardRef<PageFlipHandle, PageFlipProps>(function PageFlip(
  {
    pages,
    initialIndex = 0,
    mode,
    bookMode = 'auto',
    radius = motion.ceremony.pageCurl.radius,
    shadowStrength = motion.ceremony.pageCurl.shadowStrength,
    freezeDpr,
    freezeBackground = DEFAULT_FREEZE_BG,
    onIndexChange,
    faceSource,
    audioSource,
    sound = true,
    showHoverControl = true,
    className,
    style,
    'aria-label': ariaLabel = 'Magazine pages',
  },
  ref
) {
  // ── Responsive book layout (single vs two-page spread). ───────────────────
  const layout = useBookLayout(bookMode);

  // Turn positions collapse the leaf model down so the index controller can stay
  // page-index based: one position per turn (see book.ts).
  const positions = positionCount(pages.length, layout);

  const controller = usePageFlipController({
    pageCount: positions,
    initialIndex,
    onIndexChange,
    // In a spread only the right leaf curls (half the width), so a drag should
    // map 1:1 to that half for true paper feel.
    dragWidthFactor: layout === 'spread' ? 0.5 : 1,
  });

  useImperativeHandle(
    ref,
    () => ({
      next: controller.next,
      prev: controller.prev,
      goTo: controller.goTo,
      index: controller.index,
    }),
    [controller]
  );

  // ── Capability: decide the *baseline* mode once, on mount. ────────────────
  // We default to flat for SSR/first paint (safe, crawlable), then upgrade on
  // the client if capable. This is external-environment sync, not animation —
  // an effect is the right tool.
  const [capable, setCapable] = useState(false);
  const [watchdogTripped, setWatchdogTripped] = useState(false);
  useEffect(() => {
    setCapable(detectCapability().canUseWebGLFlip);
  }, []);

  const resolvedMode: FlipMode = useMemo(() => {
    if (mode) return mode;
    if (!capable || watchdogTripped) return 'flat';
    return 'curl';
  }, [mode, capable, watchdogTripped]);

  // ── Face source (one per instance so texture budgets don't collide). ──────
  const ownSource = useRef<PageFaceSource | null>(null);
  const source = useMemo(() => {
    if (faceSource) return faceSource;
    ownSource.current ??= new ScreenshotPageFaceSource();
    return ownSource.current;
  }, [faceSource]);
  useEffect(() => () => ownSource.current?.dispose(), []);

  // ── Audio (pluggable, keyed by spread). Own one unless injected. ──────────
  const ownAudio = useRef<FlipAudioSource | null>(null);
  const audio = useMemo<FlipAudioSource>(() => {
    if (audioSource) return audioSource;
    ownAudio.current ??= sound ? new SynthFlipAudioSource() : new SilentFlipAudioSource();
    return ownAudio.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);
  useEffect(() => () => ownAudio.current?.dispose(), []);
  const [muted, setMutedState] = useState(() => audio.muted);
  const toggleMute = useCallback(() => {
    const nextMuted = !audio.muted;
    audio.setMuted(nextMuted);
    setMutedState(nextMuted);
    if (!nextMuted) audio.resume();
  }, [audio]);

  // Document-level arrow keys.
  const onKeyDown = controller.onKeyDown;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      audio.resume(); // arm audio on a user gesture (autoplay policy)
      onKeyDown(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onKeyDown, audio]);

  // ── Turn watchdog ─────────────────────────────────────────────────────────
  // Force-settle a turn that stalls (a hung freeze, a dropped spring onRest, a
  // missing face). Armed only while `isTurning`; a normal turn clears the flag
  // via settle() well before the deadline, so the timer is cleared and never
  // fires. `settle` lives behind a ref so re-arming doesn't happen on its
  // (direction-dependent) identity changes — only on the turning edge.
  const settleRef = useRef(controller.settle);
  settleRef.current = controller.settle;
  const isTurningNow = controller.isTurning;
  useEffect(() => {
    if (!isTurningNow) return;
    const id = setTimeout(() => settleRef.current(), TURN_WATCHDOG_MS);
    return () => clearTimeout(id);
  }, [isTurningNow]);

  const index = controller.index;
  const dir = controller.direction;

  // Faces shown at rest, and the front/back/revealed triple a turn animates.
  const restFaces = facesAt(index, pages.length, layout);
  const flipFaces = useMemo(
    () => turnFaces(index, dir, pages.length, layout),
    [index, dir, pages.length, layout]
  );

  const freezeOpts: FreezeOptions = useMemo(
    () => ({ dpr: freezeDpr, backgroundColor: freezeBackground }),
    [freezeDpr, freezeBackground]
  );

  // Refs to the live DOM faces (so we can freeze them on a turn).
  const liveRefs = useRef<Record<number, HTMLElement | null>>({});
  const setLiveRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      liveRefs.current[i] = el;
    },
    []
  );

  // ── Pre-warm: rasterise adjacent faces on idle so a grab is instant, and
  //    pre-compile the curl material so the first flip doesn't stall. ────────
  usePrewarmTextures({
    source,
    enabled: resolvedMode === 'curl',
    isTurning: controller.isTurning,
    faces: useMemo(
      () => prewarmFaceList(index, pages.length, layout),
      [index, pages.length, layout]
    ),
    getEl: (i) => liveRefs.current[i] ?? null,
    freezeOpts,
  });

  // ── Sound + hover-control intent. Fire the flip SFX once per committed turn.
  const turnSfxFired = useRef(false);
  useEffect(() => {
    if (!controller.isTurning) {
      turnSfxFired.current = false;
      return;
    }
    // Fire once the turn is actually committing (target ≥ 1), not on a peel-back.
    if (!turnSfxFired.current && controller.target >= 1) {
      turnSfxFired.current = true;
      const toIndex = dir === 'forward' ? index + 1 : index - 1;
      audio.playFlip(toIndex, controller.releaseVelocity);
    }
  }, [controller.isTurning, controller.target, controller.releaseVelocity, dir, index, audio]);

  const armAudio = useCallback(() => audio.resume(), [audio]);

  const atStart = index <= 0;
  const atEnd = index >= positions - 1;

  // Cover-to-inner STIFFNESS RAMP (Premium bar #4): the cover and the last few
  // leaves resist (a hard, bound spine); the inner pages give. We ramp the
  // spring stiffness over the first/last `COVER_RAMP_POSITIONS` turns rather
  // than DearFlip's binary hard/soft — the gradient is what makes it feel bound,
  // not hinged. `stiffnessScale` ≥ 1 multiplies tension on the curl spring.
  const stiffnessScale = useMemo(
    () => coverStiffnessScale(index, dir, positions),
    [index, dir, positions]
  );

  return (
    <div
      role="group"
      aria-roledescription="magazine"
      aria-label={ariaLabel}
      tabIndex={0}
      className={className}
      onPointerDownCapture={armAudio}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: freezeBackground,
        touchAction: 'pan-y',
        ...style,
      }}
    >
      {/* Live, interactive DOM layer (a spread or single page). Always rendered
          (forms work, content selectable + accessible). Covered by the WebGL
          layer only while a curl/skim turn is mid-flight. In flat mode it owns
          the cross-fade. */}
      <SpreadLayer
        pages={pages}
        layout={layout}
        restFaces={restFaces}
        flipFaces={flipFaces}
        progress={controller.progress}
        isTurning={controller.isTurning}
        mode={resolvedMode}
        direction={dir}
        setLiveRef={setLiveRef}
        freezeBackground={freezeBackground}
      />

      {/* WebGL turn layer — only mounted when a curl/skim turn is animating on a
          capable device, and only if there's actually a leaf to lift. */}
      {resolvedMode !== 'flat' && controller.isTurning && flipFaces.front != null && (
        <div
          data-page-flip-exclude="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <Canvas
            orthographic
            camera={{ position: [0, 0, 5], zoom: 1, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
            dpr={[1, 2]}
            style={{ width: '100%', height: '100%' }}
          >
            <PerformanceMonitor
              onDecline={() => setWatchdogTripped(true)}
              bounds={() => [FPS_FLOOR, 60]}
              flipflops={2}
              onFallback={() => setWatchdogTripped(true)}
            />
            <TurnScene
              key={`${flipFaces.front}->${flipFaces.revealed}-${dir}`}
              source={source}
              freezeOpts={freezeOpts}
              layout={layout}
              getFrontEl={() => faceEl(liveRefs.current, flipFaces.front)}
              getBackEl={() => faceEl(liveRefs.current, flipFaces.back)}
              getRevealedEl={() => faceEl(liveRefs.current, flipFaces.revealed)}
              direction={dir}
              mode={resolvedMode}
              target={controller.target}
              progress={controller.progress}
              isDragging={controller.isDragging}
              releaseVelocity={controller.releaseVelocity}
              radius={radius}
              shadowStrength={shadowStrength}
              stiffnessScale={stiffnessScale}
              remaining={remainingLeaves(index, dir, positions)}
              total={positions}
              freezeBackground={freezeBackground}
              onSettle={() => {
                source.thaw(faceEl(liveRefs.current, flipFaces.front) ?? document.body);
                controller.settle();
              }}
            />
          </Canvas>
        </div>
      )}

      {/* Flat-mode turn driver. Flat mode has no useFrame loop, so this tweens
          the cross-fade progress and settles the turn. Mounted only while a flat
          turn is in flight; renders nothing. */}
      {resolvedMode === 'flat' && controller.isTurning && !controller.isDragging && (
        <FlatTurnDriver
          key={`flat-${index}-${dir}`}
          target={controller.target}
          setProgress={controller.setLiveProgress}
          onSettle={controller.settle}
        />
      )}

      {/* The interaction surface — pointer capture for drag-to-peel + tap. Sits
          on top so gestures are caught regardless of layer. Marked as flip
          chrome so the freezer never rasterises it and the grip tap-forward
          hit-test sees through it to the page content beneath. */}
      <div
        data-page-flip-exclude="true"
        {...controller.pointerHandlers}
        style={{
          position: 'absolute',
          inset: 0,
          // Let clicks through to the live DOM at rest (so links/forms work);
          // capture pointers only while turning.
          pointerEvents: controller.isTurning || controller.isDragging ? 'auto' : 'none',
          cursor: controller.isDragging ? 'grabbing' : 'grab',
        }}
      />
      {/* Always-on drag-start zones at the page edges + outer corners. A peel
          can start here; a tap is forwarded to the content beneath, so page
          controls (e.g. the onboarding footer buttons) keep working. */}
      <EdgeGrips controller={controller} />

      {/* Hover-to-advance control — reuses the article-detail floating bar. */}
      {showHoverControl && (
        <FlipHoverControl
          position={index}
          positionCount={positions}
          atStart={atStart}
          atEnd={atEnd}
          isTurning={controller.isTurning}
          muted={muted}
          onPrev={controller.prev}
          onNext={controller.next}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
});

// ── Spread layer: live DOM (single page or two-page spread) + cross-fade ─────

interface SpreadLayerProps {
  pages: PageFlipPage[];
  layout: 'single' | 'spread';
  restFaces: { left: number | null; right: number | null };
  flipFaces: { front: number | null; back: number | null; revealed: number | null };
  progress: number;
  isTurning: boolean;
  mode: FlipMode;
  direction: FlipDirection;
  setLiveRef: (i: number) => (el: HTMLElement | null) => void;
  freezeBackground: string;
}

function SpreadLayer({
  pages,
  layout,
  restFaces,
  flipFaces,
  progress,
  isTurning,
  mode,
  setLiveRef,
  freezeBackground,
}: SpreadLayerProps) {
  const flatFade = mode === 'flat' && isTurning;
  const liftPointer = isTurning && mode !== 'flat' ? 'none' : 'auto';

  // The faces that must exist in the DOM this frame: the resting spread, plus —
  // while turning — the incoming faces so the freezer can rasterise them. We
  // render them off behind the resting spread (they're hidden by the WebGL
  // layer during a curl, or cross-faded in flat mode).
  const renderFaces = useMemo(() => {
    const set = new Set<number>();
    if (restFaces.left != null) set.add(restFaces.left);
    if (restFaces.right != null) set.add(restFaces.right);
    if (isTurning) {
      if (flipFaces.front != null) set.add(flipFaces.front);
      if (flipFaces.back != null) set.add(flipFaces.back);
      if (flipFaces.revealed != null) set.add(flipFaces.revealed);
    }
    return [...set];
  }, [restFaces, flipFaces, isTurning]);

  // Which faces are the *incoming* spread (for the flat cross-fade).
  const incoming = useMemo(() => {
    const set = new Set<number>();
    if (flipFaces.back != null) set.add(flipFaces.back);
    if (flipFaces.revealed != null) set.add(flipFaces.revealed);
    return set;
  }, [flipFaces]);

  return (
    <>
      {renderFaces.map((face) => {
        const isRestVisible = face === restFaces.left || face === restFaces.right;
        const isIncoming = incoming.has(face) && !isRestVisible;
        const side: 'left' | 'right' | 'full' =
          layout === 'single'
            ? 'full'
            : face === restFaces.left || (isIncoming && face === flipFaces.back)
              ? 'left'
              : 'right';

        // Opacity: resting spread is solid; in flat mode the incoming spread
        // fades up while the resting one fades out. Behind a curl turn both
        // stay put (the GL layer covers them).
        let opacity = 1;
        let z = 0;
        if (flatFade) {
          opacity = isIncoming ? progress : isRestVisible ? 1 - progress : 0;
          z = isIncoming ? 1 : 0;
        } else if (!isRestVisible) {
          // Off-screen prep face during a curl turn — keep it paint-ready but
          // out of sight beneath the resting spread.
          opacity = 1;
          z = -1;
        }

        return (
          <PageHost
            key={pages[face]?.id ?? `face-${face}`}
            ref={setLiveRef(face)}
            freezeBackground={freezeBackground}
            side={side}
            aria-hidden={!isRestVisible}
            style={{
              opacity,
              zIndex: z,
              pointerEvents: isRestVisible ? liftPointer : 'none',
              transition: flatFade ? 'none' : undefined,
            }}
          >
            {pages[face]?.render()}
          </PageHost>
        );
      })}

      {/* Centre gutter / spine shadow on a resting two-page spread. */}
      {layout === 'spread' && restFaces.left != null && restFaces.right != null && <SpineShadow />}
    </>
  );
}

interface PageHostProps {
  children: React.ReactNode;
  freezeBackground: string;
  /** Which half of the surface this face occupies. */
  side: 'left' | 'right' | 'full';
  style?: React.CSSProperties;
  'aria-hidden'?: boolean;
}

const PageHost = forwardRef<HTMLDivElement, PageHostProps>(function PageHost(
  { children, freezeBackground, side, style, ...rest },
  ref
) {
  const halves: Record<PageHostProps['side'], React.CSSProperties> = {
    full: { inset: 0 },
    left: { top: 0, bottom: 0, left: 0, width: '50%' },
    right: { top: 0, bottom: 0, right: 0, width: '50%' },
  };
  return (
    <div
      ref={ref}
      {...rest}
      style={{
        position: 'absolute',
        background: freezeBackground,
        ...halves[side],
        ...style,
      }}
    >
      {children}
    </div>
  );
});

/** Soft gutter shadow down the spine of a resting spread. */
function SpineShadow() {
  return (
    <div
      aria-hidden
      data-page-flip-exclude="true"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 64,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 2,
        background:
          'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 44%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.28) 56%, rgba(0,0,0,0) 100%)',
      }}
    />
  );
}

// ── WebGL turn scene ─────────────────────────────────────────────────────────

interface TurnSceneProps {
  source: PageFaceSource;
  freezeOpts: FreezeOptions;
  layout: 'single' | 'spread';
  getFrontEl: () => HTMLElement | null;
  getBackEl: () => HTMLElement | null;
  getRevealedEl: () => HTMLElement | null;
  direction: FlipDirection;
  mode: FlipMode;
  target: number;
  progress: number;
  isDragging: boolean;
  releaseVelocity: number;
  radius: number;
  shadowStrength: number;
  /** Spring-stiffness multiplier for the cover-to-inner ramp (≥1). */
  stiffnessScale: number;
  /** Leaves left to turn in the current direction (drives stack thickness). */
  remaining: number;
  /** Total turn positions (the book's depth at rest). */
  total: number;
  freezeBackground: string;
  onSettle: () => void;
}

function TurnScene({
  source,
  freezeOpts,
  layout,
  getFrontEl,
  getBackEl,
  getRevealedEl,
  direction,
  mode,
  target,
  progress,
  isDragging,
  releaseVelocity,
  radius,
  shadowStrength,
  stiffnessScale,
  remaining,
  total,
  freezeBackground,
  onSettle,
}: TurnSceneProps) {
  const { viewport } = useThree();
  const [textures, setTextures] = useState<{
    front: THREE.Texture;
    back: THREE.Texture;
    revealed: THREE.Texture;
  } | null>(null);

  // Freeze the front/back/revealed faces once, when the turn scene mounts.
  // Pre-warm usually means these are already cached, so this resolves on the
  // same frame and the curl starts without a rasterise hitch. Async external
  // work — an effect is correct here.
  useEffect(() => {
    let cancelled = false;
    const frontEl = getFrontEl();
    if (!frontEl) {
      onSettle();
      return;
    }
    const backEl = getBackEl();
    const revealedEl = getRevealedEl();
    const blank = () => makeSolidTexture(freezeBackground);

    Promise.all([
      source.freeze(frontEl, freezeOpts),
      backEl ? source.freeze(backEl, freezeOpts) : Promise.resolve(blank()),
      revealedEl ? source.freeze(revealedEl, freezeOpts) : Promise.resolve(blank()),
    ])
      .then(([front, back, revealed]) => {
        if (cancelled) return;
        setTextures({ front, back, revealed });
      })
      .catch(() => {
        if (!cancelled) onSettle();
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!textures) return null;

  // In a two-page spread only the right half curls (the left page stays put),
  // so the curl quad is half-width and pinned to the spine. In single mode the
  // whole page curls.
  const curlWidth = layout === 'spread' ? viewport.width / 2 : viewport.width;
  const curlX = layout === 'spread' ? viewport.width / 4 : 0;

  return mode === 'skim' ? (
    <SkimMesh
      textureA={textures.front}
      textureB={textures.revealed}
      direction={direction}
      viewport={{ width: curlWidth, height: viewport.height }}
      offsetX={curlX}
      target={target}
      onSettle={onSettle}
    />
  ) : (
    <CurlMesh
      textureFront={textures.front}
      textureBack={textures.back}
      textureRevealed={textures.revealed}
      direction={direction}
      width={curlWidth}
      height={viewport.height}
      offsetX={curlX}
      aspect={curlWidth / viewport.height || 1}
      radius={radius}
      shadowStrength={shadowStrength}
      stiffnessScale={stiffnessScale}
      remaining={remaining}
      total={total}
      target={target}
      liveProgress={progress}
      isDragging={isDragging}
      releaseVelocity={releaseVelocity}
      onSettle={onSettle}
    />
  );
}

// ── Curl mesh: the fragment-shader page-curl ─────────────────────────────────

interface CurlMeshProps {
  textureFront: THREE.Texture;
  textureBack: THREE.Texture;
  textureRevealed: THREE.Texture;
  direction: FlipDirection;
  width: number;
  height: number;
  offsetX: number;
  aspect: number;
  radius: number;
  shadowStrength: number;
  /** Spring-stiffness multiplier (≥1) for the cover-to-inner ramp. */
  stiffnessScale: number;
  /** Leaves remaining to turn this direction (drives the page-stack thickness). */
  remaining: number;
  /** Total turn positions (book depth). */
  total: number;
  target: number;
  liveProgress: number;
  isDragging: boolean;
  releaseVelocity: number;
  onSettle: () => void;
}

function CurlMesh({
  textureFront,
  textureBack,
  textureRevealed,
  direction,
  width,
  height,
  offsetX,
  aspect,
  radius,
  shadowStrength,
  stiffnessScale,
  remaining,
  total,
  target,
  liveProgress,
  isDragging,
  releaseVelocity,
  onSettle,
}: CurlMeshProps) {
  const materialRef = useRef<InstanceType<typeof PageCurlMaterialImpl> | null>(null);
  const settled = useRef(false);

  // Drag is horizontal; the texture swap in TurnScene encodes direction, so we
  // always sweep left-to-right in shader space.
  const curlAxis = useMemo(() => new THREE.Vector2(1, 0), []);

  // Spring drives uProgress toward `target` when NOT dragging. While dragging,
  // we follow the finger (liveProgress) immediately for 1:1 peel.
  const [{ p }, api] = useSpring(() => ({
    p: 0,
    config: motion.ceremony.spring.turn,
  }));

  useEffect(() => {
    if (isDragging) return; // finger owns progress; no spring fighting it
    settled.current = false;
    api.start({
      p: target,
      // Velocity-proportional completion biased by the release velocity, then
      // the cover-to-inner stiffness ramp scales tension so the cover/back
      // resist and inner pages give (Premium bar #4).
      config: scaleStiffness(velocityConfig(target, releaseVelocity), stiffnessScale),
      onRest: () => {
        if (settled.current) return;
        settled.current = true;
        onSettle();
      },
    });
  }, [target, isDragging, api, onSettle, releaseVelocity, stiffnessScale]);

  useFrame(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const value = isDragging ? liveProgress : (p.get() as number);
    mat.uniforms.uProgress.value = value;
    mat.uniforms.uRadius.value = radius;
    mat.uniforms.uShadowStrength.value = shadowStrength;
    mat.uniforms.uAspect.value = aspect;
  });

  void direction;

  return (
    <>
      {/* Page-stack thickness (Premium bar #5): a tapered slab beneath the
          turning leaf, sized by the leaves still to turn, so the book reads as a
          substantial bound object rather than a single sheet. Static, behind the
          curl quad. */}
      <PageStack
        remaining={remaining}
        total={total}
        width={width}
        height={height}
        offsetX={offsetX}
      />
      <mesh position={[offsetX, 0, 0]} scale={[width, height, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <pageCurlMaterial
          ref={materialRef}
          key={PageCurlMaterialImpl.key}
          uPageA={textureFront}
          uPageBack={textureBack}
          uPageB={textureRevealed}
          uCurlAxis={curlAxis}
          uRadius={radius}
          uShadowStrength={shadowStrength}
          uAspect={aspect}
          transparent
        />
      </mesh>
    </>
  );
}

/**
 * Page-stack thickness slab (Premium bar #5). A thin, tapered quad sitting just
 * behind the turning leaf along the spine edge, its thickness proportional to
 * the leaves still to turn — so even a single in-flight turn shows the book has
 * depth (DearFlip stacks real z-offset pages; one tinted slab reads the same at
 * a fraction of the cost). Cheap, static, drawn once per turn.
 */
function PageStack({
  remaining,
  total,
  width,
  height,
  offsetX,
}: {
  remaining: number;
  total: number;
  width: number;
  height: number;
  offsetX: number;
}) {
  if (remaining <= 0 || total <= 1) return null;
  // Thickness grows with remaining leaves, capped so a thick book doesn't look
  // like a brick. Normalised 0..1 of remaining, then a few % of page width.
  const frac = Math.min(remaining / total, 1);
  const thickness = Math.max(width * 0.006 * Math.min(remaining, 24), width * 0.004);
  // Sit the slab at the spine (right edge of the lifting leaf) just behind it.
  const slabX = offsetX + width / 2 - thickness / 2;
  // Slight vertical inset so the stack edge tapers in from the page corners.
  const slabH = height * (1 - 0.006 * frac);
  return (
    <mesh position={[slabX, 0, -0.02]} scale={[thickness, slabH, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#0a0a0a" transparent opacity={0.9} />
    </mesh>
  );
}

/**
 * Map release velocity → react-spring config. Faster flick = stiffer spring =
 * quicker completion (~150ms); a gentle release falls back to the calm turn
 * config (~600ms). Velocity is progress-units/ms (≈0…0.01+).
 */
function velocityConfig(target: number, releaseVelocity: number) {
  if (releaseVelocity <= 0) {
    return target >= 1 ? motion.ceremony.spring.turn : motion.ceremony.spring.snap;
  }
  const v = Math.min(releaseVelocity * 1000, 12); // 0..~12
  const t = Math.min(v / 12, 1);
  return {
    tension: 200 + 360 * t, // 200 (slow) → 560 (snappy)
    friction: 30 - 8 * t, // looser as it gets faster
    mass: 0.8,
  };
}

/** Number of turn positions over which the cover/back stiffness ramp applies. */
const COVER_RAMP_POSITIONS = 3;
/** Max extra stiffness at the very cover/back (1 + this). */
const COVER_STIFFNESS_BOOST = 0.6;

/**
 * Cover-to-inner stiffness ramp (Premium bar #4). Returns a tension multiplier
 * ≥ 1: highest at the cover (forward from position 0) and at the back (forward
 * onto the last position), easing to 1 across the first/last
 * {@link COVER_RAMP_POSITIONS} leaves. The gradient is what makes the book feel
 * *bound* — DearFlip's hard/soft is binary.
 */
function coverStiffnessScale(index: number, direction: FlipDirection, positions: number): number {
  if (positions <= 1) return 1;
  // Distance (in turns) from whichever cover this turn is working against.
  const fromFrontCover = direction === 'forward' ? index : index - 1; // leaving the cover side
  const fromBackCover = positions - 1 - (direction === 'forward' ? index + 1 : index);
  const nearest = Math.max(0, Math.min(fromFrontCover, fromBackCover));
  if (nearest >= COVER_RAMP_POSITIONS) return 1;
  const closeness = 1 - nearest / COVER_RAMP_POSITIONS; // 1 at the cover → 0 inside
  return 1 + COVER_STIFFNESS_BOOST * closeness;
}

/** Leaves still to turn in `direction` from `index` (drives stack thickness). */
function remainingLeaves(index: number, direction: FlipDirection, positions: number): number {
  return direction === 'forward' ? Math.max(0, positions - 1 - index) : Math.max(0, index);
}

/** Scale a spring config's tension by `scale` (≥1), keeping friction/mass. */
function scaleStiffness(
  config: { tension: number; friction: number; mass: number },
  scale: number
): { tension: number; friction: number; mass: number } {
  if (scale === 1) return config;
  return {
    tension: config.tension * scale,
    // A touch more friction with the extra tension so the stiffer cover doesn't
    // overshoot/buzz — keeps the resist feeling solid, not springy.
    friction: config.friction * (1 + (scale - 1) * 0.35),
    mass: config.mass,
  };
}

// ── Skim mesh: rigid rotateY turn ────────────────────────────────────────────

interface SkimMeshProps {
  textureA: THREE.Texture;
  textureB: THREE.Texture;
  direction: FlipDirection;
  viewport: { width: number; height: number };
  offsetX: number;
  target: number;
  onSettle: () => void;
}

function SkimMesh({
  textureA,
  textureB,
  direction,
  viewport,
  offsetX,
  target,
  onSettle,
}: SkimMeshProps) {
  const settled = useRef(false);
  const turningGroup = useRef<THREE.Group | null>(null);
  const frontMat = useRef<THREE.MeshBasicMaterial | null>(null);
  const backMat = useRef<THREE.MeshBasicMaterial | null>(null);

  const [{ t }, api] = useSpring(() => ({
    t: 0,
    config: motion.ceremony.spring.skim,
  }));

  useEffect(() => {
    settled.current = false;
    api.start({
      t: target,
      onRest: () => {
        if (settled.current) return;
        settled.current = true;
        onSettle();
      },
    });
  }, [target, api, onSettle]);

  // rotateY from 0 → ±90° shows the front; past 90° the back face would show,
  // so we show the front (A) for [0,0.5] and the revealed B for (0.5,1],
  // pivoting around the spine. Drive transforms imperatively — animated three
  // primitives blow up TS inference (deep instantiation) and reading the spring
  // each frame is just as smooth.
  const sign = direction === 'forward' ? -1 : 1;
  const pivotX = offsetX - viewport.width / 2;

  useFrame(() => {
    const v = t.get() as number;
    if (turningGroup.current) {
      turningGroup.current.rotation.y = sign * Math.min(v, 0.5) * 2 * (Math.PI / 2);
    }
    if (frontMat.current) frontMat.current.opacity = v < 0.5 ? 1 : 0;
    if (backMat.current) backMat.current.opacity = v >= 0.5 ? 1 : 0;
  });

  return (
    <group position={[pivotX, 0, 0]}>
      {/* Turning page (front A) */}
      <group ref={turningGroup}>
        <mesh position={[viewport.width / 2, 0, 0.01]} scale={[viewport.width, viewport.height, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial ref={frontMat} map={textureA} transparent opacity={1} />
        </mesh>
      </group>
      {/* Revealed page B (static beneath) */}
      <mesh position={[viewport.width / 2, 0, 0]} scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={backMat} map={textureB} transparent opacity={0} />
      </mesh>
    </group>
  );
}

// ── Edge grips: always-on drag-start zones at the page edges + corners ────────
//
// The grips let a peel START from the binding edges/corners. But they sit ON
// TOP of the live page DOM, so naively they swallow CLICKS on content that
// reaches the edges — most importantly the onboarding footer's Back / Continue
// buttons, which live in the bottom corners. A swallowed Continue is a dead-end
// flow. So each grip distinguishes a peel (real horizontal travel) from a tap:
// a drag drives the curl through the controller; a tap is released WITHOUT
// turning and forwarded as a click to the interactive element beneath, so page
// controls keep working while edge-peel still works.

/** Travel (px) above which a grip gesture is a peel, not a tap. */
const GRIP_TAP_SLOP_PX = 6;

function EdgeGrips({ controller }: { controller: PageFlipController }) {
  // Per-pointer start position + whether it has crossed into "peel" territory.
  const gesture = useRef<{ x: number; y: number; peeling: boolean } | null>(null);

  const handlers = useMemo(() => {
    const { pointerHandlers, cancelDrag } = controller;

    /**
     * Forward a tap to the topmost PAGE element beneath the flip chrome. The
     * grips, the interaction surface, and the hover-control wrapper are all
     * `[data-page-flip-exclude]` overlays that can sit over content at the
     * moment of a tap (the interaction surface in particular is pointer-active
     * for a frame after a drag starts, before React re-renders it inert). So we
     * hit-test the whole stack with `elementsFromPoint` and pick the first
     * element that is NOT flip chrome — then click its nearest clickable
     * ancestor. This is robust regardless of transient overlay state.
     */
    const forwardTap = (clientX: number, clientY: number) => {
      const target = document
        .elementsFromPoint(clientX, clientY)
        .find((el) => el instanceof HTMLElement && !el.closest('[data-page-flip-exclude]')) as
        | HTMLElement
        | undefined;
      if (!target) return;
      const clickable = target.closest<HTMLElement>(
        'button, a, input, select, textarea, [role="button"], [role="tab"], [role="option"], [tabindex]:not([tabindex="-1"]), [onclick]'
      );
      (clickable ?? target).click();
    };

    return {
      onPointerDown: (e: React.PointerEvent) => {
        gesture.current = { x: e.clientX, y: e.clientY, peeling: false };
        pointerHandlers.onPointerDown(e);
      },
      onPointerMove: (e: React.PointerEvent) => {
        const g = gesture.current;
        if (g && !g.peeling && Math.abs(e.clientX - g.x) > GRIP_TAP_SLOP_PX) {
          g.peeling = true;
        }
        pointerHandlers.onPointerMove(e);
      },
      onPointerUp: (e: React.PointerEvent) => {
        const g = gesture.current;
        gesture.current = null;
        const moved = g ? Math.hypot(e.clientX - g.x, e.clientY - g.y) : 0;
        if (g?.peeling || moved > GRIP_TAP_SLOP_PX) {
          // A real peel — let the controller commit/settle it.
          pointerHandlers.onPointerUp(e);
        } else {
          // A tap — don't turn the page; hand the click to the content beneath.
          cancelDrag(e);
          forwardTap(e.clientX, e.clientY);
        }
      },
      onPointerCancel: (e: React.PointerEvent) => {
        gesture.current = null;
        pointerHandlers.onPointerCancel(e);
      },
    };
  }, [controller]);

  const edge: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '12%',
    maxWidth: 96,
    pointerEvents: 'auto',
    cursor: 'grab',
    zIndex: 3,
  };
  // Slightly fatter corner targets — the natural place to pinch a page.
  const corner: React.CSSProperties = {
    position: 'absolute',
    width: '16%',
    height: '22%',
    maxWidth: 120,
    maxHeight: 200,
    pointerEvents: 'auto',
    cursor: 'grab',
    zIndex: 4,
  };
  return (
    <div data-page-flip-exclude="true" aria-hidden>
      <div {...handlers} style={{ ...edge, left: 0 }} />
      <div {...handlers} style={{ ...edge, right: 0 }} />
      <div {...handlers} style={{ ...corner, right: 0, top: 0 }} />
      <div {...handlers} style={{ ...corner, right: 0, bottom: 0 }} />
      <div {...handlers} style={{ ...corner, left: 0, top: 0 }} />
      <div {...handlers} style={{ ...corner, left: 0, bottom: 0 }} />
    </div>
  );
}

// ── Flat-mode turn driver ────────────────────────────────────────────────────
// Flat mode has no R3F render loop to advance the cross-fade, so this drives it
// with requestAnimationFrame and settles the turn on completion. Under reduced
// motion it snaps instantly. Renders nothing. The RAF here is animation wiring,
// not data sync — the right tool.

function FlatTurnDriver({
  target,
  setProgress,
  onSettle,
}: {
  target: number;
  setProgress: (v: number) => void;
  onSettle: () => void;
}) {
  useEffect(() => {
    if (target < 1) {
      setProgress(0);
      onSettle();
      return;
    }

    if (prefersReducedMotion()) {
      setProgress(1);
      onSettle();
      return;
    }

    let raf = 0;
    const duration = motion.ceremony.reveal.duration;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeInOutCubic — calm, no overshoot, matches the flat-fade temperament.
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setProgress(eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onSettle();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a live DOM element for a face index (or null). */
function faceEl(refs: Record<number, HTMLElement | null>, face: number | null): HTMLElement | null {
  if (face == null) return null;
  return refs[face] ?? null;
}

/**
 * The faces worth pre-warming around the current position: the resting spread
 * plus the incoming spread either side. Keeping this to ≤ ~4 honours the
 * source's 3-live-texture LRU (the resting pair is always one of them).
 */
function prewarmFaceList(
  position: number,
  pageCount: number,
  layout: 'single' | 'spread'
): number[] {
  const set = new Set<number>();
  const here = facesAt(position, pageCount, layout);
  if (here.left != null) set.add(here.left);
  if (here.right != null) set.add(here.right);
  const fwd = turnFaces(position, 'forward', pageCount, layout);
  if (fwd.back != null) set.add(fwd.back);
  if (fwd.revealed != null) set.add(fwd.revealed);
  const back = turnFaces(position, 'backward', pageCount, layout);
  if (back.back != null) set.add(back.back);
  return [...set];
}

let solidTextureCache: Map<string, THREE.Texture> | null = null;
/** A 1×1 solid-colour texture for a missing face (e.g. a blank back endpaper). */
function makeSolidTexture(color: string): THREE.Texture {
  solidTextureCache ??= new Map();
  const cached = solidTextureCache.get(color);
  if (cached) return cached;
  const c = new THREE.Color(color);
  const data = new Uint8Array([
    Math.round(c.r * 255),
    Math.round(c.g * 255),
    Math.round(c.b * 255),
    255,
  ]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  solidTextureCache.set(color, tex);
  return tex;
}
