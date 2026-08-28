import { Globe } from '@phosphor-icons/react';
import { describe, expect, it } from 'vitest';

import { type SocialLinkType } from '#/lib/social-links';
import { ProfileHero, type SocialLink } from '../profile-hero';
import { countSlot, getSlotAttr, render, sliceSlot } from './test-utils';

const SLOT = 'profile-hero-social-link';

/**
 * A URL on each platform's own host. The hero resolves its icon from the URL,
 * so a fixture has to carry an address consistent with the platform it claims.
 */
const URL_BY_PLATFORM: Record<SocialLinkType, string> = {
  x: 'https://x.com/test',
  bluesky: 'https://bsky.app/profile/test',
  youtube: 'https://www.youtube.com/@test',
  instagram: 'https://www.instagram.com/test',
  tiktok: 'https://www.tiktok.com/@test',
  linkedin: 'https://www.linkedin.com/in/test',
  website: 'https://example.com/',
};

/** Render a hero carrying a single social link and return just that link's markup. */
function renderLink(type: SocialLink['type'], url?: string): string {
  const markup = render(
    <ProfileHero
      name="Test Profile"
      socialLinks={[{ type, url: url ?? URL_BY_PLATFORM[type] ?? `https://example.com/${type}` }]}
    />
  );
  const slice = sliceSlot(markup, SLOT);
  expect(slice, `expected a social link to render for "${type}"`).toBeDefined();
  return slice as string;
}

/** The globe, rendered exactly as `ProfileHero` renders a social icon. */
const GLOBE_MARKUP = render(<Globe weight="regular" className="size-5" />);

/** Every platform that gets its own logo, mirroring studio's picker. */
const LOGO_PLATFORMS: SocialLinkType[] = [
  'x',
  'bluesky',
  'youtube',
  'instagram',
  'tiktok',
  'linkedin',
];

describe('ProfileHero social links', () => {
  it('renders a distinct logo for every known platform', () => {
    const byPlatform = new Map(LOGO_PLATFORMS.map((type) => [type, renderLink(type)]));

    // A regression here means two platforms collapsed onto the same icon,
    // which is the bug this mapping exists to prevent.
    const rendered = [...byPlatform.values()];
    expect(new Set(rendered).size).toBe(LOGO_PLATFORMS.length);
  });

  it('gives no known platform the generic globe', () => {
    for (const type of LOGO_PLATFORMS) {
      expect(renderLink(type), `"${type}" should have its own logo, not the globe`).not.toContain(
        GLOBE_MARKUP
      );
    }
  });

  it('renders the globe for a generic website link', () => {
    expect(renderLink('website')).toContain(GLOBE_MARKUP);
  });

  it('falls back to the globe for an unrecognised platform', () => {
    // The profile API stores the platform enum without constraining it, so a
    // value outside the union can reach render. It must degrade to the globe.
    const unknown = 'discord' as unknown as SocialLinkType;
    expect(renderLink(unknown, 'not a url')).toContain(GLOBE_MARKUP);
  });

  it('falls back to the globe for an unspecified platform', () => {
    const unspecified = '' as unknown as SocialLinkType;
    expect(renderLink(unspecified, 'not a url')).toContain(GLOBE_MARKUP);
  });

  it('renders the icon the URL calls for, not the one the row claims', () => {
    // Production shape: user-service does not validate the enum, so most
    // stored links claim X whatever they point at. The URL decides.
    expect(renderLink('x', 'https://www.youtube.com/@test')).toBe(renderLink('youtube'));
    expect(renderLink('x', 'https://www.linkedin.com/in/test')).toBe(renderLink('linkedin'));
    expect(renderLink('instagram', 'https://x.com/test')).toBe(renderLink('x'));
  });

  it('gives an unsupported platform the globe even when the row claims X', () => {
    // Pinterest, Facebook and Reddit have no enum member. A readable URL on an
    // unknown host must not inherit the row's bogus platform.
    for (const url of [
      'https://ca.pinterest.com/test/',
      'https://www.facebook.com/test',
      'https://www.reddit.com/user/test/',
    ]) {
      expect(renderLink('x', url), url).toContain(GLOBE_MARKUP);
    }
  });

  it('keeps the stored platform when the URL cannot be read at all', () => {
    // A bare handle is the one case where the stored value is the only signal.
    const markup = render(
      <ProfileHero name="Test Profile" socialLinks={[{ type: 'x', url: '@kapoordhruv755' }]} />
    );
    expect(getSlotAttr(markup, SLOT, 'data-platform')).toBe('x');
    expect(sliceSlot(markup, SLOT)).not.toContain(GLOBE_MARKUP);
  });

  it('reports the resolved platform, not the stored one, on data-platform', () => {
    const markup = render(
      <ProfileHero
        name="Test Profile"
        socialLinks={[{ type: 'x', url: 'https://www.youtube.com/@test' }]}
      />
    );
    expect(getSlotAttr(markup, SLOT, 'data-platform')).toBe('youtube');
  });

  it('exposes the platform on the link for styling and assertions', () => {
    const markup = render(
      <ProfileHero
        name="Test Profile"
        socialLinks={[{ type: 'bluesky', url: 'https://bsky.app/profile/test' }]}
      />
    );
    expect(getSlotAttr(markup, SLOT, 'data-platform')).toBe('bluesky');
  });

  it('renders every supplied link', () => {
    const links: SocialLink[] = LOGO_PLATFORMS.map((type) => ({
      type,
      url: `https://example.com/${type}`,
    }));
    const markup = render(<ProfileHero name="Test Profile" socialLinks={links} />);
    expect(countSlot(markup, SLOT)).toBe(links.length);
  });

  it('renders no links when none are supplied', () => {
    expect(countSlot(render(<ProfileHero name="Test Profile" />), SLOT)).toBe(0);
  });

  /**
   * A profile link is a self-declared URL that any account can point anywhere,
   * so it never carries link equity — there is no authorised exception here the
   * way there is for an article body. This link used to render dofollow, which
   * made every public profile a free backlink for whoever signed up.
   */
  it.each(LOGO_PLATFORMS)('withholds link equity from a %s link', (type) => {
    const rel = (/\brel="([^"]*)"/.exec(renderLink(type))?.[1] ?? '').split(/\s+/);
    expect(rel).toEqual(expect.arrayContaining(['ugc', 'nofollow']));
    // The tab-nabbing defence must survive alongside the new tokens.
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  });
});
