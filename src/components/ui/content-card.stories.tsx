import preview from '#.storybook/preview';
import { ContentCard } from './content-card';
import type { ContentItem } from '#/types/content';

const meta = preview.meta({
  title: 'UI/ContentCard',
  component: ContentCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['grid', 'list'],
    },
  },
});

const item: ContentItem = {
  id: '1',
  title:
    'Lure of London and a persuasive phone call — how Chelsea beat Liverpool to Caicedo and La…',
  excerpt:
    'It was the answer Liverpool head coach Jurgen Klopp did not want to hear. Caicedo Inc to buy him, he did…',
  imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop',
  author: {
    name: 'Zach Lowy',
    handle: 'zachlowy',
    initials: 'ZL',
    avatarUrl: 'https://i.pravatar.cc/150?u=zach',
    verified: true,
  },
  publishedAt: '2h ago',
  readTime: '5 min read',
  stats: { likes: 3400, comments: 97 },
};

export const Grid = meta.story({
  render: () => (
    <div className="w-[320px]">
      <ContentCard item={item} variant="grid" />
    </div>
  ),
});

export const List = meta.story({
  render: () => (
    <div className="w-[500px]">
      <ContentCard item={item} variant="list" />
    </div>
  ),
});

export const GridRow = meta.story({
  name: 'Grid — 3 Column',
  render: () => (
    <div className="grid w-[960px] grid-cols-3 gap-6">
      <ContentCard item={item} variant="grid" />
      <ContentCard
        item={{
          ...item,
          id: '2',
          imageUrl:
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
        }}
        variant="grid"
      />
      <ContentCard
        item={{
          ...item,
          id: '3',
          imageUrl:
            'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop',
        }}
        variant="grid"
      />
    </div>
  ),
});

export const ListStack = meta.story({
  name: 'List — Stacked',
  render: () => (
    <div className="flex w-[500px] flex-col gap-4">
      <ContentCard item={item} variant="list" />
      <ContentCard item={{ ...item, id: '2' }} variant="list" />
    </div>
  ),
});
