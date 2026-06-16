import { describe, expect, it } from 'vitest';

import { assetMonogram, entityAssetUrl, isBtlCdnSafe } from './entity-asset';

const BASE = 'https://cdn.breakingthelines.app/media';
const TEAM = 'btl_football_team_t8596499a';
const PLAYER = 'btl_football_player_penzo';
const COACH = 'btl_football_coach_cmourinho';
const COMP = 'btl_football_competition_lb3d230cb';

describe('entityAssetUrl — the address contract', () => {
  it('builds a team crest at provider/crest/<id>.png', () => {
    expect(entityAssetUrl('team', 'crest', TEAM, BASE)).toBe(
      `${BASE}/provider/crest/${TEAM}.png`,
    );
  });

  it('builds a competition badge at provider/competition/<id>.png', () => {
    expect(entityAssetUrl('competition', 'crest', COMP, BASE)).toBe(
      `${BASE}/provider/competition/${COMP}.png`,
    );
  });

  it('builds a player avatar at apifootball/player/<id>.png', () => {
    expect(entityAssetUrl('player', 'avatar', PLAYER, BASE)).toBe(
      `${BASE}/apifootball/player/${PLAYER}.png`,
    );
  });

  it('builds a player hero at wikimedia/player/<id>.jpg', () => {
    expect(entityAssetUrl('player', 'hero', PLAYER, BASE)).toBe(
      `${BASE}/wikimedia/player/${PLAYER}.jpg`,
    );
  });

  it('builds a manager hero at wikimedia/manager/<id>.jpg', () => {
    expect(entityAssetUrl('manager', 'hero', COACH, BASE)).toBe(
      `${BASE}/wikimedia/manager/${COACH}.jpg`,
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
      }),
    ).toBe(`${BASE}/provider/crest/${TEAM}.png`);
  });

  it('IGNORES a raw provider hotlink on an avatar and builds from the id instead', () => {
    expect(
      entityAssetUrl('player', 'avatar', PLAYER, BASE, {
        imageUrl: 'https://media.api-sports.io/football/players/99.png',
      }),
    ).toBe(`${BASE}/apifootball/player/${PLAYER}.png`);
  });

  it('honours a BTL-safe relative R2 key on an avatar, collapsing the doubled /media/', () => {
    expect(
      entityAssetUrl('player', 'avatar', PLAYER, BASE, {
        imageUrl: 'media/wikimedia/player/penzo.jpg',
      }),
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
      }),
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
