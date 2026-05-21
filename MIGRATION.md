# Migrating to @breakingthelines/design-system 0.3.0

This release promotes seven composite Game Centre primitives that previously
lived in the platform repo under `app/components/game-centre/` into the
design-system at the public top-level entry. Consumers (platform, studio,
mobile, future surfaces) should now import them from
`@breakingthelines/design-system`.

## Why

The Game Centre primitives were authored inside the platform repo during the
G6 07-03 product-depth pass. They had no router or icon hard-dependency and
were always intended to be canonical primitives once their shape stabilised.
G6 07-04 promotes them so:

- studio, admin, mobile, and any future client can render the same Game
  Centre surfaces without copy-paste drift;
- the design-system continues to be the single source of truth for visual
  primitives (no Game Centre styling lives in platform anymore);
- the `FallbackReason` union, `TimelinePulseEventKind` mapping, and
  `GatedAction.mode` shape are versioned alongside the rest of the design
  system.

## The 7 primitives

| Primitive             | Before (platform)                                   | After (design-system)                  |
| --------------------- | --------------------------------------------------- | -------------------------------------- |
| `IdentityHeader`      | `~/components/game-centre/IdentityHeader`           | `@breakingthelines/design-system`      |
| `GameCentreTabRail`   | `~/components/game-centre/GameCentreTabRail`        | `@breakingthelines/design-system`      |
| `FallbackState`       | `~/components/game-centre/FallbackState`            | `@breakingthelines/design-system`      |
| `RatingSummary`       | `~/components/game-centre/RatingSummary`            | `@breakingthelines/design-system`      |
| `PredictionSummary`   | `~/components/game-centre/PredictionSummary`        | `@breakingthelines/design-system`      |
| `TimelinePulse`       | `~/components/game-centre/TimelinePulse`            | `@breakingthelines/design-system`      |
| `GatedAction`         | `~/components/game-centre/GatedAction`              | `@breakingthelines/design-system`      |

## Import-path changes

### Before — platform/app

```tsx
// platform/app/routes/_public/game/.../page.tsx
import {
  IdentityHeader,
  GameCentreTabRail,
  FallbackState,
  RatingSummary,
  PredictionSummary,
  TimelinePulse,
  GatedAction,
} from '~/components/game-centre';
```

### After — design-system

```tsx
// platform/app/routes/_public/game/.../page.tsx
import {
  IdentityHeader,
  GameCentreTabRail,
  FallbackState,
  RatingSummary,
  PredictionSummary,
  TimelinePulse,
  GatedAction,
} from '@breakingthelines/design-system';
```

The barrel keeps the same names and (for the most part) the same prop
contracts — see the breaking-changes section below for the exceptions.

## Breaking changes

### `GatedAction.mode`

The platform's earlier mode tri-state was `'auto' | 'inline' | 'modal'`.
The promoted primitive uses the canonical three-mode contract:

```ts
type GatedActionMode = 'inline' | 'sheet' | 'overlay';
```

Migration:

| Before    | After                                              |
| --------- | -------------------------------------------------- |
| `'auto'`  | Pick `'inline'` for shallow toggles, `'overlay'` for rich actions. The new primitive does not infer mode from action verb. |
| `'inline'`| `'inline'` (unchanged)                            |
| `'modal'` | `'overlay'` on desktop, `'sheet'` on mobile-first  |

### `GatedAction` no longer depends on platform hooks

The platform version internally called `useViewerActionGating()` and
`<InlineSignInCta />`. Those are platform-layer surfaces and remain in
platform. The promoted primitive accepts callbacks and slots instead:

```diff
- <GatedAction viewerAuthed={isAuthenticated} action="rate">
+ <GatedAction
+   viewerAuthed={isAuthenticated}
+   action="rate"
+   mode="overlay"
+   onRequireAuth={(action) => openSignInModal(action)}
+   signInCta={<InlineSignInCta action="rate" />}
+ >
    {button}
  </GatedAction>
```

`onRequireAuth(action)` fires when `mode === 'sheet' | 'overlay'` and the
viewer is anonymous; consumers wire it to their own sign-in modal. The
`signInCta` slot is the replacement for the implicit `<InlineSignInCta />`
render when `mode === 'inline'`.

### `RatingSummary` / `PredictionSummary` link rendering

Anchor links to club ratings routes and active prediction-league routes
now render via the design-system's existing `<LinkProvider>` context
(introduced in 0.2.x for `SiteNav` / `ProfileTabs`). The default is
`<a href>`, which works without any setup. To swap in tanstack-router
`Link`:

```tsx
import { LinkProvider } from '@breakingthelines/design-system';
import { Link } from '@tanstack/react-router';

<LinkProvider component={Link}>
  <RatingSummary ... />
</LinkProvider>
```

This change is non-breaking when the host wraps its tree in
`<LinkProvider component={...}>`. Hosts that previously relied on the
implicit `<a href>` continue to work.

### `FallbackReason` union widened to 13 values

The promoted `FallbackReason` union covers the 7 proto-mapped reasons
plus 6 platform extensions (`RPC_NOT_AVAILABLE`, `VIEWER_NOT_ELIGIBLE`,
`NO_ACTIVE_PREDICTION_LEAGUE`, `NO_RATINGS_YET`, `NO_THOUGHTS_YET`,
`LIST_RATINGS_RPC_PENDING`).

Consumers wired to the proto enum (`btl.game.v1.types.FallbackReason`)
keep autocomplete on the 7 proto reasons; the 6 extensions are accepted
but render through the primitive's own copy table. The 6 extensions are
expected to be elevated to proto in a later protos release.

### `TimelinePulseEventKind` mirrors proto exactly

The promoted union mirrors `btl.game.v1.types.football.FootballTimelineEventType`
with kebab/snake_case casing. Four synthetic kinds (`kickoff`,
`half_time`, `full_time`, `other`) remain for clock markers the consumer
synthesises.

There is no change for consumers that were already using the kebab-case
union. Consumers that mapped proto numeric tags to a different local
shape should align with the proto-to-kind mapping table in
`timeline-pulse.tsx`'s header comment.

## What did NOT change

- All seven primitives keep their previous render output (markup,
  classes, `data-slot` / `data-state` / `data-kind` attributes).
- The remaining design-system surface (`MatchHeader`, `ScoreboardChip`,
  `RatingScale`, `RatingDistribution`, `TabbedPage`, `FallbackNotice`,
  `EntityPageShell`, etc.) is unchanged.
- The `LinkProvider` API introduced in 0.2.x is unchanged.

## What to do in platform

After upgrading to 0.3.0:

1. Replace `~/components/game-centre/{Primitive}` imports with
   `@breakingthelines/design-system`. The platform's barrel-style
   `~/components/game-centre/index.ts` can simply re-export from the
   design-system to keep call-sites stable during the transition.
2. Wire `<LinkProvider component={Link} />` near the app root if the
   host wants its router primitive used for the anchor links inside
   `RatingSummary` / `PredictionSummary` (recommended).
3. Update `<GatedAction>` call sites to pass the new `mode` value and
   wire `onRequireAuth` + `signInCta` slots.

Lane D's verifier checks that the platform consumer is fully migrated
and that no game-centre primitive ships from the platform repo any more.
