import * as React from 'react';
import { create } from '@bufbuild/protobuf';
import { describe, expect, it, vi } from 'vitest';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';
import {
  BlockKind,
  PageBlockSchema,
  PageRenderMode,
} from '@breakingthelines/protos/btl/content/v1/page_pb';

import { ContentStripBlock } from './blocks/content-strip-block';
import { HeadlineBlock } from './blocks/headline-block';
import { InboxBlock } from './blocks/inbox-block';
import { MatchdayBlock } from './blocks/matchday-block';
import { NumericProofBlock } from './blocks/numeric-proof-block';
import { ProgrammeBackCoverBlock } from './blocks/programme-back-cover-block';
import { ProgrammeCoverBlock } from './blocks/programme-cover-block';
import { ProgrammeNumberingBlock } from './blocks/programme-numbering-block';
import { TierListBlock } from './blocks/tier-list-block';
import type { PageBlock } from '@breakingthelines/protos/btl/content/v1/page_pb';
import type { JsonObject } from '@bufbuild/protobuf';
import type {
  NumericMetricDisplay,
  PageBlockRendererProps,
  PageRendererAdapters,
} from './types';

// Block renderers are stateless function components. Calling them directly
// avoids spinning up a DOM environment for the unit project and lets the
// tests assert the exact adapter contract platform/studio host apps must
// implement at adoption time.

function block(kind: BlockKind, config: JsonObject | undefined): PageBlock {
  return create(PageBlockSchema, {
    id: 'block-1',
    kind,
    sortOrder: 0,
    isVisible: true,
    config,
  });
}

function rendererProps(
  blockInstance: PageBlock,
  adapters: PageRendererAdapters = {},
  mode: PageRenderMode = PageRenderMode.QUICK_BROWSE
): PageBlockRendererProps {
  return {
    block: blockInstance,
    mode,
    composition: undefined,
    adapters,
    index: 0,
  };
}

function expectElement(node: React.ReactNode): React.ReactElement {
  expect(React.isValidElement(node)).toBe(true);
  return node as React.ReactElement;
}

describe('HeadlineBlock', () => {
  const validBlock = block(BlockKind.HEADLINE, {
    schema_version: 1,
    text: 'Matchday',
    eyebrow: 'Programme',
  });

  it('returns null when the config fails the schema-version check', () => {
    const result = HeadlineBlock(rendererProps(block(BlockKind.HEADLINE, { text: 'No version' })));
    expect(result).toBeNull();
  });

  it('renders the design-system fallback section when no host adapter is provided', () => {
    const result = expectElement(HeadlineBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderHeadline with the parsed config when an adapter is provided', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-headline' });
    const renderHeadline = vi.fn(() => hostNode);
    const result = HeadlineBlock(
      rendererProps(validBlock, { renderHeadline }, PageRenderMode.PROGRAMME)
    );
    expect(renderHeadline).toHaveBeenCalledTimes(1);
    expect(renderHeadline).toHaveBeenCalledWith(
      expect.objectContaining({
        block: validBlock,
        mode: PageRenderMode.PROGRAMME,
        config: expect.objectContaining({
          schemaVersion: 1,
          text: 'Matchday',
          eyebrow: 'Programme',
        }),
      })
    );
    expect(result).toBe(hostNode);
  });
});

