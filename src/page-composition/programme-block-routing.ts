import type * as React from 'react';
import type {
  BlockKind,
  PageBlock,
  PageComposition,
  PageRenderMode,
} from '@breakingthelines/protos/btl/content/v1/page_pb';

import type { PageRendererAdapters } from './types';

/**
 * Per-kind Programme block renderer signature. Hosts implement these to
 * render Programme/Squad-capability BlockKinds — primarily the 6 kinds that
 * have no entry in `defaultPageBlockRegistry` today (YOUR_AUDIENCE,
 * AUDIENCE_OVERLAP, DRAFTS_DASH, RISING_CREATORS, LEADERBOARD,
 * RATINGS_GRID), and any default-registered Programme kind a host
 * deliberately routes through `renderUnknownBlock` via a `registry` /
 * `modeRegistries` override.
 *
 * Returning `null` falls through to "render nothing" — the same fall-through
 * behaviour as the underlying {@link PageRendererAdapters.renderUnknownBlock}
 * adapter when no renderer is registered for the block's kind.
 */
export type ProgrammeBlockRenderer = (input: {
  block: PageBlock;
  mode: PageRenderMode;
  composition?: PageComposition;
}) => React.ReactNode;

/**
 * Map of {@link BlockKind} → {@link ProgrammeBlockRenderer}. Hosts populate
 * this map with the Programme blocks they own at adoption time and pass the
 * result of {@link createProgrammeBlockRouter} into
 * {@link PageRendererAdapters.renderUnknownBlock}.
 */
export type ProgrammeBlockRouter = Partial<Record<BlockKind, ProgrammeBlockRenderer>>;

/**
 * Build a {@link PageRendererAdapters.renderUnknownBlock} adapter that
 * dispatches by `block.kind` to a host-supplied per-kind renderer map.
 *
 * Returns `null` for any kind without a registered renderer, which the
 * design-system PageRenderer treats as "render nothing" — identical to
 * omitting the `renderUnknownBlock` adapter for that kind.
 *
 * Precedence: `defaultPageBlockRegistry` always wins over
 * `renderUnknownBlock`. With the default registry intact, the router only
 * fires for the 6 Programme/Squad-capability BlockKinds the design-system
 * does not register a default renderer for: YOUR_AUDIENCE,
 * AUDIENCE_OVERLAP, DRAFTS_DASH, RISING_CREATORS, LEADERBOARD,
 * RATINGS_GRID. A host that wants the router to handle a default-registered
 * kind (PROGRAMME_COVER, PROGRAMME_BACK_COVER, PROGRAMME_NUMBERING,
 * MATCHDAY, INBOX) clears it from the registry — pass `registry={{}}` to
 * route every visible block through this adapter, or use a `modeRegistries`
 * mode-specific override that sets the kind to `undefined` for that mode.
 *
 * The router is purely additive: registering a kind here is a no-op while
 * that kind has a default renderer, so hosts can pre-wire entries for
 * Programme blocks the design-system ships defaults for and the entries
 * only fire if the host (or a future design-system release) removes the
 * default.
 */
export function createProgrammeBlockRouter(
  routes: ProgrammeBlockRouter
): NonNullable<PageRendererAdapters['renderUnknownBlock']> {
  return ({ block, mode, composition }) => {
    const renderer = routes[block.kind];
    if (!renderer) {
      return null;
    }
    return renderer({ block, mode, composition });
  };
}
