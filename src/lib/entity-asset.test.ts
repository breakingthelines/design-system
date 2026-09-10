import { describe, expect, it } from 'vitest';

import {
  assetMonogram,
  btlAssetCandidates,
  entityAssetCandidates,
  entityAssetUrl,
  isBtlCdnSafe,
} from './entity-asset';

const BASE = 'https://cdn.breakingthelines.app/media';
const TEAM = 'btl_football_team_t8596499a';
const PLAYER = 'btl_football_player_penzo';
const COACH = 'btl_football_coach_cmourinho';
const COMP = 'btl_football_competition_lb3d230cb';

describe('entityAssetUrl — the address contract', () => {
  it('builds a team crest at provider/crest/<id>.png', () => {
    expect(entityAssetUrl('team', 'crest', TEAM, BASE)).toBe(`${BASE}/provider/crest/${TEAM}.png`);
  });

  it('builds a competition badge at provider/competition/<id>.png', () => {
    expect(entityAssetUrl('competition', 'crest', COMP, BASE)).toBe(
      `${BASE}/provider/competition/${COMP}.png`
    );
  });

  it('builds a player avatar at apifootball/player/<id>.png', () => {
    expect(entityAssetUrl('player', 'avatar', PLAYER, BASE)).toBe(
      `${BASE}/apifootball/player/${PLAYER}.png`
    );
  });

  it('builds a player hero at wikimedia/player/<id>.jpg', () => {
    expect(entityAssetUrl('player', 'hero', PLAYER, BASE)).toBe(
      `${BASE}/wikimedia/player/${PLAYER}.jpg`
    );
  });

  it('builds a manager hero at wikimedia/manager/<id>.jpg', () => {
    expect(entityAssetUrl('manager', 'hero', COACH, BASE)).toBe(
      `${BASE}/wikimedia/manager/${COACH}.jpg`
    );
  });

  it('builds a flag at flags/<iso2>.svg, lowercasing the code', () => {
    expect(entityAssetUrl('nation', 'flag', 'GB', BASE)).toBe(`${BASE}/flags/gb.svg`);
  });

  it('returns null with no id (caller monograms)', () => {
    expect(entityAssetUrl('team', 'crest', '', BASE)).toBeNull();
  });

  it('returns null for an unsupported (kind, role) with no imageUrl', () => {
    // manager has no canonical small-headshot layer
    expect(entityAssetUrl('manager', 'avatar', COACH, BASE)).toBeNull();
  });
});

describe('entityAssetUrl — the hotlink choke-point', () => {
  it('IGNORES a raw provider hotlink on a crest and builds from the id instead', () => {
    expect(
      entityAssetUrl('team', 'crest', TEAM, BASE, {
        imageUrl: 'https://media.api-sports.io/football/teams/42.png',
      })
    ).toBe(`${BASE}/provider/crest/${TEAM}.png`);
  });

  it('IGNORES a raw provider hotlink on an avatar and builds from the id instead', () => {
    expect(
      entityAssetUrl('player', 'avatar', PLAYER, BASE, {
        imageUrl: 'https://media.api-sports.io/football/players/99.png',
      })
    ).toBe(`${BASE}/apifootball/player/${PLAYER}.png`);
  });

  it('honours a BTL-safe relative R2 key on an avatar, collapsing the doubled /media/', () => {
    expect(
      entityAssetUrl('player', 'avatar', PLAYER, BASE, {
        imageUrl: 'media/wikimedia/player/penzo.jpg',
      })
    ).toBe(`${BASE}/wikimedia/player/penzo.jpg`);
  });

  it('honours a BTL-CDN absolute url verbatim', () => {
    const abs = 'https://cdn.breakingthelines.dev/media/btl/crest/penzo.svg';
    expect(entityAssetUrl('team', 'crest', TEAM, BASE, { imageUrl: abs })).toBe(abs);
  });

  it('NEVER lets a backend hotlink override the hero (hero ignores imageUrl entirely)', () => {
    // identity image_url points at the low-res headshot — the hero must be built.
    expect(
      entityAssetUrl('player', 'hero', PLAYER, BASE, {
        imageUrl: 'media/apifootball/player/penzo.png',
      })
    ).toBe(`${BASE}/wikimedia/player/${PLAYER}.jpg`);
  });
});