describe('NumericProofBlock', () => {
  const validBlock = block(BlockKind.NUMERIC_PROOF, {
    schema_version: 1,
    metrics: ['PIECES_TOTAL', 'PUBLISHED_LAST_30_DAYS'],
  });

  it('returns null when the metrics list is empty or unrecognised', () => {
    expect(
      NumericProofBlock(rendererProps(block(BlockKind.NUMERIC_PROOF, { schema_version: 1, metrics: [] })))
    ).toBeNull();
  });

  it('uses fallback metrics when no resolveNumericMetric adapter is provided', () => {
    const result = expectElement(NumericProofBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('invokes resolveNumericMetric for every parsed metric in declared order', () => {
    const resolveNumericMetric = vi.fn(({ metric }: { metric: string }) => ({
      label: metric,
      value: `${metric}-value`,
    } satisfies NumericMetricDisplay));
    NumericProofBlock(rendererProps(validBlock, { resolveNumericMetric }));
    expect(resolveNumericMetric).toHaveBeenCalledTimes(2);
    expect(resolveNumericMetric.mock.calls[0]?.[0]).toMatchObject({ metric: 'PIECES_TOTAL' });
    expect(resolveNumericMetric.mock.calls[1]?.[0]).toMatchObject({ metric: 'PUBLISHED_LAST_30_DAYS' });
  });

  it('delegates to renderNumericProof when supplied, bypassing the metric resolver', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-numeric' });
    const renderNumericProof = vi.fn(() => hostNode);
    const resolveNumericMetric = vi.fn();
    const result = NumericProofBlock(
      rendererProps(validBlock, { renderNumericProof, resolveNumericMetric })
    );
    expect(renderNumericProof).toHaveBeenCalledTimes(1);
    expect(resolveNumericMetric).not.toHaveBeenCalled();
    expect(result).toBe(hostNode);
  });
});

describe('TierListBlock', () => {
  const validBlock = block(BlockKind.TIER_LIST, {
    schema_version: 1,
    target: { principal: { id: 'squad-1', type: 'SQUAD' } },
    layout_style: 'CARDS',
  });

  it('returns null when the target principal is missing', () => {
    const result = TierListBlock(
      rendererProps(
        block(BlockKind.TIER_LIST, {
          schema_version: 1,
          target: { principal: { id: '', type: 'SQUAD' } },
        })
      )
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback section when no host adapter is provided', () => {
    const result = expectElement(TierListBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderTierList with the parsed principal-wide scope', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-tier-list' });
    const renderTierList = vi.fn(() => hostNode);
    const result = TierListBlock(rendererProps(validBlock, { renderTierList }));
    expect(renderTierList).toHaveBeenCalledTimes(1);
    expect(renderTierList).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          target: expect.objectContaining({
            principalId: 'squad-1',
            principalType: PrincipalType.SQUAD,
            scope: { kind: 'PRINCIPAL_WIDE' },
          }),
          layoutStyle: 'CARDS',
        }),
      })
    );
    expect(result).toBe(hostNode);
  });
});

describe('ContentStripBlock', () => {
  const validBlock = block(BlockKind.CONTENT_STRIP, {
    schema_version: 1,
    layout_type: 'GRID_3COL',
    source: { kind: 'LATEST' },
    audience: 'OWNER',
    count: 6,
    label: 'Latest',
  });

  it('returns null when required source selectors are missing', () => {
    const result = ContentStripBlock(
      rendererProps(
        block(BlockKind.CONTENT_STRIP, {
          schema_version: 1,
          layout_type: 'GRID_3COL',
          source: { kind: 'COLLECTION' },
          audience: 'OWNER',
        })
      )
    );
    expect(result).toBeNull();
  });

  it('renders the design-system placeholder section when no host adapter is provided', () => {
    const result = expectElement(ContentStripBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderContentStrip with the parsed config when an adapter is provided', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-content-strip' });
    const renderContentStrip = vi.fn(() => hostNode);
    const result = ContentStripBlock(
      rendererProps(validBlock, { renderContentStrip }, PageRenderMode.PROGRAMME)
    );
    expect(renderContentStrip).toHaveBeenCalledTimes(1);
    expect(renderContentStrip).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: PageRenderMode.PROGRAMME,
        config: expect.objectContaining({
          layoutType: 'GRID_3COL',
          source: expect.objectContaining({ kind: 'LATEST' }),
          audience: 'OWNER',
          count: 6,
          filterBehaviour: 'PASS_THROUGH',
        }),
      })
    );
    expect(result).toBe(hostNode);
  });
});

// Walk a React element tree without rendering function components beyond the
// helpers explicitly invoked in the tests below. This is enough to assert the
// semantic structure (element types, ids, aria attributes) of block fallback
// renders without standing up a DOM environment for the unit project.
function findElement(
  root: React.ReactElement,
  predicate: (el: React.ReactElement) => boolean
): React.ReactElement | null {
  if (predicate(root)) return root;
  const children = (root.props as { children?: React.ReactNode }).children;
  return findElementInNode(children, predicate);
}

function findElementInNode(
  node: React.ReactNode,
  predicate: (el: React.ReactElement) => boolean
): React.ReactElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElementInNode(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (React.isValidElement(node)) {
    return findElement(node, predicate);
  }
  return null;
}

