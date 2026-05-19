import type { JsonObject } from '@bufbuild/protobuf';
import { PrincipalType } from '@breakingthelines/protos/btl/common/v1/enums_pb';

export interface HeadlineBlockConfig {
  schemaVersion: 1;
  text: string;
  subtitle?: string;
  eyebrow?: string;
  accentColor?: string;
}

export type NumericProofMetric =
  | 'SUBSCRIBERS'
  | 'LAST_PUBLISHED'
  | 'PUBLISHED_LAST_30_DAYS'
  | 'MEMBERS_SINCE'
  | 'PIECES_TOTAL'
  | 'AVG_WORDS_PER_PIECE';

export interface NumericProofBlockConfig {
  schemaVersion: 1;
  metrics: NumericProofMetric[];
  layoutStyle: 'INLINE' | 'STACKED';
  label?: string;
}

export type TierListTargetScope =
  | { kind: 'PRINCIPAL_WIDE' }
  | { kind: 'COLLECTION'; collectionId: string }
  | { kind: 'ROUTE_COLLECTION' };

export interface TierListTargetConfig {
  principalId: string;
  principalType: PrincipalType;
  scope: TierListTargetScope;
}

export interface TierListBlockConfig {
  schemaVersion: 1;
  target: TierListTargetConfig;
  layoutStyle: 'CARDS' | 'TABLE' | 'COMPACT';
  highlightTierId?: string;
  label?: string;
}

export type ContentStripLayout =
  | 'HERO_CAROUSEL'
  | 'FEATURED_SINGLE'
  | 'THREE_COLUMN_FEATURE_CENTER'
  | 'FEATURE_LEFT_LIST_RIGHT'
  | 'LIST_VERTICAL'
  | 'GRID_3COL'
  | 'GRID_4COL'
  | 'CAROUSEL_HORIZONTAL'
  | 'EPISODE_LIST'
  | 'VIDEO_PLAYER_SIDEBAR'
  | 'THOUGHT_FEED';

export type ContentStripSourceKind =
  | 'LATEST'
  | 'TRENDING'
  | 'EDITORIAL'
  | 'FEATURED_MANUAL'
  | 'COLLECTION'
  | 'BY_TAG'
  | 'BY_FILTER'
  | 'MEMBERSHIPS_FEED'
  | 'SEARCH_RESULT';

export interface ContentStripBlockConfig {
  schemaVersion: 1;
  layoutType: ContentStripLayout;
  source: {
    kind: ContentStripSourceKind;
    contentType?: 'ARTICLE' | 'VIDEO' | 'PODCAST' | 'NEWSLETTER' | 'VISUAL';
    collectionId?: string;
    filterId?: string;
    ids: string[];
    tags: string[];
  };
  audience: 'OWNER' | 'GLOBAL' | 'VIEWER_MEMBERSHIPS';
  filterBehaviour: 'PASS_THROUGH' | 'HIDE_ON_FILTER' | 'REPLACE_ON_FILTER';
  count: number;
  label?: string;
}

type JsonRecord = Record<string, unknown>;

const NUMERIC_PROOF_METRICS = new Set<NumericProofMetric>([
  'SUBSCRIBERS',
  'LAST_PUBLISHED',
  'PUBLISHED_LAST_30_DAYS',
  'MEMBERS_SINCE',
  'PIECES_TOTAL',
  'AVG_WORDS_PER_PIECE',
]);

const CONTENT_STRIP_LAYOUTS = new Set<ContentStripLayout>([
  'HERO_CAROUSEL',
  'FEATURED_SINGLE',
  'THREE_COLUMN_FEATURE_CENTER',
  'FEATURE_LEFT_LIST_RIGHT',
  'LIST_VERTICAL',
  'GRID_3COL',
  'GRID_4COL',
  'CAROUSEL_HORIZONTAL',
  'EPISODE_LIST',
  'VIDEO_PLAYER_SIDEBAR',
  'THOUGHT_FEED',
]);

