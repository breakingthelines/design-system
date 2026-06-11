# Changelog

All notable changes to `@breakingthelines/design-system` are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.32.2] — 2026-06-11

### Fixed — `PredictionLeagueSelector` Base UI #31 crash (Wave 6.25b)

- The selector dropdown was rendering `DropdownMenuLabel` (Base UI's
  `Menu.GroupLabel`) as a direct child of the menu content. Opening the
  dropdown threw Base UI error #31 (`MenuGroupRootContext is missing.
Menu group parts must be used within <Menu.Group>.`) and took down
  the whole match page. Wrapped the label + option items in
  `DropdownMenuGroup` so the `Menu.GroupLabel` has the required context.
- Also fixed a stale `min-w-[--radix-dropdown-menu-trigger-width]` class
  on the menu content — that CSS variable is Radix-flavoured; Base UI
  exposes the anchor width as `--anchor-width`. The content now uses
  the right token consistently.

### Changed — `PredictionLeagueSelector` defers eyebrow to host (Wave 6.25b)

- The internal "SCOPE" eyebrow defaulted on; hosts that already render a
  `SectionHeading` above the selector ended up with two stacked
  labels. The default is now off; pass `eyebrow="<text>"` to opt back
  in. `compact` is now a no-op (kept for prop-shape back-compat).

### Changed — `PredictionsHero` drops redundant `matchLabel` on LIVE/FINISHED (Wave 6.25b)

- The LIVE clock card and the FINISHED recap card painted the short
  match label ("CF v THF") in the bottom-right. The viewer is already
  on the match page so the label was visual repetition. Both bodies
  now omit the label. The `matchLabel` prop survives on
  `PredictionsHeroProps` for external surfaces (Arena widget, etc.)
  that consume the same component shape.

## [0.26.0] — 2026-06-10

### Added — "From grade" pill on ThoughtCard (Wave 6.8)

When a user casts a GLOBAL grade with a note, game-service mirrors the
note as a Thought. Today that thought rendered as a normal note on
profile feeds + match Thought panels with no signal that it came from
a grade. The card now optionally renders a slim pill above the body
— a tiny `GradeBox` (size `xs`) + subject name + match context, with
a tap-through to the match when the host supplies a `matchHref`.

- New `ThoughtFromGrade` type on `types/content.ts`:
  `value` (BTL 1-6 inverse scale) + `subjectLabel` + optional
  `matchLabel` + optional `matchHref`. Hosts derive this from the
  proto `ContextEnvelope`'s new `rating_value` / `rating_id` fields
  (protos v0.42.0) plus the existing `subjects[]` list.
- `ThoughtItem.fromGrade` is optional — absent value preserves the
  legacy "plain thought" rendering, so legacy thoughts are unaffected.
- PRIVATE grades never reach this path; privacy is enforced upstream
  in the game-service rating fan-out, NOT by the card.
- New `FromGradePill` story under `UI/ThoughtCard`.

## [0.24.0] — 2026-06-10

### Added — Grade submission modal primitives (Wave 6.4.10)

- **`VerticalGradeScale`** (`game-centre/vertical-grade-scale.tsx`)
  Six clickable rows arranged vertically with a red-intensity gradient from
  row 1 (full BTL red) at the top to row 6 (greyed-out, ~10% opacity) at the
  bottom. Tip labels: "Excellent" anchored on row 1 and "Poor" on row 6 are
  always visible; intermediate descriptors (Very Good / Good / Satisfactory /
  Below Standard) surface on hover or selection. Selected row gets a white
  ring + slight scale-up. Built for the redesigned BTL grade submission sheet
  where the vertical axis carries the qualitative story without needing a
  "Lower is better" header. Distinct from the existing `GradeScale` composite
  (which is a horizontal row-per-grade with bar/count readouts for the Match
  Centre Ratings sub-tab).
  Props: `value?: RatingScaleValue; onSelect?: (value) => void;
