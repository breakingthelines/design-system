import * as React from 'react';
import { create } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';
import {
  BlockKind,
  PageBlockSchema,
  PageCompositionSchema,
  PageRenderMode,
  PageSurface,
} from '@breakingthelines/protos/btl/content/v1/page_pb';

import { PageRenderer } from './page-renderer';
import {
  createProgrammeBlockRouter,
  type ProgrammeBlockRenderer,
  type ProgrammeBlockRouter,
} from './programme-block-routing';

// 5 Programme BlockKinds the design-system DOES register a default renderer
// for in `defaultPageBlockRegistry`. With the default registry intact, these
// kinds never reach `adapters.renderUnknownBlock` — they are dispatched by
// their dedicated design-system block components (which themselves call into
// the matching `PageRendererAdapters.render*` slot when one is supplied).
// The only way to push them through `renderUnknownBlock` is to deliberately
// override the registry — see the third describe block for that pattern.
const REGISTERED_PROGRAMME_KINDS: readonly BlockKind[] = [
  BlockKind.PROGRAMME_COVER,
  BlockKind.PROGRAMME_BACK_COVER,
  BlockKind.PROGRAMME_NUMBERING,
  BlockKind.MATCHDAY,
  BlockKind.INBOX,
];

// 6 Programme/Squad-capability BlockKinds the design-system does NOT register
// a default renderer for. With the default registry intact, these are the
// only kinds that flow through `adapters.renderUnknownBlock` — and therefore
// through `createProgrammeBlockRouter`. Hosts that want a typed dispatch over
// these kinds plug the router into `renderUnknownBlock` directly.
const UNREGISTERED_PROGRAMME_KINDS: readonly BlockKind[] = [
  BlockKind.YOUR_AUDIENCE,
  BlockKind.AUDIENCE_OVERLAP,
  BlockKind.DRAFTS_DASH,
  BlockKind.RISING_CREATORS,
  BlockKind.LEADERBOARD,
  BlockKind.RATINGS_GRID,
];

// All 11 Programme/Squad-capability BlockKinds. Used by helper-only tests
// where we exercise `createProgrammeBlockRouter` directly. The helper itself
// is registry-independent: it dispatches by `block.kind` regardless of which
// kinds the design-system registers default renderers for. PageRenderer's
// dispatch order (registry first, `renderUnknownBlock` after) is what
// determines which kinds actually reach the router at integration time.
const ALL_PROGRAMME_KINDS: readonly BlockKind[] = [
  ...REGISTERED_PROGRAMME_KINDS,
  ...UNREGISTERED_PROGRAMME_KINDS,
];

function programmeBlock(kind: BlockKind, sortOrder: number, id?: string) {
  return create(PageBlockSchema, {
    id: id ?? '',
    kind,
    sortOrder,
    isVisible: true,
  });
}

function programmeComposition(blocks: ReturnType<typeof programmeBlock>[]) {
  return create(PageCompositionSchema, {
    surface: PageSurface.PROGRAMME_ISSUE,
    principal: { id: 'squad-1', type: PrincipalType.SQUAD },
    version: 'programme-routing-fixture',
    blocks,
  });
}

function asElement(node: React.ReactNode): React.ReactElement {
  expect(React.isValidElement(node)).toBe(true);
  return node as React.ReactElement;
}

function fragmentChild(fragment: React.ReactElement): React.ReactNode {
  expect(fragment.type).toBe(React.Fragment);
  return (fragment.props as { children: React.ReactNode }).children;
}

