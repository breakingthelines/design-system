# Changelog

All notable changes to `@breakingthelines/design-system` are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
