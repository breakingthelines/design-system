import { describe, expect, it } from 'vitest';

import {
  type EntityImageManifest,
  entityImage,
  entityImageKey,
  entityMonogram,
} from './entity-image';
import { ENTITY_IMAGERY_SEED_MANIFEST } from './entity-imagery-manifest';

// Canonical ids are content-hashed (opaque hex suffix that NEVER starts with a
// digit). The fixtures below use that real shape on purpose — a provider-derived
// id (numeric suffix) is never minted and would trip the guardrail in
// `entity-imagery-manifest.guardrail.test.ts`.
const manifest: EntityImageManifest = {
  version: 'test',
  cdnBase: 'https://media.breakingthelines.dev',
  entities: {
    // both layers → bespoke wins
    btl_football_team_taaaa1111: { type: 'crest', btl: 'svg', provider: 'png' },
    // provider only → mirrored
    btl_football_team_tbbbb2222: { type: 'crest', provider: 'png' },
    // bespoke only
    btl_football_player_pcccc3333: { type: 'player', btl: 'webp' },
    // present but wrong type for the lookup
    btl_football_competition_ldddd4444: { type: 'competition', provider: 'png' },
  },
};

describe('entityImage resolver', () => {
  it('prefers the BTL-own bespoke layer when present', () => {
    expect(entityImage('crest', 'btl_football_team_taaaa1111', manifest)).toBe(
      'https://media.breakingthelines.dev/btl/crest/btl_football_team_taaaa1111.svg'
    );
  });

  it('falls back to the mirrored provider layer when no bespoke art exists', () => {
    expect(entityImage('crest', 'btl_football_team_tbbbb2222', manifest)).toBe(
      'https://media.breakingthelines.dev/provider/crest/btl_football_team_tbbbb2222.png'
    );
  });

  it('returns null (monogram) for an unknown entity', () => {
    expect(entityImage('crest', 'btl_football_team_tffff9999', manifest)).toBeNull();
  });

  it('returns null when the manifest entry type does not match the request', () => {
    expect(entityImage('crest', 'btl_football_competition_ldddd4444', manifest)).toBeNull();
  });

  it('honours a CORS-clean imageUrl override over the manifest', () => {
    expect(
      entityImage('crest', 'btl_football_team_taaaa1111', manifest, {
        imageUrl: 'https://media.breakingthelines.dev/special/override.webp',
      })
    ).toBe('https://media.breakingthelines.dev/special/override.webp');
  });

  it('can be forced to the provider layer via preferLayers', () => {
    expect(
      entityImage('crest', 'btl_football_team_taaaa1111', manifest, { preferLayers: ['provider'] })
    ).toBe('https://media.breakingthelines.dev/provider/crest/btl_football_team_taaaa1111.png');
  });

  it('returns null when a forced layer is absent', () => {
    expect(
      entityImage('player', 'btl_football_player_pcccc3333', manifest, {
        preferLayers: ['provider'],
      })
    ).toBeNull();
  });

  it('returns null for an empty entity id', () => {
    expect(entityImage('crest', '', manifest)).toBeNull();
  });

  it('trims a trailing slash on the cdn base', () => {
    const m: EntityImageManifest = { ...manifest, cdnBase: 'https://cdn.example.com/' };
    expect(entityImage('crest', 'btl_football_team_tbbbb2222', m)).toBe(
      'https://cdn.example.com/provider/crest/btl_football_team_tbbbb2222.png'
    );
  });
});

describe('entityImageKey', () => {
  it('builds a source-layered key', () => {
    expect(entityImageKey('btl', 'player', 'btl_football_player_p7e3a91c', 'webp')).toBe(
      'btl/player/btl_football_player_p7e3a91c.webp'
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
    // btl_football_competition_lb3d230cb = Premier League (resolved canonical id).
    expect(
      entityImage('competition', 'btl_football_competition_lb3d230cb', ENTITY_IMAGERY_SEED_MANIFEST)
    ).toBe(
      'https://media.breakingthelines.dev/provider/competition/btl_football_competition_lb3d230cb.png'
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
