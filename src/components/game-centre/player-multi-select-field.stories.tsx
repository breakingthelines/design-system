import * as React from 'react';

import { expect, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';

import { matchesSearchQuery } from '#/lib/search-match';

import { PlayerMultiSelectField, type PlayerMultiSelectOption } from './player-multi-select-field';

const meta = preview.meta({
  title: 'GameCentre/PlayerMultiSelectField',
  component: PlayerMultiSelectField,
  tags: ['autodocs'],
  argTypes: {
    maxSelectable: {
      control: { type: 'number', min: 0, max: 10, step: 1 },
    },
  },
});

const ARSENAL: PlayerMultiSelectOption[] = [
  { id: 'p-saka', name: 'B. Saka', jerseyNumber: 7, caption: 'Arsenal' },
  { id: 'p-odegaard', name: 'M. Ødegaard', jerseyNumber: 8, caption: 'Arsenal' },
  { id: 'p-havertz', name: 'K. Havertz', jerseyNumber: 29, caption: 'Arsenal' },
  { id: 'p-martinelli', name: 'G. Martinelli', jerseyNumber: 11, caption: 'Arsenal' },
  { id: 'p-rice', name: 'D. Rice', jerseyNumber: 41, caption: 'Arsenal' },
  { id: 'p-saliba', name: 'W. Saliba', jerseyNumber: 2, caption: 'Arsenal' },
];

const CHELSEA: PlayerMultiSelectOption[] = [
  { id: 'p-palmer', name: 'C. Palmer', jerseyNumber: 20, caption: 'Chelsea' },
  { id: 'p-jackson', name: 'N. Jackson', jerseyNumber: 15, caption: 'Chelsea' },
  { id: 'p-enzo', name: 'Enzo Fernández', jerseyNumber: 8, caption: 'Chelsea' },
  { id: 'p-caicedo', name: 'M. Caicedo', jerseyNumber: 25, caption: 'Chelsea' },
];

const ALL_PLAYERS = [...ARSENAL, ...CHELSEA];

function GoalscorersWrapper(props: React.ComponentProps<typeof PlayerMultiSelectField>) {
  const [selected, setSelected] = React.useState<string[]>(
    props.selectedIds ? [...props.selectedIds] : []
  );
  return (
    <div className="w-[420px] rounded-[6px] border border-white/10 bg-neutral-950 p-4">
      <PlayerMultiSelectField {...props} selectedIds={selected} onChange={setSelected} />
    </div>
  );
}

export const Goalscorers = meta.story({
  name: 'Goalscorers (soft cap hint, no max)',
  args: {
    label: 'Goalscorers',
    description: '1 pt per correct pick.',
    hint: 'Pick up to 2 home, 1 away.',
    players: ALL_PLAYERS,
    selectedIds: ['p-saka'],
  },
  render: (args) => <GoalscorersWrapper {...args} />,
});

export const Bookings = meta.story({
  name: 'Bookings (max 3)',
  args: {
    label: 'Bookings',
    description: 'Pick 3 players you think will be booked. 1 pt per hit.',
    players: ALL_PLAYERS,
    selectedIds: ['p-rice', 'p-caicedo'],
    maxSelectable: 3,
  },
  render: (args) => <GoalscorersWrapper {...args} />,
});

export const AtCap = meta.story({
  name: 'Bookings — at cap (unselected rows disabled)',
  args: {
    label: 'Bookings',
    description: '1 pt per correct pick.',
    players: ALL_PLAYERS,
    selectedIds: ['p-rice', 'p-caicedo', 'p-saliba'],
    maxSelectable: 3,
  },
  render: (args) => <GoalscorersWrapper {...args} />,
});

export const Empty = meta.story({
  name: 'Empty — no lineups yet',
  args: {
    label: 'Goalscorers',
    description: '1 pt per correct pick.',
    players: [],
    selectedIds: [],
    emptyCopy: 'Lineups land before kickoff.',
  },
  render: (args) => <GoalscorersWrapper {...args} />,
});

// Wave 6.25m — searchable variant. Full match-day squads (~23 per side) are
// painful to scan; the input filters visible rows by case-insensitive
// substring on `player.name`.
const FULL_SQUAD: PlayerMultiSelectOption[] = [
  ...ARSENAL,
  ...CHELSEA,
  { id: 'p-rashford', name: 'M. Rashford', jerseyNumber: 10, caption: 'Man Utd' },
  { id: 'p-bruno', name: 'B. Fernandes', jerseyNumber: 8, caption: 'Man Utd' },
  { id: 'p-salah', name: 'M. Salah', jerseyNumber: 11, caption: 'Liverpool' },
  { id: 'p-mbappe', name: 'K. Mbappé', jerseyNumber: 7, caption: 'PSG' },
  { id: 'p-joao', name: 'João Pedro', jerseyNumber: 20, caption: 'Chelsea' },
];

export const Searchable = meta.story({
  name: 'Searchable — full match-day squad',
  args: {
    label: 'Goalscorers',
    description: 'Type a surname to filter the squad list.',
    players: FULL_SQUAD,
    selectedIds: ['p-saka'],
    searchable: true,
  },
  render: (args) => <GoalscorersWrapper {...args} />,
});

/* ── Accent-insensitive search ─────────────────────────────────────────────
 * A viewer reported that searching "joao" found nothing, because the squad
 * list carries "João Pedro" exactly as the provider ships it and the filter
 * was a raw `toLowerCase().includes()`. The filter now folds BOTH the query
 * and the name, so neither spelling is privileged. These stories are the
 * load-bearing proof of that at the component level — the unit tests in
 * `lib/search-match.test.ts` prove the fold, these prove the field uses it.
 * ────────────────────────────────────────────────────────────────────────── */

/** Player ids of the rows the field is currently showing, in order. */
function visibleIds(canvasElement: HTMLElement): string[] {
  return Array.from(
    canvasElement.querySelectorAll('[data-slot="player-multi-select-field-row"]')
  ).map((row) => row.getAttribute('data-player-id') ?? '');
}

async function searchFor(canvasElement: HTMLElement, text: string) {
  const canvas = within(canvasElement);
  const input = canvas.getByRole('searchbox', { name: 'Search Goalscorers' });
  await userEvent.clear(input);
  await userEvent.type(input, text);
  return input;
}

export const SearchableAccentFolded = meta.story({
  name: 'Searchable — "joao" finds "João Pedro"',
  args: {
    label: 'Goalscorers',
    description: 'Typing without the accent still finds the accented name.',
    players: FULL_SQUAD,
    selectedIds: [],
    searchable: true,
  },
  render: (args) => <GoalscorersWrapper {...args} />,
  play: async ({ canvasElement }) => {
    // The reported bug: an unaccented query against an accented name.
    await searchFor(canvasElement, 'joao');
    await expect(visibleIds(canvasElement)).toEqual(['p-joao']);

    // The other direction must not have been traded away for it: a viewer who
    // DOES type the accent still finds the same row.
    await searchFor(canvasElement, 'João');
    await expect(visibleIds(canvasElement)).toEqual(['p-joao']);

    // And the query the provider's own spelling produces, lower-cased.
    await searchFor(canvasElement, 'joão');
    await expect(visibleIds(canvasElement)).toEqual(['p-joao']);

    // A name with no diacritic anywhere in it is untouched by the change.
    await searchFor(canvasElement, 'saka');
    await expect(visibleIds(canvasElement)).toEqual(['p-saka']);

    // Folding widens what matches; it must not turn a miss into a hit on a
    // different BASE letter.
    await searchFor(canvasElement, 'joan');
    await expect(visibleIds(canvasElement)).toEqual([]);
    await expect(within(canvasElement).getByText(/No players match/)).toBeInTheDocument();

    // Other accented squad members fold the same way.
    await searchFor(canvasElement, 'mbappe');
    await expect(visibleIds(canvasElement)).toEqual(['p-mbappe']);
    await searchFor(canvasElement, 'fernandez');
    await expect(visibleIds(canvasElement)).toEqual(['p-enzo']);
  },
});

/**
 * `matchPlayer` escape hatch — a host that wants the shirt number searchable
 * too composes the exported `matchesSearchQuery` rather than reimplementing
 * the fold. The default (name only, accent-folded) is unchanged for everyone
 * who does not pass this.
 */
export const SearchableCustomMatcher = meta.story({
  name: 'Searchable — host-supplied matcher (name or shirt number)',
  args: {
    label: 'Goalscorers',
    description: 'This host also lets you search by shirt number.',
    players: FULL_SQUAD,
    selectedIds: [],
    searchable: true,
    searchPlaceholder: 'Name or number',
    matchPlayer: (player, query) =>
      matchesSearchQuery(player.name, query) || String(player.jerseyNumber ?? '') === query.trim(),
  },
  render: (args) => <GoalscorersWrapper {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox', { name: 'Search Goalscorers' });

    // The host's extra rule fires.
    await userEvent.clear(input);
    await userEvent.type(input, '41');
    await expect(visibleIds(canvasElement)).toEqual(['p-rice']);

    // The composed default still folds accents.
    await userEvent.clear(input);
    await userEvent.type(input, 'joao');
    await expect(visibleIds(canvasElement)).toEqual(['p-joao']);
  },
});

// Wave 6.25n — per-player counter mode. Picking Saka three times means
// "Saka scores three goals". Settlement on the server credits
// min(picked_count, actual_goals) × pointsPerPick per player, with no
// aggregate cap on the field (a 7-0 game can credit the full prediction).
function CounterWrapper(
  props: Omit<
    React.ComponentProps<typeof PlayerMultiSelectField>,
    'mode' | 'selectedIds' | 'onChange' | 'counts' | 'onCountsChange'
  > & {
    initialCounts?: Record<string, number>;
    maxPerPlayer?: number;
    maxTotalCount?: number;
  }
) {
  const { initialCounts = {}, maxPerPlayer, maxTotalCount, ...rest } = props;
  const [counts, setCounts] = React.useState<Record<string, number>>({ ...initialCounts });
  return (
    <div className="w-[420px] rounded-[6px] border border-white/10 bg-neutral-950 p-4">
      <PlayerMultiSelectField
        {...rest}
        mode="counter"
        counts={counts}
        onCountsChange={setCounts}
        maxPerPlayer={maxPerPlayer}
        maxTotalCount={maxTotalCount}
      />
    </div>
  );
}

export const Counter = meta.story({
  name: 'Counter — Saka × 3 (Wave 6.25n)',
  args: {
    label: 'Goalscorers',
    description: '+2 pts per goal. Pick a player N times to predict N goals.',
    players: ALL_PLAYERS,
  },
  render: (args) => <CounterWrapper {...args} initialCounts={{ 'p-saka': 3, 'p-palmer': 1 }} />,
});

export const CounterSearchable = meta.story({
  name: 'Counter — searchable squad',
  args: {
    label: 'Goalscorers',
    description: '+2 pts per goal. Type a surname to filter.',
    players: FULL_SQUAD,
    searchable: true,
  },
  render: (args) => <CounterWrapper {...args} initialCounts={{ 'p-saka': 2 }} />,
});

// Wave 6.25s — aggregate total cap. The host caps the SUM of counts across
// all rows (e.g. predicted home score = 2). When the cap is reached every
// row's `+` is disabled and the fieldset carries `data-at-total-cap`.
// Decrement stays live so the user can clear room.
export const CounterMaxTotalCount = meta.story({
  name: 'Counter — capped at 2 total (Wave 6.25s)',
  args: {
    label: 'Goalscorers · Home',
    description: '+2 pts per goal. Capped at predicted home score (2).',
    hint: 'Predicted home score: 2 · 0 picks remaining',
    players: ARSENAL,
  },
  render: (args) => <CounterWrapper {...args} initialCounts={{ 'p-saka': 2 }} maxTotalCount={2} />,
});