const CONTENT_STRIP_SOURCES = new Set<ContentStripSourceKind>([
  'LATEST',
  'TRENDING',
  'EDITORIAL',
  'FEATURED_MANUAL',
  'COLLECTION',
  'BY_TAG',
  'BY_FILTER',
  'MEMBERSHIPS_FEED',
  'SEARCH_RESULT',
]);

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasSchemaVersionOne(value: JsonRecord): boolean {
  return value.schema_version === 1;
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function principalTypeFromConfig(value: unknown): PrincipalType {
  switch (value) {
    case 'USER':
      return PrincipalType.USER;
    case 'SQUAD':
      return PrincipalType.SQUAD;
    case 'AGENT':
      return PrincipalType.AGENT;
    default:
      return PrincipalType.UNSPECIFIED;
  }
}

export function parseHeadlineConfig(config?: JsonObject): HeadlineBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const text = stringOrUndefined(config.text);
  if (!text) {
    return null;
  }
  const accentColor = stringOrUndefined(config.accent_color);
  if (accentColor && !HEX_COLOR_PATTERN.test(accentColor)) {
    return null;
  }

  return {
    schemaVersion: 1,
    text,
    subtitle: stringOrUndefined(config.subtitle),
    eyebrow: stringOrUndefined(config.eyebrow),
    accentColor,
  };
}

export function parseNumericProofConfig(config?: JsonObject): NumericProofBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config) || !Array.isArray(config.metrics)) {
    return null;
  }

  const metrics = config.metrics.filter(
    (metric): metric is NumericProofMetric =>
      typeof metric === 'string' && NUMERIC_PROOF_METRICS.has(metric as NumericProofMetric)
  );

  if (metrics.length === 0 || metrics.length > 4) {
    return null;
  }

  return {
    schemaVersion: 1,
    metrics,
    layoutStyle: config.layout_style === 'STACKED' ? 'STACKED' : 'INLINE',
    label: stringOrUndefined(config.label),
  };
}

export function parseTierListConfig(config?: JsonObject): TierListBlockConfig | null {
  if (
    !isRecord(config) ||
    !hasSchemaVersionOne(config) ||
    !isRecord(config.target) ||
    !isRecord(config.target.principal)
  ) {
    return null;
  }

  const principalId = stringOrUndefined(config.target.principal.id);
  const principalType = principalTypeFromConfig(config.target.principal.type);
  if (!principalId || principalType === PrincipalType.UNSPECIFIED) {
    return null;
  }

  let scope: TierListTargetScope = { kind: 'PRINCIPAL_WIDE' };
  if (isRecord(config.target.scope)) {
    const collectionId = stringOrUndefined(config.target.scope.collection_id);
    if (collectionId) {
      scope = { kind: 'COLLECTION', collectionId };
    } else if (config.target.scope.route_collection === true) {
      scope = { kind: 'ROUTE_COLLECTION' };
    } else if (config.target.scope.principal_wide === true) {
      scope = { kind: 'PRINCIPAL_WIDE' };
    }
  }

  return {
    schemaVersion: 1,
    target: {
      principalId,
      principalType,
      scope,
    },
    layoutStyle:
      config.layout_style === 'TABLE' || config.layout_style === 'COMPACT'
        ? config.layout_style
        : 'CARDS',
    highlightTierId: stringOrUndefined(config.highlight_tier_id),
    label: stringOrUndefined(config.label),
  };
}

export function parseContentStripConfig(config?: JsonObject): ContentStripBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config) || !isRecord(config.source)) {
    return null;
  }

  const layoutType = stringOrUndefined(config.layout_type);
  const sourceKind = stringOrUndefined(config.source.kind);
  const audience = stringOrUndefined(config.audience);
  const count = numberOrUndefined(config.count) ?? 6;
  const source = {
    kind: sourceKind as ContentStripSourceKind,
    contentType: stringOrUndefined(config.source.content_type) as
      | 'ARTICLE'
      | 'VIDEO'
      | 'PODCAST'
      | 'NEWSLETTER'
      | 'VISUAL'
      | undefined,
    collectionId: stringOrUndefined(config.source.collection_id),
    filterId: stringOrUndefined(config.source.filter_id),
    ids: stringArray(config.source.ids),
    tags: stringArray(config.source.tags),
  };
  if (
    !layoutType ||
    !CONTENT_STRIP_LAYOUTS.has(layoutType as ContentStripLayout) ||
    !sourceKind ||
    !CONTENT_STRIP_SOURCES.has(sourceKind as ContentStripSourceKind) ||
    (audience !== 'OWNER' && audience !== 'GLOBAL' && audience !== 'VIEWER_MEMBERSHIPS') ||
    count < 1 ||
    count > 48
  ) {
    return null;
  }

  if (!isValidContentStripSource(source)) {
    return null;
  }

  return {
    schemaVersion: 1,
    layoutType: layoutType as ContentStripLayout,
    source,
    audience,
    filterBehaviour:
      config.filter_behaviour === 'HIDE_ON_FILTER' ||
      config.filter_behaviour === 'REPLACE_ON_FILTER'
        ? config.filter_behaviour
        : 'PASS_THROUGH',
    count,
    label: stringOrUndefined(config.label),
  };
}