disabled?: boolean; className?: string`.
  `data-direction="lower-is-better"` invariant + `data-value` per row.

### Changed — ThoughtComposer compact mode

- **`ThoughtComposer`** gained a `compact` prop and a continuous
  `onChange(text, mentions)` callback. In compact mode the composer is
  always expanded, the avatar + click-to-expand chrome is dropped, and the
  internal Post button is suppressed — the host owns submission. Built for
  the redesigned grade submission sheet so the modal's "Submit grade" CTA is
  the canonical submit while the composer is just the input surface. Default
  remains `compact={false}` so existing thoughts pages keep their behaviour.

## [0.4.0] — 2026-05-25

### Added — L1 Beta Polish primitives + FallbackReason expansion

Ten new render-only primitives covering the Arena (L3), Prediction League
(L4), Ratings Club (L5), Studio Cockpit shell (L6), Engagement Ops (L7),
and Studio Media composer (L8) lanes of the Beta Polish surface matrix.
All primitives are fetcher-agnostic and router-agnostic — routing wires
through `<LinkProvider>` like the rest of the library.

- **`PredictionFormCard`** (L4 — Prediction League composer)
  Props: `matchLabel: string; kickoffIso?: string; contextLabel?: string;
outcomePick?: 'home' | 'draw' | 'away'; onOutcomeChange?: (next) => void;
exactScore?: { home: number | undefined; away: number | undefined };
onExactScoreChange?: (side: 'home' | 'away', value: number | undefined) => void;
modules?: readonly { id: string; label: string; control: React.ReactNode;
helpText?: React.ReactNode }[]; footer?: React.ReactNode;
disabled?: boolean; className?: string`.
  Renders a fieldset/legend per pick group. `data-state="open" | "disabled"`.

- **`PredictionLeaderboardTable`** (L4 — Prediction League standings)
  Props: `title: string; eyebrow?: string;
rows: readonly (LeaderboardRowProps & { id: string; onSelect?: (id) => void })[];
totalEntrants?: number; footer?: React.ReactNode; className?: string`.
  Wraps `LeaderboardRow`. Viewer row anchor `id="leaderboard-viewer-row"`.

- **`RatingScaleSlider`** (L5 — Ratings Club composer)
  Props: `value?: RatingScaleValue; defaultValue?: RatingScaleValue;
onChange?: (value: RatingScaleValue) => void;
variant?: 'tiles' | 'slider'; eyebrow?: string;
helpText?: React.ReactNode; disabled?: boolean; ariaLabel?: string;
className?: string`.
  Supports controlled + uncontrolled. Arrow-key nav. Always exposes
  `data-direction="lower-is-better"` to hold the inverse-scale invariant.

- **`RatingDistributionBar`** (L5 — Ratings Club row + Game Centre player tab)
  Props: `counts: RatingCounts; meanValue?: number; label?: React.ReactNode;
totalOverride?: number; showSegmentCounts?: boolean;
variant?: 'stacked' | 'grouped'; className?: string`.
  Compact horizontal companion to `RatingDistribution`. Honest empty state
  via the `EMPTY_RATING_COUNTS` sentinel.

- **`RatingsClubTable`** (L5 — Ratings Club standings)
  Props: `title: string; eyebrow?: string;
rows: readonly { id: string; rank: number; subjectLabel: string;
subjectSecondary?: string; subjectImageUrl?: string;
subjectAccentColor?: string; meanValue?: number; counts?: RatingCounts;
onSelect?: (id) => void }[]; totalSubjects?: number;
footer?: React.ReactNode; className?: string`.
  Embeds `RatingDistributionBar` grouped variant per row.

- **`StudioCockpitSidebar`** (L6 — Studio cockpit shell)
  Props: `identity?: { label: string; secondary?: string;
accentColor?: string; imageUrl?: string };
sections: readonly { id: string; label: string;
items: readonly { id: string; label: string; description?: string;
href?: string; onSelect?: (id) => void; badgeCount?: number;
dot?: 'todo' | 'doing' | 'done' | 'warn'; icon?: React.ReactNode;
isActive?: boolean; disabled?: boolean }[] }[];
footer?: React.ReactNode; className?: string`.
  Polymorphic item root (anchor / button / inert div) based on
  `href` / `onSelect`. Active row uses `aria-current="page"`.

- **`EngagementOpsHeader`** (L7 — Squad Engagement Overview)
  Props: `eyebrow?: string; title: string; subtitle?: React.ReactNode;
