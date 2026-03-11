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

export interface ThoughtItem {
  id: string;
  body: string;
  imageUrl?: string;
  author: ContentAuthor;
  createdAt: string;
  stats: ContentStats;
  liked?: boolean;
  reposted?: boolean;
}