function isValidContentStripSource(source: ContentStripBlockConfig['source']): boolean {
  switch (source.kind) {
    case 'COLLECTION':
      return !!source.collectionId;
    case 'BY_TAG':
      return source.tags.length > 0;
    case 'BY_FILTER':
      return !!source.filterId;
    case 'FEATURED_MANUAL':
      return source.ids.length > 0;
    default:
      return true;
  }
}

// ── Programme block configs ────────────────────────────────────────────────
//
// The five Programme block kinds (cover, back-cover, numbering, matchday,
// inbox) are emitted by the content-service PROGRAMME_ISSUE default composer
// today but the design-system does not yet ship default fallback renderers or
// adapter slots for them. The parser surface is added here so hosts that opt
// in via a custom block registry get typed config access without each host
// rewriting the same JSON shape coercions. When design-system block
// renderers + adapter slots land, they will reuse these parsers; the JSON
// schemas in `content-service/internal/domain/pagecomposition/schemas/` are
// the source of truth.

/**
 * Parsed config for `BLOCK_KIND_PROGRAMME_COVER`. Mirrors
 * `programme_cover.v1.json`: every field beyond `schemaVersion` is optional
 * because the backend default composer is the typical author and supplies
 * only what the surface requires.
 */
export interface ProgrammeCoverBlockConfig {
  schemaVersion: 1;
  title?: string;
  subtitle?: string;
  heroTopic?: string;
  heroImageUrl?: string;
  voiceFrameTemplate?: string;
}

/**
 * Parsed config for `BLOCK_KIND_PROGRAMME_BACK_COVER`. Boolean toggles use
 * the schema defaults (`show_share_action: true`, `show_mode_toggle: true`)
 * when the inbound config omits them.
 */
export interface ProgrammeBackCoverBlockConfig {
  schemaVersion: 1;
  showShareAction: boolean;
  showModeToggle: boolean;
  settingsUrl?: string;
  shareLabel?: string;
}

/**
 * Parsed config for `BLOCK_KIND_PROGRAMME_NUMBERING`. `historyLimit` is
 * bounded 1–12 by the schema; out-of-range values cause the parser to
 * return `null` rather than silently clamp.
 */
export interface ProgrammeNumberingBlockConfig {
  schemaVersion: 1;
  showIssueNumber: boolean;
  showHistory: boolean;
  historyLimit: number;
}

export type MatchdayWindow = 'LAST_BIG_MATCH' | 'THIS_WEEKEND' | 'GAMEWEEK';

/**
 * Parsed config for `BLOCK_KIND_MATCHDAY`. `competitionIds` and `teamIds`
 * are clamped to the schema's `maxItems: 12` to keep the rendered surface
 * manageable. Unknown `window` values fall back to the schema default
 * `THIS_WEEKEND`.
 */
export interface MatchdayBlockConfig {
  schemaVersion: 1;
  competitionIds: string[];
  teamIds: string[];
  window: MatchdayWindow;
  showPredictions: boolean;
  showRatings: boolean;
}

export type InboxPriorityMin = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Parsed config for `BLOCK_KIND_INBOX`. `count` is bounded 1–12 by the
 * schema; out-of-range values cause the parser to return `null`. `itemTypes`
 * is clamped to the schema's `maxItems: 8`. Unknown `priorityMin` values
 * fall back to the schema default `LOW`.
 */
export interface InboxBlockConfig {
  schemaVersion: 1;
  itemTypes: string[];
  priorityMin: InboxPriorityMin;
  count: number;
  includeCompleted: boolean;
  voiceFramedOnly: boolean;
}

