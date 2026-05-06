import { BlockKind } from '@breakingthelines/protos/btl/content/v1/page_pb';

import { ContentStripBlock } from './blocks/content-strip-block';
import { HeadlineBlock } from './blocks/headline-block';
import { InboxBlock } from './blocks/inbox-block';
import { MatchdayBlock } from './blocks/matchday-block';
import { NumericProofBlock } from './blocks/numeric-proof-block';
import { ProgrammeBackCoverBlock } from './blocks/programme-back-cover-block';
import { ProgrammeCoverBlock } from './blocks/programme-cover-block';
import { ProgrammeNumberingBlock } from './blocks/programme-numbering-block';
import { TierListBlock } from './blocks/tier-list-block';
import type { PageBlockRegistry } from './types';

// Default block-kind → renderer map. Two host-adoption patterns coexist:
//
// 1. Default registry + adapter slot. The 9 BlockKinds below ship a
//    design-system fallback renderer that calls into the matching
//    `PageRendererAdapters.render*` slot when supplied (e.g. supply
//    `renderMatchday` and the host owns the rendered output). When no
//    adapter is supplied the design-system fallback section renders.
//
// 2. Router for unregistered kinds. The 6 remaining BlockKinds the
//    `content-service` registers schemas for (YOUR_AUDIENCE,
//    AUDIENCE_OVERLAP, DRAFTS_DASH, RISING_CREATORS, LEADERBOARD,
//    RATINGS_GRID) are NOT in the default registry, so PageRenderer
//    dispatches them through `adapters.renderUnknownBlock`. Use the typed
//    `createProgrammeBlockRouter` factory in `programme-block-routing.ts`
//    to dispatch by `block.kind` without writing a switch statement.
//
// Hosts can also force a default-registered kind through pattern 2 by
// passing `registry: {}` (or a `modeRegistries` mode-specific override
// that sets the kind to undefined) — see the `programme-block-routing`
// test suite for the precedence behaviour.
export const defaultPageBlockRegistry: PageBlockRegistry = {
  [BlockKind.HEADLINE]: HeadlineBlock,
  [BlockKind.NUMERIC_PROOF]: NumericProofBlock,
  [BlockKind.TIER_LIST]: TierListBlock,
  [BlockKind.CONTENT_STRIP]: ContentStripBlock,
  [BlockKind.PROGRAMME_COVER]: ProgrammeCoverBlock,
  [BlockKind.PROGRAMME_BACK_COVER]: ProgrammeBackCoverBlock,
  [BlockKind.PROGRAMME_NUMBERING]: ProgrammeNumberingBlock,
  [BlockKind.MATCHDAY]: MatchdayBlock,
  [BlockKind.INBOX]: InboxBlock,
};

export function createPageBlockRegistry(overrides: PageBlockRegistry = {}): PageBlockRegistry {
  return {
    ...defaultPageBlockRegistry,
    ...overrides,
  };
}
