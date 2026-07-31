import { Globe } from '@phosphor-icons/react';
import { describe, expect, it } from 'vitest';

import { ProfileHero, type SocialLink, type SocialLinkType } from '../profile-hero';
import { countSlot, getSlotAttr, render, sliceSlot } from './test-utils';

const SLOT = 'profile-hero-social-link';

/** Render a hero carrying a single social link and return just that link's markup. */
function renderLink(type: SocialLink['type']): string {
  const markup = render(
    <ProfileHero name="Test Profile" socialLinks={[{ type, url: `https://example.com/${type}` }]} />
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
    expect(renderLink(unknown)).toContain(GLOBE_MARKUP);
  });

  it('falls back to the globe for an unspecified platform', () => {
    const unspecified = '' as unknown as SocialLinkType;
    expect(renderLink(unspecified)).toContain(GLOBE_MARKUP);
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
});
