import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { DataCell, DataRow, DataTable, type DataTableProps } from '../data-table';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

const COLUMNS = 'minmax(180px, 1.2fr) minmax(110px, 0.8fr)';

function table(children: ReactNode, props: Partial<DataTableProps> = {}) {
  return render(
    <DataTable label="Admins" columns={COLUMNS} header={['Name', 'Role']} {...props}>
      {children}
    </DataTable>
  );
}

describe('DataTable', () => {
  it('declares table semantics that survive the mobile reflow', () => {
    const markup = table(
      <DataRow>
        <DataCell label="Name">Ripley</DataCell>
        <DataCell label="Role">Admin</DataCell>
      </DataRow>
    );

    expect(getSlotAttr(markup, 'data-table', 'role')).toBe('table');
    expect(getSlotAttr(markup, 'data-table-head', 'role')).toBe('rowgroup');
    expect(getSlotAttr(markup, 'data-table-body', 'role')).toBe('rowgroup');
    expect(getSlotAttr(markup, 'data-table-header', 'role')).toBe('row');
    expect(getSlotAttr(markup, 'data-table-header-cell', 'role')).toBe('columnheader');
    expect(getSlotAttr(markup, 'data-table-row', 'role')).toBe('row');
    expect(getSlotAttr(markup, 'data-table-cell', 'role')).toBe('cell');
  });

  it('keeps the scroll container out of the table structure', () => {
    // A plain div between role="table" and its row groups breaks the
    // required-children relationship; role="none" makes it transparent.
    const markup = table(<DataRow>x</DataRow>);
    expect(getSlotAttr(markup, 'data-table-scroll', 'role')).toBe('none');
  });

  it('names the table and reports its column count', () => {
    const markup = table(<DataRow>x</DataRow>);
    expect(getSlotAttr(markup, 'data-table', 'aria-label')).toBe('Admins');
    expect(getSlotAttr(markup, 'data-table', 'aria-colcount')).toBe('2');
  });

  it('publishes the column template as a custom property, not a hardcoded grid', () => {
    const markup = table(<DataRow>x</DataRow>);
    const style = getSlotAttr(markup, 'data-table', 'style');
    expect(style).toContain('--dt-columns');
    expect(style).toContain('minmax(180px, 1.2fr)');
  });

  it('owns its horizontal overflow and never widens its parent', () => {
    const markup = table(<DataRow>x</DataRow>);
    const root = sliceSlot(markup, 'data-table') ?? '';
    const scroll = getSlotAttr(markup, 'data-table-scroll', 'class') ?? '';

    // Exactly one element scrolls sideways, and it is the inner one.
    expect(scroll).toContain('overflow-x-auto');
    expect(getSlotAttr(markup, 'data-table', 'class')).not.toContain('overflow');
    // The root can shrink inside a flex or grid parent, so the width it cannot
    // fit becomes the scroll container's problem rather than the page's.
    expect(getSlotAttr(markup, 'data-table', 'class')).toContain('min-w-0');
    expect(scroll).toContain('min-w-0');
    expect(root).toBeTruthy();
  });

  it('renders one header cell per heading, empty ones included', () => {
    const markup = render(
      <DataTable columns={COLUMNS} header={['Code', 'Status', '']}>
        <DataRow>x</DataRow>
      </DataTable>
    );
    expect(countSlot(markup, 'data-table-header-cell')).toBe(3);
  });

  it('renders one row per child', () => {
    const markup = table(
      <>
        <DataRow>a</DataRow>
        <DataRow>b</DataRow>
        <DataRow>c</DataRow>
      </>
    );
    expect(countSlot(markup, 'data-table-row')).toBe(3);
  });

  it('hides the header row below md, where there are no columns to head', () => {
    const markup = table(<DataRow>x</DataRow>);
    expect(getSlotAttr(markup, 'data-table-header', 'class')).toContain('max-md:hidden');
  });

  it('gives every labelled cell its column name back below md', () => {
    const markup = table(
      <DataRow>
        <DataCell label="Role">Admin</DataCell>
      </DataRow>
    );
    expect(getSlotAttr(markup, 'data-table-cell', 'data-label')).toBe('Role');
    expect(getSlotAttr(markup, 'data-table-row', 'class')).toContain(
      'before:content-[attr(data-label)]'
    );
  });

  it('leaves data-label off a cell that has no label, so no caption renders', () => {
    const markup = table(
      <DataRow>
        <DataCell>
          <button type="button">Delete</button>
        </DataCell>
      </DataRow>
    );
    expect(getSlotAttr(markup, 'data-table-cell', 'data-label')).toBeUndefined();
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = table(<DataRow>x</DataRow>);
    const rowClass = getSlotAttr(markup, 'data-table-row', 'class') ?? '';

    expect(rowClass).toContain('bg-card');
    expect(rowClass).toContain('border-border');
    expect(rowClass).toContain('text-card-foreground');
    // No literal colour anywhere in the rendered markup.
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});

/**
 * Several call sites render `<SomeRowView row={...} />` rather than a `DataRow`
 * directly. Density has to reach those through context, not a forwarded prop.
 */
function AdvertiserRow({ name }: { name: string }) {
  return (
    <DataRow>
      <DataCell label="Advertiser">{name}</DataCell>
    </DataRow>
  );
}

describe('DataRow', () => {
  it('is inert by default: no tabindex, no interactive flag', () => {
    const markup = table(<DataRow>x</DataRow>);
    expect(getSlotAttr(markup, 'data-table-row', 'tabindex')).toBeUndefined();
    expect(getSlotAttr(markup, 'data-table-row', 'data-interactive')).toBeUndefined();
  });

  it('becomes focusable when it is activatable, and stays a row', () => {
    const markup = table(<DataRow onActivate={() => {}}>x</DataRow>);

    expect(getSlotAttr(markup, 'data-table-row', 'tabindex')).toBe('0');
    expect(getSlotAttr(markup, 'data-table-row', 'data-interactive')).toBe('true');
    // Not a button: promoting it would cost the table its structure.
    expect(getSlotAttr(markup, 'data-table-row', 'role')).toBe('row');
  });

  it('shows a focus ring only when it is activatable', () => {
    const inert = getSlotAttr(table(<DataRow>x</DataRow>), 'data-table-row', 'class') ?? '';
    const active =
      getSlotAttr(table(<DataRow onActivate={() => {}}>x</DataRow>), 'data-table-row', 'class') ??
      '';

    expect(inert).not.toContain('focus-visible:ring-2');
    expect(active).toContain('focus-visible:ring-2');
    expect(active).toContain('cursor-pointer');
  });

  it('takes its density from the table rather than a prop', () => {
    const comfortable = table(<DataRow>x</DataRow>);
    const compact = table(<DataRow>x</DataRow>, { density: 'compact' });

    expect(getSlotAttr(comfortable, 'data-table', 'data-density')).toBe('comfortable');
    expect(getSlotAttr(comfortable, 'data-table-row', 'class')).toContain('p-4');
    expect(getSlotAttr(compact, 'data-table', 'data-density')).toBe('compact');
    expect(getSlotAttr(compact, 'data-table-row', 'class')).toContain('py-2');
  });

  it('renders a row that a page composed from its own component', () => {
    const markup = table(<AdvertiserRow name="Bet Co" />, { density: 'compact' });
    expect(slotText(markup, 'data-table-cell')).toBe('Bet Co');
    expect(getSlotAttr(markup, 'data-table-row', 'class')).toContain('py-2');
  });

  it('accepts a raw element as a cell', () => {
    const markup = table(
      <DataRow>
        <span data-label="Kind">competition</span>
      </DataRow>
    );
    expect(markup).toContain('data-label="Kind"');
    expect(hasSlot(markup, 'data-table-row')).toBe(true);
  });
});
