import preview from '#.storybook/preview';

import { DataCell, DataRow, DataTable } from './data-table';
import { Badge } from './badge';

const meta = preview.meta({
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A generic table surface. The caller supplies the column template, the headings and the rows. Below the md breakpoint every row collapses to a single-column card and each cell shows its column name above the value.',
      },
    },
  },
});

const COLUMNS =
  'minmax(180px, 1.2fr) minmax(220px, 1.5fr) minmax(120px, 0.9fr) minmax(120px, 0.8fr) minmax(150px, 0.9fr)';

const users = [
  {
    id: '1',
    username: 'ellenripley',
    email: 'ellen@breakingthelines.com',
    tier: 'Pro',
    status: 'Active',
    joined: '12 Mar 2026',
  },
  {
    id: '2',
    username: 'dallas',
    email: 'dallas@breakingthelines.com',
    tier: 'Free',
    status: 'Suspended',
    joined: '04 Jan 2026',
  },
  {
    id: '3',
    username: 'lambert',
    email: 'lambert.with.a.very.long.address@breakingthelines.com',
    tier: 'Pro',
    status: 'Active',
    joined: '28 Feb 2026',
  },
];

export const Default = meta.story({
  render: () => (
    <DataTable
      label="Users"
      columns={COLUMNS}
      header={['Username', 'E-mail', 'Tier', 'Status', 'Joined']}
    >
      {users.map((user) => (
        <DataRow key={user.id}>
          <DataCell label="Username">@{user.username}</DataCell>
          <DataCell label="E-mail">{user.email}</DataCell>
          <DataCell label="Tier">{user.tier}</DataCell>
          <DataCell label="Status">
            <Badge variant={user.status === 'Active' ? 'tintedSuccess' : 'tintedDestructive'}>
              {user.status}
            </Badge>
          </DataCell>
          <DataCell label="Joined">{user.joined}</DataCell>
        </DataRow>
      ))}
    </DataTable>
  ),
});

export const Compact = meta.story({
  name: 'Compact density',
  render: () => (
    <DataTable
      label="Users"
      density="compact"
      columns={COLUMNS}
      header={['Username', 'E-mail', 'Tier', 'Status', 'Joined']}
    >
      {users.map((user) => (
        <DataRow key={user.id}>
          <DataCell label="Username">@{user.username}</DataCell>
          <DataCell label="E-mail">{user.email}</DataCell>
          <DataCell label="Tier">{user.tier}</DataCell>
          <DataCell label="Status">{user.status}</DataCell>
          <DataCell label="Joined">{user.joined}</DataCell>
        </DataRow>
      ))}
    </DataTable>
  ),
});

export const ActivatableRows = meta.story({
  name: 'Activatable rows',
  parameters: {
    docs: {
      description: {
        story:
          'A row with onActivate is clickable, focusable and responds to Enter and Space. It stays a row rather than becoming a button, so keep a real link inside it as the announced path to the same destination, and stop propagation on anything else that is clickable.',
      },
    },
  },
  render: () => (
    <DataTable
      label="Users"
      columns={COLUMNS}
      header={['Username', 'E-mail', 'Tier', 'Status', 'Joined']}
    >
      {users.map((user) => (
        <DataRow
          key={user.id}
          onActivate={() => {
            console.log(`open ${user.username}`);
          }}
        >
          <DataCell label="Username">
            <a href={`#${user.username}`} onClick={(event) => event.stopPropagation()}>
              @{user.username}
            </a>
          </DataCell>
          <DataCell label="E-mail">{user.email}</DataCell>
          <DataCell label="Tier">{user.tier}</DataCell>
          <DataCell label="Status">{user.status}</DataCell>
          <DataCell label="Joined">{user.joined}</DataCell>
        </DataRow>
      ))}
    </DataTable>
  ),
});

export const Empty = meta.story({
  name: 'Empty and loading rows',
  parameters: {
    docs: {
      description: {
        story:
          'The table draws no empty state of its own. A page that has nothing to show says so in a row, which keeps the headings and the column template in place.',
      },
    },
  },
  render: () => (
    <DataTable
      label="Users"
      columns={COLUMNS}
      header={['Username', 'E-mail', 'Tier', 'Status', 'Joined']}
    >
      <DataRow>
        <DataCell className="text-muted-foreground">No users match this filter.</DataCell>
      </DataRow>
    </DataTable>
  ),
});

export const NarrowViewport = meta.story({
  name: 'Narrow viewport (horizontal scroll)',
  parameters: {
    docs: {
      description: {
        story:
          'Between the column floors and the md breakpoint the grid is wider than its container. The scroll container inside the table takes that width; the page never scrolls sideways.',
      },
    },
  },
  render: () => (
    <div className="w-[420px] border border-dashed border-border p-2">
      <DataTable
        label="Users"
        columns={COLUMNS}
        header={['Username', 'E-mail', 'Tier', 'Status', 'Joined']}
      >
        {users.map((user) => (
          <DataRow key={user.id}>
            <DataCell label="Username">@{user.username}</DataCell>
            <DataCell label="E-mail">{user.email}</DataCell>
            <DataCell label="Tier">{user.tier}</DataCell>
            <DataCell label="Status">{user.status}</DataCell>
            <DataCell label="Joined">{user.joined}</DataCell>
          </DataRow>
        ))}
      </DataTable>
    </div>
  ),
});

export const RawCells = meta.story({
  name: 'Raw cells with data-label',
  parameters: {
    docs: {
      description: {
        story:
          'A cell can be any element. Set data-label on it and the mobile caption works the same as it does for DataCell.',
      },
    },
  },
  render: () => (
    <DataTable
      label="Nodes"
      columns="minmax(200px, 2fr) minmax(120px, 1fr)"
      header={['Node', 'Kind']}
    >
      <DataRow>
        <span data-label="Node">Premier League</span>
        <span data-label="Kind" className="text-muted-foreground">
          competition
        </span>
      </DataRow>
      <DataRow>
        <span data-label="Node">Arsenal</span>
        <span data-label="Kind" className="text-muted-foreground">
          club
        </span>
      </DataRow>
    </DataTable>
  ),
});
