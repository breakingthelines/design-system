import { describe, expect, it } from 'vitest';

import { PageHeader } from '../page-header';
import { getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

describe('PageHeader', () => {
  it('names the page with an h1 by default', () => {
    // Every hand-rolled header in the estate is an h1. The local component
    // rendered h2, which put the page's own name below a heading it did not have.
    const markup = render(<PageHeader title="Taxonomy" />);
    const title = sliceSlot(markup, 'page-header-title') ?? '';

    expect(title.startsWith('<h1')).toBe(true);
    expect(slotText(markup, 'page-header-title')).toBe('Taxonomy');
  });

  it('steps the heading down on request, and sizes it to match', () => {
    const two = render(<PageHeader title="Taxonomy" level={2} />);
    const three = render(<PageHeader title="Taxonomy" level={3} />);

    expect((sliceSlot(two, 'page-header-title') ?? '').startsWith('<h2')).toBe(true);
    expect((sliceSlot(three, 'page-header-title') ?? '').startsWith('<h3')).toBe(true);
    expect(getSlotAttr(two, 'page-header-title', 'class')).toContain('text-xl');
    expect(getSlotAttr(three, 'page-header-title', 'class')).toContain('text-lg');
  });

  it('draws no kicker unless it is given one', () => {
    // The local version hardcoded "BTL Admin" with no way to remove it.
    const bare = render(<PageHeader title="Home" />);
    const kicked = render(<PageHeader title="Home" kicker="BTL Admin" />);

    expect(hasSlot(bare, 'page-header-kicker')).toBe(false);
    expect(bare).not.toContain('BTL Admin');
    expect(slotText(kicked, 'page-header-kicker')).toBe('BTL Admin');
  });

  it('omits the description and the actions bar when they are absent', () => {
    const markup = render(<PageHeader title="Home" />);

    expect(hasSlot(markup, 'page-header-description')).toBe(false);
    expect(hasSlot(markup, 'page-header-actions')).toBe(false);
  });

  it('puts the actions opposite the title and wraps them under it below md', () => {
    const markup = render(
      <PageHeader title="Advertisers" actions={<button type="button">New advertiser</button>} />
    );
    const root = getSlotAttr(markup, 'page-header', 'class') ?? '';
    const actions = getSlotAttr(markup, 'page-header-actions', 'class') ?? '';

    expect(root).toContain('flex-col');
    expect(root).toContain('md:flex-row');
    expect(root).toContain('md:justify-between');
    expect(actions).toContain('flex-wrap');
    expect(actions).toContain('max-md:w-full');
    expect(slotText(markup, 'page-header-actions')).toBe('New advertiser');
  });

  it('keeps children in the title column, under the description', () => {
    const markup = render(
      <PageHeader title="Users" description="Everyone with an account.">
        <span data-slot="probe">filters</span>
      </PageHeader>
    );
    const titles = sliceSlot(markup, 'page-header-titles') ?? '';

    expect(titles).toContain('data-slot="probe"');
    expect(titles.indexOf('page-header-description')).toBeLessThan(titles.indexOf('probe'));
  });

  it('does not become SectionHeader', () => {
    // SectionHeader is the uppercase display header that introduces a block
    // inside a page. Nothing here is uppercase and nothing draws its rule.
    const markup = render(<PageHeader title="Taxonomy" />);

    expect(getSlotAttr(markup, 'page-header-title', 'class')).not.toContain('uppercase');
    expect(hasSlot(markup, 'section-header')).toBe(false);
  });

  it('opts into a rule under it rather than shipping one', () => {
    const plain = render(<PageHeader title="Home" />);
    const bordered = render(<PageHeader title="Home" bordered />);

    expect(getSlotAttr(plain, 'page-header', 'class')).not.toContain('border-b');
    expect(getSlotAttr(bordered, 'page-header', 'class')).toContain('border-b');
    expect(getSlotAttr(bordered, 'page-header', 'class')).toContain('border-border');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(
      <PageHeader title="Taxonomy" kicker="BTL Admin" description="Govern canonical entities." />
    );

    expect(getSlotAttr(markup, 'page-header', 'class')).toContain('text-foreground');
    expect(getSlotAttr(markup, 'page-header-kicker', 'class')).toContain('text-muted-foreground');
    expect(getSlotAttr(markup, 'page-header-description', 'class')).toContain(
      'text-muted-foreground'
    );
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});
