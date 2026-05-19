import { describe, expect, it } from 'vitest';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';

import {
  parseAudienceOverlapConfig,
  parseContentStripConfig,
  parseDraftsDashConfig,
  parseHeadlineConfig,
  parseInboxConfig,
  parseLeaderboardConfig,
  parseMatchdayConfig,
  parseNumericProofConfig,
  parseProgrammeBackCoverConfig,
  parseProgrammeCoverConfig,
  parseProgrammeNumberingConfig,
  parseRatingsGridConfig,
  parseRisingCreatorsConfig,
  parseTierListConfig,
  parseYourAudienceConfig,
} from './config';

describe('PageBlock config parsers', () => {
  it('requires headline schema_version and text', () => {
    expect(parseHeadlineConfig({ schema_version: 1, text: 'Matchday' })).toMatchObject({
      schemaVersion: 1,
      text: 'Matchday',
    });
    expect(parseHeadlineConfig({ text: 'Missing version' })).toBeNull();
    expect(parseHeadlineConfig({ schema_version: 1 })).toBeNull();
    expect(
      parseHeadlineConfig({ schema_version: 1, text: 'Bad accent', accent_color: 'red' })
    ).toBeNull();
  });

  it('parses numeric proof layout defaults', () => {
    expect(
      parseNumericProofConfig({
        schema_version: 1,
        metrics: ['PIECES_TOTAL'],
      })
    ).toMatchObject({
      schemaVersion: 1,
      metrics: ['PIECES_TOTAL'],
      layoutStyle: 'INLINE',
    });

    expect(
      parseNumericProofConfig({
        schema_version: 1,
        metrics: ['SUBSCRIBERS'],
        layout_style: 'STACKED',
      })
    ).toMatchObject({ layoutStyle: 'STACKED' });
    expect(
      parseNumericProofConfig({
        schema_version: 1,
        metrics: [
          'SUBSCRIBERS',
          'LAST_PUBLISHED',
          'PUBLISHED_LAST_30_DAYS',
          'MEMBERS_SINCE',
          'PIECES_TOTAL',
        ],
      })
    ).toBeNull();
  });

  it('treats missing tier-list scope as principal-wide', () => {
    expect(
      parseTierListConfig({
        schema_version: 1,
        target: {
          principal: {
            id: 'squad-1',
            type: 'SQUAD',
          },
        },
      })
    ).toMatchObject({
      target: {
        principalId: 'squad-1',
        principalType: PrincipalType.SQUAD,
        scope: { kind: 'PRINCIPAL_WIDE' },
      },
    });
  });

  it('rejects content strip source kinds missing required selector fields', () => {
    const base = {
      schema_version: 1,
      layout_type: 'GRID_3COL',
      audience: 'OWNER',
    };

    expect(parseContentStripConfig({ ...base, source: { kind: 'COLLECTION' } })).toBeNull();
    expect(parseContentStripConfig({ ...base, source: { kind: 'BY_TAG', tags: [] } })).toBeNull();
    expect(parseContentStripConfig({ ...base, source: { kind: 'BY_FILTER' } })).toBeNull();
    expect(parseContentStripConfig({ ...base, source: { kind: 'FEATURED_MANUAL' } })).toBeNull();
    expect(parseContentStripConfig({ ...base, count: 0, source: { kind: 'LATEST' } })).toBeNull();
    expect(parseContentStripConfig({ ...base, count: 49, source: { kind: 'LATEST' } })).toBeNull();

    expect(
      parseContentStripConfig({
        ...base,
        source: { kind: 'COLLECTION', collection_id: 'collection-1' },
      })
    ).toMatchObject({
      source: {
        kind: 'COLLECTION',
        collectionId: 'collection-1',
      },
      filterBehaviour: 'PASS_THROUGH',
    });
  });
});