describe('isBtlCdnSafe', () => {
  it('accepts a relative R2 key (no host)', () => {
    expect(isBtlCdnSafe('media/provider/crest/x.png')).toBe(true);
    expect(isBtlCdnSafe('/media/provider/crest/x.png')).toBe(true);
  });
  it('accepts a BTL CDN absolute url (.app and .dev)', () => {
    expect(isBtlCdnSafe('https://cdn.breakingthelines.app/media/x.png')).toBe(true);
    expect(isBtlCdnSafe('https://cdn.breakingthelines.dev/media/x.png')).toBe(true);
  });
  it('REJECTS a raw provider hotlink', () => {
    expect(isBtlCdnSafe('https://media.api-sports.io/football/teams/42.png')).toBe(false);
  });
  it('rejects an arbitrary third-party host and data URIs', () => {
    expect(isBtlCdnSafe('https://evil.example.com/x.png')).toBe(false);
    expect(isBtlCdnSafe('data:image/png;base64,AAAA')).toBe(false);
    expect(isBtlCdnSafe('')).toBe(false);
    expect(isBtlCdnSafe(null)).toBe(false);
  });
});

describe('assetMonogram', () => {
  it('takes up to two initials, uppercased', () => {
    expect(assetMonogram('Aston Villa')).toBe('AV');
    expect(assetMonogram('Arsenal')).toBe('A');
    expect(assetMonogram('  ')).toBe('?');
  });
});

