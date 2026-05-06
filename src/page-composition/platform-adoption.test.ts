import { describe, expect, it } from 'vitest';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';

import {
  parseContentStripConfig,
  parseHeadlineConfig,
  parseInboxConfig,
  parseMatchdayConfig,
  parseNumericProofConfig,
  parseProgrammeBackCoverConfig,
  parseProgrammeCoverConfig,
  parseProgrammeNumberingConfig,
  parseTierListConfig,
} from './config';

// Configs in this file mirror the per-surface default composer in
// `content-service/internal/domain/pagecomposition/defaults.go`. They are the
// PageBlock shapes the backend actually emits for every default composition
// we ship, so the design-system parsers must accept them verbatim before
// `platform`/`studio` can adopt the published `@breakingthelines/design-system`
// PageRenderer in place of `platform/app/pagecomposition`.

describe('PageBlock parsers accept content-service default compositions', () => {
  it('accepts the SUBSCRIPTION surface defaults (headline + tier list)', () => {
    const headline = parseHeadlineConfig({
      schema_version: 1,
      eyebrow: 'Membership',
      text: 'Back this writer',
      subtitle: 'Full access to every piece, from the first word to the final whistle.',
    });
    expect(headline).toMatchObject({
      schemaVersion: 1,
      text: 'Back this writer',
      eyebrow: 'Membership',
    });

    const tierList = parseTierListConfig({
      schema_version: 1,
      target: { principal: { id: 'user-1', type: 'USER' } },
      layout_style: 'CARDS',
    });
    expect(tierList).toMatchObject({
      target: {
        principalId: 'user-1',
        principalType: PrincipalType.USER,
        scope: { kind: 'PRINCIPAL_WIDE' },
      },
      layoutStyle: 'CARDS',
    });
  });

  it('accepts the PROFILE surface default LATEST/OWNER content strip', () => {
    const strip = parseContentStripConfig({
      schema_version: 1,
      layout_type: 'FEATURE_LEFT_LIST_RIGHT',
      source: { kind: 'LATEST' },
      audience: 'OWNER',
      count: 6,
      label: 'Latest',
    });
    expect(strip).toMatchObject({
      layoutType: 'FEATURE_LEFT_LIST_RIGHT',
      source: { kind: 'LATEST' },
      audience: 'OWNER',
      count: 6,
      filterBehaviour: 'PASS_THROUGH',
    });
  });

  it('accepts the COLLECTION_SUBSCRIPTION default route_collection tier list', () => {
    const tierList = parseTierListConfig({
      schema_version: 1,
      target: {
        principal: { id: 'squad-1', type: 'SQUAD' },
        scope: { route_collection: true },
      },
      layout_style: 'CARDS',
    });
    expect(tierList).toMatchObject({
      target: {
        principalType: PrincipalType.SQUAD,
        scope: { kind: 'ROUTE_COLLECTION' },
      },
    });
  });

  it('accepts the ARENA default MEMBERSHIPS_FEED content strip without source selectors', () => {
    const strip = parseContentStripConfig({
      schema_version: 1,
      layout_type: 'FEATURE_LEFT_LIST_RIGHT',
      source: { kind: 'MEMBERSHIPS_FEED' },
      audience: 'VIEWER_MEMBERSHIPS',
      count: 12,
      label: 'From your memberships',
    });
    expect(strip).toMatchObject({
      source: { kind: 'MEMBERSHIPS_FEED' },
      audience: 'VIEWER_MEMBERSHIPS',
      count: 12,
    });
  });

  it('accepts the SUBSCRIPTIONS_LIBRARY default headline', () => {
    const headline = parseHeadlineConfig({
      schema_version: 1,
      eyebrow: 'Your wallet',
      text: 'Memberships',
      subtitle: "Everyone you're backing, when they next renew, and what you're spending.",
    });
    expect(headline).toMatchObject({
      text: 'Memberships',
      eyebrow: 'Your wallet',
    });
  });

  it('accepts the PROGRAMME_ISSUE default TRENDING content strip', () => {
    const strip = parseContentStripConfig({
      schema_version: 1,
      layout_type: 'HERO_CAROUSEL',
      source: { kind: 'TRENDING' },
      audience: 'GLOBAL',
      count: 6,
      label: 'In the conversation',
    });
    expect(strip).toMatchObject({
      layoutType: 'HERO_CAROUSEL',
      source: { kind: 'TRENDING' },
      audience: 'GLOBAL',
      count: 6,
    });
  });
});

// The following deltas tighten existing platform/app/pagecomposition behavior
// to match the JSON schemas in `content-service/internal/domain/pagecomposition/schemas/*.v1.json`.
// They are documented here so the platform/studio cutover knows what data the
// design-system parsers will reject, and so a future drift in the backend
// default composer is caught by these tests rather than at runtime.

