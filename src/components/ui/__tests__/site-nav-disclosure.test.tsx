import { describe, expect, it } from 'vitest';

import { SiteNav } from '../site-nav';
import { render, sliceSlot } from './test-utils';

/**
 * The owner's report was "on my iPad I can't hover over the menus so they stay
 * stuck, I can't go to about submenu". The cause was that every desktop
 * dropdown in `SiteNav` — the Media/About tab submenus, Notifications, Create
 * and Account — was a pure-CSS `group-hover/<name>:visible` panel. A tap
 * synthesises a hover, the panel opens, and nothing retracts it.
 *
 * These are the markup-level invariants of the fix. The interactive proof
 * (tap toggles, hover still opens for a mouse, no double-toggle on
 * click-after-hover) lives in the `SiteNav` stories' play functions and in the
 * touch/desktop Playwright run recorded in the 0.96.0 CHANGELOG entry — this
 * file pins the things a static render can see, which happens to include the
 * one that caused the bug.
 */

const tabs = [
  { label: 'Home', href: '/' },
  {
    label: 'Media',
    menuHeader: 'Watch & Listen',
    children: [
      { label: 'BTL TV', href: '/tv' },
      { label: 'Zine', href: 'https://zine.example', external: true },
    ],
  },
  {
    label: 'About',
    children: [
      { label: 'Credo', href: '/credo', description: 'What is BTL about?' },
      { label: 'Pricing', href: '/pricing', description: 'Plans' },
    ],
  },
];

function fullNav() {
  return render(
    <SiteNav
      tabs={tabs}
      initials="TA"
      avatarUrl="https://example.test/avatar.png"
      profileHref="/@tom"
      studioHref="https://studio.example"
      onLogout={() => undefined}
      composeItems={[{ label: 'Article', href: 'https://studio.example/compose' }]}
      notificationPopover={<div>inbox</div>}
      notificationCount={3}
      onSearchClick={() => undefined}
      learnHref="https://docs.example"
    />
  );
}

/** Every `<button>` open tag in the markup, as raw strings. */
function buttonTags(markup: string): string[] {
  return markup.match(/<button[^>]*>/g) ?? [];
}

describe('SiteNav dropdowns are disclosures, not CSS hover', () => {
  it('ships no hover-driven visibility anywhere in the header', () => {
    // THE regression guard. `group-hover/<name>:visible` is the exact
    // construct that stuck on the owner's iPad: it has no closed state a tap
    // can reach. If one comes back, this fails.
    const markup = fullNav();
    expect(markup).not.toMatch(/group-hover\/[a-z]+:visible/);
    expect(markup).not.toMatch(/group-hover\/[a-z]+:opacity-100/);
    // `group/avatar` is excluded on purpose: the shared `Avatar` primitive
    // owns that name for its own internal hover styling and never gated a
    // panel with it.
    expect(markup).not.toMatch(/group\/(sub|notif|compose)\b/);
  });

  it('renders every dropdown closed, inert and hidden', () => {
    const markup = fullNav();
    const panels = markup.match(/<div[^>]*data-slot="site-nav-dropdown"[^>]*>/g) ?? [];
    // Media, About, Notifications, Create, Account.
    expect(panels).toHaveLength(5);
    for (const panel of panels) {
      expect(panel).toContain('data-state="closed"');
      // `invisible` keeps it out of the tab order; `inert` keeps it out of
      // everything else while it is hidden.
      expect(panel).toContain('invisible');
      expect(panel).toMatch(/\binert(=""|\s|>)/);
    }
  });

  it('gives every dropdown trigger the disclosure ARIA contract', () => {
    const markup = fullNav();
    const triggers = buttonTags(markup).filter((tag) => tag.includes('aria-expanded'));
    expect(triggers).toHaveLength(5);
    for (const trigger of triggers) {
      expect(trigger).toContain('aria-expanded="false"');
      expect(trigger).toContain('aria-haspopup="true"');
      expect(trigger).toMatch(/aria-controls="[^"]+"/);
      expect(trigger).toContain('data-state="closed"');
    }
  });

  it('points every trigger at the panel it actually controls', () => {
    const markup = fullNav();
    const controlled = [...markup.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
    const panelIds = [
      ...markup.matchAll(/<div id="([^"]+)"[^>]*data-slot="site-nav-dropdown"/g),
    ].map((match) => match[1]);
    expect(controlled).toHaveLength(5);
    expect(new Set(controlled).size).toBe(5);
    expect(new Set(controlled)).toEqual(new Set(panelIds));
  });

  it('makes the Account trigger a real button', () => {
    // It used to be a bare `<div>`: unfocusable, unannounced, and with no way
    // to open it without a hovering pointer.
    const markup = fullNav();
    const account = buttonTags(markup).filter((tag) => tag.includes('aria-label="Account"'));
    expect(account.length).toBeGreaterThanOrEqual(1);
    expect(account[0]).toContain('aria-expanded="false"');
  });

  it('still renders the About submenu rows inside its panel', () => {
    // The rows are what the owner could not reach. They are still there, still
    // links, just behind a disclosure now rather than a hover state.
    const markup = fullNav();
    const disclosures = markup.match(/data-slot="site-nav-disclosure"/g) ?? [];
    expect(disclosures).toHaveLength(5);
    expect(markup).toContain('href="/credo"');
    expect(markup).toContain('href="/pricing"');
  });

  it('leaves tabs without children as plain links', () => {
    // Home has no submenu, so it must stay a link — not gain a trigger.
    const markup = render(<SiteNav tabs={[{ label: 'Home', href: '/' }]} />);
    expect(markup).not.toContain('data-slot="site-nav-disclosure"');
    expect(sliceSlot(markup, 'site-nav')).toContain('href="/"');
  });
});
