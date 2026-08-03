import {
  Butterfly,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from '@phosphor-icons/react';
import { describe, expect, it } from 'vitest';

import {
  resolveSocialLinkIcon,
  resolveSocialLinkType,
  socialLinkIcon,
  socialLinkTypeFromUrl,
  type SocialLinkType,
} from './social-links';

describe('socialLinkTypeFromUrl', () => {
  it('derives the platform from every known host', () => {
    const cases: Array<[string, SocialLinkType]> = [
      ['https://x.com/zachlowy', 'x'],
      ['https://twitter.com/agemianlawgroup', 'x'],
      ['https://bsky.app/profile/test', 'bluesky'],
      ['https://www.youtube.com/@BlazeEstimating', 'youtube'],
      ['https://youtu.be/dQw4w9WgXcQ', 'youtube'],
      ['https://www.instagram.com/indeedseo', 'instagram'],
      ['https://www.tiktok.com/@kevinaraujof', 'tiktok'],
      ['https://www.linkedin.com/company/mobcoder-ai', 'linkedin'],
    ];
    for (const [url, expected] of cases) {
      expect(socialLinkTypeFromUrl(url), url).toBe(expected);
    }
  });

  it('accepts the host with or without a leading www.', () => {
    expect(socialLinkTypeFromUrl('https://youtube.com/@a')).toBe('youtube');
    expect(socialLinkTypeFromUrl('https://www.youtube.com/@a')).toBe('youtube');
    expect(socialLinkTypeFromUrl('https://x.com/a')).toBe('x');
    expect(socialLinkTypeFromUrl('https://www.x.com/a')).toBe('x');
  });

  it('ignores the scheme, port, path, query and fragment', () => {
    expect(socialLinkTypeFromUrl('http://x.com/a')).toBe('x');
    expect(socialLinkTypeFromUrl('https://x.com/borderlena_?s=21')).toBe('x');
    expect(
      socialLinkTypeFromUrl(
        'https://www.instagram.com/mohamed_khirallh_44?igsh=MTl1cDdudGoxa2hzOA=='
      )
    ).toBe('instagram');
    expect(socialLinkTypeFromUrl('https://youtube.com/watch#t=1')).toBe('youtube');
  });

  it('upgrades a scheme-less host so a typed address still resolves', () => {
    expect(socialLinkTypeFromUrl('x.com/foo')).toBe('x');
    expect(socialLinkTypeFromUrl('//youtube.com/@a')).toBe('youtube');
  });

  it('matches the host, never a substring of the URL', () => {
    // The whole point of parsing: a substring test makes all of these match.
    expect(socialLinkTypeFromUrl('https://notyoutube.com/a')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://youtube.com.evil.test/a')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://example.com/instagram')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://example.com/?utm_source=x.com')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://myx.com/a')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://tiktok.com.br/a')).toBeUndefined();
  });

  it('does not claim a deeper subdomain it has not been told about', () => {
    // Safe degradation: these fall back rather than being guessed at.
    expect(socialLinkTypeFromUrl('https://m.youtube.com/a')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://uk.linkedin.com/in/a')).toBeUndefined();
  });

  it('returns undefined for an unknown host', () => {
    expect(socialLinkTypeFromUrl('https://ca.pinterest.com/a/')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://www.facebook.com/mobcoderinc')).toBeUndefined();
    expect(socialLinkTypeFromUrl('https://constructionestimating.ca/')).toBeUndefined();
  });

  it('does not throw on a malformed, relative or empty value', () => {
    for (const value of [
      '@kapoordhruv755',
      '/relative/path',
      'not a url',
      '',
      '   ',
      'https://',
      'http://localhost',
      'javascript:alert(1)',
      'mailto:a@b.com',
      undefined,
      null,
    ]) {
      expect(() => socialLinkTypeFromUrl(value)).not.toThrow();
      expect(socialLinkTypeFromUrl(value), String(value)).toBeUndefined();
    }
  });
});

describe('resolveSocialLinkType', () => {
  it('prefers the URL when the stored platform disagrees', () => {
    // Production shape: the row claims X, the URL is a YouTube channel.
    expect(resolveSocialLinkType('https://www.youtube.com/@Construction_estimating', 'x')).toBe(
      'youtube'
    );
    expect(resolveSocialLinkType('https://ca.pinterest.com/x/', 'x')).toBe('website');
    expect(resolveSocialLinkType('https://x.com/borderlena_?s=21', 'instagram')).toBe('x');
    expect(resolveSocialLinkType('https://collegeessay.org/', 'tiktok')).toBe('website');
    expect(resolveSocialLinkType('https://emirates.estate/', 'bluesky')).toBe('website');
  });

  it('keeps the stored platform only when nothing can be read from the value', () => {
    // A bare handle cannot be parsed, so the stored value is all there is.
    expect(resolveSocialLinkType('@kapoordhruv755', 'x')).toBe('x');
    expect(resolveSocialLinkType('not a url', 'bluesky')).toBe('bluesky');
    expect(resolveSocialLinkType('', 'youtube')).toBe('youtube');
  });

  it('overrides the stored platform for a readable URL on an unknown host', () => {
    // A readable URL is evidence both ways: if this were X it would be on
    // x.com, so the row is provably wrong and the globe is the honest icon.
    // This is what makes an unsupported platform degrade correctly rather
    // than inheriting a junk enum.
    expect(resolveSocialLinkType('https://ca.pinterest.com/a/', 'x')).toBe('website');
    expect(resolveSocialLinkType('https://www.facebook.com/a', 'x')).toBe('website');
    expect(resolveSocialLinkType('https://www.reddit.com/user/a/', 'x')).toBe('website');
    expect(resolveSocialLinkType('https://example.com/a', 'bluesky')).toBe('website');
  });

  it('falls back to website when neither the URL nor the stored value resolves', () => {
    expect(resolveSocialLinkType('https://octo.biz/', undefined)).toBe('website');
    expect(resolveSocialLinkType('@handle', undefined)).toBe('website');
    expect(resolveSocialLinkType('', undefined)).toBe('website');
    // A value outside the union — the profile API does not constrain the enum.
    expect(resolveSocialLinkType('https://discord.gg/a', 'discord' as SocialLinkType)).toBe(
      'website'
    );
  });

  it('agrees with the stored platform when the row happens to be right', () => {
    expect(resolveSocialLinkType('https://x.com/zachlowy', 'x')).toBe('x');
    expect(resolveSocialLinkType('https://www.instagram.com/indeedseo', 'instagram')).toBe(
      'instagram'
    );
  });
});

describe('socialLinkIcon', () => {
  it('gives every known platform its own logo', () => {
    expect(socialLinkIcon('x')).toBe(XLogo);
    expect(socialLinkIcon('bluesky')).toBe(Butterfly);
    expect(socialLinkIcon('youtube')).toBe(YoutubeLogo);
    expect(socialLinkIcon('instagram')).toBe(InstagramLogo);
    expect(socialLinkIcon('tiktok')).toBe(TiktokLogo);
    expect(socialLinkIcon('linkedin')).toBe(LinkedinLogo);
    expect(socialLinkIcon('website')).toBe(Globe);
  });

  it('falls back to the globe for anything unrecognised', () => {
    expect(socialLinkIcon('discord' as SocialLinkType)).toBe(Globe);
    expect(socialLinkIcon('' as SocialLinkType)).toBe(Globe);
  });
});

describe('resolveSocialLinkIcon', () => {
  it('resolves the icon the URL calls for, not the one the row claims', () => {
    expect(resolveSocialLinkIcon('https://www.youtube.com/@a', 'x')).toBe(YoutubeLogo);
    expect(resolveSocialLinkIcon('https://ca.pinterest.com/a/', 'x')).toBe(Globe);
    expect(resolveSocialLinkIcon('@kapoordhruv755', 'x')).toBe(XLogo);
    expect(resolveSocialLinkIcon('not a url', undefined)).toBe(Globe);
    expect(resolveSocialLinkIcon('https://bsky.app/profile/a', undefined)).toBe(Butterfly);
  });
});

/**
 * The distinct social link URLs stored in production, with the platform each
 * row claims. Pulled from `users.social_links` rather than invented, so the
 * derivation is checked against what it will actually meet.
 */
describe('production corpus', () => {
  const CORPUS: Array<[stored: SocialLinkType, url: string, expected: SocialLinkType]> = [
    // Rows claiming X that really are X
    ['x', 'https://x.com/LewisFN00', 'x'],
    ['x', 'https://x.com/blaze_uk_ltd', 'x'],
    ['x', 'https://x.com/blazeestimating', 'x'],
    ['x', 'https://x.com/borderlena_?s=21', 'x'],
    ['x', 'https://x.com/buyoriginal_pk', 'x'],
    ['x', 'https://x.com/canada_blaze', 'x'],
    ['x', 'https://x.com/ce_inc00', 'x'],
    ['x', 'https://x.com/kevinaraujof', 'x'],
    ['x', 'https://x.com/zachlowy', 'x'],
    ['x', 'https://twitter.com/agemianlawgroup', 'x'],
    ['x', 'https://twitter.com/mobcoderinc', 'x'],
    // Rows claiming X that are a different platform entirely
    ['x', 'https://www.youtube.com/@Construction_estimating', 'youtube'],
    ['x', 'https://www.youtube.com/@TheFootballSnapshot/videos', 'youtube'],
    ['x', 'https://www.instagram.com/mobcoderinc', 'instagram'],
    ['x', 'https://www.linkedin.com/company/mobcoder-ai', 'linkedin'],
    ['x', 'https://www.linkedin.com/in/dhruv-kapoor-57785b31b', 'linkedin'],
    [
      'x',
      'https://www.linkedin.com/in/mohamed-khirallh-1b6062167?utm_source=share_via&utm_content=profile&utm_medium=member_android',
      'linkedin',
    ],
    // Rows claiming X that are a plain website or an unsupported platform
    ['x', '@kapoordhruv755', 'x'], // unparseable: keeps the stored value
    ['x', 'https://breakingthelines.com/@neilharrison?tab=about', 'website'],
    ['x', 'https://ca.pinterest.com/constructionestimatinginc/', 'website'],
    ['x', 'https://coldculturestore.com/', 'website'],
    ['x', 'https://constructionestimating.ca/', 'website'],
    ['x', 'https://dribbble.com/mobcoder', 'website'],
    ['x', 'https://herzog-bau.gmbh/', 'website'],
    ['x', 'https://indeedseo.com/white-label-seo-reseller', 'website'],
    ['x', 'https://mobcoder.ai/', 'website'],
    ['x', 'https://octo.biz/', 'website'],
    ['x', 'https://slim.house/', 'website'],
    ['x', 'https://substack.com/@thefootballsnapshot', 'website'],
    ['x', 'https://www.animatedexplainers.com/', 'website'],
    ['x', 'https://www.coach-taiwan.net/', 'website'],
    ['x', 'https://www.cobwebgames.com/', 'website'],
    ['x', 'https://www.facebook.com/mobcoderinc', 'website'],
    ['x', 'https://www.facebook.com/share/1D7bjrxG4X/', 'website'],
    ['x', 'https://www.pixelstudiosinc.com/', 'website'],
    ['x', 'https://www.realesaletter.com/', 'website'],
    ['x', 'https://www.reddit.com/user/Grouchy_Back_1446/', 'website'],
    // Rows claiming another platform
    ['bluesky', 'https://emirates.estate/', 'website'],
    ['youtube', 'https://www.youtube.com/@BlazeEstimating', 'youtube'],
    ['youtube', 'https://www.youtube.com/@BlazeEstimatingLTD-f8b', 'youtube'],
    ['youtube', 'https://www.youtube.com/@BuyOriginal-pk', 'youtube'],
    ['youtube', 'https://www.youtube.com/@FeaturesMyAssignmentHelpcom', 'youtube'],
    ['youtube', 'https://www.youtube.com/@Indeedseoagency', 'youtube'],
    ['youtube', 'https://www.youtube.com/@blazeestimatingca', 'youtube'],
    ['instagram', 'https://www.instagram.com/blaze_estimatingltd', 'instagram'],
    ['instagram', 'https://www.instagram.com/blazeestimatingca', 'instagram'],
    ['instagram', 'https://www.instagram.com/blazeestimatingllc/', 'instagram'],
    ['instagram', 'https://www.instagram.com/buyoriginal_pk/', 'instagram'],
    ['instagram', 'https://www.instagram.com/indeedseo', 'instagram'],
    [
      'instagram',
      'https://www.instagram.com/mohamed_khirallh_44?igsh=MTl1cDdudGoxa2hzOA==',
      'instagram',
    ],
    ['instagram', 'https://www.instagram.com/vapeportaluk/', 'instagram'],
    ['instagram', 'https://x.com/borderlena_?s=21', 'x'],
    ['tiktok', 'https://collegeessay.org/', 'website'],
    ['tiktok', 'https://www.tiktok.com/@kevinaraujof', 'tiktok'],
  ];

  it('resolves every stored URL to the platform it actually points at', () => {
    for (const [stored, url, expected] of CORPUS) {
      expect(resolveSocialLinkType(url, stored), url).toBe(expected);
    }
  });

  it('never throws on a stored value', () => {
    for (const [stored, url] of CORPUS) {
      expect(() => resolveSocialLinkIcon(url, stored), url).not.toThrow();
    }
  });
});
