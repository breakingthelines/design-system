import type * as React from 'react';
import type { BlockKind, PageBlock, PageComposition, PageRenderMode } from '@breakingthelines/protos/btl/content/v1/page_pb';

import type {
  ContentStripBlockConfig,
  HeadlineBlockConfig,
  InboxBlockConfig,
  MatchdayBlockConfig,
  NumericProofBlockConfig,
  NumericProofMetric,
  ProgrammeBackCoverBlockConfig,
  ProgrammeCoverBlockConfig,
  ProgrammeNumberingBlockConfig,
  TierListBlockConfig,
} from './config';

/**
 * One resolved numeric metric the design-system NumericProofBlock fallback
 * renders. Hosts return one of these from {@link PageRendererAdapters.resolveNumericMetric}.
 */
export interface NumericMetricDisplay {
  /** Short uppercase label rendered in the metric cell heading. */
  label: string;
  /** The numeric value (or any React node, e.g. a formatted timestamp). */
  value: React.ReactNode;
  /** Optional supporting caption rendered below the value. */
  caption?: React.ReactNode;
}

/**
 * Host-supplied callbacks the headless PageRenderer dispatches to so each
 * block can be rendered by app-owned, data-bound UI without moving the
 * design-system into app territory.
 *
 * Contract for every adapter:
 * - The adapter receives the *parsed* config (typed `HeadlineBlockConfig`,
 *   `TierListBlockConfig`, etc.), not the raw `JsonObject` from the block's
 *   `config` field.
 * - The adapter receives the active {@link PageRenderMode} so a single
 *   adapter can render Programme- vs Quick Browse-flavoured UI.
 * - The adapter return value replaces the design-system presentational
 *   fallback verbatim — there is no merging or wrapping.
 * - Returning `null` or `undefined` falls back to the design-system
 *   presentational renderer for that block.
 */