describe('Programme block parsers', () => {
  it('parses a Programme cover config and ignores missing optional fields', () => {
    expect(
      parseProgrammeCoverConfig({
        schema_version: 1,
        title: 'The BTL Programme',
        subtitle: 'Matchday reading',
        hero_topic: 'Manchester derby',
        hero_image_url: 'https://example.com/hero.jpg',
        voice_frame_template: 'programme_issue',
      })
    ).toEqual({
      schemaVersion: 1,
      title: 'The BTL Programme',
      subtitle: 'Matchday reading',
      heroTopic: 'Manchester derby',
      heroImageUrl: 'https://example.com/hero.jpg',
      voiceFrameTemplate: 'programme_issue',
    });

    expect(parseProgrammeCoverConfig({ schema_version: 1 })).toEqual({
      schemaVersion: 1,
      title: undefined,
      subtitle: undefined,
      heroTopic: undefined,
      heroImageUrl: undefined,
      voiceFrameTemplate: undefined,
    });

    expect(parseProgrammeCoverConfig({ title: 'No version' })).toBeNull();
  });

  it('applies Programme back-cover boolean defaults from the schema', () => {
    expect(parseProgrammeBackCoverConfig({ schema_version: 1 })).toEqual({
      schemaVersion: 1,
      showShareAction: true,
      showModeToggle: true,
      settingsUrl: undefined,
      shareLabel: undefined,
    });

    expect(
      parseProgrammeBackCoverConfig({
        schema_version: 1,
        show_share_action: false,
        show_mode_toggle: false,
        share_label: 'Share',
      })
    ).toMatchObject({
      showShareAction: false,
      showModeToggle: false,
      shareLabel: 'Share',
    });
  });

  it('rejects Programme numbering history_limit out of 1-12', () => {
    expect(parseProgrammeNumberingConfig({ schema_version: 1 })).toMatchObject({
      showIssueNumber: true,
      showHistory: true,
      historyLimit: 4,
    });

    expect(
      parseProgrammeNumberingConfig({
        schema_version: 1,
        history_limit: 6,
      })
    ).toMatchObject({ historyLimit: 6 });

    expect(parseProgrammeNumberingConfig({ schema_version: 1, history_limit: 0 })).toBeNull();
    expect(parseProgrammeNumberingConfig({ schema_version: 1, history_limit: 13 })).toBeNull();
  });

  it('clamps Matchday id arrays to 12 and falls back to THIS_WEEKEND for unknown windows', () => {
    const competitionIds = Array.from({ length: 14 }, (_, i) => `comp-${i}`);
    const teamIds = Array.from({ length: 15 }, (_, i) => `team-${i}`);
    const result = parseMatchdayConfig({
      schema_version: 1,
      competition_ids: competitionIds,
      team_ids: teamIds,
      window: 'NOT_A_WINDOW',
    });
    expect(result?.competitionIds).toHaveLength(12);
    expect(result?.teamIds).toHaveLength(12);
    expect(result?.window).toBe('THIS_WEEKEND');
    expect(result?.showPredictions).toBe(true);
    expect(result?.showRatings).toBe(true);

    expect(
      parseMatchdayConfig({
        schema_version: 1,
        window: 'GAMEWEEK',
        show_predictions: false,
        show_ratings: false,
      })
    ).toMatchObject({
      window: 'GAMEWEEK',
      showPredictions: false,
      showRatings: false,
    });
  });

  it('rejects Inbox count out of 1-12 and clamps item_types to 8', () => {
    const itemTypes = Array.from({ length: 10 }, (_, i) => `type-${i}`);
    const result = parseInboxConfig({
      schema_version: 1,
      item_types: itemTypes,
      priority_min: 'HIGH',
      count: 7,
    });
    expect(result?.itemTypes).toHaveLength(8);
    expect(result?.priorityMin).toBe('HIGH');
    expect(result?.count).toBe(7);

    expect(parseInboxConfig({ schema_version: 1, count: 0 })).toBeNull();
    expect(parseInboxConfig({ schema_version: 1, count: 13 })).toBeNull();

    expect(parseInboxConfig({ schema_version: 1 })).toMatchObject({
      priorityMin: 'LOW',
      count: 5,
      includeCompleted: false,
      voiceFramedOnly: false,
    });

    expect(parseInboxConfig({ schema_version: 1, priority_min: 'NOT_A_PRIORITY' })).toMatchObject({
      priorityMin: 'LOW',
    });
  });
});

