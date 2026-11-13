import { describe, expect, it } from 'vitest';

import { SiteFooter } from '../site-footer';
import { render } from './test-utils';

/**
 * The footer nav was tracked caps ("ARENA THOUGHTS MEDIA ABOUT"), which the
 * owner's design rules ban. Labels are sentence case at normal letter-spacing,
 * the same text-xs muted style as before.
 */
describe('SiteFooter', () => {
  const markup = render(<SiteFooter />);

  it('labels the default links in sentence case', () => {
    for (const label of ['Arena', 'Thoughts', 'Media', 'About']) {
      expect(markup).toContain(`>${label}<`);
    }
    for (const label of ['ARENA', 'THOUGHTS', 'MEDIA', 'ABOUT', 'CREDO', 'ZINE']) {
      expect(markup).not.toContain(`>${label}<`);
    }
  });

  it('sets the submenu labels in sentence case too', () => {
    for (const label of [
      'BTL TV',
      'BTL podcasts',
      'Zine',
      'Credo',
      'Pricing',
      'Contact',
      'Careers',
    ]) {
      expect(markup).toContain(`>${label}<`);
    }
  });

  it('uses no tracking or uppercase anywhere in the footer', () => {
    expect(markup).not.toMatch(/tracking-|uppercase/);
  });
});
