import { describe, expect, it } from 'vitest';

import { SearchField } from '../search-field';
import { getSlotAttr, hasSlot, render } from './test-utils';

describe('SearchField', () => {
  it('is a search input with the affordance attached', () => {
    const markup = render(<SearchField />);

    expect(hasSlot(markup, 'search-field')).toBe(true);
    expect(hasSlot(markup, 'input-group-addon')).toBe(true);
    expect(getSlotAttr(markup, 'input-group-control', 'type')).toBe('search');
    expect(getSlotAttr(markup, 'input-group-control', 'placeholder')).toBe('Search');
    expect(markup).toContain('<svg');
  });

  it('carries the 16px mobile floor so no page has to patch it', () => {
    // iOS Safari zooms the viewport when a focused input renders below 16px.
    // text-base is 16px; the system's own size returns at md.
    const inputClass = getSlotAttr(render(<SearchField />), 'input-group-control', 'class') ?? '';

    expect(inputClass).toContain('text-base');
    expect(inputClass).toContain('md:text-sm');
  });

  it('grows to a 44px target below md', () => {
    expect(getSlotAttr(render(<SearchField />), 'search-field', 'class')).toContain('max-md:h-11');
  });

  it('is never nameless', () => {
    // Two of the four call sites shipped an unlabelled search box, because
    // nothing about an inputProps bag made a name look required.
    expect(getSlotAttr(render(<SearchField />), 'input-group-control', 'aria-label')).toBe(
      'Search'
    );
  });

  it('takes a specific name for a page with more than one search box', () => {
    const markup = render(<SearchField label="Search audit logs" />);
    expect(getSlotAttr(markup, 'input-group-control', 'aria-label')).toBe('Search audit logs');
  });

  it('lets aria-label win over the default name', () => {
    const markup = render(<SearchField aria-label="Search content flags" />);
    expect(getSlotAttr(markup, 'input-group-control', 'aria-label')).toBe('Search content flags');
  });

  it('takes input props directly rather than through a bag', () => {
    const markup = render(
      <SearchField name="q" defaultValue="ripley" placeholder="Search admins" disabled />
    );

    expect(getSlotAttr(markup, 'input-group-control', 'name')).toBe('q');
    expect(getSlotAttr(markup, 'input-group-control', 'value')).toBe('ripley');
    expect(getSlotAttr(markup, 'input-group-control', 'placeholder')).toBe('Search admins');
    expect(markup).toContain('disabled');
  });

  it('keeps the control slot the group styles its focus ring from', () => {
    // InputGroup matches [data-slot=input-group-control]:focus-visible. Renaming
    // that slot would take the ring away without any visible failure.
    const markup = render(<SearchField />);

    expect(hasSlot(markup, 'input-group-control')).toBe(true);
    expect(getSlotAttr(markup, 'search-field', 'class')).toContain(
      'has-[[data-slot=input-group-control]:focus-visible]:border-ring'
    );
  });

  it('takes a different affordance, or none', () => {
    const custom = render(<SearchField icon={<span data-slot="probe">/</span>} />);
    const bare = render(<SearchField icon={null} />);

    expect(custom).toContain('data-slot="probe"');
    expect(bare).not.toContain('<svg');
    expect(hasSlot(bare, 'input-group-addon')).toBe(false);
  });

  it('hides the affordance from the accessibility tree', () => {
    // The input's own name says it is a search box; the glass repeating that
    // would be noise.
    expect(render(<SearchField />)).toContain('aria-hidden="true"');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(<SearchField />);
    const group = getSlotAttr(markup, 'search-field', 'class') ?? '';

    expect(group).toContain('border-input');
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});
