/**
 * Seed entity-imagery coverage manifest (COLD-START HINT).
 *
 * This is the static, hand-maintained manifest that unblocks the resolver and
 * the designer before the gamewire mirror is built. It covers the First Touch
 * onboarding corpus (the same clubs + competitions previously hotlinked in
 * `platform/.../first-touch/screens/crests.ts`), keyed by canonical BTL
 * identity entity ID.
 *
 * NOTE ON IDs: the numeric suffix here is the API-Football id (which identity's
 * api-football resolver preserves when minting `btl_football_*` ids). Confirm
 * each id against identity (`/v1/resolve?provider=api-football&provider_id=<n>`)
 * before relying on it for bespoke art — see the mandate's "do not guess IDs".
 *
 * NOTE ON LAYERS: entries are marked `provider: 'png'` to express *intended*
 * coverage once the gamewire mirror runs. They are NOT live until the mirror
 * has actually stored the object and the bucket/CDN exist. Until then the
 * resolver will return these URLs but they may 404 → callers MUST keep the
 * monogram onError fallback. Bespoke `btl` extensions get added per entity as
 * Gab's art lands (see `design/entity-imagery-mandate.md`).
 *
 * The canonical machine-readable copy lives in the bucket as
 * `manifest/entity-imagery.json`; `entity-imagery-manifest.json` (next to this
 * file) is the checked-in mirror of this seed.
 */

import type { EntityImageManifest } from './entity-image';

/** Proposed public CDN base for the entity-imagery bucket (OPEN decision). */
export const ENTITY_IMAGERY_CDN_BASE = 'https://media.breakingthelines.dev';

export const ENTITY_IMAGERY_SEED_MANIFEST: EntityImageManifest = {
  version: '2026-06-02T00:00:00Z',
  cdnBase: ENTITY_IMAGERY_CDN_BASE,
  entities: {
    // ── Competitions (top leagues + marquee cups) ──────────────────────────
    btl_football_competition_39: { type: 'competition', provider: 'png' }, // Premier League
    btl_football_competition_140: { type: 'competition', provider: 'png' }, // La Liga
    btl_football_competition_135: { type: 'competition', provider: 'png' }, // Serie A
    btl_football_competition_78: { type: 'competition', provider: 'png' }, // Bundesliga
    btl_football_competition_61: { type: 'competition', provider: 'png' }, // Ligue 1
    btl_football_competition_2: { type: 'competition', provider: 'png' }, // UEFA Champions League
    btl_football_competition_3: { type: 'competition', provider: 'png' }, // UEFA Europa League
    btl_football_competition_45: { type: 'competition', provider: 'png' }, // FA Cup
    btl_football_competition_13: { type: 'competition', provider: 'png' }, // Copa Libertadores
    btl_football_competition_44: { type: 'competition', provider: 'png' }, // WSL

    // ── Crests (top clubs from the onboarding corpus) ──────────────────────
    btl_football_team_42: { type: 'crest', provider: 'png' }, // Arsenal
    btl_football_team_66: { type: 'crest', provider: 'png' }, // Aston Villa
    btl_football_team_49: { type: 'crest', provider: 'png' }, // Chelsea
    btl_football_team_40: { type: 'crest', provider: 'png' }, // Liverpool
    btl_football_team_50: { type: 'crest', provider: 'png' }, // Man City
    btl_football_team_33: { type: 'crest', provider: 'png' }, // Man Utd
    btl_football_team_47: { type: 'crest', provider: 'png' }, // Tottenham
    btl_football_team_34: { type: 'crest', provider: 'png' }, // Newcastle
    btl_football_team_541: { type: 'crest', provider: 'png' }, // Real Madrid
    btl_football_team_529: { type: 'crest', provider: 'png' }, // Barcelona
    btl_football_team_505: { type: 'crest', provider: 'png' }, // Inter
    btl_football_team_489: { type: 'crest', provider: 'png' }, // AC Milan
  },
};
