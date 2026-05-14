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
      options: ['grid', 'list', 'portrait'],
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

const smartCoverItem: ContentItem = {
  ...gridItem,
  id: 'smart-cover',
  title: 'A wide stadium image cropped into a tall card without losing the decisive run',
  imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1400&h=520&fit=crop',
  imagePresentation: {
    fitMode: 'smart-cover',
    focalArea: { x: 0.58, y: 0.18, width: 0.26, height: 0.48 },
    zoom: 1.18,
  },
};

const containBleedItem: ContentItem = {
  ...gridItem,
  id: 'contain-bleed',
  title: 'A portrait source stays intact on a landscape thumbnail with an editorial bleed',
  imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=520&h=1200&fit=crop',
  imagePresentation: {
    fitMode: 'contain-bleed',
    focalArea: { x: 0.2, y: 0.1, width: 0.52, height: 0.58 },
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

export const SmartCover = meta.story({
  name: 'Smart Cover Focal Area',
  render: () => (
    <div className="w-[366px]">
      <ContentCard item={smartCoverItem} variant="grid" />
    </div>
  ),
});

export const ContainBleed = meta.story({
  name: 'Contain Bleed Awkward Ratio',
  render: () => (
    <div className="flex w-[560px] flex-col gap-6">
      <ContentCard item={containBleedItem} variant="list" />
      <div className="w-[260px]">
        <ContentCard item={containBleedItem} variant="portrait" />
      </div>
    </div>
  ),
});
