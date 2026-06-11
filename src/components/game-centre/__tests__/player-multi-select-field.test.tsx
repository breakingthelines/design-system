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

  // Wave 6.25m — searchable rosters
  describe('searchable', () => {
    it('does not render the search input by default (back-compat)', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          selectedIds={[]}
          onChange={vi.fn()}
        />
      );
      expect(hasSlot(markup, 'player-multi-select-field-search')).toBe(false);
    });

    it('renders the search input when `searchable` is true', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          selectedIds={[]}
          onChange={vi.fn()}
          searchable
        />
      );
      expect(hasSlot(markup, 'player-multi-select-field-search')).toBe(true);
      // Default placeholder.
      expect(markup).toContain('placeholder="Search players"');
      // aria-label uses the field label so screen readers read the field name.
      expect(markup).toContain('aria-label="Search Goalscorers"');
    });

    it('honours a custom placeholder', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          selectedIds={[]}
          onChange={vi.fn()}
          searchable
          searchPlaceholder="Find a player"
        />
      );
      expect(markup).toContain('placeholder="Find a player"');
    });

    it('does not render the search input when the roster is empty (no search target)', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={[]}
          selectedIds={[]}
          onChange={vi.fn()}
          searchable
        />
      );
      expect(hasSlot(markup, 'player-multi-select-field-search')).toBe(false);
      // Empty state still fires on a zero-length roster.
      expect(hasSlot(markup, 'player-multi-select-field-empty')).toBe(true);
    });
  });

  // Wave 6.25n — per-player counter mode for the goalscorers field.
  describe('counter mode', () => {
    it('renders per-row decrement + count + increment controls', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          mode="counter"
          counts={{}}
          onCountsChange={vi.fn()}
        />
      );
      // Mode is reflected on the root for CSS targeting.
      expect(markup).toContain('data-mode="counter"');
      // Each row carries a row-variant marker + a count attribute.
      expect(markup).toContain('data-row-variant="counter"');
      expect(countSlot(markup, 'player-multi-select-field-counter-decrement')).toBe(PLAYERS.length);
      expect(countSlot(markup, 'player-multi-select-field-counter-increment')).toBe(PLAYERS.length);
      expect(countSlot(markup, 'player-multi-select-field-counter-value')).toBe(PLAYERS.length);
    });

    it('defaults missing keys to 0', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          mode="counter"
          counts={{}}
          onCountsChange={vi.fn()}
        />
      );
      // Every row's data-count is 0; we just sanity-check at least one.
      expect(markup).toContain('data-count="0"');
      // None of the rows are picked.
      expect(markup).not.toContain('data-checked="true"');
    });

    it('reflects per-player counts on the row', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          mode="counter"
          counts={{ 'p-1': 3, 'p-2': 1 }}
          onCountsChange={vi.fn()}
        />
      );
      // Saka has count 3 and is picked.
      expect(markup).toContain('data-player-id="p-1"');
      expect(markup).toContain('data-count="3"');
      // Ødegaard has count 1.
      expect(markup).toContain('data-count="1"');
      // Picked rows carry data-checked.
      expect(markup).toContain('data-checked="true"');
    });

    it('disables the decrement button when count is 0', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={[PLAYERS[0]!]}
          mode="counter"
          counts={{}}
          onCountsChange={vi.fn()}
        />
      );
      // Decrement button is the one with `disabled=""` and the
      // counter-decrement slot — the order of attributes on the <button>
      // is React's; assert both markers appear on the same tag.
      expect(markup).toMatch(
        /<button[^>]*disabled[^>]*data-slot="player-multi-select-field-counter-decrement"/
      );
    });

    it('disables the increment button when maxPerPlayer cap is reached', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={[PLAYERS[0]!]}
          mode="counter"
          counts={{ 'p-1': 2 }}
          onCountsChange={vi.fn()}
          maxPerPlayer={2}
        />
      );
      // Increment button is disabled when count >= cap.
      expect(markup).toMatch(
        /<button[^>]*disabled[^>]*data-slot="player-multi-select-field-counter-increment"/
      );
    });

    it('does NOT render data-at-cap in counter mode (no aggregate cap)', () => {
      const markup = render(
        <PlayerMultiSelectField
          label="Goalscorers"
          players={PLAYERS}
          mode="counter"
          counts={{ 'p-1': 5, 'p-2': 5, 'p-3': 5 }}
          onCountsChange={vi.fn()}
        />
      );
      expect(markup).not.toContain('data-at-cap');
    });

    // Wave 6.25s — aggregate total cap (sum of counts across all rows).
    describe('maxTotalCount', () => {
      it('does NOT flag data-at-total-cap when the sum is below the cap', () => {
        const markup = render(
          <PlayerMultiSelectField
            label="Goalscorers"
            players={PLAYERS}
            mode="counter"
            counts={{ 'p-1': 1 }}
            onCountsChange={vi.fn()}
            maxTotalCount={2}
          />
        );
        expect(markup).not.toContain('data-at-total-cap');
      });

      it('flags data-at-total-cap on the fieldset when the sum hits the cap', () => {
        const markup = render(
          <PlayerMultiSelectField
            label="Goalscorers"
            players={PLAYERS}
            mode="counter"
            counts={{ 'p-1': 1, 'p-2': 1 }}
            onCountsChange={vi.fn()}
            maxTotalCount={2}
          />
        );
        expect(markup).toContain('data-at-total-cap="true"');
      });

      it('disables every row increment when the cap is reached', () => {
        const markup = render(
          <PlayerMultiSelectField
            label="Goalscorers"
            players={PLAYERS}
            mode="counter"
            counts={{ 'p-1': 2 }}
            onCountsChange={vi.fn()}
            maxTotalCount={2}
          />
        );
        // Every increment button — picked or not — should be disabled.
        const incrementMatches = markup.matchAll(
          /<button[^>]*data-slot="player-multi-select-field-counter-increment"[^>]*>/g
        );
        const buttons = Array.from(incrementMatches).map((m) => m[0]);
        expect(buttons.length).toBe(PLAYERS.length);
        for (const btn of buttons) {
          expect(btn).toContain('disabled');
        }
      });

      it('keeps decrement buttons enabled at the cap (recovery path)', () => {
        const markup = render(
          <PlayerMultiSelectField
            label="Goalscorers"
            players={PLAYERS}
            mode="counter"
            counts={{ 'p-1': 2 }}
            onCountsChange={vi.fn()}
            maxTotalCount={2}
          />
        );
        // The picked row's decrement is NOT disabled — the user must be
        // able to clear room without the cap interfering. (Decrement on
        // a zero-count row is still disabled by the count==0 rule.)
        const pickedRowMatch = markup.match(
          /<li[^>]*data-player-id="p-1"[\s\S]*?<\/li>/
        );
        expect(pickedRowMatch).not.toBeNull();
        const pickedRow = pickedRowMatch?.[0] ?? '';
        const decrementMatch = pickedRow.match(
          /<button[^>]*data-slot="player-multi-select-field-counter-decrement"[^>]*>/
        );
        expect(decrementMatch).not.toBeNull();
        expect(decrementMatch?.[0]).not.toContain('disabled');
      });

      it('preserves picks above a shrinking cap without mutating state', () => {
        // Cap=1 but the existing counts already sum to 3. The component
        // must NOT silently drop counts — it should expose the at-cap
        // state and leave the user to clear with −.
        const markup = render(
          <PlayerMultiSelectField
            label="Goalscorers"
            players={PLAYERS}
            mode="counter"
            counts={{ 'p-1': 2, 'p-2': 1 }}
            onCountsChange={vi.fn()}
            maxTotalCount={1}
          />
        );
        expect(markup).toContain('data-at-total-cap="true"');
        // Picks are still visible on their rows.
        expect(markup).toContain('data-player-id="p-1"');
        expect(markup).toMatch(
          /<li[^>]*data-player-id="p-1"[^>]*data-count="2"/
        );
      });
    });
  });
});
