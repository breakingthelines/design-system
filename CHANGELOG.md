# Changelog

All notable changes to `@breakingthelines/design-system` are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.40.10] — 2026-06-12

### Changed — crest whitening rebuilt (consistent engraved monochrome)

- Logos are now whitened by a polarity-free pipeline (shared `whiten-logo.ts`):
  per-image auto-levels → multi-scale absolute high-pass → white fill capped to a
  light register + an alpha-gradient rim. A near-black mark (the Premier League
  lion) and a near-white one land in the SAME light register with their internal
  detail preserved as engraving — the washed-out silhouette+overlay is gone.
- The static DOM poster now renders crests through the SAME `whitenLogo` (drawn
  to a small canvas) so the poster matches the 3D book exactly, instead of a CSS
  mask approximation.
- No new dependency (a 2MB WASM image lib was evaluated and rejected on footprint
  / maintenance / poor fit). Limit: solid flag-band crests keep only their
  silhouette; the long-term fix for those is a mirrored mono asset.

## [0.40.9] — 2026-06-12

### Changed — logos: white silhouette + detail; iconless crests get a BTL placeholder

- Crest/logo whitening rebuilt: a uniformly-dark mark (the PL lion) can't be
  lifted by `grayscale + brightness`, so the renderer now paints a WHITE
  silhouette of the shape and blends the grayscale logo back at low opacity —
  the mark reads light while its internal lines survive as soft outlines.
  (Canvas: offscreen composite. DOM: a `mask-image` silhouette + faint overlay.)
- A crest/logo we have no art for now renders the BTL bracket mark on a faint
  tile (the "BTL placeholder") instead of bare initials. Used inside the mag
  only — the cover already drops iconless marks.

## [0.40.8] — 2026-06-12

### Changed — back CTA one line, logos brighter, slicker reader entrance

- Back-cover CTA renders on ONE line at one size (lead white, accent BTL red).
- Crest/logo monochrome brightened (grayscale brightness 2 + contrast) so dark
  marks like the Premier League lion read light instead of near-black.
- Static cover → 3D book transition: the book now settles in (scale + eased fade)
  while the poster lifts away, instead of a flat opacity swap.

## [0.40.7] — 2026-06-12

### Changed — back cover redesign + logos keep their outlines

- Crest/competition logos now render as a LIGHT MONOCHROME (`grayscale + brightness`)
  instead of a solid white silhouette — they read white-ish but keep their internal
  outlines/detail (a flat knockout erased it).
- Back cover redesigned: the cover's top-left cluster (wordmark + kicker + date),
  the tactical doodle texture, a bold closing line, and a CTA whose accent renders
  in BTL red (`BackFaceSpec` gains `kicker` / `date` / `ctaLead` / `ctaAccent`).

## [0.40.6] — 2026-06-12

### Fixed — stat face auto-fits long values

- The content `stat` face now shrinks its big value to the column width (canvas)
  / wraps it (DOM), so a long predicted side like "Bosnia & Herzegovina" fits
  instead of clipping off the page edge. A short grade still renders huge.

## [0.40.5] — 2026-06-12

### Fixed — uploaded cover not rendering in the 3D book

- The canvas image preloader now cache-busts its `crossOrigin` request. A plain
  `<img>` shown earlier (the closed-cover poster / static fallback) could cache
  the same URL WITHOUT CORS; the canvas then reused that entry, its crossOrigin
  fetch failed, and the texture silently dropped — so an uploaded cover showed in
  the DOM but never in the 3D book, regardless of size. A distinct query key
  forces a fresh CORS-clean response.

## [0.40.4] — 2026-06-12

### Changed — Issue reader: no auto-close, longer image budget

- Removed the reveal "close the book" ceremony (`ClosingCover`). The reader now
  rests on the back cover when it reaches the end; leaving is the host's explicit
  action. No more auto-fold / re-open behaviour.
- Image load timeout 7s → 10s, so a large uploaded cover photo finishes loading
  into the 3D canvas texture instead of falling back to a blank cover.