describe('Stricter design-system parsers vs platform/app/pagecomposition', () => {
  it('requires schema_version: 1 even for shapes platform accepted without it', () => {
    expect(parseHeadlineConfig({ text: 'No version' })).toBeNull();
    expect(
      parseContentStripConfig({
        layout_type: 'GRID_3COL',
        source: { kind: 'LATEST' },
        audience: 'OWNER',
      })
    ).toBeNull();
    expect(
      parseTierListConfig({
        target: { principal: { id: 'u', type: 'USER' } },
      })
    ).toBeNull();
    expect(parseNumericProofConfig({ metrics: ['SUBSCRIBERS'] })).toBeNull();
  });

  it('rejects ContentStrip count outside the schema range 1-48', () => {
    expect(
      parseContentStripConfig({
        schema_version: 1,
        layout_type: 'GRID_3COL',
        source: { kind: 'LATEST' },
        audience: 'OWNER',
        count: 0,
      })
    ).toBeNull();
    expect(
      parseContentStripConfig({
        schema_version: 1,
        layout_type: 'GRID_3COL',
        source: { kind: 'LATEST' },
        audience: 'OWNER',
        count: 100,
      })
    ).toBeNull();
  });

  it('returns PRINCIPAL_WIDE for missing TierList scope (platform returned UNSPECIFIED)', () => {
    const tierList = parseTierListConfig({
      schema_version: 1,
      target: { principal: { id: 'u', type: 'USER' } },
    });
    expect(tierList?.target.scope).toEqual({ kind: 'PRINCIPAL_WIDE' });
  });

  it('rejects unsupported NumericProof shapes the schema does not allow', () => {
    expect(
      parseNumericProofConfig({ schema_version: 1, metrics: ['NOT_A_METRIC'] })
    ).toBeNull();
    expect(parseNumericProofConfig({ schema_version: 1, metrics: [] })).toBeNull();
  });
});

// The PROGRAMME_ISSUE default composition emits six blocks today (cover,
// numbering, matchday, content strip, inbox, back cover) — see
// `programmeIssueDefaults` in `content-service/internal/domain/pagecomposition/defaults.go`.
// Asserting that every one of those six blocks parses through the design-
// system parsers proves the canonical Programme default composition is fully
// type-checkable end-to-end and gives the eventual published-package
// adoption a single fixture to regression-test against.

describe('PROGRAMME_ISSUE default composition end-to-end parser coverage', () => {
  it('parses every block in the canonical PROGRAMME_ISSUE default composition', () => {
    const cover = parseProgrammeCoverConfig({
      schema_version: 1,
      title: 'The BTL Programme',
      subtitle: 'Your matchday reading list, built from the latest BTL signals.',
      voice_frame_template: 'programme_issue',
    });
    expect(cover).toMatchObject({
      title: 'The BTL Programme',
      voiceFrameTemplate: 'programme_issue',
    });

    const numbering = parseProgrammeNumberingConfig({
      schema_version: 1,
      show_issue_number: true,
      show_history: true,
      history_limit: 4,
    });
    expect(numbering).toMatchObject({
      showIssueNumber: true,
      showHistory: true,
      historyLimit: 4,
    });

    const matchday = parseMatchdayConfig({
      schema_version: 1,
      window: 'THIS_WEEKEND',
      show_predictions: true,
      show_ratings: true,
    });
    expect(matchday).toMatchObject({
      window: 'THIS_WEEKEND',
      showPredictions: true,
      showRatings: true,
    });

    const contentStrip = parseContentStripConfig({
      schema_version: 1,
      layout_type: 'HERO_CAROUSEL',
      source: { kind: 'TRENDING' },
      audience: 'GLOBAL',
      count: 6,
      label: 'In the conversation',
    });
    expect(contentStrip).toMatchObject({
      layoutType: 'HERO_CAROUSEL',
      source: { kind: 'TRENDING' },
      audience: 'GLOBAL',
      count: 6,
    });

    const inbox = parseInboxConfig({
      schema_version: 1,
      priority_min: 'LOW',
      count: 5,
      include_completed: false,
      voice_framed_only: false,
    });
    expect(inbox).toMatchObject({
      priorityMin: 'LOW',
      count: 5,
      includeCompleted: false,
      voiceFramedOnly: false,
    });

    const backCover = parseProgrammeBackCoverConfig({
      schema_version: 1,
      show_share_action: true,
      show_mode_toggle: true,
      share_label: 'Share this issue',
    });
    expect(backCover).toMatchObject({
      showShareAction: true,
      showModeToggle: true,
      shareLabel: 'Share this issue',
    });
  });
});