describe('createProgrammeBlockRouter', () => {
  it('routes every Programme/Squad-capability BlockKind to its registered renderer', () => {
    // Helper-only test: we exercise the router callable directly so registry
    // precedence does not apply. The helper must dispatch by `block.kind`
    // for any kind the host registers a renderer for, including kinds the
    // design-system also registers a default renderer for.
    const calls: BlockKind[] = [];
    const routes: ProgrammeBlockRouter = Object.fromEntries(
      ALL_PROGRAMME_KINDS.map((kind) => [
        kind,
        ((input) => {
          calls.push(input.block.kind);
          return null;
        }) satisfies ProgrammeBlockRenderer,
      ])
    );

    const renderUnknownBlock = createProgrammeBlockRouter(routes);

    for (const kind of ALL_PROGRAMME_KINDS) {
      const block = programmeBlock(kind, 0);
      renderUnknownBlock({ block, mode: PageRenderMode.PROGRAMME });
    }

    expect(calls).toEqual([...ALL_PROGRAMME_KINDS]);
  });

  it('returns null for kinds with no registered renderer', () => {
    const renderUnknownBlock = createProgrammeBlockRouter({
      [BlockKind.LEADERBOARD]: () =>
        React.createElement('span', { 'data-test': 'leaderboard' }),
    });

    const unhandled = renderUnknownBlock({
      block: programmeBlock(BlockKind.RATINGS_GRID, 0),
      mode: PageRenderMode.PROGRAMME,
    });
    expect(unhandled).toBeNull();

    const handled = renderUnknownBlock({
      block: programmeBlock(BlockKind.LEADERBOARD, 0),
      mode: PageRenderMode.PROGRAMME,
    });
    expect(React.isValidElement(handled)).toBe(true);
  });

  it('forwards mode and composition into the per-kind renderer', () => {
    const leaderboardRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const renderUnknownBlock = createProgrammeBlockRouter({
      [BlockKind.LEADERBOARD]: leaderboardRenderer,
    });

    const block = programmeBlock(BlockKind.LEADERBOARD, 0, 'leaderboard-1');
    const composition = programmeComposition([block]);

    renderUnknownBlock({ block, mode: PageRenderMode.PROGRAMME, composition });
    expect(leaderboardRenderer).toHaveBeenCalledTimes(1);
    expect(leaderboardRenderer).toHaveBeenCalledWith({
      block,
      mode: PageRenderMode.PROGRAMME,
      composition,
    });
  });
});

