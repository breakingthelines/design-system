import preview from '#.storybook/preview';
import { UserPill } from './user-pill';
import { cursorPalette } from '#/tokens/colors';

const meta = preview.meta({
  title: 'UI/UserPill',
  component: UserPill,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'typing', 'idle', 'away'],
    },
    isContributionFocus: {
      control: 'boolean',
    },
  },
});

const sampleUser = {
  id: '1',
  name: 'Sarah Connor',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  role: 'editor',
};

const sampleUserNoAvatar = {
  id: '2',
  name: 'John Smith',
  initials: 'JS',
  role: 'captain',
};

export const Default = meta.story({
  args: {
    user: sampleUser,
    cursorColor: cursorPalette[0].hex,
  },
});

export const AllStatuses = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-4">
      <UserPill user={sampleUser} cursorColor={cursorPalette[0].hex} status="active" />
      <UserPill user={sampleUser} cursorColor={cursorPalette[1].hex} status="typing" />
      <UserPill user={sampleUser} cursorColor={cursorPalette[2].hex} status="idle" />
      <UserPill user={sampleUser} cursorColor={cursorPalette[3].hex} status="away" />
    </div>
  ),
});

export const ContributionFocus = meta.story({
  render: () => (
    <div className="flex flex-col gap-4">
      <UserPill
        user={sampleUser}
        cursorColor={cursorPalette[0].hex}
        isContributionFocus
        onClose={() => console.log('Close clicked')}
      />
      <UserPill
        user={sampleUserNoAvatar}
        cursorColor={cursorPalette[4].hex}
        isContributionFocus
        onClose={() => console.log('Close clicked')}
      />
    </div>
  ),
});

export const WithFallback = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-4">
      <UserPill user={sampleUserNoAvatar} cursorColor={cursorPalette[4].hex} />
      <UserPill
        user={{ id: '3', name: 'Mike', role: 'viewer' }}
        cursorColor={cursorPalette[2].hex}
      />
    </div>
  ),
});

export const WithoutRole = meta.story({
  render: () => (
    <UserPill
      user={{ id: '4', name: 'Anonymous User', avatarUrl: 'https://i.pravatar.cc/150?img=5' }}
      cursorColor={cursorPalette[5].hex}
    />
  ),
});

export const LongName = meta.story({
  render: () => (
    <UserPill
      user={{
        id: '5',
        name: 'Alexander Bartholomew Winchester III',
        role: 'editor',
        avatarUrl: 'https://i.pravatar.cc/150?img=6',
      }}
      cursorColor={cursorPalette[6].hex}
    />
  ),
});

export const Clickable = meta.story({
  render: () => (
    <UserPill
      user={sampleUser}
      cursorColor={cursorPalette[0].hex}
      onClick={() => console.log('Pill clicked')}
    />
  ),
});

export const AllCursorColors = meta.story({
  render: () => (
    <div className="flex flex-wrap gap-3">
      {cursorPalette.map((color, index) => (
        <UserPill
          key={color.name}
          user={{
            id: String(index),
            name: color.name.charAt(0).toUpperCase() + color.name.slice(1),
            role: 'editor',
          }}
          cursorColor={color.hex}
        />
      ))}
    </div>
  ),
});
