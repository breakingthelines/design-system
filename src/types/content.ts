export interface ContentAuthor {
  name: string;
  avatarUrl?: string;
  initials?: string;
  handle?: string;
  verified?: boolean;
  tier?: 'Free' | 'Pro' | 'Line Breaker';
}

export interface ContentStats {
  likes: number;
  comments: number;
  reposts?: number;
}

export type ImageFitMode = 'smart-cover' | 'contain-bleed';

export interface ImageFocalArea {
  /** Normalized left coordinate, where 0 is the left edge and 1 is the right edge. */
  x: number;
  /** Normalized top coordinate, where 0 is the top edge and 1 is the bottom edge. */
  y: number;
  /** Normalized width of the focal area. */
  width: number;
  /** Normalized height of the focal area. */
  height: number;
}

export interface ImagePresentation {
  /** smart-cover crops around the focal area; contain-bleed fits the full image over an editorial bleed. */
  fitMode?: ImageFitMode;
  /** The important crop region inside the source image, expressed as normalized image coordinates. */
  focalArea?: ImageFocalArea;
  /** Optional focal zoom. Values below 1 are treated as 1. */
  zoom?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  imagePresentation?: ImagePresentation;
  author: ContentAuthor;
  publishedAt: string;
  readTime?: string;
  stats: ContentStats;
  contentType?: 'article' | 'video' | 'podcast';
}

export interface ReplyContext {
  username: string;
  displayName: string;
  href?: string;
}

export interface ThoughtContentContext {
  title: string;
  slug: string;
  creatorHandle: string;
  href: string;
}

export interface ThoughtTextAnchor {
  selectedText: string;
  blockId: string;
  textOffset: number;
}

export interface ThoughtTimestampAnchor {
  startSeconds: number;
  endSeconds?: number;
  label: string;
}

export interface ThoughtAnchor {
  type: 'text' | 'timestamp' | 'region';
  text?: ThoughtTextAnchor;
  startSeconds?: number;
  label?: string;
}

/**
 * Slim "from grade" pill data shown above the body when a thought was
 * spawned by the game-service grade-review fan-out (a user casts a GLOBAL
 * grade with a note → that note becomes a Thought). Hosts derive this
 * from the proto `ContextEnvelope` (`rating_id`, `rating_value`) and the
 * `subjects[]` list (subject = first PLAYER_PERFORMANCE / COACH_PERFORMANCE
 * ref; match = first GAME ref).
 *
 * `value` is the cast grade on the BTL 1-6 inverse scale (1 = Excellent,
 * 6 = Poor). When this object is undefined OR `value` is unset, the pill
 * is suppressed and the card renders as a normal thought. PRIVATE grades
 * never spawn thoughts so privacy is enforced upstream — see the
 * game-service rating fan-out.
 */
export interface ThoughtFromGrade {
  /** Cast grade on the BTL 1-6 inverse scale (1 = Excellent, 6 = Poor). */
  value: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * The thing the grade was cast on — typically a player or coach name
   * (e.g. "Saka", "Arteta"). Falls back to the match label if the
   * subject ref didn't carry a label.
   */
  subjectLabel: string;
  /**
   * Match context shown after the subject (e.g. "Arsenal v Spurs").
   * Optional — match-level grades may have no separate match line.
   */
  matchLabel?: string;
  /**
   * Tap-through to the match page. When set, the whole pill is a Link;
   * when absent the pill is rendered as a non-interactive badge.
   */
  matchHref?: string;
}

/**
 * Canonical subject reference attached to a thought — mirrors the proto
 * `btl.context.v1.SubjectRef` shape, narrowed to the fields the card
 * actually needs to forward into the Studio "Expand to article" deep-link.
 * Each pair encodes one tagged entity (e.g. `PLAYER:btl_football_player_xxx`).
 */
export interface ThoughtSubjectRef {
  /**
   * Subject kind as the canonical `SubjectType` enum name (e.g. `PLAYER`,
   * `GAME`, `TEAM`, `COACH`). Stays as a string so the design-system stays
   * proto-free; the platform passes the proto enum name directly.
   */
  type: string;
  /** Canonical entity id (BTL `btl_football_*` ids in production). */
  id: string;
}

export interface ThoughtItem {
  id: string;
  /**
   * Author principal id — typically the `publisher_id` on the proto Thought.
   * When present and equal to the viewer's id, the overflow menu surfaces
   * the destructive Delete affordance. Absent on legacy/anonymous renders.
   */
  publisherId?: string;
  /**
   * Canonical subject refs carried on the thought (proto
   * `context.subjects[]`). Forwarded into the Studio "Expand to article"
   * deep-link so the spawned article inherits the same entity tagging
   * without the user re-attaching every chip by hand.
   */
  subjectRefs?: ThoughtSubjectRef[];
  /** Plain-text body. Always present — the search/preview text and the legacy fallback for rendering. */
  body: string;
  /**
   * The full serialized Lexical editor state (`body_json`) for this thought,
   * if it was composed with the structured path. Carries inline MentionNodes
   * losslessly so {@link ThoughtBody} renders mentions via the shared
   * {@link MentionFromNode} reader. Absent on legacy thoughts, which fall back
   * to rendering {@link body} through the `@word` regex.
   */
  bodyJson?: string;
  gifUrl?: string;
  imageUrl?: string;
  author: ContentAuthor;
  createdAt: string;
  stats: ContentStats;
  liked?: boolean;
  reposted?: boolean;
  repostedBy?: { username: string; displayName?: string };
  isOriginalAuthor?: boolean;
  replies?: ThoughtItem[];
  replyCount?: number;
  replyingTo?: ReplyContext;
  contentContext?: ThoughtContentContext;
  anchor?: ThoughtAnchor;
  /** Permalink to this thought (e.g. `/@handle/thoughts/{id}`). When set, the card's timestamp renders as a Link. */
  permalinkHref?: string;
  /**
   * When present, the card renders a slim "from grade" pill above the
   * body — a GradeBox + subject + match line — so readers can tell the
   * thought came from a cast grade and tap through to the match.
   */
  fromGrade?: ThoughtFromGrade;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  artworkUrl?: string;
  itemCount?: number;
  collectionType?: 'podcast' | 'video' | 'newsletter' | 'visual' | 'mixed' | 'article';
  creator?: ContentAuthor;
}
