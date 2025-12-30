import preview from '#.storybook/preview';
import { useState } from 'react';
import { AvatarStack } from './avatar-stack';
import { cursorPalette } from '#/tokens/colors';

const meta = preview.meta({
  title: 'UI/AvatarStack',
  component: AvatarStack,
  tags: ['autodocs'],
  argTypes: {
    max: {
      control: { type: 'number', min: 1, max: 10 },
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg'],
    },
  },
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
    ][i % 10],
    avatarUrl: `https://i.pravatar.cc/150?img=${i + 1}`,
    cursorColor: cursorPalette[i % cursorPalette.length].hex,
    status: ['active', 'typing', 'idle', 'active', 'active'][i % 5] as 'active' | 'typing' | 'idle',
  }));

export const Default = meta.story({
  args: {
    users: generateUsers(4),
  },
});

export const FewUsers = meta.story({
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">1 user</p>
        <AvatarStack users={generateUsers(1)} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">2 users</p>
        <AvatarStack users={generateUsers(2)} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">3 users</p>
        <AvatarStack users={generateUsers(3)} />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">4 users</p>
        <AvatarStack users={generateUsers(4)} />
      </div>
    </div>
  ),
});

export const WithOverflow = meta.story({
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">6 users, max 4</p>
        <AvatarStack
          users={generateUsers(6)}
          max={4}
          onOverflowClick={() => console.log('Overflow clicked')}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">10 users, max 5</p>
        <AvatarStack
          users={generateUsers(10)}
          max={5}
          onOverflowClick={() => console.log('Overflow clicked')}
        />
      </div>
    </div>
  ),
});

export const AllSizes = meta.story({
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Small</p>
        <AvatarStack users={generateUsers(4)} size="sm" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Default</p>
        <AvatarStack users={generateUsers(4)} size="default" />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Large</p>
        <AvatarStack users={generateUsers(4)} size="lg" />
      </div>
    </div>
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
        status: 'active' as const,
      },
      {
        id: '2',
        name: 'Typing User',
        avatarUrl: 'https://i.pravatar.cc/150?img=2',
        cursorColor: cursorPalette[1].hex,
        status: 'typing' as const,
      },
      {
        id: '3',
        name: 'Idle User',
        avatarUrl: 'https://i.pravatar.cc/150?img=3',
        cursorColor: cursorPalette[2].hex,
        status: 'idle' as const,
      },
      {
        id: '4',
        name: 'Active User 2',
        avatarUrl: 'https://i.pravatar.cc/150?img=4',
        cursorColor: cursorPalette[3].hex,
        status: 'active' as const,
      },
    ];
    return <AvatarStack users={users} />;
  },
});

export const WithSelection = meta.story({
  render: function Render() {
    const [selectedId, setSelectedId] = useState<string | undefined>('2');
    const users = generateUsers(5);

    return (
      <div className="space-y-4">
        <AvatarStack
          users={users}
          selectedUserId={selectedId}
          onUserClick={(id) => setSelectedId(id === selectedId ? undefined : id)}
        />
        <p className="text-sm text-muted-foreground">
          Selected: {selectedId ? users.find((u) => u.id === selectedId)?.name : 'None'}
        </p>
      </div>
    );
  },
});

export const WithFallbacks = meta.story({
  render: () => {
    const users = [
      { id: '1', name: 'Sarah Connor', initials: 'SC', cursorColor: cursorPalette[0].hex },
      { id: '2', name: 'John Smith', initials: 'JS', cursorColor: cursorPalette[1].hex },
      { id: '3', name: 'Maria Garcia', initials: 'MG', cursorColor: cursorPalette[2].hex },
      { id: '4', name: 'David Chen', initials: 'DC', cursorColor: cursorPalette[3].hex },
    ];
    return <AvatarStack users={users} />;
  },
});

export const Interactive = meta.story({
  render: function Render() {
    const [users, setUsers] = useState(generateUsers(4));

    const addUser = () => {
      const newId = String(users.length + 1);
      setUsers([
        ...users,
        {
          id: newId,
          name: `New User ${newId}`,
          avatarUrl: `https://i.pravatar.cc/150?img=${users.length + 10}`,
          cursorColor: cursorPalette[users.length % cursorPalette.length].hex,
          status: 'active' as const,
        },
      ]);
    };

    const removeUser = () => {
      if (users.length > 1) {
        setUsers(users.slice(0, -1));
      }
    };

    return (
      <div className="space-y-4">
        <AvatarStack users={users} max={6} />
        <div className="flex gap-2">
          <button
            onClick={addUser}
            className="rounded bg-grey-300 px-3 py-1.5 text-sm text-white hover:bg-grey-200"
          >
            Add User
          </button>
          <button
            onClick={removeUser}
            className="rounded bg-grey-300 px-3 py-1.5 text-sm text-white hover:bg-grey-200"
          >
            Remove User
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Click buttons to see enter/exit animations</p>
      </div>
    );
  },
});
