import { expect, fireEvent, userEvent, within } from 'storybook/test';

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

/* ── Accent-insensitive search ─────────────────────────────────────────────
 * The collaborator list filters on people's real names, so it had the same
 * defect the player pickers did: a raw `toLowerCase().includes()` meant a
 * viewer typing "joao" never found "João Pedro". Both sides of the comparison
 * are now folded, so either spelling finds the row.
 * ────────────────────────────────────────────────────────────────────────── */

const ACCENTED_TEAM = [
  'João Pedro',
  'Thomas Müller',
  'Mesut Özil',
  'Sarah Connor',
  'John Smith',
  'Maria Garcia',
  'David Chen',
  'Emma Wilson',
  'James Brown',
  'Lisa Taylor',
  'Michael Lee',
].map((name, i) => ({
  id: String(i + 1),
  name,
  initials: name
    .split(' ')
    .map((part) => part.charAt(0))
    .join(''),
  cursorColor: cursorPalette[i % cursorPalette.length].hex,
  role: ['captain', 'editor', 'viewer'][i % 3],
}));

/** Names of the collaborator rows the dropdown is currently showing. */
function visibleNames(): string[] {
  return Array.from(document.querySelectorAll('[role="menu"] button'))
    .map((row) => row.querySelector('.truncate')?.textContent ?? '')
    .filter(Boolean);
}

export const AccentInsensitiveSearch = meta.story({
  name: 'Many Users — accent-insensitive search',
  render: () => (
    <CollaboratorDropdown
      users={ACCENTED_TEAM}
      trigger={<Button variant="outline">+8 more</Button>}
      onUserClick={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '+8 more' }));
    const menu = within(await within(document.body).findByRole('menu'));
    const input = menu.getByPlaceholderText('Search collaborators...');

    // `fireEvent.change` rather than `userEvent.type`: the search input lives
    // inside the menu popup, whose own typeahead consumes keydowns before they
    // reach the field. Driving the controlled value directly is what we are
    // asserting on anyway — this story is about the FILTER, not about focus
    // management inside the popup.
    async function searchFor(text: string) {
      await fireEvent.change(input, { target: { value: text } });
    }

    // The reported bug: an unaccented query against an accented name.
    await searchFor('joao');
    await expect(visibleNames()).toEqual(['João Pedro']);

    // The accented spelling must still work — the fix folds both sides.
    await searchFor('João');
    await expect(visibleNames()).toEqual(['João Pedro']);

    await searchFor('muller');
    await expect(visibleNames()).toEqual(['Thomas Müller']);

    await searchFor('Özil');
    await expect(visibleNames()).toEqual(['Mesut Özil']);

    // A name with no diacritic is unaffected.
    await searchFor('connor');
    await expect(visibleNames()).toEqual(['Sarah Connor']);

    // Folding must not turn a miss into a hit on a different base letter.
    await searchFor('miller');
    await expect(visibleNames()).toEqual([]);
    await expect(menu.getByText('No collaborators found')).toBeInTheDocument();
  },
});
