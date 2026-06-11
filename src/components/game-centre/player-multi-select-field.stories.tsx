import * as React from 'react';

import preview from '#.storybook/preview';

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

// Wave 6.25n — per-player counter mode. Picking Saka three times means
// "Saka scores three goals". Settlement on the server credits
// min(picked_count, actual_goals) × pointsPerPick per player, with no
// aggregate cap on the field (a 7-0 game can credit the full prediction).
function CounterWrapper(
  props: Omit<
    React.ComponentProps<typeof PlayerMultiSelectField>,
    'mode' | 'selectedIds' | 'onChange' | 'counts' | 'onCountsChange'
  > & { initialCounts?: Record<string, number>; maxPerPlayer?: number }
) {
  const { initialCounts = {}, maxPerPlayer, ...rest } = props;
  const [counts, setCounts] = React.useState<Record<string, number>>({ ...initialCounts });
  return (
    <div className="w-[420px] rounded-[6px] border border-white/10 bg-neutral-950 p-4">
      <PlayerMultiSelectField
        {...rest}
        mode="counter"
        counts={counts}
        onCountsChange={setCounts}
        maxPerPlayer={maxPerPlayer}
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