describe('HeadlineBlock fallback a11y', () => {
  it('labels the section via aria-labelledby pointing at the h1 heading id', () => {
    const validBlock = block(BlockKind.HEADLINE, {
      schema_version: 1,
      text: 'Matchday',
      eyebrow: 'Programme',
    });
    const result = expectElement(HeadlineBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    expect(sectionProps['aria-labelledby']).toBeTruthy();

    const heading = findElement(result, (el) => el.type === 'h1');
    expect(heading).not.toBeNull();
    const headingProps = heading!.props as { id: string; children: React.ReactNode };
    expect(headingProps.id).toBe(sectionProps['aria-labelledby']);
    expect(headingProps.children).toBe('Matchday');
  });
});

describe('NumericProofBlock fallback a11y', () => {
  it('labels the section via aria-label when no config label is provided', () => {
    const blockNoLabel = block(BlockKind.NUMERIC_PROOF, {
      schema_version: 1,
      metrics: ['SUBSCRIBERS'],
    });
    const result = expectElement(NumericProofBlock(rendererProps(blockNoLabel)));
    const props = result.props as { 'aria-label'?: string; 'aria-labelledby'?: string };
    expect(props['aria-label']).toBe('Numeric proof');
    expect(props['aria-labelledby']).toBeUndefined();
  });

  it('labels the section via aria-labelledby pointing at the h2 when a label is configured', () => {
    const blockWithLabel = block(BlockKind.NUMERIC_PROOF, {
      schema_version: 1,
      metrics: ['SUBSCRIBERS'],
      label: 'The archive',
    });
    const result = expectElement(NumericProofBlock(rendererProps(blockWithLabel)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    expect(sectionProps['aria-labelledby']).toBeTruthy();

    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    const headingProps = heading!.props as { id: string; children: React.ReactNode };
    expect(headingProps.id).toBe(sectionProps['aria-labelledby']);
    expect(headingProps.children).toBe('The archive');
  });

  it('renders the metric grid as a definition list with dt/dd cells per metric', () => {
    const blockWithMetrics = block(BlockKind.NUMERIC_PROOF, {
      schema_version: 1,
      metrics: ['PIECES_TOTAL', 'PUBLISHED_LAST_30_DAYS'],
    });
    const result = expectElement(NumericProofBlock(rendererProps(blockWithMetrics)));
    const dl = findElement(result, (el) => el.type === 'dl');
    expect(dl).not.toBeNull();

    const cells = React.Children.toArray((dl!.props as { children: React.ReactNode }).children).filter(
      React.isValidElement
    );
    expect(cells).toHaveLength(2);

    // Each cell is a MetricCell function-component element. Render it once
    // so we can assert dt/dd presence on the actual fallback DOM.
    const cell = cells[0] as React.ReactElement;
    const Cell = cell.type as (props: Record<string, unknown>) => React.ReactElement;
    const renderedCell = Cell(cell.props as Record<string, unknown>);
    expect(findElement(renderedCell, (el) => el.type === 'dt')).not.toBeNull();
    expect(findElement(renderedCell, (el) => el.type === 'dd')).not.toBeNull();
  });
});

describe('TierListBlock fallback a11y', () => {
  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const validBlock = block(BlockKind.TIER_LIST, {
      schema_version: 1,
      target: { principal: { id: 'squad-1', type: 'SQUAD' } },
      layout_style: 'CARDS',
    });
    const result = expectElement(TierListBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    expect(sectionProps['aria-labelledby']).toBeTruthy();

    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('ContentStripBlock fallback a11y', () => {
  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const validBlock = block(BlockKind.CONTENT_STRIP, {
      schema_version: 1,
      layout_type: 'GRID_3COL',
      source: { kind: 'LATEST' },
      audience: 'OWNER',
      count: 6,
    });
    const result = expectElement(ContentStripBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    expect(sectionProps['aria-labelledby']).toBeTruthy();

    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('ProgrammeCoverBlock', () => {
  const validBlock = block(BlockKind.PROGRAMME_COVER, {
    schema_version: 1,
    title: 'Chelsea v Liverpool',
    subtitle: 'A matchday issue',
    hero_topic: 'Premier League',
    voice_frame_template: 'programme_issue',
  });

  it('returns null when the config fails the schema-version check', () => {
    const result = ProgrammeCoverBlock(
      rendererProps(block(BlockKind.PROGRAMME_COVER, { title: 'No version' }))
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback header when no host adapter is provided', () => {
    const result = expectElement(ProgrammeCoverBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderProgrammeCover with the parsed config when supplied', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-cover' });
    const renderProgrammeCover = vi.fn(() => hostNode);
    const result = ProgrammeCoverBlock(
      rendererProps(validBlock, { renderProgrammeCover }, PageRenderMode.PROGRAMME)
    );
    expect(renderProgrammeCover).toHaveBeenCalledTimes(1);
    expect(renderProgrammeCover).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: PageRenderMode.PROGRAMME,
        config: expect.objectContaining({
          title: 'Chelsea v Liverpool',
          heroTopic: 'Premier League',
          voiceFrameTemplate: 'programme_issue',
        }),
      })
    );
    expect(result).toBe(hostNode);
  });

  it('labels the section via aria-labelledby pointing at the h1 heading id', () => {
    const result = expectElement(ProgrammeCoverBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    const heading = findElement(result, (el) => el.type === 'h1');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('ProgrammeBackCoverBlock', () => {
  const validBlock = block(BlockKind.PROGRAMME_BACK_COVER, {
    schema_version: 1,
    show_share_action: true,
    show_mode_toggle: true,
    share_label: 'Share this issue',
  });

  it('returns null when the config fails the schema-version check', () => {
    const result = ProgrammeBackCoverBlock(
      rendererProps(block(BlockKind.PROGRAMME_BACK_COVER, { share_label: 'No version' }))
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback section when no host adapter is provided', () => {
    const result = expectElement(ProgrammeBackCoverBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderProgrammeBackCover with the parsed config when supplied', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-back-cover' });
    const renderProgrammeBackCover = vi.fn(() => hostNode);
    const result = ProgrammeBackCoverBlock(
      rendererProps(validBlock, { renderProgrammeBackCover })
    );
    expect(renderProgrammeBackCover).toHaveBeenCalledTimes(1);
    expect(renderProgrammeBackCover).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          showShareAction: true,
          showModeToggle: true,
          shareLabel: 'Share this issue',
        }),
      })
    );
    expect(result).toBe(hostNode);
  });

  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const result = expectElement(ProgrammeBackCoverBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('ProgrammeNumberingBlock', () => {
  const validBlock = block(BlockKind.PROGRAMME_NUMBERING, {
    schema_version: 1,
    show_issue_number: true,
    show_history: true,
    history_limit: 4,
  });

  it('returns null when history_limit is out of 1-12', () => {
    const result = ProgrammeNumberingBlock(
      rendererProps(
        block(BlockKind.PROGRAMME_NUMBERING, {
          schema_version: 1,
          history_limit: 99,
        })
      )
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback strip when no host adapter is provided', () => {
    const result = expectElement(ProgrammeNumberingBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderProgrammeNumbering with the parsed config when supplied', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-numbering' });
    const renderProgrammeNumbering = vi.fn(() => hostNode);
    const result = ProgrammeNumberingBlock(
      rendererProps(validBlock, { renderProgrammeNumbering })
    );
    expect(renderProgrammeNumbering).toHaveBeenCalledTimes(1);
    expect(renderProgrammeNumbering).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          showIssueNumber: true,
          showHistory: true,
          historyLimit: 4,
        }),
      })
    );
    expect(result).toBe(hostNode);
  });

  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const result = expectElement(ProgrammeNumberingBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('MatchdayBlock', () => {
  const validBlock = block(BlockKind.MATCHDAY, {
    schema_version: 1,
    window: 'THIS_WEEKEND',
    show_predictions: true,
    show_ratings: true,
  });

  it('returns null when the config fails the schema-version check', () => {
    const result = MatchdayBlock(
      rendererProps(block(BlockKind.MATCHDAY, { window: 'THIS_WEEKEND' }))
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback section when no host adapter is provided', () => {
    const result = expectElement(MatchdayBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderMatchday with the parsed config when supplied', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-matchday' });
    const renderMatchday = vi.fn(() => hostNode);
    const result = MatchdayBlock(rendererProps(validBlock, { renderMatchday }));
    expect(renderMatchday).toHaveBeenCalledTimes(1);
    expect(renderMatchday).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          window: 'THIS_WEEKEND',
          showPredictions: true,
          showRatings: true,
        }),
      })
    );
    expect(result).toBe(hostNode);
  });

  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const result = expectElement(MatchdayBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});

describe('InboxBlock', () => {
  const validBlock = block(BlockKind.INBOX, {
    schema_version: 1,
    priority_min: 'LOW',
    count: 5,
    include_completed: false,
    voice_framed_only: false,
  });

  it('returns null when count is out of 1-12', () => {
    const result = InboxBlock(
      rendererProps(block(BlockKind.INBOX, { schema_version: 1, count: 0 }))
    );
    expect(result).toBeNull();
  });

  it('renders the design-system fallback section when no host adapter is provided', () => {
    const result = expectElement(InboxBlock(rendererProps(validBlock)));
    expect(result.type).toBe('section');
  });

  it('delegates to renderInbox with the parsed config when supplied', () => {
    const hostNode = React.createElement('div', { 'data-test': 'host-inbox' });
    const renderInbox = vi.fn(() => hostNode);
    const result = InboxBlock(rendererProps(validBlock, { renderInbox }));
    expect(renderInbox).toHaveBeenCalledTimes(1);
    expect(renderInbox).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          priorityMin: 'LOW',
          count: 5,
          includeCompleted: false,
          voiceFramedOnly: false,
        }),
      })
    );
    expect(result).toBe(hostNode);
  });

  it('labels the section via aria-labelledby pointing at the h2 heading id', () => {
    const result = expectElement(InboxBlock(rendererProps(validBlock)));
    const sectionProps = result.props as { 'aria-labelledby'?: string };
    const heading = findElement(result, (el) => el.type === 'h2');
    expect(heading).not.toBeNull();
    expect((heading!.props as { id: string }).id).toBe(sectionProps['aria-labelledby']);
  });
});