export interface PageRendererAdapters {
  /**
   * Render a {@link HeadlineBlockConfig} block. Hosts typically render the
   * page-level masthead with their own typography, link primitives, and
   * media here. When omitted, the design-system fallback section renders.
   */
  renderHeadline?: (input: {
    block: PageBlock;
    config: HeadlineBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Whole-block override for a {@link NumericProofBlockConfig} block.
   * Short-circuits {@link PageRendererAdapters.resolveNumericMetric}; when
   * supplied, the per-metric resolver is not invoked. Use this when the
   * host wants to render the entire numeric-proof section (skeleton loaders,
   * data fetching, layout) end-to-end.
   */
  renderNumericProof?: (input: {
    block: PageBlock;
    config: NumericProofBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render a {@link ContentStripBlockConfig} block. Hosts wire their
   * content-fetching hooks here and render the layout that matches
   * `config.layoutType`. When omitted, the design-system fallback renders
   * a placeholder section.
   */
  renderContentStrip?: (input: {
    block: PageBlock;
    config: ContentStripBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render a {@link TierListBlockConfig} block. Hosts wire their
   * subscription-tier fetching and tier-selection actions here. When
   * omitted, the design-system fallback renders a placeholder section.
   */
  renderTierList?: (input: {
    block: PageBlock;
    config: TierListBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Per-metric resolver invoked by the design-system NumericProofBlock
   * fallback. Called once per metric in the order declared by
   * `config.metrics`. Return `null` to fall back to the design-system
   * placeholder for that single metric. Bypassed entirely when
   * {@link PageRendererAdapters.renderNumericProof} is supplied.
   */
  resolveNumericMetric?: (input: {
    metric: NumericProofMetric;
    block: PageBlock;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => NumericMetricDisplay | null;
  /**
   * Render a {@link ProgrammeCoverBlockConfig} block. Hosts typically
   * render the Programme issue masthead — title, subtitle, hero topic,
   * voice-frame artwork — here. When omitted, the design-system fallback
   * section renders.
   */
  renderProgrammeCover?: (input: {
    block: PageBlock;
    config: ProgrammeCoverBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render a {@link ProgrammeBackCoverBlockConfig} block. Hosts wire share
   * actions, render-mode toggles, and settings affordances here. When
   * omitted, the design-system fallback section renders.
   */
  renderProgrammeBackCover?: (input: {
    block: PageBlock;
    config: ProgrammeBackCoverBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render a {@link ProgrammeNumberingBlockConfig} block. Hosts render
   * issue identity (Issue #N) and history links here. When omitted, the
   * design-system fallback section renders.
   */
  renderProgrammeNumbering?: (input: {
    block: PageBlock;
    config: ProgrammeNumberingBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render a {@link MatchdayBlockConfig} block. Hosts wire game-service
   * fixtures, predictions, and ratings here. When omitted, the
   * design-system fallback section renders a placeholder.
   */
  renderMatchday?: (input: {
    block: PageBlock;
    config: MatchdayBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Render an {@link InboxBlockConfig} block. Hosts wire
   * notification-service Inbox items and Assistant Manager voice frames
   * here. When omitted, the design-system fallback section renders a
   * placeholder.
   */
  renderInbox?: (input: {
    block: PageBlock;
    config: InboxBlockConfig;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
  /**
   * Catch-all for blocks whose `kind` has no entry in the active block
   * registry. The default registry covers 9 kinds: HEADLINE,
   * NUMERIC_PROOF, TIER_LIST, CONTENT_STRIP, PROGRAMME_COVER,
   * PROGRAMME_BACK_COVER, PROGRAMME_NUMBERING, MATCHDAY, INBOX. Six
   * BlockKinds the `content-service` registers schemas for fall through
   * here by default: YOUR_AUDIENCE, AUDIENCE_OVERLAP, DRAFTS_DASH,
   * RISING_CREATORS, LEADERBOARD, RATINGS_GRID.
   *
   * Hosts can either implement this directly or use the typed
   * `createProgrammeBlockRouter` factory to dispatch by `block.kind`
   * without writing a switch statement.
   *
   * Return any React node the host wants to render in place of the
   * unknown block; return `null` (or omit the adapter) to render nothing.
   */
  renderUnknownBlock?: (input: {
    block: PageBlock;
    mode: PageRenderMode;
    composition?: PageComposition;
  }) => React.ReactNode;
}

/**
 * Props the headless PageRenderer passes to every block renderer. Custom
 * block renderers added to a {@link PageBlockRegistry} or
 * {@link PageRenderModeRegistries} must accept this shape.
 */
export interface PageBlockRendererProps {
  /** The PageBlock proto being rendered. */
  block: PageBlock;
  /** The active render mode (Quick Browse vs Programme). */
  mode: PageRenderMode;
  /** The full PageComposition the block is part of, when available. */
  composition?: PageComposition;
  /** Host-supplied adapters threaded through from the PageRenderer call. */
  adapters: PageRendererAdapters;
  /** 0-based index of this block among the visible, sorted blocks. */
  index: number;
}

/**
 * A function/class component that renders a PageBlock. Designed so any
 * design-system or host React component matching {@link PageBlockRendererProps}
 * can be plugged into the registry.
 */
export type PageBlockRenderer = React.ComponentType<PageBlockRendererProps>;

/**
 * Map of {@link BlockKind} → renderer. The default registry exported as
 * `defaultPageBlockRegistry` covers 9 kinds: HEADLINE, NUMERIC_PROOF,
 * TIER_LIST, CONTENT_STRIP, PROGRAMME_COVER, PROGRAMME_BACK_COVER,
 * PROGRAMME_NUMBERING, MATCHDAY, INBOX. Hosts extend it via
 * `createPageBlockRegistry({...})` to add Squad-capability renderers
 * (LEADERBOARD, RATINGS_GRID) or override any default-registered kind.
 */
export type PageBlockRegistry = Partial<Record<BlockKind, PageBlockRenderer>>;

/**
 * Optional per-mode renderer overrides. When the active `mode` is found in
 * this map, its registry entries take precedence over the base registry on
 * a per-block-kind basis. Use this for the Programme vs Quick Browse split:
 * keep one base registry and override only the blocks that render
 * differently in Programme mode.
 */
export type PageRenderModeRegistries = Partial<Record<PageRenderMode, PageBlockRegistry>>;