describe('PageRenderer + createProgrammeBlockRouter integration with the default registry', () => {
  it('dispatches every unregistered Programme/Squad-capability BlockKind through the router', () => {
    const seen: BlockKind[] = [];
    const renderer: ProgrammeBlockRenderer = ({ block }) => {
      seen.push(block.kind);
      return React.createElement('span', { 'data-kind': block.kind });
    };

    const routes: ProgrammeBlockRouter = Object.fromEntries(
      UNREGISTERED_PROGRAMME_KINDS.map((kind) => [kind, renderer])
    );

    const composition = programmeComposition(
      UNREGISTERED_PROGRAMME_KINDS.map((kind, index) =>
        programmeBlock(kind, (index + 1) * 10)
      )
    );

    const result = asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        adapters: { renderUnknownBlock: createProgrammeBlockRouter(routes) },
      })
    );

    expect(seen).toEqual([...UNREGISTERED_PROGRAMME_KINDS]);

    // PageRenderer wraps each unknown-block render in a Fragment so the
    // host renderer return value is preserved verbatim. Assert one Fragment
    // per unregistered Programme block.
    const wrapperProps = result.props as { children: React.ReactNode };
    const children = React.Children.toArray(wrapperProps.children).map(asElement);
    expect(children).toHaveLength(UNREGISTERED_PROGRAMME_KINDS.length);
    for (const child of children) {
      expect(child.type).toBe(React.Fragment);
    }
  });

  it('does not invoke the router for default-registered Programme BlockKinds', () => {
    // The 5 registered Programme kinds (PROGRAMME_COVER, PROGRAMME_BACK_COVER,
    // PROGRAMME_NUMBERING, MATCHDAY, INBOX) are dispatched by their dedicated
    // design-system block components, not by `renderUnknownBlock`. Even when
    // the router has entries for those kinds, the registry wins.
    const seen: BlockKind[] = [];
    const renderer: ProgrammeBlockRenderer = ({ block }) => {
      seen.push(block.kind);
      return null;
    };

    const routes: ProgrammeBlockRouter = Object.fromEntries(
      ALL_PROGRAMME_KINDS.map((kind) => [kind, renderer])
    );

    const composition = programmeComposition(
      ALL_PROGRAMME_KINDS.map((kind, index) =>
        programmeBlock(kind, (index + 1) * 10)
      )
    );

    asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        adapters: { renderUnknownBlock: createProgrammeBlockRouter(routes) },
      })
    );

    // Only the 6 unregistered kinds reach the router; the 5 registered
    // Programme kinds are short-circuited by the registry.
    expect(seen).toEqual([...UNREGISTERED_PROGRAMME_KINDS]);
    for (const registered of REGISTERED_PROGRAMME_KINDS) {
      expect(seen).not.toContain(registered);
    }
  });

  it('falls through to null wrapped in a Fragment for unregistered kinds the router does not handle', () => {
    const routes: ProgrammeBlockRouter = {
      [BlockKind.LEADERBOARD]: () =>
        React.createElement('span', { 'data-test': 'leaderboard' }),
    };

    const composition = programmeComposition([
      programmeBlock(BlockKind.LEADERBOARD, 10, 'leaderboard'),
      programmeBlock(BlockKind.RATINGS_GRID, 20, 'ratings-grid'),
    ]);

    const result = asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        adapters: { renderUnknownBlock: createProgrammeBlockRouter(routes) },
      })
    );

    const wrapperProps = result.props as { children: React.ReactNode };
    const children = React.Children.toArray(wrapperProps.children).map(asElement);
    expect(children).toHaveLength(2);

    // The leaderboard Fragment carries the host-supplied <span>; the
    // ratings-grid Fragment carries `null` because the router has no entry
    // for that kind.
    expect(React.isValidElement(fragmentChild(children[0]))).toBe(true);
    expect(fragmentChild(children[1])).toBeNull();
  });

  it('keeps the nine default-registered renderers active even when the router has entries for those kinds', () => {
    // The default registry covers HEADLINE, NUMERIC_PROOF, TIER_LIST,
    // CONTENT_STRIP plus the 5 Programme kinds. The default registry always
    // wins over `renderUnknownBlock` per the PageRenderer dispatch order, so
    // a router entry for any of the 9 default kinds is silently ignored.
    // Only the unregistered LEADERBOARD entry actually fires.
    const headlineRouterRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const matchdayRouterRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const inboxRouterRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const leaderboardRouterRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);

    const composition = programmeComposition([
      create(PageBlockSchema, {
        id: 'headline',
        kind: BlockKind.HEADLINE,
        sortOrder: 5,
        isVisible: true,
        config: { schema_version: 1, text: 'Matchday', eyebrow: 'Programme' },
      }),
      programmeBlock(BlockKind.MATCHDAY, 10, 'matchday'),
      programmeBlock(BlockKind.INBOX, 15, 'inbox'),
      programmeBlock(BlockKind.LEADERBOARD, 20, 'leaderboard'),
    ]);

    asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        adapters: {
          renderUnknownBlock: createProgrammeBlockRouter({
            [BlockKind.HEADLINE]: headlineRouterRenderer,
            [BlockKind.MATCHDAY]: matchdayRouterRenderer,
            [BlockKind.INBOX]: inboxRouterRenderer,
            [BlockKind.LEADERBOARD]: leaderboardRouterRenderer,
          }),
        },
      })
    );

    expect(headlineRouterRenderer).not.toHaveBeenCalled();
    expect(matchdayRouterRenderer).not.toHaveBeenCalled();
    expect(inboxRouterRenderer).not.toHaveBeenCalled();
    expect(leaderboardRouterRenderer).toHaveBeenCalledTimes(1);
    expect(leaderboardRouterRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ kind: BlockKind.LEADERBOARD }),
        mode: PageRenderMode.PROGRAMME,
      })
    );
  });

  it('assigns stable distinct React keys for routed blocks without an id', () => {
    const routes: ProgrammeBlockRouter = {
      [BlockKind.LEADERBOARD]: () => null,
      [BlockKind.RATINGS_GRID]: () => null,
    };

    // Three visible Programme blocks, none with an id and none in the
    // default registry. PageRenderer's fallback key is
    // `${kind}-${sortOrder}`; sortOrder must be distinct so blocks with
    // the same kind get distinct keys.
    const composition = programmeComposition([
      programmeBlock(BlockKind.LEADERBOARD, 10),
      programmeBlock(BlockKind.RATINGS_GRID, 20),
      programmeBlock(BlockKind.RATINGS_GRID, 30),
    ]);

    const result = asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        adapters: { renderUnknownBlock: createProgrammeBlockRouter(routes) },
      })
    );

    const wrapperProps = result.props as { children: React.ReactNode };
    // Iterate the raw children array (not Children.toArray) so we read the
    // keys PageRenderer set, not React's normalised `.$`-prefixed form.
    const children = wrapperProps.children as React.ReactElement[];
    expect(children).toHaveLength(3);
    const keys = children.map((child) => child.key);
    expect(keys).toEqual([
      `${BlockKind.LEADERBOARD}-10`,
      `${BlockKind.RATINGS_GRID}-20`,
      `${BlockKind.RATINGS_GRID}-30`,
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('PageRenderer + createProgrammeBlockRouter integration with deliberate registry overrides', () => {
  it('routes a default-registered kind through the router when the host supplies an empty `registry`', () => {
    const routerRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const composition = programmeComposition([
      create(PageBlockSchema, {
        id: 'headline',
        kind: BlockKind.HEADLINE,
        sortOrder: 5,
        isVisible: true,
        config: { schema_version: 1, text: 'Matchday', eyebrow: 'Programme' },
      }),
      programmeBlock(BlockKind.MATCHDAY, 10, 'matchday'),
      programmeBlock(BlockKind.LEADERBOARD, 20, 'leaderboard'),
    ]);

    asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        // An empty `registry` clears the default block-kind → renderer map,
        // so HEADLINE and MATCHDAY no longer have defaults and fall through
        // to `renderUnknownBlock` alongside the unregistered LEADERBOARD.
        registry: {},
        adapters: {
          renderUnknownBlock: createProgrammeBlockRouter({
            [BlockKind.HEADLINE]: routerRenderer,
            [BlockKind.MATCHDAY]: routerRenderer,
            [BlockKind.LEADERBOARD]: routerRenderer,
          }),
        },
      })
    );

    expect(routerRenderer).toHaveBeenCalledTimes(3);
    const seenKinds = routerRenderer.mock.calls.map(
      ([input]) => (input as { block: { kind: BlockKind } }).block.kind
    );
    expect(seenKinds).toEqual([
      BlockKind.HEADLINE,
      BlockKind.MATCHDAY,
      BlockKind.LEADERBOARD,
    ]);
  });

  it('routes a default-registered kind through the router when `modeRegistries` removes its default for the active mode', () => {
    const matchdayRouterRenderer = vi.fn<ProgrammeBlockRenderer>(() => null);
    const composition = programmeComposition([
      programmeBlock(BlockKind.MATCHDAY, 5, 'matchday'),
    ]);

    asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        // The mode-specific override sets MATCHDAY to `undefined` for
        // PROGRAMME, removing the default renderer for that kind in this
        // mode and forcing the block through the router. Other modes
        // (e.g. QUICK_BROWSE) would still use the default.
        modeRegistries: {
          [PageRenderMode.PROGRAMME]: {
            [BlockKind.MATCHDAY]: undefined,
          },
        },
        adapters: {
          renderUnknownBlock: createProgrammeBlockRouter({
            [BlockKind.MATCHDAY]: matchdayRouterRenderer,
          }),
        },
      })
    );

    expect(matchdayRouterRenderer).toHaveBeenCalledTimes(1);
    expect(matchdayRouterRenderer).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ kind: BlockKind.MATCHDAY }),
        mode: PageRenderMode.PROGRAMME,
      })
    );
  });
});
