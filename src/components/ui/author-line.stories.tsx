import preview from '#.storybook/preview';
import { AuthorLine } from './author-line';
import type { ContentAuthor } from '#/types/content';

const meta = preview.meta({
  title: 'UI/AuthorLine',
  component: AuthorLine,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'default'],
    },
  },
});

const author: ContentAuthor = {
  name: 'Zach Lowy',
  handle: 'zachlowyBTL',
  initials: 'ZL',
  avatarUrl: 'https://i.pravatar.cc/150?u=zach',
  verified: true,
  tier: 'Pro',
};

export const Default = meta.story({
  args: {
    author,
    showHandle: true,
    date: 'Just now',
  },
});

export const Small = meta.story({
  args: {
    author,
    size: 'sm',
    showHandle: true,
    date: '2h ago',
  },
});

export const WithAvatar = meta.story({
  args: {
    author,
    showAvatar: true,
    showHandle: true,
    date: '2h ago',
  },
});

export const AllVariants = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <AuthorLine author={author} showHandle date="Just now" />
      <AuthorLine author={author} size="sm" showHandle date="2h ago" />
      <AuthorLine author={author} showAvatar showHandle date="Mar 3" />
      <AuthorLine author={{ name: 'Ben Jacobs', initials: 'BJ', verified: true }} date="1d ago" />
      <AuthorLine
        author={{ name: 'Guest Writer', initials: 'GW', tier: 'Free' }}
        date="3d ago"
        readTime="8 min read"
      />
    </div>
  ),
});
