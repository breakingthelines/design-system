// WebGL "magazine" page-flip — the crown-jewel onboarding renderer.
//
// A single-quad fragment-shader cylindrical page-curl (text stays crisp because
// the curl is a per-pixel UV remap, not mesh deformation), with rigid-rotateY
// skim and a no-WebGL flat-mode fallback. Pages are live interactive DOM at
// rest, frozen to GPU textures only during a turn via the PageFaceSource
// freeze/thaw contract.
//
// Consumed by the platform onboarding flow + Programme Issue reader (later, via
// GitHub Packages — not wired here).

export { PageFlip } from './page-flip';
export type { PageFlipProps, PageFlipHandle, PageFlipPage, FlipMode } from './page-flip';

// Programme Issue reader — standalone "open an issue", composed over PageFlip.
// Reused for the onboarding Issue #1 reveal. (Explicit file path, not the
// directory index, so bunchee/Rollup resolves it without a directory-main.)
export { IssueReader } from './issue-reader/issue-reader';
export type {
  IssueReaderProps,
  IssueReaderHandle,
  IssueReaderMode,
  IssueMeta,
  IssueFace,
} from './issue-reader/issue-reader';

export {
  ScreenshotPageFaceSource,
  createPageFaceSource,
  MAX_FREEZE_DPR,
  MAX_LIVE_TEXTURES,
} from './page-face-source';
export type { PageFaceSource, FreezeOptions } from './page-face-source';

export { PageCurlMaterialImpl } from './page-curl-material';
export type { PageCurlMaterialUniforms, PageCurlMaterialElement } from './page-curl-material';

export { usePageFlipController } from './use-page-flip-controller';
export type {
  PageFlipController,
  PageFlipControllerOptions,
  FlipDirection,
} from './use-page-flip-controller';

// Responsive single/spread layout (DearFlip-style pageMode: AUTO).
export { useBookLayout, SPREAD_MIN_WIDTH } from './use-book-layout';
export type { BookMode, BookModePreference } from './use-book-layout';

// The leaf/spread paper model (pure; useful for issue-reader page maths + tests).
export { positionCount, facesAt, turnFaces } from './book';
export type { SpreadFaces, TurnFaces } from './book';

// Pluggable audio layer (keyed by spread; swap for per-spread soundtracks).
export { SynthFlipAudioSource, SilentFlipAudioSource, MUTE_STORAGE_KEY } from './flip-audio';
export type { FlipAudioSource } from './flip-audio';

// Hover-to-advance control (reuses the article-detail floating-bar design).
export { FlipHoverControl } from './flip-hover-control';

export {
  detectCapability,
  prefersReducedMotion,
  hasWebGL,
  MIN_DEVICE_MEMORY_GB,
  MIN_HARDWARE_CONCURRENCY,
  FPS_FLOOR,
} from './capability';
export type { CapabilityReport } from './capability';