describe('entityAssetCandidates — the btl layer and the chain order', () => {
  it('gives a mark its RESOLVED address first, extensionless, then the provider tail', () => {
    // The resolved object always carries the winning image (bespoke when one
    // exists, else the provider copy — content-service#248), so after the
    // backfill this first address answers 200 for every known mark and the
    // provider tail is a rollout safety net, not a probe.
    expect(entityAssetCandidates('team', 'crest', TEAM, BASE)).toEqual([
      `${BASE}/resolved/crest/${TEAM}`,
      `${BASE}/provider/crest/${TEAM}.png`,
    ]);
  });

  it('addresses a competition badge at btl/competition/, not btl/badge/', () => {
    expect(entityAssetCandidates('competition', 'crest', COMP, BASE)).toEqual([
      `${BASE}/resolved/competition/${COMP}`,
      `${BASE}/provider/competition/${COMP}.png`,
    ]);
  });

  it('gives a photo role ONE btl candidate (webp) — an svg hero is refused on write', () => {
    expect(entityAssetCandidates('player', 'avatar', PLAYER, BASE)).toEqual([
      `${BASE}/btl/avatar/${PLAYER}.webp`,
      `${BASE}/apifootball/player/${PLAYER}.png`,
    ]);
  });

  it('the BTL-owned candidate is ALWAYS ahead of the provider layer', () => {
    // For a mark that candidate is the resolved object (which carries the
    // bespoke art whenever it exists); for a photo it is the bespoke btl/
    // address. Either way, ours leads and the raw provider layer trails.
    const isOurs = (url: string) => url.includes('/btl/') || url.includes('/resolved/');
    for (const chain of [
      entityAssetCandidates('team', 'crest', TEAM, BASE),
      entityAssetCandidates('competition', 'crest', COMP, BASE),
      entityAssetCandidates('player', 'avatar', PLAYER, BASE),
      entityAssetCandidates('player', 'hero', PLAYER, BASE),
      entityAssetCandidates('manager', 'hero', COACH, BASE),
    ]) {
      const firstProvider = chain.findIndex((url) => !isOurs(url));
      const lastOurs = chain.map(isOurs).lastIndexOf(true);
      expect(lastOurs).toBeGreaterThanOrEqual(0);
      expect(lastOurs).toBeLessThan(firstProvider);
    }
  });

  it('the ROLE/KIND asymmetry: one btl/hero/ directory, two wikimedia ones', () => {
    const player = entityAssetCandidates('player', 'hero', PLAYER, BASE);
    const manager = entityAssetCandidates('manager', 'hero', COACH, BASE);

    // btl is ROLE-keyed: the same directory for both people.
    expect(player[0]).toBe(`${BASE}/btl/hero/${PLAYER}.webp`);
    expect(manager[0]).toBe(`${BASE}/btl/hero/${COACH}.webp`);

    // the mirror is KIND-keyed: player and manager are different directories.
    expect(player[1]).toBe(`${BASE}/wikimedia/player/${PLAYER}.jpg`);
    expect(manager[1]).toBe(`${BASE}/wikimedia/manager/${COACH}.jpg`);
  });

  it('never addresses the RETIRED btl/player/ or btl/manager/ directories', () => {
    const all = [
      ...entityAssetCandidates('player', 'avatar', PLAYER, BASE),
      ...entityAssetCandidates('player', 'hero', PLAYER, BASE),
      ...entityAssetCandidates('manager', 'hero', COACH, BASE),
    ];
    expect(all.some((url) => url.includes('/btl/player/'))).toBe(false);
    expect(all.some((url) => url.includes('/btl/manager/'))).toBe(false);
  });

  it('has NO bespoke candidate for a manager avatar (the role pins player ids)', () => {
    expect(btlAssetCandidates('manager', 'avatar', COACH, BASE)).toEqual([]);
    // ...and nothing else resolves either, so the caller monograms.
    expect(entityAssetCandidates('manager', 'avatar', COACH, BASE)).toEqual([]);
  });

  it('has NO bespoke candidate for a flag: flags are mirrored only', () => {
    expect(btlAssetCandidates('nation', 'flag', 'gb', BASE)).toEqual([]);
    expect(entityAssetCandidates('nation', 'flag', 'GB', BASE)).toEqual([`${BASE}/flags/gb.svg`]);
  });

  it('addresses a venue photo at btl/stadium/ with no provider tail', () => {
    const venue = 'btl_football_venue_v1234abc';
    expect(entityAssetCandidates('venue', 'hero', venue, BASE)).toEqual([
      `${BASE}/btl/stadium/${venue}.webp`,
    ]);
  });

  it('keeps a BTL-safe backend value ahead of the provider address, behind btl', () => {
    const chain = entityAssetCandidates('player', 'avatar', PLAYER, BASE, {
      imageUrl: 'media/wikimedia/player/penzo.jpg',
    });
    expect(chain).toEqual([
      `${BASE}/btl/avatar/${PLAYER}.webp`,
      `${BASE}/wikimedia/player/penzo.jpg`,
      `${BASE}/apifootball/player/${PLAYER}.png`,
    ]);
  });

  it('still refuses a raw provider hotlink anywhere in the chain', () => {
    const chain = entityAssetCandidates('team', 'crest', TEAM, BASE, {
      imageUrl: 'https://media.api-sports.io/football/teams/42.png',
    });
    expect(chain.some((url) => url.includes('api-sports.io'))).toBe(false);
    expect(chain).toEqual([`${BASE}/resolved/crest/${TEAM}`, `${BASE}/provider/crest/${TEAM}.png`]);
  });

  it('is empty with no id and with no cdnBase', () => {
    expect(entityAssetCandidates('team', 'crest', '', BASE)).toEqual([]);
    expect(entityAssetCandidates('team', 'crest', TEAM, '')).toEqual([]);
  });

  it('deduplicates: a backend value equal to the provider address appears once', () => {
    const chain = entityAssetCandidates('team', 'crest', TEAM, BASE, {
      imageUrl: `media/provider/crest/${TEAM}.png`,
    });
    expect(chain).toEqual([`${BASE}/resolved/crest/${TEAM}`, `${BASE}/provider/crest/${TEAM}.png`]);
  });
});

describe('entityAssetUrl is unchanged by the btl layer', () => {
  it('still returns the single provider address, never a btl one', () => {
    expect(entityAssetUrl('team', 'crest', TEAM, BASE)).toBe(`${BASE}/provider/crest/${TEAM}.png`);
    expect(entityAssetUrl('competition', 'crest', COMP, BASE)).toBe(
      `${BASE}/provider/competition/${COMP}.png`
    );
  });
});