const MATCHDAY_WINDOWS = new Set<MatchdayWindow>(['LAST_BIG_MATCH', 'THIS_WEEKEND', 'GAMEWEEK']);

const INBOX_PRIORITIES = new Set<InboxPriorityMin>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

function booleanWithDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Parses a `BLOCK_KIND_PROGRAMME_COVER` config; returns `null` on schema-version mismatch. */
export function parseProgrammeCoverConfig(config?: JsonObject): ProgrammeCoverBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  return {
    schemaVersion: 1,
    title: stringOrUndefined(config.title),
    subtitle: stringOrUndefined(config.subtitle),
    heroTopic: stringOrUndefined(config.hero_topic),
    heroImageUrl: stringOrUndefined(config.hero_image_url),
    voiceFrameTemplate: stringOrUndefined(config.voice_frame_template),
  };
}

/** Parses a `BLOCK_KIND_PROGRAMME_BACK_COVER` config; returns `null` on schema-version mismatch. */
export function parseProgrammeBackCoverConfig(
  config?: JsonObject
): ProgrammeBackCoverBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  return {
    schemaVersion: 1,
    showShareAction: booleanWithDefault(config.show_share_action, true),
    showModeToggle: booleanWithDefault(config.show_mode_toggle, true),
    settingsUrl: stringOrUndefined(config.settings_url),
    shareLabel: stringOrUndefined(config.share_label),
  };
}

/** Parses a `BLOCK_KIND_PROGRAMME_NUMBERING` config; returns `null` on schema-version mismatch or `historyLimit` out of 1–12. */
export function parseProgrammeNumberingConfig(
  config?: JsonObject
): ProgrammeNumberingBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const historyLimit = numberOrUndefined(config.history_limit) ?? 4;
  if (historyLimit < 1 || historyLimit > 12) {
    return null;
  }

  return {
    schemaVersion: 1,
    showIssueNumber: booleanWithDefault(config.show_issue_number, true),
    showHistory: booleanWithDefault(config.show_history, true),
    historyLimit,
  };
}

/** Parses a `BLOCK_KIND_MATCHDAY` config; returns `null` on schema-version mismatch. */
export function parseMatchdayConfig(config?: JsonObject): MatchdayBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const windowValue = stringOrUndefined(config.window);

  return {
    schemaVersion: 1,
    competitionIds: stringArray(config.competition_ids).slice(0, 12),
    teamIds: stringArray(config.team_ids).slice(0, 12),
    window:
      windowValue && MATCHDAY_WINDOWS.has(windowValue as MatchdayWindow)
        ? (windowValue as MatchdayWindow)
        : 'THIS_WEEKEND',
    showPredictions: booleanWithDefault(config.show_predictions, true),
    showRatings: booleanWithDefault(config.show_ratings, true),
  };
}

/** Parses a `BLOCK_KIND_INBOX` config; returns `null` on schema-version mismatch or `count` out of 1–12. */
export function parseInboxConfig(config?: JsonObject): InboxBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 5;
  if (count < 1 || count > 12) {
    return null;
  }

  const priorityValue = stringOrUndefined(config.priority_min);

  return {
    schemaVersion: 1,
    itemTypes: stringArray(config.item_types).slice(0, 8),
    priorityMin:
      priorityValue && INBOX_PRIORITIES.has(priorityValue as InboxPriorityMin)
        ? (priorityValue as InboxPriorityMin)
        : 'LOW',
    count,
    includeCompleted: booleanWithDefault(config.include_completed, false),
    voiceFramedOnly: booleanWithDefault(config.voice_framed_only, false),
  };
}

// ── Creator analytics + recommendation block configs ──────────────────────
//
// Six additional BlockKinds the content-service registers schemas for but
// does not (yet) emit through any default composer. These are creator-side
// analytics blocks (YOUR_AUDIENCE, AUDIENCE_OVERLAP, DRAFTS_DASH) and reader/
// squad-capability blocks (RISING_CREATORS, LEADERBOARD, RATINGS_GRID).
// The parsers are added here so hosts using either the registry+adapter
// pattern or the `createProgrammeBlockRouter` pattern get typed config
// access for these blocks without re-implementing schema coercion.

export type AudienceWindow = '7d' | '30d' | '90d';
export type AudienceMetric =
  | 'TOTAL_READERS'
  | 'ACTIVE_READERS'
  | 'ENGAGEMENT_DEPTH'
  | 'COMPLETION_RATE'
  | 'SUBSCRIBER_RATIO';

