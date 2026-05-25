import { describe, expect, it } from 'vitest';

import { StudioCockpitSidebar } from '../studio-cockpit-sidebar';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('StudioCockpitSidebar', () => {
  const sections = [
    {
      id: 'work',
      label: 'Work',
      items: [
        { id: 'drafts', label: 'Drafts', badgeCount: 3, isActive: true },
        { id: 'published', label: 'Published' },
      ],
    },
    {
      id: 'audience',
      label: 'Audience',
      items: [
        { id: 'engagement', label: 'Engagement', dot: 'doing' as const },
        { id: 'opportunities', label: 'Opportunities', badgeCount: 0 },
      ],
    },
  ];

  it('exposes the section count on the root', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    expect(getSlotAttr(markup, 'studio-cockpit-sidebar', 'data-section-count')).toBe('2');
  });

  it('renders one section element per section', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    expect(countSlot(markup, 'studio-cockpit-sidebar-section')).toBe(2);
    expect(markup).toContain('data-section-id="work"');
    expect(markup).toContain('data-section-id="audience"');
  });

  it('renders one item per section item', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    expect(countSlot(markup, 'studio-cockpit-sidebar-item')).toBe(4);
  });

  it('marks the active item with aria-current="page"', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    expect(markup).toContain('data-id="drafts"');
    expect(markup).toContain('aria-current="page"');
  });

  it('renders the badge count when greater than zero', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    const draftSlice = markup.split('data-id="drafts"')[1] ?? '';
    expect(draftSlice).toContain('data-slot="studio-cockpit-sidebar-item-badge"');
    expect(draftSlice).toContain('3');
  });

  it('omits the badge when count is zero', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    const oppSlice = markup.split('data-id="opportunities"')[1] ?? '';
    expect(oppSlice.split('data-id=')[0]).not.toContain('studio-cockpit-sidebar-item-badge');
  });

  it('renders the dot when supplied', () => {
    const markup = render(<StudioCockpitSidebar sections={sections} />);
    expect(hasSlot(markup, 'studio-cockpit-sidebar-item-dot')).toBe(true);
  });

  it('renders the identity block when supplied', () => {
    const markup = render(
      <StudioCockpitSidebar
        sections={sections}
        identity={{ label: 'Editor One', secondary: 'Studio editor' }}
      />
    );
    expect(hasSlot(markup, 'studio-cockpit-sidebar-identity')).toBe(true);
    expect(slotText(markup, 'studio-cockpit-sidebar-identity-label')).toContain('Editor One');
  });
});