## [0.40.3] — 2026-06-12

### Changed — `PredictionsHero` copy: "on offer this match" → "on offer per match" (#133)

## [0.40.2] — 2026-06-12

### Changed — Issue reader audit fixes (cover badges, timing)

- **Flat white badges.** Club crests + competition logos now render as flat
  white marks (canvas `filter: brightness(0) invert(1)`; DOM the same) with NO
  background disc or ring, on both the cover grids and the content list. Player
  photos + user avatars keep their circular portrait treatment. Driven by
  `FaceImage.fit`: `contain` → flat white badge, `cover` → circle.
- **Slower image timeout** (2.5s → 7s) so the cover photo + crests actually
  finish loading into the 3D canvas textures on first paint, instead of falling
  back to monograms / a blank cover while the static DOM showed them.
- **Dwell on the back cover.** The reveal close ceremony now waits ~4.2s on the
  final spread before folding shut (was ~1.1s), so the last page is readable.
- Cover kicker + date pinned left-aligned in the DOM renderer.

## [0.40.1] — 2026-06-12

### Fixed — `FixtureRow` x-positions across statuses (Wave 6.34e)

- FixtureRow uses a 3-column CSS grid with fixed-width outer cells so team
  blocks line up between SCHEDULED / LIVE / FINISHED rows. (Also an oxfmt pass
  over the page-flip subtree.)

## [0.40.0] — 2026-06-12

### Changed — Issue reader is now a genuinely-3D book (BREAKING: `IssueReader` props)

- The onboarding Issue #1 reveal renders on a real react-three-fiber book
  (SkinnedMesh pages bent by a bone chain) instead of the StPageFlip CSS curl.
  Page content is a structured `FaceSpec` model drawn two ways from ONE source:
  canvas textures for the 3D book, DOM for the static (no-WebGL / reduced-motion)
  fallback. No page-curl chrome — navigation is a calm dot rail; hover darkens
  the leaf (no red glow). The owner's paper-doodle composites onto inner pages.
- New `./page-flip` exports: `FaceSpec` (+ variants), `FaceDOM`, `drawFaceCanvas`,
  `useFaceTextures`, `Book3D`, `collectFaceImageUrls`, `FACE_COLORS`, `headingFamily`.
- `IssueReader` now takes `specs: FaceSpec[]` (+ optional legacy `faces` for the
  static path) and `headingFont`; the StPageFlip-era `bookMode` / `sound` /
  `showHoverControl` / `onTurn` / `initialIndex` props are removed. StPageFlip
  (`PageFlip`) stays exported for the onboarding questionnaire.
- Cover redesigned to the matchday-programme treatment: stacked wordmark →
  `OFFICIAL FIRST TOUCH` → date (top-left), club crests (top-right), league logos
  (bottom-right), small `@handle` (bottom-left), darker legibility scrim.

## [0.39.5] — 2026-06-12

### Fixed — `ProfileTabs` wrapped to two rows on desktop and looked spread