/**
 * Parsed config for `BLOCK_KIND_YOUR_AUDIENCE`. Mirrors `your_audience.v1.json`:
 * `window` defaults to `30d`; `metrics` is filtered to the schema's allowed
 * values and clamped to `maxItems: 5`.
 */
export interface YourAudienceBlockConfig {
  schemaVersion: 1;
  window: AudienceWindow;
  metrics: AudienceMetric[];
}

/**
 * Parsed config for `BLOCK_KIND_AUDIENCE_OVERLAP`. Mirrors
 * `audience_overlap.v1.json`: `count` 1–10 enforced (returns `null` on out
 * of range); `comparisonCreatorIds` clamped to `maxItems: 8`;
 * `minimumReaderCount` defaults to 50 with a non-negative floor.
 */
export interface AudienceOverlapBlockConfig {
  schemaVersion: 1;
  comparisonCreatorIds: string[];
  minimumReaderCount: number;
  count: number;
}

export type DraftStatus = 'DRAFT' | 'IN_REVIEW' | 'SCHEDULED' | 'PUBLISHED_WITH_PENDING_EDITS';

/**
 * Parsed config for `BLOCK_KIND_DRAFTS_DASH`. Mirrors `drafts_dash.v1.json`:
 * `count` 1–12 enforced; `statuses` is filtered to the schema's allowed
 * values and clamped to `maxItems: 4`; `showReviewCycle` defaults to true.
 */
export interface DraftsDashBlockConfig {
  schemaVersion: 1;
  statuses: DraftStatus[];
  count: number;
  showReviewCycle: boolean;
}

export type RisingCreatorsWindow = '7d' | '30d';

/**
 * Parsed config for `BLOCK_KIND_RISING_CREATORS`. Mirrors
 * `rising_creators.v1.json`: `count` 1–12 enforced; `taxonomyNodeIds`
 * clamped to `maxItems: 12`; `timeWindow` defaults to `30d`.
 */
export interface RisingCreatorsBlockConfig {
  schemaVersion: 1;
  taxonomyNodeIds: string[];
  timeWindow: RisingCreatorsWindow;
  count: number;
}

/**
 * Parsed config for `BLOCK_KIND_LEADERBOARD`. Mirrors `leaderboard.v1.json`:
 * `capabilityInstanceId` is required (returns `null` if missing or empty);
 * `count` 1–100 enforced; `showViewerRank` defaults to true.
 */
export interface LeaderboardBlockConfig {
  schemaVersion: 1;
  capabilityInstanceId: string;
  gameweekId?: string;
  count: number;
  showViewerRank: boolean;
}

export type RatingSubjectType = 'PLAYER' | 'TEAM' | 'COACH' | 'MATCH' | 'MOMENT';

/**
 * Parsed config for `BLOCK_KIND_RATINGS_GRID`. Mirrors `ratings_grid.v1.json`:
 * `capabilityInstanceId` is required (returns `null` if missing or empty);
 * `count` 1–50 enforced; `subjectTypes` is filtered to the schema's allowed
 * values and clamped to `maxItems: 5`.
 */
export interface RatingsGridBlockConfig {
  schemaVersion: 1;
  capabilityInstanceId: string;
  gameId?: string;
  subjectTypes: RatingSubjectType[];
  count: number;
}

const AUDIENCE_WINDOWS = new Set<AudienceWindow>(['7d', '30d', '90d']);
const AUDIENCE_METRICS = new Set<AudienceMetric>([
  'TOTAL_READERS',
  'ACTIVE_READERS',
  'ENGAGEMENT_DEPTH',
  'COMPLETION_RATE',
  'SUBSCRIBER_RATIO',
]);

const DRAFT_STATUSES = new Set<DraftStatus>([
  'DRAFT',
  'IN_REVIEW',
  'SCHEDULED',
  'PUBLISHED_WITH_PENDING_EDITS',
]);

const RISING_CREATORS_WINDOWS = new Set<RisingCreatorsWindow>(['7d', '30d']);

const RATING_SUBJECT_TYPES = new Set<RatingSubjectType>([
  'PLAYER',
  'TEAM',
  'COACH',
  'MATCH',
  'MOMENT',
]);

