import { describe, expect, it } from 'vitest';

import { PaginationFooter, buildPageList } from '../pagination-footer';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('buildPageList', () => {
  it('draws every page while there are seven or fewer', () => {
    expect(buildPageList(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(buildPageList(1, 1)).toEqual([1]);
  });

  it('reports page 1 for an empty result rather than no page at all', () => {
    expect(buildPageList(0, 1)).toEqual([1]);
    expect(buildPageList(-3, 1)).toEqual([1]);
  });

  it('elides on the far side only, near either end', () => {
    expect(buildPageList(20, 1)).toEqual([1, 2, '...', 20]);
    expect(buildPageList(20, 20)).toEqual([1, '...', 19, 20]);
  });

  it('elides on both sides in the middle', () => {
    expect(buildPageList(20, 10)).toEqual([1, '...', 9, 10, 11, '...', 20]);
  });

  it('clamps an out-of-range active page instead of drawing past the end', () => {
    expect(buildPageList(20, 99)).toEqual([1, '...', 19, 20]);
    expect(buildPageList(20, -5)).toEqual([1, 2, '...', 20]);
  });

  it('always puts a gap between two numbers, and never over an empty range', () => {
    for (let total = 8; total <= 40; total += 1) {
      for (let active = 1; active <= total; active += 1) {
        const pages = buildPageList(total, active);

        // Ascending, no repeats, first and last always drawn.
        const numbers = pages.filter((page): page is number => page !== '...');
        expect(numbers[0]).toBe(1);
        expect(numbers[numbers.length - 1]).toBe(total);
        numbers.forEach((page, index) => {
          if (index === 0) return;
          // Strictly ascending, which also rules out a repeated page.
          expect(page).toBeGreaterThan(numbers[index - 1]);
        });

        pages.forEach((page, index) => {
          if (page !== '...') return;
          const before = pages[index - 1];
          const after = pages[index + 1];
          // A gap is never first, never last, and never adjacent to another gap.
          expect(typeof before).toBe('number');
          expect(typeof after).toBe('number');
          // It always stands for at least one page it is hiding.
          expect((after as number) - (before as number)).toBeGreaterThan(1);
        });
      }
    }
  });

  it('spends a gap on a single hidden page rather than drawing it', () => {
    // [1, '...', 3, 4, 5, '...', 8] costs the same width as [1, 2, 3, 4, 5, '...', 8]
    // and says less. This is the behaviour the six admin-dashboard copies of
    // this function have, and the swap is not the place to change it.
    expect(buildPageList(8, 4)).toEqual([1, '...', 3, 4, 5, '...', 8]);
  });
});

describe('PaginationFooter', () => {
  const base = {
    totalLabel: 'Total users: 1,284',
    pages: buildPageList(20, 10),
    activePage: 10,
  };

  it('presents the page controls as a named navigation landmark', () => {
    const markup = render(<PaginationFooter {...base} />);
    const nav = getSlotAttr(markup, 'pagination-footer-nav', 'aria-label');

    expect(markup).toContain('<nav');
    expect(nav).toBe('Pagination');
  });

  it('takes a caller-supplied landmark name', () => {
    const markup = render(<PaginationFooter {...base} label="Audit log pages" />);
    expect(getSlotAttr(markup, 'pagination-footer-nav', 'aria-label')).toBe('Audit log pages');
  });

  it('labels every page button and marks the current one', () => {
    const markup = render(<PaginationFooter {...base} />);

    expect(markup).toContain('aria-label="Page 10"');
    expect(markup).toContain('aria-current="page"');
    // Exactly one current page.
    expect(markup.split('aria-current="page"').length - 1).toBe(1);
    expect(getSlotAttr(markup, 'pagination-footer-previous', 'aria-label')).toBe('Previous page');
    expect(getSlotAttr(markup, 'pagination-footer-next', 'aria-label')).toBe('Next page');
  });

  it('renders one button per page and hides the gaps from assistive tech', () => {
    const markup = render(<PaginationFooter {...base} />);

    // [1, '...', 9, 10, 11, '...', 20] — five numbers, two gaps.
    expect(countSlot(markup, 'pagination-footer-page')).toBe(5);
    expect(countSlot(markup, 'pagination-footer-gap')).toBe(2);
    expect(getSlotAttr(markup, 'pagination-footer-gap', 'aria-hidden')).toBe('true');
  });

  it('infers hasPrevious and hasNext from the active page', () => {
    const first = render(
      <PaginationFooter {...base} activePage={1} pages={buildPageList(20, 1)} />
    );
    expect(getSlotAttr(first, 'pagination-footer-previous', 'disabled')).toBe('');
    expect(getSlotAttr(first, 'pagination-footer-next', 'disabled')).toBeUndefined();

    const last = render(
      <PaginationFooter {...base} activePage={20} pages={buildPageList(20, 20)} />
    );
    expect(getSlotAttr(last, 'pagination-footer-previous', 'disabled')).toBeUndefined();
    expect(getSlotAttr(last, 'pagination-footer-next', 'disabled')).toBe('');
  });

  it('lets the host override the inference, which is what a cursor API needs', () => {
    // A cursor-paged list knows there is a next page even when the drawn list
    // stops at the active one.
    const markup = render(
      <PaginationFooter {...base} activePage={20} pages={buildPageList(20, 20)} hasNext />
    );
    expect(getSlotAttr(markup, 'pagination-footer-next', 'disabled')).toBeUndefined();
  });

  it('renders the total as given', () => {
    const markup = render(<PaginationFooter {...base} />);
    expect(slotText(markup, 'pagination-footer-total')).toBe('Total users: 1,284');
  });

  it('defaults the Prev and Next wording, and takes an override', () => {
    expect(slotText(render(<PaginationFooter {...base} />), 'pagination-footer-previous')).toBe(
      'Prev'
    );
    const custom = render(<PaginationFooter {...base} previousLabel="Back" nextLabel="Forward" />);
    expect(slotText(custom, 'pagination-footer-previous')).toBe('Back');
    expect(slotText(custom, 'pagination-footer-next')).toBe('Forward');
  });

  it('offers the per-page selector as a listbox when there are options', () => {
    const markup = render(
      <PaginationFooter {...base} perPage={25} perPageOptions={[10, 25, 50]} />
    );
    const trigger = 'pagination-footer-per-page-trigger';

    expect(getSlotAttr(markup, trigger, 'aria-haspopup')).toBe('listbox');
    expect(getSlotAttr(markup, trigger, 'aria-expanded')).toBe('false');
    expect(getSlotAttr(markup, trigger, 'disabled')).toBeUndefined();
    expect(slotText(markup, trigger)).toContain('25');
    // Closed: the list is not in the tree at all.
    expect(hasSlot(markup, 'pagination-footer-per-page-list')).toBe(false);
  });

  it('disables the per-page trigger when the page size is fixed', () => {
    const markup = render(<PaginationFooter {...base} perPage={10} />);
    const trigger = 'pagination-footer-per-page-trigger';

    expect(getSlotAttr(markup, trigger, 'disabled')).toBe('');
    expect(getSlotAttr(markup, trigger, 'aria-haspopup')).toBeUndefined();
    expect(slotText(markup, trigger)).toContain('10');
  });

  it('names the per-page trigger by its label and its value together', () => {
    const markup = render(<PaginationFooter {...base} perPage={50} perPageOptions={[10, 50]} />);
    const labelledBy = getSlotAttr(markup, 'pagination-footer-per-page-trigger', 'aria-labelledby');

    expect(labelledBy?.split(' ')).toHaveLength(2);
    const [labelId, valueId] = labelledBy!.split(' ');
    expect(getSlotAttr(markup, 'pagination-footer-per-page-label', 'id')).toBe(labelId);
    expect(markup).toContain(`id="${valueId}">50<`);
  });

  it('carries a caller-supplied caret in place of its own', () => {
    const markup = render(
      <PaginationFooter
        {...base}
        perPageOptions={[10]}
        perPageIcon={<span data-slot="host-caret">v</span>}
      />
    );
    expect(hasSlot(markup, 'host-caret')).toBe(true);
  });

  it('wraps rather than scrolls, so Prev and Next stay reachable', () => {
    const markup = render(<PaginationFooter {...base} />);
    const root = getSlotAttr(markup, 'pagination-footer', 'class') ?? '';
    const nav = getSlotAttr(markup, 'pagination-footer-nav', 'class') ?? '';

    expect(root).toContain('flex-wrap');
    expect(nav).toContain('flex-wrap');
    expect(root).not.toContain('overflow');
    expect(nav).not.toContain('overflow');
    expect(root).toContain('min-w-0');
  });

  it('gives every control a thumb-sized target below md', () => {
    const markup = render(<PaginationFooter {...base} />);
    // 11 = 2.75rem = 44px.
    expect(getSlotAttr(markup, 'pagination-footer-previous', 'class')).toContain('max-md:min-h-11');
    expect(getSlotAttr(markup, 'pagination-footer-page', 'class')).toContain('max-md:min-w-11');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(<PaginationFooter {...base} perPageOptions={[10, 25]} />);

    expect(getSlotAttr(markup, 'pagination-footer-previous', 'class')).toContain('bg-muted');
    expect(getSlotAttr(markup, 'pagination-footer', 'class')).toContain('text-foreground');
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });

  it('resolves the active page button to one background and one colour', () => {
    // cva concatenates variant then active; without tailwind-merge both
    // text-muted-foreground and text-foreground would ship and the winner
    // would be decided by stylesheet order.
    // Page 1 is the first drawn button, so make page 1 the active one.
    const markup = render(<PaginationFooter {...base} pages={[1, 2, 3]} activePage={1} />);
    const active = getSlotAttr(markup, 'pagination-footer-page', 'class') ?? '';

    expect(active).not.toContain('text-muted-foreground');
    expect(active).toContain('text-foreground');
    expect(active).not.toContain('bg-transparent');
  });
});
