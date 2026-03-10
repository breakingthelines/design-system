import preview from '#.storybook/preview';
import { HeroCard } from './hero-card';
import type { ContentItem } from '#/types/content';

const meta = preview.meta({
  title: 'UI/HeroCard',
  component: HeroCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

const item: ContentItem = {
  id: '1',
  title:
    "Cole Palmer has very quickly stopped looking like the punchline to Chelsea's transfer window",
  excerpt:
    "Lure of London and a persuasive phone call — how Chelsea's approach to the EPL has defining ...",
  imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=500&fit=crop',
  author: {
    name: 'Zach Lowy',
    handle: 'zachlowy',
    initials: 'ZL',
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    verified: true,
  },
  publishedAt: '2h ago',
  readTime: '8 min read',
  stats: { likes: 12400, comments: 342, reposts: 89 },
};

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={item} />
    </div>
  ),
});

export const WithClick = meta.story({
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={item} onClick={() => console.log('clicked')} />
    </div>
  ),
});

export const NoBanner = meta.story({
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={{ ...item, imageUrl: undefined }} />
    </div>
  ),
});
