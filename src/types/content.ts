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
}

export interface ThoughtContentContext {
  title: string;
  slug: string;
  creatorHandle: string;
  href: string;
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
  replies?: ThoughtItem[];
  replyCount?: number;
  replyingTo?: ReplyContext;
  contentContext?: ThoughtContentContext;
}
