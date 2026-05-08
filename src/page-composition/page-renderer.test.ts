import * as React from 'react';
import { create } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import {
  BlockKind,
  PageBlockSchema,
  PageCompositionSchema,
  PageRenderMode,
  PageSurface,
} from '@breakingthelines/protos/btl/content/v1/page_pb';

import { getPageBlockRegistryForMode, getVisiblePageBlocks, PageRenderer } from './page-renderer';
import type { PageBlockRendererProps } from './types';

const quickBrowseRenderer = () => null;
const programmeRenderer = () => null;

describe('getVisiblePageBlocks', () => {
  it('filters hidden blocks and sorts visible blocks by sortOrder', () => {
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'third',
          kind: BlockKind.CONTENT_STRIP,
          sortOrder: 30,
          isVisible: true,
        }),
        create(PageBlockSchema, {
          id: 'hidden',
          kind: BlockKind.TIER_LIST,
          sortOrder: 5,
          isVisible: false,
        }),
        create(PageBlockSchema, {
          id: 'first',
          kind: BlockKind.HEADLINE,
          sortOrder: 10,
          isVisible: true,
        }),
      ],
    });

    expect(getVisiblePageBlocks(composition).map((block) => block.id)).toEqual(['first', 'third']);
    expect(composition.blocks.map((block) => block.id)).toEqual(['third', 'hidden', 'first']);
  });
});

describe('getPageBlockRegistryForMode', () => {
  it('merges mode-specific renderers over the base registry', () => {
    const registry = getPageBlockRegistryForMode(
      { [BlockKind.HEADLINE]: quickBrowseRenderer },
      {
        [PageRenderMode.PROGRAMME]: {
          [BlockKind.HEADLINE]: programmeRenderer,
        },
      },
      PageRenderMode.PROGRAMME
    );

    expect(registry[BlockKind.HEADLINE]).toBe(programmeRenderer);
  });
});

// PageRenderer is a stateless function component; call it directly and inspect
// the returned React element tree. This exercises the branches host apps will
// hit at adoption time without pulling in a DOM environment for the unit
// project.

function asElement(node: React.ReactNode): React.ReactElement {
  expect(React.isValidElement(node)).toBe(true);
  return node as React.ReactElement;
}

// Render a PageRendererNotice element returned by PageRenderer one level
// deeper so we can assert the rendered DOM (role attribute, structural
// element type) without standing up a DOM environment for the unit project.
function renderNoticeChild(notice: React.ReactElement): React.ReactElement {
  const Notice = notice.type as (props: Record<string, unknown>) => React.ReactElement;
  return Notice(notice.props as Record<string, unknown>);
}

describe('PageRenderer branches', () => {
  it('returns an alert-role error notice when loadError is true and no errorState is provided', () => {
    const result = asElement(PageRenderer({ loadError: true }));
    expect(typeof result.type).toBe('function');
    expect((result.props as { tone?: string }).tone).toBe('error');
    const rendered = renderNoticeChild(result);
    expect(rendered.type).toBe('div');
    expect((rendered.props as { role?: string }).role).toBe('alert');
  });

  it('renders the host-provided errorState verbatim when loadError is true', () => {
    const customError = React.createElement('div', { 'data-test': 'custom-error' });
    const result = PageRenderer({ loadError: true, errorState: customError });
    expect(result).toBe(customError);
  });

  it('returns a status-role empty notice when there are no visible blocks', () => {
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'hidden',
          kind: BlockKind.HEADLINE,
          sortOrder: 0,
          isVisible: false,
        }),
      ],
    });
    const result = asElement(PageRenderer({ composition }));
    expect(typeof result.type).toBe('function');
    expect((result.props as { tone?: string }).tone).toBeUndefined();
    const rendered = renderNoticeChild(result);
    expect(rendered.type).toBe('div');
    expect((rendered.props as { role?: string }).role).toBe('status');
  });

  it('renders the host-provided emptyState verbatim when there are no visible blocks', () => {
    const customEmpty = React.createElement('div', { 'data-test': 'custom-empty' });
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [],
    });
    const result = PageRenderer({ composition, emptyState: customEmpty });
    expect(result).toBe(customEmpty);
  });

  it('passes className and the active mode through to the wrapper element', () => {
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'headline',
          kind: BlockKind.HEADLINE,
          sortOrder: 0,
          isVisible: true,
        }),
      ],
    });
    const result = asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        className: 'custom-wrapper',
      })
    );
    const props = result.props as { className: string; 'data-page-render-mode': PageRenderMode };
    expect(result.type).toBe('div');
    expect(props.className).toContain('custom-wrapper');
    expect(props['data-page-render-mode']).toBe(PageRenderMode.PROGRAMME);
  });

  it('invokes renderUnknownBlock when a visible block has no registered renderer', () => {
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'unknown',
          kind: BlockKind.MATCHDAY,
          sortOrder: 0,
          isVisible: true,
        }),
      ],
    });
    const renderUnknownBlock = vi.fn(() => React.createElement('span', { 'data-test': 'unknown' }));
    const result = asElement(
      PageRenderer({
        composition,
        registry: {},
        adapters: { renderUnknownBlock },
      })
    );
    expect(renderUnknownBlock).toHaveBeenCalledTimes(1);
    expect(renderUnknownBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ kind: BlockKind.MATCHDAY }),
        mode: PageRenderMode.QUICK_BROWSE,
      })
    );

    const wrapperProps = result.props as { children: React.ReactNode };
    const children = React.Children.toArray(wrapperProps.children);
    expect(children).toHaveLength(1);
    const fragment = asElement(children[0]);
    expect(fragment.type).toBe(React.Fragment);
  });

  it('renders a Fragment with null when a visible block has no renderer and no adapter', () => {
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'unknown',
          kind: BlockKind.MATCHDAY,
          sortOrder: 0,
          isVisible: true,
        }),
      ],
    });
    const result = asElement(PageRenderer({ composition, registry: {} }));
    const wrapperProps = result.props as { children: React.ReactNode };
    const children = React.Children.toArray(wrapperProps.children);
    expect(children).toHaveLength(1);
    const fragment = asElement(children[0]);
    expect(fragment.type).toBe(React.Fragment);
    expect((fragment.props as { children: React.ReactNode }).children).toBeNull();
  });

  it('routes a block through the mode-specific override when one is provided', () => {
    const baseRenderer = vi.fn(() => null);
    const programmeOverride = vi.fn(() => null);
    const composition = create(PageCompositionSchema, {
      surface: PageSurface.PROGRAMME_ISSUE,
      blocks: [
        create(PageBlockSchema, {
          id: 'headline',
          kind: BlockKind.HEADLINE,
          sortOrder: 0,
          isVisible: true,
        }),
      ],
    });
    const result = asElement(
      PageRenderer({
        composition,
        mode: PageRenderMode.PROGRAMME,
        registry: {
          [BlockKind.HEADLINE]: baseRenderer as React.ComponentType<PageBlockRendererProps>,
        },
        modeRegistries: {
          [PageRenderMode.PROGRAMME]: {
            [BlockKind.HEADLINE]: programmeOverride as React.ComponentType<PageBlockRendererProps>,
          },
        },
      })
    );
    const wrapperProps = result.props as { children: React.ReactNode };
    const children = React.Children.toArray(wrapperProps.children);
    const blockElement = asElement(children[0]);
    expect(blockElement.type).toBe(programmeOverride);
    expect(blockElement.type).not.toBe(baseRenderer);
  });
});
