import * as React from 'react';

import { Funnel } from '@phosphor-icons/react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import preview from '#.storybook/preview';

import { FilterModal, type FilterOption } from './filter-modal';
import { Button } from './button';

const meta = preview.meta({
  title: 'UI/FilterModal',
  component: FilterModal,
  tags: ['autodocs'],
});

// Option labels are club and competition names, which carry diacritics exactly
// as the provider ships them.
const COMPETITIONS: FilterOption[] = [
  { value: 'atletico', label: 'Atlético Madrid' },
  { value: 'bayern', label: 'Bayern München' },
  { value: 'coruna', label: 'Deportivo La Coruña' },
  { value: 'arsenal', label: 'Arsenal' },
  { value: 'chelsea', label: 'Chelsea' },
  { value: 'malmo', label: 'Malmö FF' },
];

function FilterModalHarness(props: { options?: FilterOption[] }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Filter clubs
      </Button>
      <FilterModal
        open={open}
        onOpenChange={setOpen}
        icon={<Funnel />}
        title="Clubs"
        searchPlaceholder="Search clubs"
        options={props.options ?? COMPETITIONS}
        selectedValues={selected}
        onSelectionChange={setSelected}
      />
    </>
  );
}

export const Default = meta.story({
  render: () => <FilterModalHarness />,
});

/* ── Accent-insensitive search ─────────────────────────────────────────────
 * The option list filters on labels that carry diacritics, so it had the same
 * defect the player pickers did. Both sides of the comparison are now folded,
 * so either spelling finds the row.
 * ────────────────────────────────────────────────────────────────────────── */

/** Labels of the option rows the modal is currently showing. */
function visibleLabels(): string[] {
  return Array.from(document.querySelectorAll('[data-slot="filter-modal-option"]')).map(
    (row) => row.getAttribute('data-value') ?? ''
  );
}

export const AccentInsensitiveSearch = meta.story({
  name: 'Accent-insensitive search',
  render: () => <FilterModalHarness />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filter clubs' }));
    const dialog = within(await within(document.body).findByRole('dialog'));
    const input = dialog.getByPlaceholderText('Search clubs');

    async function searchFor(text: string) {
      await fireEvent.change(input, { target: { value: text } });
    }

    // Typing without the accent finds the accented label.
    await searchFor('atletico');
    await expect(visibleLabels()).toEqual(['atletico']);

    // And typing WITH the accent still does — the fix folds both sides.
    await searchFor('Atlético');
    await expect(visibleLabels()).toEqual(['atletico']);

    await searchFor('munchen');
    await expect(visibleLabels()).toEqual(['bayern']);

    await searchFor('coruna');
    await expect(visibleLabels()).toEqual(['coruna']);

    await searchFor('malmo');
    await expect(visibleLabels()).toEqual(['malmo']);

    // A label with no diacritic is unaffected.
    await searchFor('arsenal');
    await expect(visibleLabels()).toEqual(['arsenal']);

    // Folding must not turn a miss into a hit on a different base letter.
    await searchFor('atlantico');
    await expect(visibleLabels()).toEqual([]);
  },
});
