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
    "Cole Palmer has very quickly stopped looking like the punchline to Chelsea's frenetic window",
  excerpt:
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry dummy text ever since the 1500s from an unknown french printer.',
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
  stats: { likes: 3400, comments: 52 },
};

const smartCoverItem: ContentItem = {
  ...item,
  id: 'smart-cover',
  title: 'The tiny details that make a crowded penalty box readable again',
  imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&h=1200&fit=crop',
  imagePresentation: {
    fitMode: 'smart-cover',
    focalArea: { x: 0.32, y: 0.08, width: 0.36, height: 0.42 },
    zoom: 1.14,
  },
};

const containBleedItem: ContentItem = {
  ...item,
  id: 'contain-bleed',
  title: 'When the frame is too tall for the hero, keep the whole image in play',
  imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=520&h=1200&fit=crop',
  imagePresentation: {
    fitMode: 'contain-bleed',
    focalArea: { x: 0.24, y: 0.12, width: 0.5, height: 0.56 },
  },
};

export const Default = meta.story({
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={item} totalSlides={6} activeSlide={0} />
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

export const SecondSlide = meta.story({
  name: 'Second Slide Active',
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={item} totalSlides={6} activeSlide={1} />
    </div>
  ),
});

export const SmartCover = meta.story({
  name: 'Smart Cover Focal Area',
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={smartCoverItem} totalSlides={6} activeSlide={2} />
    </div>
  ),
});

export const ContainBleed = meta.story({
  name: 'Contain Bleed Awkward Ratio',
  render: () => (
    <div className="w-full max-w-5xl">
      <HeroCard item={containBleedItem} totalSlides={6} activeSlide={3} />
    </div>
  ),
});
