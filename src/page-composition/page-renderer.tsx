import * as React from 'react';
import type {
  PageBlock,
  PageComposition,
  PageRenderMode,
} from '@breakingthelines/protos/btl/content/v1/page_pb';
import { PageRenderMode as RenderMode } from '@breakingthelines/protos/btl/content/v1/page_pb';

import { cn } from '#/lib/utils';

import { defaultPageBlockRegistry } from './registry';
import type { PageBlockRegistry, PageRenderModeRegistries, PageRendererAdapters } from './types';

/**
 * Props for the headless {@link PageRenderer}. Hosts wire data fetching and
 * adapter implementations here; the design-system owns block dispatch,
 * sort/visibility, mode-registry selection, and the fallback notices for
 * loadError / empty composition.
 */
export interface PageRendererProps {
  /**
   * The PageComposition to render. Pass `null` or `undefined` while the
   * host is fetching; the renderer will show the empty notice.
   */
  composition?: PageComposition | null;
  /**
   * Active render mode. Defaults to `QUICK_BROWSE`. The mode is forwarded
   * to every block renderer and to {@link PageRendererProps.modeRegistries}
   * for per-mode renderer overrides.
   */
  mode?: PageRenderMode;
  /**
   * Base block-kind → renderer map. Defaults to the design-system's
   * `defaultPageBlockRegistry` covering 9 kinds: HEADLINE, NUMERIC_PROOF,
   * TIER_LIST, CONTENT_STRIP, PROGRAMME_COVER, PROGRAMME_BACK_COVER,
   * PROGRAMME_NUMBERING, MATCHDAY, INBOX. Use `createPageBlockRegistry({...})`
   * to add or override entries; pass `{}` to clear all defaults so every
   * visible block flows through `adapters.renderUnknownBlock`.
   */
  registry?: PageBlockRegistry;
  /**
   * Optional per-mode renderer overrides. When the active mode is found in
   * this map, its entries take precedence over `registry` on a per-block
   * basis. Use this for the Programme vs Quick Browse split.
   */
  modeRegistries?: PageRenderModeRegistries;
  /**
   * Host-supplied adapters threaded into every default block renderer. See
   * {@link PageRendererAdapters} for the contract.
   */
  adapters?: PageRendererAdapters;
  /**
   * Set to `true` when the host's composition fetch failed. The renderer
   * renders the error notice (or the host-provided `errorState`) and skips
   * block dispatch entirely.
   */
  loadError?: boolean;
  /** Optional class appended to the wrapper div. */
  className?: string;
  /**
   * Optional host-provided node that replaces the design-system empty
   * notice when the composition has no visible blocks. Returned verbatim.
   */
  emptyState?: React.ReactNode;
  /**
   * Optional host-provided node that replaces the design-system error
   * notice when `loadError` is true. Returned verbatim.
   */
  errorState?: React.ReactNode;
}

/**
 * Headless PageRenderer for content-service Page Composition. Filters and
 * sorts visible blocks, selects the active block-kind registry (merging any
 * mode-specific overrides), and delegates block rendering to either a
 * registry entry or the host's `renderUnknownBlock` adapter. Keeps no app
 * data hooks of its own — all transport, fetching, and side effects live
 * in the host adapters.
 */
export function PageRenderer({
  composition,
  mode = RenderMode.QUICK_BROWSE,
  registry = defaultPageBlockRegistry,
  modeRegistries,
  adapters = {},
  loadError = false,
  className,
  emptyState,
  errorState,
}: PageRendererProps) {
  if (loadError) {
    return errorState ?? <PageRendererNotice tone="error">We couldn't load this page right now.</PageRendererNotice>;
  }

  const visibleBlocks = getVisiblePageBlocks(composition);
  const activeRegistry = getPageBlockRegistryForMode(registry, modeRegistries, mode);

  if (visibleBlocks.length === 0) {
    return emptyState ?? <PageRendererNotice>This page does not have a published composition yet.</PageRendererNotice>;
  }

  return (
    <div className={cn('pb-14', className)} data-page-render-mode={mode}>
      {visibleBlocks.map((block, index) => {
        const blockKey = block.id || `${block.kind}-${block.sortOrder}`;
        const Renderer = activeRegistry[block.kind];
        if (!Renderer) {
          return (
            <React.Fragment key={blockKey}>
              {adapters.renderUnknownBlock?.({
                block,
                mode,
                composition: composition ?? undefined,
              }) ?? null}
            </React.Fragment>
          );
        }

        return (
          <Renderer
            key={blockKey}
            block={block}
            mode={mode}
            composition={composition ?? undefined}
            adapters={adapters}
            index={index}
          />
        );
      })}
    </div>
  );
}

export function getPageBlockRegistryForMode(
  registry: PageBlockRegistry,
  modeRegistries: PageRenderModeRegistries | undefined,
  mode: PageRenderMode
): PageBlockRegistry {
  return {
    ...registry,
    ...modeRegistries?.[mode],
  };
}

export function getVisiblePageBlocks(composition?: PageComposition | null): PageBlock[] {
  return (composition?.blocks ?? []).reduce<PageBlock[]>((sorted, block) => {
    if (!block.isVisible) {
      return sorted;
    }

    const next = [...sorted];
    const insertAt = next.findIndex((candidate) => block.sortOrder < candidate.sortOrder);
    if (insertAt === -1) {
      next.push(block);
    } else {
      next.splice(insertAt, 0, block);
    }
    return next;
  }, []);
}

function PageRendererNotice({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'error';
}) {
  // role="alert" (assertive announcement) for the loadError path; role="status"
  // (polite announcement) for the no-published-composition path. Both roles
  // imply the matching aria-live behaviour, so no explicit aria-live is set.
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="mx-auto max-w-[1144px] px-4 py-20"
    >
      <div
        className={cn(
          'rounded-[28px] border px-6 py-8 text-sm leading-7',
          tone === 'error'
            ? 'border-red-100/20 bg-red-100/6 text-white/70'
            : 'border-white/10 bg-white/[0.025] text-white/58'
        )}
      >
        {children}
      </div>
    </div>
  );
}
