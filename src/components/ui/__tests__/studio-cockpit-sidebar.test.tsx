import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { LinkProvider } from '../link-context';
import { StudioCockpitSidebar } from '../studio-cockpit-sidebar';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

/** Stand-in "router link" — a real consumer would pass e.g. Next's `Link`.
 *  Renders a distinguishing attribute so tests can tell it apart from a raw
 *  `<a>` produced by the LinkContext default. */
function MockRouterLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a data-mock-router-link="true" href={href} {...props}>
      {children}
    </a>
  );
}

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

  it('routes nav item hrefs through a configured LinkProvider component', () => {
    const linkSections = [
      {
        id: 'work',
        label: 'Work',
        items: [{ id: 'drafts', label: 'Drafts', href: '/studio/drafts' }],
      },
    ];

    const markup = render(
      <LinkProvider component={MockRouterLink}>
        <StudioCockpitSidebar sections={linkSections} />
      </LinkProvider>
    );

    const itemMarkup = sliceSlot(markup, 'studio-cockpit-sidebar-item');
    expect(itemMarkup).toBeDefined();
    // Pins the fix: a raw `<a href>` (ignoring useLinkComponent) would not
    // carry the mock link's marker attribute, so this fails if the sidebar
    // regresses to rendering the anchor directly instead of through context.
    expect(itemMarkup).toContain('data-mock-router-link="true"');
    expect(itemMarkup).toContain('href="/studio/drafts"');
  });

  it('does not route onSelect (button) items through the link component', () => {
    const buttonSections = [
      {
        id: 'actions',
        label: 'Actions',
        items: [{ id: 'archive', label: 'Archive', onSelect: () => {} }],
      },
    ];

    const markup = render(
      <LinkProvider component={MockRouterLink}>
        <StudioCockpitSidebar sections={buttonSections} />
      </LinkProvider>
    );

    const itemMarkup = sliceSlot(markup, 'studio-cockpit-sidebar-item');
    expect(itemMarkup).toBeDefined();
    expect(itemMarkup).not.toContain('data-mock-router-link');
    expect(itemMarkup).toContain('<button');
  });
});
