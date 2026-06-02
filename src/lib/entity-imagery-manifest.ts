/**
 * Seed entity-imagery coverage manifest (COLD-START HINT).
 *
 * This is the static, hand-maintained manifest that unblocks the resolver and
 * the designer before the gamewire mirror is built. It covers the First Touch
 * onboarding corpus (the same clubs + competitions previously hotlinked in
 * `platform/.../first-touch/screens/crests.ts`), keyed by canonical BTL
 * identity entity ID.
 *
 * NOTE ON IDs: every key is a REAL canonical BTL identity entity ID, resolved
 * against the identity registry — NOT a provider-derived id. Canonical ids are
 * content-hashed: the suffix is an opaque hex hash (e.g. `t9d7dd08f`,
 * `l91f82788`) and NEVER the provider's numeric id. Identity's api-football
 * resolver does NOT preserve the numeric provider id in the suffix; it returns
 * the entity's own content-hashed id (the prior version of this file wrongly
 * keyed entries by the api-football number — a `team_<digit…>` suffix — which
 * the resolver never mints, so those keys resolved to nothing). Clubs were
 * resolved via `/v1/resolve?type=team&provider=api_football&provider_id=<n>`
 * (or, where the api-football crosswalk is absent, by name via `/v1/search`);
 * competitions have no api-football crosswalk and were resolved by name via
 * `/v1/search?type=competition`, disambiguated by transfermarkt/opta codes. If
 * you add an entity, resolve its id against identity first — never hand-format
 * a `btl_football_*` id (see the mandate's "do not guess IDs"). The guardrail
 * test (`entity-imagery-manifest.guardrail.test.ts`) rejects any digit-suffixed
 * `btl_football_*` literal.
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
    // No api-football crosswalk: resolved by name, disambiguated by transfermarkt/opta code.
    btl_football_competition_lb3d230cb: { type: 'competition', provider: 'png' }, // Premier League (tm GB1 / opta 8)
    btl_football_competition_ld517cd4f: { type: 'competition', provider: 'png' }, // La Liga (tm ES1 / opta 23)
    btl_football_competition_ld1f8a49a: { type: 'competition', provider: 'png' }, // Serie A (tm IT1 / opta 21)
    btl_football_competition_l91f82788: { type: 'competition', provider: 'png' }, // Bundesliga (tm L1 / opta 22)
    btl_football_competition_l55ddfaa7: { type: 'competition', provider: 'png' }, // Ligue 1 (tm FR1 / opta 24)
    btl_football_competition_l5ffc4aa2: { type: 'competition', provider: 'png' }, // UEFA Champions League (tm CL / opta 5)
    btl_football_competition_l74c9a055: { type: 'competition', provider: 'png' }, // UEFA Europa League (tm EL / opta 6)
    btl_football_competition_l0dd84076: { type: 'competition', provider: 'png' }, // FA Cup (tm FAC / opta 1)
    btl_football_competition_l9d90b1ca: { type: 'competition', provider: 'png' }, // Copa Libertadores (tm CLI / opta 420)
    btl_football_competition_lc08e0617: { type: 'competition', provider: 'png' }, // Women's Super League (fbref/fotmob/opta)

    // ── Crests (top clubs from the onboarding corpus) ──────────────────────
    btl_football_team_t8596499a: { type: 'crest', provider: 'png' }, // Arsenal F.C. (api-football 42)
    btl_football_team_t086e7f04: { type: 'crest', provider: 'png' }, // Aston Villa F.C. (by name; Villa Park, 1874)
    btl_football_team_ta544eb41: { type: 'crest', provider: 'png' }, // Chelsea F.C. (api-football 49)
    btl_football_team_td5dab25f: { type: 'crest', provider: 'png' }, // Liverpool F.C. (api-football 40)
    btl_football_team_t30ae204f: { type: 'crest', provider: 'png' }, // Manchester City F.C. (api-football 50)
    btl_football_team_t9d7dd08f: { type: 'crest', provider: 'png' }, // Manchester United F.C. (api-football 33)
    btl_football_team_tb3ba39f6: { type: 'crest', provider: 'png' }, // Tottenham Hotspur F.C. (api-football 47)
    btl_football_team_tca986041: { type: 'crest', provider: 'png' }, // Newcastle United F.C. (by name; St James' Park, 1892)
    btl_football_team_t9e0ef566: { type: 'crest', provider: 'png' }, // Real Madrid C.F. (by name; Bernabéu, 1902)
    btl_football_team_tc7e2759e: { type: 'crest', provider: 'png' }, // FC Barcelona (by name; Camp Nou, 1899)
    btl_football_team_tb354b960: { type: 'crest', provider: 'png' }, // Inter Milan (by name; Meazza, 1908)
    btl_football_team_t92aa6359: { type: 'crest', provider: 'png' }, // AC Milan (by name; Meazza, 1899)
  },
};
