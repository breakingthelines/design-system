import preview from '#.storybook/preview';
import { CreatorCard, type CreatorCardItem } from './creator-card';

const meta = preview.meta({
  title: 'UI/CreatorCard',
  component: CreatorCard,
  tags: ['autodocs'],
});

const zach: CreatorCardItem = {
  id: 'u_zachlowy',
  name: 'Zach Lowy',
  handle: 'zachlowy',
  avatarUrl: 'https://i.pravatar.cc/120?img=8',
  bio: 'Co-founder & Chief Editor of Breaking The Lines. Football analyst covering tactics, transfers and the stories behind the game.',
  verified: true,
  followerCount: 8500,
  thoughtCount: 498,
  href: '/@zachlowy',
  rank: 1,
};

const newcomer: CreatorCardItem = {
  id: 'u_amaraok',
  name: 'Amara Okafor',
  handle: 'amaraok',
  bio: 'Writing about the Women’s Super League and grassroots football across West Africa.',
  verified: false,
  followerCount: 312,
  thoughtCount: 27,
  href: '/@amaraok',
  rank: 4,
};

export const Ranked = meta.story({
  name: 'Single — ranked',
  render: () => (
    <div className="w-[400px]">
      <CreatorCard item={zach} />
    </div>
  ),
});

export const MonogramFallback = meta.story({
  name: 'No avatar (monogram)',
  render: () => (
    <div className="w-[400px]">
      <CreatorCard item={newcomer} />
    </div>
  ),
});

export const NoRank = meta.story({
  name: 'No rank badge',
  render: () => (
    <div className="w-[400px]">
      <CreatorCard item={{ ...zach, rank: undefined }} />
    </div>
  ),
});

export const Watchlist = meta.story({
  name: 'Creators to Watch — 3-col grid',
  render: () => (
    <div className="grid w-[1200px] grid-cols-3 gap-5">
      {Array.from({ length: 6 }, (_, i) => (
        <CreatorCard key={i} item={{ ...zach, id: `u_${i}`, rank: i + 1 }} />
      ))}
    </div>
  ),
});
