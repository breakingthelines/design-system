// BTL "magazine" page-flip — the crown-jewel onboarding + Issue reader.
//
// Built on the MIT-licensed StPageFlip engine (`page-flip`,
// https://github.com/Nodlik/StPageFlip — MIT © 2020 Nodlik). Pages are real,
// selectable DOM. On the server / first paint / reduced-motion we render a
// plain scrollable page column (flat mode); on a capable client the same page
// elements are handed to the engine, which renders a realistic paper turn with
// proper edge shadows. The cover is shown alone and opens into a two-page
// spread; a small page-curl appears on edge hover and an edge-click turns the
// page — there is no drag-to-flip.
//
// Consumed by the platform onboarding flow + Programme Issue reader (via GitHub
// Packages — call sites are wired in the platform repo, not here).

export { PageFlip } from './page-flip';
export type {
  PageFlipProps,
  PageFlipHandle,
  PageFlipPage,
  FlipMode,
  OrientationName,
} from './page-flip';

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

// Responsive single/spread layout (DearFlip-style pageMode: AUTO).
export { useBookLayout, SPREAD_MIN_WIDTH } from './use-book-layout';
export type { BookMode, BookModePreference } from './use-book-layout';

// The leaf/spread paper model (pure; useful for issue-reader page maths + tests).
export { positionCount, facesAt, turnFaces } from './book';
export type { SpreadFaces, TurnFaces, FlipDirection } from './book';

// Pluggable audio layer (keyed by spread; swap for per-spread soundtracks).
export { SynthFlipAudioSource, SilentFlipAudioSource, MUTE_STORAGE_KEY } from './flip-audio';
export type { FlipAudioSource } from './flip-audio';

// Hover-to-advance control (reuses the article-detail floating-bar design).
export { FlipHoverControl } from './flip-hover-control';

// Pure capability helpers. The flip itself only needs `prefersReducedMotion`
// (it renders flat under reduced motion); the rest stay exported as small,
// dependency-free utilities for callers that want to decide whether to mount
// the reader at all.
export {
  detectCapability,
  prefersReducedMotion,
  hasWebGL,
  MIN_DEVICE_MEMORY_GB,
  MIN_HARDWARE_CONCURRENCY,
  FPS_FLOOR,
} from './capability';
export type { CapabilityReport } from './capability';
