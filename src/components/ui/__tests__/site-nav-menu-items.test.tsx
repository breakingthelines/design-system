import { describe, expect, it } from 'vitest';

import { SiteNav } from '../site-nav';
import { render } from './test-utils';

/**
 * The avatar menu rows were tracked caps (`uppercase tracking-[0.08em]`), which
 * the owner's design rules ban. They now use the nav's own 12px/18px label
 * style in sentence case.
 */
describe('SiteNav menu rows', () => {
  const markup = render(
    <SiteNav
      tabs={[{ label: 'Home', href: '/' }]}
      initials="TA"
      avatarMenu={[
        { label: 'Profile', href: '/@tom' },
        { label: 'Help', href: 'https://docs.example', external: true },
        { label: 'Log out', onClick: () => undefined },
      ]}
    />
  );

  it('renders the avatar menu labels as given', () => {
    for (const label of ['Profile', 'Help', 'Log out']) {
      expect(markup).toContain(`>${label}<`);
    }
  });

  it('uses no tracked caps in the header menus', () => {
    expect(markup).not.toContain('tracking-[0.08em]');
  });

  it('sets the rows in the nav label size', () => {
    const rows = markup.match(/<(a|button)[^>]*>(Profile|Help|Log out)</g) ?? [];
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toContain('text-[12px]');
      expect(row).toContain('leading-[18px]');
      expect(row).toContain('tracking-[-0.36px]');
      expect(row).not.toMatch(/\buppercase\b/);
    }
  });
});