describe('Creator analytics + recommendation block parsers', () => {
  it('falls back to YourAudience window 30d and filters unknown metrics', () => {
    expect(parseYourAudienceConfig({ schema_version: 1 })).toEqual({
      schemaVersion: 1,
      window: '30d',
      metrics: [],
    });

    expect(
      parseYourAudienceConfig({
        schema_version: 1,
        window: '7d',
        metrics: ['TOTAL_READERS', 'NOT_A_METRIC', 'COMPLETION_RATE'],
      })
    ).toEqual({
      schemaVersion: 1,
      window: '7d',
      metrics: ['TOTAL_READERS', 'COMPLETION_RATE'],
    });

    expect(parseYourAudienceConfig({ schema_version: 1, window: '6m' })).toMatchObject({
      window: '30d',
    });

    expect(parseYourAudienceConfig({ window: '7d' })).toBeNull();
  });

  it('rejects AudienceOverlap count out of 1-10 and clamps comparison_creator_ids to 8', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `creator-${i}`);
    expect(
      parseAudienceOverlapConfig({
        schema_version: 1,
        comparison_creator_ids: ids,
        count: 5,
      })
    ).toMatchObject({
      comparisonCreatorIds: ids.slice(0, 8),
      count: 5,
      minimumReaderCount: 50,
    });

    expect(parseAudienceOverlapConfig({ schema_version: 1, count: 0 })).toBeNull();
    expect(parseAudienceOverlapConfig({ schema_version: 1, count: 11 })).toBeNull();
    expect(
      parseAudienceOverlapConfig({ schema_version: 1, minimum_reader_count: -10 })
    ).toMatchObject({
      minimumReaderCount: 0,
    });
  });

  it('rejects DraftsDash count out of 1-12 and filters unknown statuses', () => {
    expect(
      parseDraftsDashConfig({
        schema_version: 1,
        statuses: ['DRAFT', 'NOT_A_STATUS', 'IN_REVIEW'],
        count: 8,
      })
    ).toEqual({
      schemaVersion: 1,
      statuses: ['DRAFT', 'IN_REVIEW'],
      count: 8,
      showReviewCycle: true,
    });

    expect(parseDraftsDashConfig({ schema_version: 1, count: 0 })).toBeNull();
    expect(parseDraftsDashConfig({ schema_version: 1, count: 13 })).toBeNull();
    expect(parseDraftsDashConfig({ schema_version: 1, show_review_cycle: false })).toMatchObject({
      showReviewCycle: false,
    });
  });

  it('rejects RisingCreators count out of 1-12 and clamps taxonomy_node_ids to 12', () => {
    const ids = Array.from({ length: 15 }, (_, i) => `tax-${i}`);
    expect(
      parseRisingCreatorsConfig({
        schema_version: 1,
        taxonomy_node_ids: ids,
        time_window: '7d',
      })
    ).toMatchObject({
      taxonomyNodeIds: ids.slice(0, 12),
      timeWindow: '7d',
      count: 4,
    });

    expect(parseRisingCreatorsConfig({ schema_version: 1, count: 0 })).toBeNull();
    expect(parseRisingCreatorsConfig({ schema_version: 1, count: 13 })).toBeNull();
    expect(parseRisingCreatorsConfig({ schema_version: 1, time_window: '90d' })).toMatchObject({
      timeWindow: '30d',
    });
  });

  it('requires Leaderboard capability_instance_id and bounds count to 1-100', () => {
    expect(
      parseLeaderboardConfig({
        schema_version: 1,
        capability_instance_id: 'cap-1',
        gameweek_id: 'gw-3',
        count: 25,
      })
    ).toEqual({
      schemaVersion: 1,
      capabilityInstanceId: 'cap-1',
      gameweekId: 'gw-3',
      count: 25,
      showViewerRank: true,
    });

    expect(parseLeaderboardConfig({ schema_version: 1 })).toBeNull();
    expect(parseLeaderboardConfig({ schema_version: 1, capability_instance_id: '' })).toBeNull();
    expect(
      parseLeaderboardConfig({
        schema_version: 1,
        capability_instance_id: 'cap-1',
        count: 0,
      })
    ).toBeNull();
    expect(
      parseLeaderboardConfig({
        schema_version: 1,
        capability_instance_id: 'cap-1',
        count: 101,
      })
    ).toBeNull();
  });

  it('requires RatingsGrid capability_instance_id, bounds count to 1-50, filters subject_types', () => {
    expect(
      parseRatingsGridConfig({
        schema_version: 1,
        capability_instance_id: 'cap-2',
        game_id: 'game-9',
        subject_types: ['PLAYER', 'NOT_A_SUBJECT', 'TEAM'],
        count: 30,
      })
    ).toEqual({
      schemaVersion: 1,
      capabilityInstanceId: 'cap-2',
      gameId: 'game-9',
      subjectTypes: ['PLAYER', 'TEAM'],
      count: 30,
    });

    expect(parseRatingsGridConfig({ schema_version: 1 })).toBeNull();
    expect(
      parseRatingsGridConfig({ schema_version: 1, capability_instance_id: 'cap-2', count: 51 })
    ).toBeNull();
  });
});
