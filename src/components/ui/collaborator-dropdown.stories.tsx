import preview from '#.storybook/preview';
import { CollaboratorDropdown } from './collaborator-dropdown';
import { Button } from './button';
import { cursorPalette } from '#/tokens/colors';

const meta = preview.meta({
  title: 'UI/CollaboratorDropdown',
  component: CollaboratorDropdown,
  tags: ['autodocs'],
});

const generateUsers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: [
      'Sarah Connor',
      'John Smith',
      'Maria Garcia',
      'David Chen',
      'Emma Wilson',
      'James Brown',
      'Lisa Taylor',
      'Michael Lee',
      'Anna Martinez',
      'Robert Johnson',
      'Sophie Williams',
      'Thomas Anderson',
      'Jennifer Davis',
      'Christopher Moore',
      'Amanda White',
    ][i % 15],
    avatarUrl: `https://i.pravatar.cc/150?img=${i + 1}`,
    cursorColor: cursorPalette[i % cursorPalette.length].hex,
    role: ['captain', 'editor', 'viewer', 'editor', 'viewer'][i % 5],
    status: ['active', 'typing', 'idle', 'away', 'active'][i % 5] as
      | 'active'
      | 'typing'
      | 'idle'
      | 'away',
  }));

export const Default = meta.story({
  render: () => (
    <CollaboratorDropdown
      users={generateUsers(5)}
      trigger={<Button variant="outline">+3 more</Button>}
      onUserClick={(id) => console.log('Clicked user:', id)}
    />
  ),
});

export const FewUsers = meta.story({
  render: () => (
    <CollaboratorDropdown
      users={generateUsers(3)}
      trigger={<Button variant="outline">View collaborators</Button>}
      onUserClick={(id) => console.log('Clicked user:', id)}
    />
  ),
});

export const WithSearch = meta.story({
  name: 'Many Users (With Search)',
  render: () => (
    <CollaboratorDropdown
      users={generateUsers(15)}
      trigger={<Button variant="outline">+12 more</Button>}
      onUserClick={(id) => console.log('Clicked user:', id)}
    />
  ),
});

export const MixedStatuses = meta.story({
  render: () => {
    const users = [
      {
        id: '1',
        name: 'Active User',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        cursorColor: cursorPalette[0].hex,
        role: 'captain',
        status: 'active' as const,
      },
      {
        id: '2',
        name: 'Typing User',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        cursorColor: cursorPalette[1].hex,
        role: 'editor',
        status: 'typing' as const,
      },
      {
        id: '3',
        name: 'Idle User',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        cursorColor: cursorPalette[2].hex,
        role: 'editor',
        status: 'idle' as const,
      },
      {
        id: '4',
        name: 'Away User',
        avatarUrl: 'https://i.pravatar.cc/150?img=4',
        cursorColor: cursorPalette[3].hex,
        role: 'viewer',
        status: 'away' as const,
      },
    ];

    return (
      <CollaboratorDropdown
        users={users}
        trigger={<Button variant="outline">View statuses</Button>}
        onUserClick={(id) => console.log('Clicked user:', id)}
      />
    );
  },
});

export const WithFallbacks = meta.story({
  render: () => {
    const users = [
      {
        id: '1',
        name: 'Sarah Connor',
        initials: 'SC',
        cursorColor: cursorPalette[0].hex,
        role: 'captain',
      },
      {
        id: '2',
        name: 'John Smith',
        initials: 'JS',
        cursorColor: cursorPalette[1].hex,
        role: 'editor',
      },
      {
        id: '3',
        name: 'Maria Garcia',
        initials: 'MG',
        cursorColor: cursorPalette[2].hex,
        role: 'viewer',
      },
    ];

    return (
      <CollaboratorDropdown
        users={users}
        trigger={<Button variant="outline">View team</Button>}
        onUserClick={(id) => console.log('Clicked user:', id)}
      />
    );
  },
});

export const CustomTrigger = meta.story({
  render: () => (
    <CollaboratorDropdown
      users={generateUsers(5)}
      trigger={
        <button className="flex size-8 items-center justify-center rounded-full bg-grey-300 text-xs font-medium text-white ring-2 ring-background hover:bg-grey-200">
          +5
        </button>
      }
      onUserClick={(id) => console.log('Clicked user:', id)}
    />
  ),
});
