# Entity-imagery resolver — integration note

Resolves a football entity to a CORS-clean BTL CDN URL via a three-layer
priority chain (BTL-own bespoke → gamewire-mirrored provider → monogram). See
the engineering spec `proposals/entity-imagery-system.md` and the designer brief
`design/entity-imagery-mandate.md` in the docs repo.

## Status

**Scaffold.** Pure resolver + a static seed manifest covering the onboarding
corpus. The R2 bucket name + public CDN base are OPEN decisions
(`media.breakingthelines.dev` proposed). gamewire's mirror — which fills the
`provider` layer and patches the manifest — is designed but **not yet built**, so
the seeded `provider` URLs may 404 until it runs: keep an `onError` monogram
fallback at the call site.

## Usage

```ts
import {
  entityImage,
  entityMonogram,
  ENTITY_IMAGERY_SEED_MANIFEST,
} from '@breakingthelines/design-system';

const url = entityImage('crest', 'btl_football_team_42', ENTITY_IMAGERY_SEED_MANIFEST);
// url is a CDN string, or null → render entityMonogram(label).
```

The resolver is pure: inject the manifest (fetched once at boot, or build-time
embedded). It does no I/O on the render path.

## Replacing the First Touch hotlink (follow-up PR, not done here)

`platform/app/components/first-touch/screens/crests.ts` currently builds
`https://media.api-sports.io/football/...` URLs (CORS-tainted in the page-flip
rasteriser). Rewire `crestUrlFor(kind, id, imageUrl)` to:

1. map the corpus `kind` → `EntityImageType` (`team`→`crest`, `competition`→`competition`),
2. map the corpus `id` → canonical identity entity ID (`btl_football_team_*` /
   `btl_football_competition_*`),
3. return `entityImage(type, entityId, manifest, { imageUrl })`.

The existing monogram `onError` fallback in `screen-clubs.tsx`'s `Crest`
component stays as layer 3. `screen-follow.tsx` benefits automatically. Once the
URLs are served from our bucket with CORS headers, `crossOrigin="anonymous"`
loads stop tainting the canvas.

## Keeping the manifest current

v1 is the static seed in `entity-imagery-manifest.ts`. Once the gamewire mirror
ships it patches `manifest/entity-imagery.json` in the bucket (adds `provider`);
a designer upload tool patches it when bespoke art lands (adds `btl`). At that
point, fetch the live manifest at app boot instead of importing the seed.
