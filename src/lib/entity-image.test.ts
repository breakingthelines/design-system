import { describe, expect, it } from 'vitest';

import {
  type EntityImageManifest,
  entityImage,
  entityImageKey,
  entityMonogram,
} from './entity-image';
import { ENTITY_IMAGERY_SEED_MANIFEST } from './entity-imagery-manifest';

const manifest: EntityImageManifest = {
  version: 'test',
  cdnBase: 'https://media.breakingthelines.dev',
  entities: {
    // both layers → bespoke wins
    btl_football_team_42: { type: 'crest', btl: 'svg', provider: 'png' },
    // provider only → mirrored
    btl_football_team_66: { type: 'crest', provider: 'png' },
    // bespoke only
    btl_football_player_1: { type: 'player', btl: 'webp' },
    // present but wrong type for the lookup
    btl_football_competition_39: { type: 'competition', provider: 'png' },
  },
};

describe('entityImage resolver', () => {
  it('prefers the BTL-own bespoke layer when present', () => {
    expect(entityImage('crest', 'btl_football_team_42', manifest)).toBe(
      'https://media.breakingthelines.dev/btl/crest/btl_football_team_42.svg'
    );
  });

  it('falls back to the mirrored provider layer when no bespoke art exists', () => {
    expect(entityImage('crest', 'btl_football_team_66', manifest)).toBe(
      'https://media.breakingthelines.dev/provider/crest/btl_football_team_66.png'
    );
  });

  it('returns null (monogram) for an unknown entity', () => {
    expect(entityImage('crest', 'btl_football_team_999', manifest)).toBeNull();
  });

  it('returns null when the manifest entry type does not match the request', () => {
    expect(entityImage('crest', 'btl_football_competition_39', manifest)).toBeNull();
  });

  it('honours a CORS-clean imageUrl override over the manifest', () => {
    expect(
      entityImage('crest', 'btl_football_team_42', manifest, {
        imageUrl: 'https://media.breakingthelines.dev/special/override.webp',
      })
    ).toBe('https://media.breakingthelines.dev/special/override.webp');
  });

  it('can be forced to the provider layer via preferLayers', () => {
    expect(
      entityImage('crest', 'btl_football_team_42', manifest, { preferLayers: ['provider'] })
    ).toBe('https://media.breakingthelines.dev/provider/crest/btl_football_team_42.png');
  });

  it('returns null when a forced layer is absent', () => {
    expect(
      entityImage('player', 'btl_football_player_1', manifest, { preferLayers: ['provider'] })
    ).toBeNull();
  });

  it('returns null for an empty entity id', () => {
    expect(entityImage('crest', '', manifest)).toBeNull();
  });

  it('trims a trailing slash on the cdn base', () => {
    const m: EntityImageManifest = { ...manifest, cdnBase: 'https://cdn.example.com/' };
    expect(entityImage('crest', 'btl_football_team_66', m)).toBe(
      'https://cdn.example.com/provider/crest/btl_football_team_66.png'
    );
  });
});

describe('entityImageKey', () => {
  it('builds a source-layered key', () => {
    expect(entityImageKey('btl', 'player', 'btl_football_player_7', 'webp')).toBe(
      'btl/player/btl_football_player_7.webp'
    );
  });
});

describe('entityMonogram', () => {
  it('takes up to two initials', () => {
    expect(entityMonogram('Aston Villa')).toBe('AV');
    expect(entityMonogram('Arsenal')).toBe('A');
    expect(entityMonogram('  ')).toBe('?');
  });
});

describe('seed manifest', () => {
  it('resolves a seeded competition to its mirrored URL', () => {
    expect(entityImage('competition', 'btl_football_competition_39', ENTITY_IMAGERY_SEED_MANIFEST)).toBe(
      'https://media.breakingthelines.dev/provider/competition/btl_football_competition_39.png'
    );
  });

  it('every seed entry carries a valid type', () => {
    for (const [id, entry] of Object.entries(ENTITY_IMAGERY_SEED_MANIFEST.entities)) {
      expect(id.startsWith('btl_football_')).toBe(true);
      expect(['crest', 'competition', 'player', 'manager', 'stadium']).toContain(entry.type);
      expect(entry.btl ?? entry.provider).toBeTruthy();
    }
  });
});
