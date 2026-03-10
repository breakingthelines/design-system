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

const gridItem: ContentItem = {
  id: '1',
  title:
    'Lure of London and a persuasive phone call - how Chelsea beat Liverpool to Caicedo and Lavia',
  excerpt:
    'It was the answer Liverpool head coach Jurgen Klopp did not want to hear. Caicedo ire to buy him, he did not...',
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
  stats: { likes: 3400, comments: 52 },
};

const listItem: ContentItem = {
  ...gridItem,
  id: '2',
  title:
    'Signing Messi or Kane takes more than a big fee \u2013 here\u2019s how to seal a mega deal',
  author: {
    name: 'Matt Law',
    handle: 'mattlaw',
    initials: 'ML',
    avatarUrl: 'https://i.pravatar.cc/150?u=matt',
  },
};

export const Grid = meta.story({
  render: () => (
    <div className="w-[366px]">
      <ContentCard item={gridItem} variant="grid" />
    </div>
  ),
});

export const List = meta.story({
  render: () => (
    <div className="w-[560px]">
      <ContentCard item={listItem} variant="list" />
    </div>
  ),
});

export const GridRow = meta.story({
  name: 'Grid \u2014 3 Column',
  render: () => (
    <div className="grid w-[1128px] grid-cols-3 gap-6">
      <ContentCard item={gridItem} variant="grid" />
      <ContentCard
        item={{
          ...gridItem,
          id: '2',
          imageUrl:
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
        }}
        variant="grid"
      />
      <ContentCard
        item={{
          ...gridItem,
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
  name: 'List \u2014 Stacked',
  render: () => (
    <div className="flex w-[560px] flex-col gap-4">
      <ContentCard item={listItem} variant="list" />
      <ContentCard item={{ ...listItem, id: '3' }} variant="list" />
      <ContentCard item={{ ...listItem, id: '4' }} variant="list" />
    </div>
  ),
});