kpis: readonly { id: string; label: string;
value: number | string | undefined; caption?: string; delta?: number;
deltaUnit?: 'count' | 'percent'; sparkline?: React.ReactNode;
higherIsBetter?: boolean }[];
windows?: readonly { id: string; label: string; isActive?: boolean }[];
onSelectWindow?: (id: string) => void; actions?: React.ReactNode;
className?: string`.
  Renders `—` for undefined KPI values (honest fallback). Delta direction
  exposed as `data-direction="up" | "down" | "flat"`.

- **`OpportunityCard`** (L7 — Studio Content Opportunities feed)
  Props: `kind: 'trending_subject' | 'prediction_swing' | 'rating_spike'
| 'thought_traction' | 'audience_question' | 'editorial_gap' | 'other';
title: string; summary?: string; score?: number;
context?: React.ReactNode;
signals?: readonly { id: string; label: string;
tone?: 'neutral' | 'positive' | 'warning'; hint?: string }[];
actions?: React.ReactNode; agoLabel?: string;
onSelect?: () => void; className?: string`.
  Priority chip derived from `score` (low < 40, medium < 75, high ≥ 75).
  Hidden when `score` is undefined — never fabricates a default.

- **`ExternalMediaPicker`** (L8 — Studio external media composer)
  Props: `kind: 'publisher_url' | 'video' | 'podcast' | 'visual';
onKindChange?: (next) => void; url: string;
onUrlChange?: (next: string) => void;
onResolve?: (url: string, kind) => void; placeholder?: string;
inputLabel?: string; previewNode?: React.ReactNode;
errorNode?: React.ReactNode; resolveCta?: React.ReactNode;
footer?: React.ReactNode; disabled?: boolean; className?: string`.
  State `idle | resolved | error` derived from `previewNode` / `errorNode`
  presence — no internal fetching.

- **`ComposerFromSourceCard`** (L7 — Studio Compose From Source)
  Props: `kind: 'opportunity' | 'thought' | 'question' | 'fixture'