- The `<nav>` dropped its `sm:overflow-x-visible sm:flex-wrap` classes. At and
  above the `sm` breakpoint these forced the tab strip to WRAP, so a long set
  (the profile's nine tabs, e.g. "About" landing on a second line) stacked onto
  two rows. The strip is now a single row at all breakpoints: it stays on one
  line and scrolls horizontally on overflow (`overflow-x-auto scrollbar-none`),
  with no wrapping ever.
- Each tab `<button>` dropped its `sm:min-w-[120px]`. Tabs are now content-width
  and pack tightly to the left, so short labels no longer stretch and spread
  across the row. Everything else (height, padding, radius, weight, active and
  inactive variants) is unchanged.
- No prop changes. The shared component is used by both the user profile and the
  football entity pages; fewer-tab sets now render as a clean left-aligned row.

## [0.38.7] — 2026-06-11

### Changed — `MatchHeader` venue label: bolder, tighter to xG row

- Venue label now renders `font-semibold` (was regular weight), matching the
  hero's bold typographic register (date eyebrow, team labels, xG label).
- Venue label sits closer to the xG row via `-mt-2` on its container,
  trimming the parent `gap-5` rhythm by one step at that seam only. The
  eyebrow / teams / xG cadence above is unchanged.
- No prop changes. Tests unchanged.

## [0.38.6] — 2026-06-11

### Fixed — `Image` `fallbackSrc` not firing for an SSR pre-hydration error

- The `fallbackSrc` swap is driven by the `<img>` `onError` event. On a
  server-rendered page a primary source that 404s can FINISH loading (as an
  error) before React attaches its synthetic handlers, so `onError` never
  fires and the image stayed stuck on the failed source instead of swapping
  to `fallbackSrc`.
- `imgRefCallback` already detected the cache-hit LOAD twin of this race
  (`complete && naturalWidth > 0`); it now also detects the cache-hit ERROR
  (`complete && currentSrc && naturalWidth === 0`) and runs the same failure
  path. The YouTube-retry → `fallbackSrc` swap → placeholder logic is shared
  between the event handler and the ref callback (`failOver`).
- No API change. Fixes the entity-page hero falling back to the headshot when
  a player's high-res portrait isn't mirrored (the primary 404s server-side).

## [0.38.5] — 2026-06-11

### Added — `Image` `fallbackSrc` prop (layered onError fallback)

- New optional `fallbackSrc` prop on `Image`. When the primary `src` fails to
  load, the component swaps to `fallbackSrc` once; if the fallback also fails
  it falls through to the existing `fallback` node / `BtlPlaceholder` (never a
  broken-image glyph). This mirrors the layered resolution the entity-image
  resolver uses (own art → mirrored provider → placeholder).
- The swap is implemented with an `onError` event handler plus internal state
  (no effect). The failed-source state resets whenever `src` changes, so a new
  entity always retries its primary source first. The rendered `<img>` is keyed
  on the effective source, so a failed element is replaced rather than reused.
- Off by default for back-compat — consumers that pass no `fallbackSrc` see no
  behavioural change.
- Motivating use: the entity-page right-column hero now points at the high-res
  Wikimedia portrait with the api-football headshot as `fallbackSrc`, so the
  big hero is sharp while gracefully degrading when no portrait is mirrored.

## [0.38.1] — 2026-06-11

### Fixed — `PlayerMultiSelectField` row height alignment (Wave 6.25p)

- Both row variants (`multi`/`counter`) now share a uniform `min-h-[44px]` so
  side-by-side fields keep row N aligned across the divider regardless of
  which control the row carries. The counter row's `[−] [count] [+]` controls
  (size-6 buttons) used to render the row a few pixels taller than the
  checkbox-mode row (size-5 chip), which left the Goalscorers + Bookings
  columns drifting out of alignment inside the prediction modal.

## [0.36.3] — 2026-06-11

### Added — `PlayerMultiSelectField` `searchable` prop (Wave 6.25m)

- New `searchable` prop on `PlayerMultiSelectField`. When true, the field
  renders a small search input above the roster list. Typing filters visible
  rows by case-insensitive substring on `player.name`; selections persist
  across the filter and the at-cap state is computed against the full
  selection set, not the visible subset.
- Optional `searchPlaceholder` prop overrides the default `"Search players"`.
- The search input is suppressed when `players` is empty (no search target).
- Off by default for back-compat — existing consumers see no visual change.
- Used by `SubmitPredictionSheet`'s Goalscorers + Bookings pickers, where the
  pre-XI fallback hands the modal a ~23-player squad per side and scanning
  by sight is painful.

## [0.36.2] — 2026-06-11

### Changed — MatchHeader xG label

- The xG label now reads "xG" (was rendered "XG" by a `uppercase` class) and the
  row is tighter: dropped the wide `tracking-[0.22em]` on the label and the
  desktop `sm:gap-x-6` so the values sit closer to the label.

## [0.36.1] — 2026-06-11

> `0.36.0` was published concurrently by another change; this `MatchHeader`
> work ships as `0.36.1`.

### Changed — `MatchHeader` central stack + responsive pass (Wave 6.28)

Central scoreboard column (desktop):

- The game status ("FT"/clock) is now a full-width panel matching the score
  panel, not a narrow pill. The score panel (dark, `grey-100`) and the status
  panel (lighter, `grey-300`) stack into one equal-width unit, centred label.
- The xG row swaps its emphasis: the `xG` label is now white and bold (slightly
  wider tracking), and the home/away xG values are muted grey (`text-white/55`).
- Scorers moved out of the central row into the team side-columns. Each team's
  scorers sit directly under its name + standing block (home right-aligned, away
  left-aligned), keeping the `Name - Time` + goal-icon format. The central
  `ScorersRow` is gone; each side renders its own `match-header-scorers` list
  (so two slots appear when both sides score, one when only one side does).

Responsive:

- Team names no longer clip on narrow viewports. The side columns collapse to
  zero width (`min-w-0`) and the central scoreboard keeps its width.
- Below `sm`, each side stacks vertically — crest centred above the name — so a
  long name ("Wolverhampton Wanderers") gets the full column width and breaks on
  its spaces rather than mid-word or off the edge. From `sm` up the layout
  returns to the desktop row (name beside crest, mirrored per side).
- Crest, name type, gaps and the scoreboard all shrink on narrow widths;
  standings and scorers stay readable and centre under each team on mobile.

No API change: `MatchHeaderSide.scorers` is still consumed per side, so this is
an internal layout move. `data-slot` hooks are stable (`match-header-status`,
`match-header-scorers`, `match-header-score`, etc.).

## [0.35.1] — 2026-06-11

### Changed — `PredictionStakesBadge` Wave 6.25j cleanup

- Drop the red horizontal underline added in 6.25i. The badge is now plain text
  only: `+3 pts` in BTL red, nothing else (no underline, no border, no pill).
- Switch back to `font-content` (Inter). The Monde Journal display family the
  6.25i pass tried didn't sit alongside neighbouring section headings; Inter
  with the BTL red colour carries the stake signal on its own.
- Pluralise correctly: `+1 pt` (singular) / `+3 pts` (plural) instead of
  always-uppercase `PT`/`PTS`. The `each` modifier now reads `+2 pts each` /
  `+1 pt each` with the noun pluralised against `points`.
- Drop the `flex-col` layout (was carrying the underline rule); the badge is
  now a single inline baseline-aligned row so hosts can drop it directly next
  to a section heading without extra wrapping.

## [0.35.0] — 2026-06-11

### Changed — `MatchHeader` scoreboard refresh (Wave 6.27)

- The kickoff **date line is now bold** (`text-sm font-semibold`); the
  competition stays lighter beneath it.
- The **score sits in a darker rounded panel** (`--color-grey-100`,
  `rounded-lg`). The **game status ("FT", "HT", live minute) moved out of the
  score panel into its own separate, lighter pill** (`--color-grey-300`,
  `rounded-full`) directly below the score, matching the mockup. New
  `data-slot="match-header-status"`; the score panel slot no longer carries the
  status caption.
- Scorers now read **`Name - Time`** (a muted separator between the name and the
  minute) with wider column spacing and a faint divider between the home/away
  columns.

### Added — `MatchHeaderSide.standingHref`

- The league-standing caption (`standingLabel`) can now link to the competition
  page when `standingHref` is supplied; it still omits entirely when no
  `standingLabel` is given (knockout phases / standings unavailable).

## [0.33.0] — 2026-06-11

### Added — football three-letter country codes

- `countryCode3()` + `COUNTRY_CODE3` resolve a country name to its football
  (FIFA/IOC) three-letter code ("Brazil" → "BRA", "England" → "ENG"), keyed by
  the same normalised names as `COUNTRY_ISO2`. Drives the compact nationality
  chip on entity pages.

### Changed — Inter for entity headings

- `EntityPageShell` title and the `EntityStatsSummary` "Overview" heading now use
  the sans (Inter) family instead of the display serif.

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
