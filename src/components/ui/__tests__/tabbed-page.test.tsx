import { describe, expect, it } from 'vitest';

import { TabbedPage, pushTabToSearch, readTabFromSearch } from '../tabbed-page';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'ratings', label: 'Ratings', badge: 12 },
  { id: 'log', label: 'Log', disabled: true },
];

describe('TabbedPage rendering', () => {
  it('renders one tab per descriptor and surfaces the active id on the root', () => {
    const markup = render(
      <TabbedPage tabs={tabs} value="overview" onValueChange={() => undefined}>
        body
      </TabbedPage>
    );
    expect(countSlot(markup, 'tabbed-page-tab')).toBe(3);
    expect(getSlotAttr(markup, 'tabbed-page', 'data-active-tab')).toBe('overview');
  });

  it('marks the active tab with aria-selected and a slot indicator', () => {
    const markup = render(
      <TabbedPage tabs={tabs} value="ratings" onValueChange={() => undefined}>
        body
      </TabbedPage>
    );
    expect(markup).toContain('aria-selected="true"');
    expect(hasSlot(markup, 'tabbed-page-tab-indicator')).toBe(true);
  });

  it('renders the badge node alongside the tab label', () => {
    const markup = render(
      <TabbedPage tabs={tabs} value="overview" onValueChange={() => undefined}>
        body
      </TabbedPage>
    );
    expect(slotText(markup, 'tabbed-page-tab-badge')).toBe('12');
  });

  it('renders a disabled tab as a disabled button', () => {
    const markup = render(
      <TabbedPage tabs={tabs} value="overview" onValueChange={() => undefined}>
        body
      </TabbedPage>
    );
    expect(markup).toContain('disabled=""');
  });

  it('renders children in the panel slot', () => {
    const markup = render(
      <TabbedPage tabs={tabs} value="overview" onValueChange={() => undefined}>
        the-panel
      </TabbedPage>
    );
    expect(slotText(markup, 'tabbed-page-panel')).toContain('the-panel');
  });
});

describe('readTabFromSearch', () => {
  it('returns the fallback when no search is provided', () => {
    expect(readTabFromSearch(undefined, 'overview')).toBe('overview');
    expect(readTabFromSearch('', 'overview')).toBe('overview');
  });

  it('reads ?tab= from a raw search string (with or without ?)', () => {
    expect(readTabFromSearch('?tab=ratings', 'overview')).toBe('ratings');
    expect(readTabFromSearch('tab=ratings&other=1', 'overview')).toBe('ratings');
  });

  it('reads tab from a URLSearchParams instance', () => {
    const params = new URLSearchParams('tab=log');
    expect(readTabFromSearch(params, 'overview')).toBe('log');
  });

  it('reads tab from a plain object (TanStack Router search shape)', () => {
    expect(readTabFromSearch({ tab: 'ratings', other: 'x' }, 'overview')).toBe('ratings');
    expect(readTabFromSearch({ other: 'x' }, 'overview')).toBe('overview');
  });

  it('falls back when the tab value is the empty string', () => {
    expect(readTabFromSearch({ tab: '' }, 'overview')).toBe('overview');
  });
});

describe('pushTabToSearch', () => {
  it('strips the tab param when the user lands back on the default', () => {
    const next = pushTabToSearch({ other: 'x', tab: 'ratings' }, 'overview', 'overview');
    expect(next.tab).toBeUndefined();
    expect((next as { other: string }).other).toBe('x');
  });

  it('writes the tab param when navigating away from the default', () => {
    const next = pushTabToSearch({ other: 'x' }, 'ratings', 'overview');
    expect(next.tab).toBe('ratings');
  });
});
