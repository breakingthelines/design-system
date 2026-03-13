import preview from '#.storybook/preview';
import { ProfileHero } from './profile-hero';

const meta = preview.meta({
  title: 'UI/ProfileHero',
  component: ProfileHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
});

export const Default = meta.story({
  args: {
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
    avatarUrl: 'https://i.pravatar.cc/300?u=zach',
    name: 'Zach Lowy',
    handle: 'zachlowy',
    verified: true,
    description: 'Co-creator of @btlvid . Words for @theScore, @NICETYo, @90minUSV, @iraqgoalsports, @ReissxMUFC and @BBCWorld.',
    socialLinks: [
      { type: 'x', url: 'https://x.com/zachlowy' },
      { type: 'website', url: 'https://breakingthelines.com' },
    ],
    followers: 65200,
    subscribers: 102,
    onFollow: () => {},
    onSubscribe: () => {},
  },
});

export const Following = meta.story({
  args: {
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
    avatarUrl: 'https://i.pravatar.cc/300?u=zach',
    name: 'Zach Lowy',
    handle: 'zachlowy',
    verified: true,
    description: 'Co-creator of @btlvid . Words for @theScore.',
    followers: 65200,
    subscribers: 102,
    onFollow: () => {},
    onSubscribe: () => {},
    isFollowing: true,
  },
});

export const Minimal = meta.story({
  args: {
    name: 'New Creator',
    initials: 'NC',
    handle: 'newcreator',
    description: 'Just getting started with football analytics.',
    followers: 12,
    onFollow: () => {},
  },
});