function filterEnumArray<T>(value: unknown, allowed: ReadonlySet<T>, maxItems: number): T[] {
  return stringArray(value)
    .filter((item): item is string & T => allowed.has(item as T))
    .slice(0, maxItems);
}

/** Parses a `BLOCK_KIND_YOUR_AUDIENCE` config; returns `null` on schema-version mismatch. */
export function parseYourAudienceConfig(config?: JsonObject): YourAudienceBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const windowValue = stringOrUndefined(config.window);

  return {
    schemaVersion: 1,
    window:
      windowValue && AUDIENCE_WINDOWS.has(windowValue as AudienceWindow)
        ? (windowValue as AudienceWindow)
        : '30d',
    metrics: filterEnumArray(config.metrics, AUDIENCE_METRICS, 5),
  };
}

/** Parses a `BLOCK_KIND_AUDIENCE_OVERLAP` config; returns `null` on schema-version mismatch or `count` out of 1–10. */
export function parseAudienceOverlapConfig(config?: JsonObject): AudienceOverlapBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 3;
  if (count < 1 || count > 10) {
    return null;
  }
  const minimumReaderCount = Math.max(0, numberOrUndefined(config.minimum_reader_count) ?? 50);

  return {
    schemaVersion: 1,
    comparisonCreatorIds: stringArray(config.comparison_creator_ids).slice(0, 8),
    minimumReaderCount,
    count,
  };
}

/** Parses a `BLOCK_KIND_DRAFTS_DASH` config; returns `null` on schema-version mismatch or `count` out of 1–12. */
export function parseDraftsDashConfig(config?: JsonObject): DraftsDashBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 6;
  if (count < 1 || count > 12) {
    return null;
  }

  return {
    schemaVersion: 1,
    statuses: filterEnumArray(config.statuses, DRAFT_STATUSES, 4),
    count,
    showReviewCycle: booleanWithDefault(config.show_review_cycle, true),
  };
}

/** Parses a `BLOCK_KIND_RISING_CREATORS` config; returns `null` on schema-version mismatch or `count` out of 1–12. */
export function parseRisingCreatorsConfig(config?: JsonObject): RisingCreatorsBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 4;
  if (count < 1 || count > 12) {
    return null;
  }

  const timeWindowValue = stringOrUndefined(config.time_window);

  return {
    schemaVersion: 1,
    taxonomyNodeIds: stringArray(config.taxonomy_node_ids).slice(0, 12),
    timeWindow:
      timeWindowValue && RISING_CREATORS_WINDOWS.has(timeWindowValue as RisingCreatorsWindow)
        ? (timeWindowValue as RisingCreatorsWindow)
        : '30d',
    count,
  };
}

/** Parses a `BLOCK_KIND_LEADERBOARD` config; returns `null` on schema-version mismatch, missing capability_instance_id, or `count` out of 1–100. */
export function parseLeaderboardConfig(config?: JsonObject): LeaderboardBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const capabilityInstanceId = stringOrUndefined(config.capability_instance_id);
  if (!capabilityInstanceId) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 20;
  if (count < 1 || count > 100) {
    return null;
  }

  return {
    schemaVersion: 1,
    capabilityInstanceId,
    gameweekId: stringOrUndefined(config.gameweek_id),
    count,
    showViewerRank: booleanWithDefault(config.show_viewer_rank, true),
  };
}

/** Parses a `BLOCK_KIND_RATINGS_GRID` config; returns `null` on schema-version mismatch, missing capability_instance_id, or `count` out of 1–50. */
export function parseRatingsGridConfig(config?: JsonObject): RatingsGridBlockConfig | null {
  if (!isRecord(config) || !hasSchemaVersionOne(config)) {
    return null;
  }

  const capabilityInstanceId = stringOrUndefined(config.capability_instance_id);
  if (!capabilityInstanceId) {
    return null;
  }

  const count = numberOrUndefined(config.count) ?? 20;
  if (count < 1 || count > 50) {
    return null;
  }

  return {
    schemaVersion: 1,
    capabilityInstanceId,
    gameId: stringOrUndefined(config.game_id),
    subjectTypes: filterEnumArray(config.subject_types, RATING_SUBJECT_TYPES, 5),
    count,
  };
}
