import { describe, expect, it, vi } from 'vitest';

import { PlayerMultiSelectField, type PlayerMultiSelectOption } from '../player-multi-select-field';
import { countSlot, hasSlot, render, slotText } from './test-utils';

const PLAYERS: PlayerMultiSelectOption[] = [
  { id: 'p-1', name: 'B. Saka', jerseyNumber: 7, caption: 'Arsenal' },
  { id: 'p-2', name: 'M. Ødegaard', jerseyNumber: 8, caption: 'Arsenal' },
  { id: 'p-3', name: 'C. Palmer', jerseyNumber: 20, caption: 'Chelsea' },
];

describe('PlayerMultiSelectField', () => {
  it('renders one row per player with the field label as the group aria-label', () => {
    const markup = render(
      <PlayerMultiSelectField
        label="Goalscorers"
        players={PLAYERS}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );
    expect(slotText(markup, 'player-multi-select-field-label')).toBe('Goalscorers');
    expect(countSlot(markup, 'player-multi-select-field-row')).toBe(PLAYERS.length);
    expect(markup).toContain('aria-label="Goalscorers"');
  });

  it('marks selected rows with data-checked and aria-checked=true', () => {
    const markup = render(
      <PlayerMultiSelectField
        label="Goalscorers"
        players={PLAYERS}
        selectedIds={['p-2']}
        onChange={vi.fn()}
      />
    );
    expect(markup).toContain('data-player-id="p-2"');
    // Selected row carries data-checked.
    expect(markup).toContain('data-checked="true"');
    // And the checkbox button is aria-checked.
    expect(markup).toContain('aria-checked="true"');
  });

  it('renders the description + hint slots when provided', () => {
    const markup = render(
      <PlayerMultiSelectField
        label="Goalscorers"
        description="1 pt per correct pick."
        hint="Pick up to 2 home, 1 away."
        players={PLAYERS}
        selectedIds={[]}
        onChange={vi.fn()}
      />
    );
    expect(slotText(markup, 'player-multi-select-field-description')).toBe(
      '1 pt per correct pick.'
    );
    expect(slotText(markup, 'player-multi-select-field-hint')).toBe('Pick up to 2 home, 1 away.');
  });

  it('renders the empty fallback when there are no players', () => {
    const markup = render(
      <PlayerMultiSelectField
        label="Goalscorers"
        players={[]}
        selectedIds={[]}
        onChange={vi.fn()}
        emptyCopy="Lineups land before kickoff."
      />
    );
    expect(hasSlot(markup, 'player-multi-select-field-empty')).toBe(true);
    expect(slotText(markup, 'player-multi-select-field-empty')).toBe(
      'Lineups land before kickoff.'
    );
    expect(hasSlot(markup, 'player-multi-select-field-rows')).toBe(false);
  });

  it('sets the data-at-cap flag and disables unselected rows at the hard cap', () => {
    const markup = render(
      <PlayerMultiSelectField
        label="Bookings"
        players={PLAYERS}
        selectedIds={['p-1', 'p-3']}
        onChange={vi.fn()}
        maxSelectable={2}
      />
    );
    expect(markup).toContain('data-at-cap="true"');
    // The unselected row goes into the capped state.
    expect(markup).toContain('data-disabled="capped"');
  });
});
