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

  it('separates the legal links with spacing, not dots or pipes', () => {
    expect(markup).not.toContain('·');
    expect(markup).not.toMatch(/>\s*\|\s*</);
    for (const label of ['Terms of Use', 'Privacy', 'Cookies', 'RSS', 'Sitemap']) {
      expect(markup).toContain(`>${label}<`);
    }
  });

  it('draws the submenu popover flat, with no gradient accent', () => {
    // The logo SVG has its own linearGradient; this is about CSS fills.
    expect(markup).not.toMatch(/bg-gradient/);
  });

  it('puts plain links and caret triggers on the same 16px line box', () => {
    // A block wrapper around the caret buttons inherited the body line height
    // and dropped Media and About below Arena and Thoughts.
    const plain = markup.match(/<a[^>]*>(Arena|Thoughts)</g) ?? [];
    const carets = markup.match(/<button[^>]*aria-expanded[^>]*>/g) ?? [];
    expect(plain).toHaveLength(2);
    expect(carets).toHaveLength(2);
    for (const tag of [...plain, ...carets]) {
      expect(tag).toContain('items-center');
      expect(tag).toContain('leading-4');
    }
    expect(markup).not.toMatch(/<div class="relative">/);
  });
});