| 'rating_window' | 'prediction_window' | 'subject' | 'other';
title: string; summary?: string; context?: React.ReactNode;
sourceImageUrl?: string; sourceAccentColor?: string;
signals?: readonly { id: string; label: string;
tone?: 'neutral' | 'positive' | 'warning'; hint?: string }[];
previewNode?: React.ReactNode; sourceId?: string;
actions?: React.ReactNode; secondaryActions?: React.ReactNode;
className?: string`.
  Avatar slot omitted entirely when no `sourceImageUrl` or `sourceAccentColor`.

### Changed — `FallbackReason` union expanded to 46 values

`FallbackNotice` and `FallbackState` now recognise 33 additional fallback
reasons mapped to the new proto `FallbackReason` tags (14–46) shipped in
`@breakingthelines/protos@0.15.0`. Reasons are accepted in SCREAMING_SNAKE
proto form (`FALLBACK_REASON_PREDICTION_LOCKED`), stripped form
(`PREDICTION_LOCKED`), and the canonical kebab/lowercase form used by the
library (`prediction_locked`). Every new reason ships with an honest title +
body (no invented content). New keys:

- L3 / Arena: `audience_signal_unavailable`, `eligibility_check_failed`,
  `viewer_not_in_squad`, `viewer_not_subscribed`, `viewer_role_required`,
  `squad_role_required`, `audience_window_closed`.
- L4 / Prediction League: `prediction_locked`, `prediction_not_yet_open`,
  `prediction_window_closed`, `prediction_already_submitted`,
  `prediction_match_postponed`, `prediction_league_not_started`,
  `prediction_league_archived`.
- L5 / Ratings Club: `rating_window_closed`, `rating_already_submitted`,
  `rating_not_yet_open`, `rating_match_postponed`,
  `ratings_club_archived`.
- L6 / Studio cockpit: `cockpit_section_unavailable`,
  `studio_role_required`, `cockpit_data_pending`,
  `studio_account_suspended`.
- L7 / Engagement Ops + Opportunities: `engagement_window_unavailable`,
  `opportunities_pending`, `opportunity_dismissed`,
  `opportunity_source_archived`, `composer_source_not_available`.
- L8 / Studio Media composer: `external_url_unresolved`,
  `external_video_unavailable`, `external_podcast_unavailable`,
  `external_visual_unregistered`, `external_media_rate_limited`,
  `external_media_provider_outage`.

### Notes

- All 10 primitives are exported from the package root (`src/index.ts`).
- Storybook stories added under `UI/*` for each primitive.
- No new tokens introduced — every surface uses existing CSS variables
  (`--color-grey-100/200/300/500`, `--color-red-100`, `--color-status-*`).

[0.4.0]: https://github.com/breakingthelines/design-system/releases/tag/v0.4.0

## [0.3.0] — 2026-05-21

### Added — G6 Game Centre composite primitives

Seven composite primitives promoted from the platform repo
(`platform/app/components/game-centre/*`). These sit one layer above the
0.2.0 render-only primitives and assemble the Game Centre, Arena, and
Engagement surfaces (Match pages, Player / Team / Manager / Competition
entity pages, Prediction League pages, Rating Club pages).

All are render-only and framework-agnostic. Router primitives swap in via
the existing `<LinkProvider>` context; sign-in / role-check surfaces
swap in via `GatedAction` callbacks (`onRequireAuth`) and slots
(`signInCta`, `roleHint`).

- **`IdentityHeader`** — match + entity (player / team / manager /
  competition) hero block. Composes `MatchHeader` + `ScoreboardChip` for
  match pages; renders an `Avatar`-backed hero for entity pages. Honest
  about unresolved identities (dims the crest, swaps the subtitle).
- **`GameCentreTabRail`** — generic-typed wrapper around `TabbedPage`
  that adds `badge` (number → muted pill), `hidden` (drop a tab entirely),
  and `disabled`. Generic `TabId` parameter so `onChange` yields a
  literal union, not `string`.
- **`FallbackState`** — standardised honest fallback rendered inside
  section bodies. Wraps the 0.2.0 `FallbackNotice` for the 7 proto-mapped
  reasons, plus 6 platform extensions (`RPC_NOT_AVAILABLE`,
  `VIEWER_NOT_ELIGIBLE`, `NO_ACTIVE_PREDICTION_LEAGUE`, `NO_RATINGS_YET`,
  `NO_THOUGHTS_YET`, `LIST_RATINGS_RPC_PENDING`). Exports
  `FallbackReason` as a string literal union of all 13.
- **`RatingSummary`** — aggregate rating block. Renders the viewer's
  rating, BTL average + distribution, club averages, and tagged-thought
  count. Honest empty/loading states via `FallbackState`. Caller composes
  the "Rate this" CTA via `cta` prop (typically wrapped in `GatedAction`).
- **`PredictionSummary`** — aggregate prediction block. Renders the
  viewer's pick, the home/draw/away pulse, and the list of active
  prediction leagues running on this fixture. Same honest empty/loading
  pattern as `RatingSummary`.
- **`TimelinePulse`** — vertical and horizontal timeline strips. Event
  kinds reconciled 1:1 with proto `FootballTimelineEventType`, plus four
  synthetic kinds (`kickoff`, `half_time`, `full_time`, `other`) for
  clock markers the consumer can inject.
- **`GatedAction`** — viewer-gating wrapper with three modes
  (`inline` / `sheet` / `overlay`). Anonymous viewers either see the
  inline sign-in CTA the consumer injects, or the original surface with
  clicks intercepted via `onRequireAuth(action)`. Authed-but-role-missing
  viewers see a `FallbackState` "Members only" hint (overridable via
  `roleHint`).

### Migration

Consumers that previously imported from `~/components/game-centre`
(platform repo) should now import from `@breakingthelines/design-system`.
See `MIGRATION.md` for the full path-by-path mapping.

### Notes

- The `FallbackReason` union includes 7 proto-mapped values and 6 platform
  extensions. Consumers wired to only the proto enum still get
  autocomplete on the 7 proto reasons; the 6 platform extensions are
  expected to be elevated to proto in a later release.
- `TimelinePulseEventKind` mirrors `btl.game.v1.types.football.FootballTimelineEventType`
  with kebab/snake_case casing. See the doc-comment header on
  `timeline-pulse.tsx` for the proto-to-kind mapping table.
- `GatedAction.mode` is `'inline' | 'sheet' | 'overlay'`. The platform's
  earlier `'auto' | 'inline' | 'modal'` tri-state collapses into this
  new shape: `auto` → caller-side decision, `modal` → `overlay` (default)
  or `sheet` (mobile).

[0.3.0]: https://github.com/breakingthelines/design-system/releases/tag/v0.3.0

## [0.2.0] — 2026-05-20

### Added — G6 Game Centre primitives

Eleven new render-only primitives that back the G6 07-02 Game Centre product
surfaces (Match pages, Player / Team / Manager / Competition entity pages,
Prediction League pages, Rating Club pages, the Game Centre layout engine).

All primitives are presentational: props in, JSX out. No fetching, no router
awareness, no global state. Honest about missing data — never fake-fills.

- **`RatingScale`** — BTL canonical 1-6 inverse rating scale (1 Excellent,
  2 Very Good, 3 Good, 4 Satisfactory, 5 Below Standard, 6 Poor; _lower is
  better_). Compact tile row and legend layouts. Inversion is verifiable via
  `data-direction="lower-is-better"` and accessible labels.
- **`RatingDistribution`** — histogram of the 1-6 spread with an optional
  centroid marker. Honest about empty buckets — `data-total` reflects the
  real count, `0 ratings` renders unapologetically.
- **`MatchHeader`** — masthead for a Match page (teams + score / kickoff +
  competition + venue + date), driven by status so we show kickoff for
  scheduled and score for live / finished.
- **`ScoreboardChip`** — compact live-state badge for fixture rows and
  scoreboards. `scheduled / live / half_time / finished / postponed /
cancelled` with optional clock label.
- **`TabbedPage`** — search-param tab routing wrapper. Router-agnostic;
  exports `readTabFromSearch` / `pushTabToSearch` helpers that the platform
  composes with TanStack Router's `search` validator pattern.
- **`FallbackNotice`** — renders the `btl.game.v1.types.FallbackReason` proto
  enum as an honest "data is missing" notice. Each variant (`LINEUPS_MISSING`,
  `TIMELINE_MISSING`, `RICH_ACTIONS_UNAVAILABLE`, `LIVE_SCORE_STALE`,
  `PROVIDER_OUTAGE`, `UNRESOLVED_IDENTITY`, `SETTLEMENT_PENDING`) gets its
  own copy. `UNSPECIFIED` rows are silently dropped — never invent fill.
- **`EntityPageShell`** — universal entity-page skeleton used by Player,
  Team, Manager, Competition, Prediction League, and Rating Club pages.
  Eyebrow → hero → meta → tabs → content.
- **`RatingLogRow`** — single row in a member's personal Ratings log
  (subject + match context + rating + optional rationale).
- **`PredictionPickCard`** — modular pick card. Core fields are outcome +
  exact score + result; arbitrary leagues add `modules`.
- **`LeaderboardRow`** — Prediction League leaderboard row with rank,
  rank delta (▲ / ▼ / —), member, and points.
- **`ContextSlot`** — placement slot used by the Game Centre's
  `context_slots` layout engine. Honest about `filled / pending / empty`
  states; no fake-fill.

### Notes

- Each primitive ships with a Vitest unit test that asserts the
  rendered markup (data-slots, data-attributes, copy) and the pure helpers.
- All copy is non-apologetic and avoids AI speech patterns and emdashes per
  BTL's `feedback_copy_style` memory.

[0.2.0]: https://github.com/breakingthelines/design-system/releases/tag/v0.2.0
