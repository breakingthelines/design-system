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

export interface ContentItem {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
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

export interface ThoughtItem {
  id: string;
  body: string;
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
