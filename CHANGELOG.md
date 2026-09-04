# Changelog

All notable changes to `@breakingthelines/design-system` are documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.91.0]

### Added: a generic DataTable and PaginationFooter

The design system had three tables and every one of them knew what a row
meant: `PredictionLeaderboardTable` ranks squad members, `RatingsClubTable`
ranks players, `CompetitionStandingsTable` ranks clubs. Nothing generic. So
admin-dashboard wrote its own, in CSS Modules, and fourteen of its pages now
render `DataTable`/`DataRow` while six render `PaginationFooter`. None of that
is admin-specific work. It is the table and the pager any list surface needs.

Both are now here, and both are new exports: no existing component, style or
type changes.

**`DataTable` is a grid with declared roles, not a `<table>`.** Every surface
it backs collapses to a stacked card below `md`, and a real table cannot reflow
that way without `display: block` on its rows, which drops the implicit table
semantics in every engine. So `table` / `rowgroup` / `row` / `columnheader` /
`cell` are set explicitly and survive the reflow. The local version admin was
using declared no roles at all, and gave a clickable row `role="button"`, which
traded the table's structure for a shortcut. A `DataRow` with `onActivate` here
stays a row: focusable, Enter and Space bound, structure intact.

**The column template is a prop, not a stylesheet.** `columns` takes a
`grid-template-columns` string with a `minmax()` floor per column, published as
`--dt-columns` and read only by a `md:` utility. Below that breakpoint the grid
is one column and the header row is hidden, because there are no columns left
to head. Nothing is lost with it: a cell carrying `data-label` (or a `DataCell`
with a `label`) renders its column name above its value, where the heading
would have been.

**One element scrolls sideways and it is not the page.** The row grid refuses
to shrink past its floors, so on a narrow viewport it is wider than its
container. `[data-slot='data-table-scroll']` catches that width; the root sets
`min-w-0` so a flex or grid parent cannot be widened by it either.

**`PaginationFooter` never scrolls.** Prev and Next bracket the page numbers,
so a strip that scrolls puts both off screen as soon as there are more than
about five pages, and a suppressed scrollbar leaves nothing to say they are
there. Every strip wraps instead, no element sets `overflow`, and below `md`
each control grows to a 44px target. The page controls are a `nav` with a name,
each page button is labelled and the current one carries `aria-current="page"`,
and the per-page control is a keyboard-navigable listbox rather than a div that
opens on click.

**`buildPageList` ships with it.** The eliding page-list builder was copied into
all six admin pages, character for character in two variants. Its behaviour is
unchanged, including the case where a gap stands for a single hidden page; that
is pinned by a test rather than quietly corrected during a move.

**Tokens only, so both themes resolve.** The local version was written against
a dark tool and hardcoded `#1f1f1f`, `#2b2b2b`, `#807c7c`, `#ffffff`. These use
`bg-card`, `border-border`, `bg-muted`, `text-muted-foreground` and
`text-foreground`, so the same markup is correct under `.dark` and without it.
A test asserts no literal colour reaches the rendered markup.

### New exports

| Export                                                                                      | What it is                                           |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `DataTable`                                                                                 | The table surface: column template, headings, rows   |
| `DataRow`                                                                                   | One row, optionally activatable                      |
| `DataCell`                                                                                  | One cell, with the optional mobile caption as a prop |
| `PaginationFooter`                                                                          | Total, page controls, per-page selector              |
| `buildPageList`                                                                             | The elided page list to hand it                      |
| `dataTableVariants`, `dataTableRowVariants`, `dataTableHeaderVariants`                      | cva helpers                                          |
| `paginationFooterVariants`, `paginationControlVariants`                                     | cva helpers                                          |
| `DataTableDensity`, `PaginationPage`, `PaginationFooterDensity`, `PaginationControlVariant` | variant and value unions                             |

## [0.89.0]

### Fixed: profile social links no longer pass link equity

`ProfileHero` rendered each social link with `rel="noopener noreferrer"` —
which is to say **dofollow**. A profile link is free text that any account can
point anywhere, so every public profile was a backlink anyone could mint by
signing up: no article, no editorial review, and no moderation surface in the
way. It is the cheapest version of the thing an SEO placement pays for.

The links now render `rel="ugc nofollow noopener noreferrer"`. `ugc` marks
them as user-generated and `nofollow` withholds the equity; the existing
noopener/noreferrer pair is unchanged, so the tab-nabbing defence is intact.

**No authorised exception.** An article body has one — a publisher can be
trusted to link out editorially — but a profile link is never editorial. It is
a self-declared URL, identical in kind whoever supplies it, so this applies to
every account including first-party ones. A trusted account loses nothing that
mattered: nobody links their own X profile for the PageRank.

## [0.87.0]

### Fixed: search inputs now match accent-insensitively

A viewer reported that searching "joao" in the goalscorers picker found
nothing, because the match-day squad carries "João Pedro" exactly as the
provider ships it and the filter was a raw `toLowerCase().includes()`. Most
keyboards make reproducing the diacritic anything from awkward to impossible,
so the row was effectively unreachable.

Three components had their own copy of that filter, and all three had the
defect. It was never specific to the player picker:

- **`PlayerMultiSelectField`** filtered `player.name`. This is the reported
  bug. Goalscorers and bookings are the pickers it backs.
- **`CollaboratorDropdown`** filtered `user.name`. Same defect on the same
  kind of data, people's real names, one component family over.
- **`FilterModal`** filtered `option.label`. Those labels are club,
  competition and country names, so "Atlético Madrid", "Bayern München" and
  "Deportivo La Coruña" were all unreachable without the accent.

Every other component that takes a query delegates matching to the host
(`GifPicker`, `FilterBar`, `MentionPlugin`, `ThoughtsPanel` and the panels
that pass through to it), so none of them could carry this bug and none are
touched.

**Both sides of the comparison are folded, never just one.** The new
`foldForSearch` in `lib/search-match.ts` decomposes to NFD, strips the
Combining Diacritical Marks block (U+0300..U+036F) and lower-cases. Folding
only the candidate would let "joao" find "João Pedro" while breaking the
viewer who does type "João"; folding only the query would do the reverse.
With both folded the two spellings collapse onto the same key and either
input finds the player.

It is deliberately not a slug. Punctuation, spaces and apostrophes survive, so
"N'Golo" and "A. Alexander-Arnold" keep matching on the substrings a viewer
actually types. Letters that are their own codepoint rather than a base plus a
combining mark (ø, ß, ł, đ) pass through unchanged and still match themselves.
`lib/country-flags.ts` keeps its own stricter normaliser, which does strip
punctuation, because that one builds a lookup key for a fixed table rather
than matching free text.

Folding is for matching only. Nothing here changes what is rendered: rows keep
the real, accented name.

Names that differ by more than a diacritic still do not match each other, so
"miller" does not find "Müller". Names whose accent is their only
distinguishing feature become mutually reachable rather than unreachable: a
query for either spelling surfaces both rows and the viewer picks by sight.
That is the direction a substring search should move in. It widens what
matches and never hides a row the old behaviour would have shown.

### Added: `matchPlayer` on `PlayerMultiSelectField`

An optional predicate, `(player, query) => boolean`, consulted only when
`searchable` is on and the query is non-empty. The default is unchanged
behaviour for everyone who does not pass it.

The row already carries `jerseyNumber` and `caption`, and the component
deliberately searches neither. Until now a host that wanted either had no way
to say so and would have had to fork the component, which is not hypothetical:
platform forked exactly this component when the accent bug had no other
remedy. The escape hatch is a predicate rather than a list transform on
purpose, so an override cannot reorder, duplicate or fabricate rows. Ordering
and the selection and cap invariants stay owned by the component, and an empty
query short-circuits to "show everything" before the predicate is consulted,
so a faulty matcher cannot break the rest state.

`FilterModal` and `CollaboratorDropdown` get no equivalent prop. Nothing has
asked for one, and the correct default is now in place for both.

### Added: `foldForSearch` and `matchesSearchQuery` exports

Both are exported from the package root. A consumer that owns its own search
input can fold identically to the design system instead of writing a fourth
copy of the same normalise-and-strip, and a host supplying `matchPlayer`
composes with `matchesSearchQuery` rather than reimplementing it.

### Notes

- Twelve unit tests cover the fold and the matcher in the node project, both
  directions of the reported bug plus the non-match cases.
- Three stories drive the real components in the browser project: the picker
  with a squad containing "João Pedro", the collaborator dropdown, and
  `FilterModal`, which had no stories at all before this. Each types the
  unaccented query, then the accented one, then an unaccented control name,
  then a near-miss on a different base letter. `FilterModal` option rows gained
  `data-slot="filter-modal-option"` and `data-value` so they can be asserted
  on, matching the data-slot convention the rest of the package already uses.
- Mutation-verified in both directions. Reverting the fold inside
  `foldForSearch` fails six of the twelve unit tests and all four story tests.
  Reverting only the picker's filter back to `toLowerCase().includes()`, with
  the helper left intact, keeps every unit test green and fails the picker's
  two story tests alone, which is what proves the story is load-bearing on the
  wiring rather than on the helper.
- `@base-ui/react/dialog` joined `optimizeDeps.include`. `FilterModal`'s new
  stories are the first in the suite to reach the dialog primitive, and on a
  cold cache Vite re-optimised it mid-run and broke in-flight dynamic imports.
  Same reason `@lexical/react/LexicalTypeaheadMenuPlugin` is already there.

## [0.86.0]

### Fixed: the bottom `Sheet` now clears the keyboard on tablets too

0.85.0 fixed the keyboard covering the bottom sheet, and scoped itself to
phone widths on the reasoning that desktop has no on-screen keyboard. That is
true of desktop and false of tablets. An iPad has an on-screen keyboard and a
viewport well above `sm` — as does a phone held in landscape — so the original
bug survived there untouched, on the one variant the fix never looked at.

**The gate was the bug, not the arithmetic.** `occluded = innerHeight −
visualViewport.height − visualViewport.offsetTop` was already platform-
agnostic and is unchanged. What sat on top of it was `useIsMobile()`, which
conflates "narrow viewport" with "has no keyboard". It is now gated on whether
an occlusion is actually **reported**:

- A device with no on-screen keyboard never reports one. Its two viewport
  heights agree and `offsetTop` is zero, so the residual is zero and the
  correction is a no-op **by construction** — the same way the Android case
  has always resolved itself, where `innerHeight` shrinks in lockstep and the
  residual comes out zero. Desktop is now inert by arithmetic rather than by
  assumption, which is the claim the breakpoint was only ever a proxy for.
- Every open bottom sheet subscribes, at any width. Nothing runs while a sheet
  is shut, and `Sheet` no longer calls `useMediaQuery` at all.
- The 20px noise floor does real work in the newly-covered environment. A
  classic horizontal scrollbar is inside `innerHeight` and outside
  `visualViewport.height`, so a desktop page reads a standing residual of its
  thickness — 17px at the widest in common use, under the floor. (The sheet
  also locks `body` overflow while open, so the scrollbar is gone for the
  whole window in which this is read.)

**`sm` is a different sheet, and is handled as one rather than waved through.**
It is a floating card, not a flush panel, so two things needed their own
answer:

- **The 24px offset is composed with, not replaced.** The raised card sits the
  same `sm:bottom-6` clear of the edge the user can _see_ that a resting one
  sits clear of the bottom of the screen. Substituting the occlusion for the
  offset would flatten the card onto the top of the keyboard exactly when the
  keyboard is up, which reads as a bug rather than a fix.
- **The `sm` height cap has an `sm` equivalent.** It keeps the same 90% share
  of the visible viewport the flush variant takes, still under the card's own
  `720px` ceiling, and additionally yields to the room actually left above the
  gap. That last clamp is not hypothetical: a phone in landscape is above
  `sm`, and with a keyboard up its visible slice can be short enough that 90%
  of it plus the gap no longer fits — without it the card's header is pushed
  off the top of the visible area, which is the same class of bug one
  breakpoint over.

Both are derived in `sheet-viewport.ts` with the rest of the arithmetic, and
ride two more custom properties whose fallbacks are `1.5rem` and
`min(90dvh,720px)` — character for character the values they replace. A
resting card at any width is unchanged, and the correction stays exactly
reversible.

**The desktop story changed deliberately.** It used to shrink the visual
viewport by a keyboard's worth at desktop width and assert the sheet did not
move; that was a proof of the `sm` gate, and the gate is what this removes.
Keeping the assertion would have been keeping the bug. It now asserts the
thing that is still true and now load-bearing — a faithful desktop visual
viewport reports nothing, so nothing is written — plus the scrollbar-noise
case. The tablet reading it used to stand in for is asserted for real in
`Bottom — floating card clears the keyboard at sm and up`.

Real desktop **pinch-zoom** is the one non-keyboard thing that can make a
browser report a residual, and it will now move the sheet. This was already
true on mobile from 0.85.0 and is not new behaviour so much as newly reachable
at width; the result is the sheet tracking the edge of the visible area, which
is what a `position: fixed` element ought to do when the user has zoomed away
from it. It is not stubbed in any story.

Fourteen mutations, each caught: the eight from 0.85.0/0.85.1 (mutation 6 now
inverted — _reinstating_ a breakpoint gate is the failure), plus leaving
either `sm:` utility uncomposed, replacing the gap instead of composing with
it, dropping either the containment clamp or the card ceiling, and comparing
only the flush pair for equality. Two new stories drive `window.visualViewport`
at a real 820x1180 tablet viewport and measure `getBoundingClientRect()`: the
raised card moves by exactly the occlusion with its 24px gap intact and its
height down from 720 to 704, survives three cycles deep-equal, and is still
dismissable by drag from the raised position; and the Android reading, where
both viewports shrink together, must not move it.

## [0.85.1]

### Fixed: `Sheet` no longer crashes where `matchMedia` is not implemented

0.85.0 regression. The keyboard fix gated itself on `useIsMobile()`, and
`useMediaQuery` called `window.matchMedia` unguarded inside an effect. jsdom
does not implement `matchMedia`, so any consumer mounting a `Sheet` in a jsdom
test threw on mount:

```
TypeError: window.matchMedia is not a function
```

Studio's suite went from green to 10 failures on the bump. It was latent for
every consumer, not specific to studio — platform passed only because its
tests never mount that path. `useMediaQuery` had been in the package since
long before, but no design-system component had ever called it, so 0.85.0 was
the release that made it reachable.

- `resolveMediaQueryList` now returns `null` instead of throwing for the three
  real shapes: no `window` at all, a `window` with no `matchMedia`, and a
  partial stub whose answer has no boolean `matches`.
- Subscribing is guarded too. The polyfill commonly pasted into test setups is
  `() => ({ matches: false, addListener() {}, removeListener() {} })`, which
  answers the query but has no `addEventListener` — so the legacy pair is used
  where it is the only one present, and a list offering neither is read once
  rather than crashed on. Guarding only the call would have moved the crash
  one line down.
- **An unevaluable query reports `false`**, so `useIsMobile` reports desktop.
  That is already this hook's answer for "cannot evaluate yet" — the state
  initialises `false` and only consults `matchMedia` in an effect, a contract
  `Sheet` and the editor's `PlayerPickerSurface` both lean on — so
  "cannot evaluate ever" now gives the same answer rather than introducing a
  second rule. It is also the inert branch: desktop `Sheet` subscribes to
  nothing and writes no inline style, where mobile would switch on
  visual-viewport tracking in exactly the environment that has no
  `visualViewport` either. And it is the conservative one: layout is decided
  by CSS, this hook only gates a JS correction on top, so `false` leaves the
  stylesheet in charge exactly as it was before 0.85.0.

`window.visualViewport`, which jsdom also does not implement, did NOT have the
same hole — it was guarded in 0.85.0 and still is. That is now proven rather
than asserted: a story drives a real mobile media query with `visualViewport`
removed, so the tracking effect is genuinely enabled and reaches the guard,
and deleting the guard fails it with
`Cannot read properties of undefined (reading 'height')`.

Two new stories, both mounting `Sheet` for the first time inside the test
rather than merely revealing it — `useMediaQuery`'s effect runs once per
query, so a sheet mounted while `matchMedia` still existed never reaches the
crash, and a first draft that rendered it up front passed against the
unguarded code. One removes `matchMedia` and `visualViewport` together and
asserts the sheet renders, carries its content, writes no inline override and
still closes. The other removes `visualViewport` alone at a real phone width.
Nine unit tests cover the resolver in the node project, where `window` is
genuinely absent.

No behaviour change where the APIs exist: the eight mutations covering the
keyboard fix and these guards all still fail as intended.

## [0.85.0]

### Fixed: the bottom `Sheet` sits above the on-screen keyboard instead of under it

Reported on a phone against the editor's lineup player picker: tapping a slot
opens the picker, the picker's search field takes focus, and the keyboard is
drawn straight over the sheet. It is not specific to that picker — every
bottom sheet with an input in it had the same bug, including the comment
thread sheet.

The sheet is `position: fixed; bottom: 0`, which anchors it to the LAYOUT
viewport, and iOS never shrinks the layout viewport for the keyboard — only
the VISUAL viewport, the part the user can see. `max-h-[90dvh]` does not help
either: `dvh` tracks browser chrome, not keyboards. So the sheet stayed
exactly where it was and the keyboard covered it.

`Sheet` now sizes and positions the phone-width bottom variant against the
visual viewport, via `window.visualViewport`.

- **The lift is derived from the residual, not from the keyboard.** What gets
  measured is the strip of the layout viewport the user cannot see:
  `innerHeight - visualViewport.height - visualViewport.offsetTop`. Lift the
  sheet by that and its bottom edge lands on the bottom edge of the visible
  area.
- **It cannot double-compensate.** Chrome on Android defaults to
  `interactive-widget=resizes-content`, which shrinks the layout viewport, so
  `bottom: 0` is already clear of the keyboard there — and `innerHeight`
  shrinks in lockstep with `visualViewport.height`, making the residual zero
  and the correction a no-op. Same expression on both platforms, no
  user-agent branch. (Neither platform nor studio sets `interactive-widget`,
  so both get their browser's default, and both defaults are handled.)
- **`offsetTop` is part of the expression, not an afterthought.** iOS pans the
  visual viewport to reveal a focused field, which shrinks the strip below it
  without resizing anything; dropping the term over-lifts by the pan.
- **The sheet also shrinks.** Lifting alone would push its top off the screen,
  so its height is capped at the same 90% share it always took — of the
  VISIBLE viewport now, rather than the dynamic one.
- **`env(safe-area-inset-bottom)` is dropped while the keyboard is up.** iOS
  keeps reporting the home-indicator inset once the keyboard covers the
  indicator entirely, so leaving it in reserved ~34px of dead space at exactly
  the moment vertical room was scarcest.
- **Exactly reversible.** Nothing is written to the panel's inline style
  unless something is genuinely occluded — the overrides ride CSS custom
  properties whose fallbacks are the old values — and readings below a 20px
  noise floor are ignored, so sub-pixel disagreement between the two
  viewports cannot drift the sheet a pixel per event.
- **Untouched above `sm`.** The floating `bottom-6` card, and every desktop
  viewport, keep the geometry they have today; the tracking never runs there,
  and no listener is attached while a sheet is closed.
- Drag-to-dismiss is unchanged. The lift rides `bottom` on the panel, the
  drag rides `transform` on the inner wrapper, and no pointer handler was
  added, moved or re-gated.

The arithmetic is pure, DOM-free logic in `sheet-viewport.ts`
(`sheet-viewport.test.ts`, 24 tests), same discipline as `sheet-drag.ts`. New
`UI/Sheet` stories drive `window.visualViewport` directly in a real browser
and measure the panel's `getBoundingClientRect()`: that it rises by exactly
the occluded height on iOS, that it does not move at all on the Android
reading, that it returns to identical geometry over repeated keyboard cycles,
and that a desktop-width sheet ignores the whole thing.

## [0.84.0]

### Fixed: the `@`-mention typeahead flips above the caret instead of opening off-screen

`MiniEditor`'s mention menu always opened downward. With the composer at the
bottom of the viewport — the shape both of today's new surfaces have, studio's
task Activity bottom sheet and the editor's inline comment thread — it opened
past the bottom edge. Measured in a bottom sheet at 390x780: caret at y=716,
menu 226px tall, 166px of it off-screen and unclickable, and unreachable too
since `Sheet` locks page scroll while open.

Lexical's `LexicalTypeaheadMenuPlugin` does have a flip branch, but it is
unreachable for a composer this size. Its guard asks whether the menu would
fit above the caret _within the contenteditable root_:

```js
top - rootElementRect.top > menuHeight + height
```

A `MiniEditor` root is ~60px tall, so that difference is at most a line or
two — 25px available against 245.5px required in the case above — and the
branch never runs, no matter that 716px of viewport sat unused directly above.

- The menu now opens above the caret when it does not fit below, and stays
  below whenever it does fit (a flip the user did not need is a surprise).
- When it fits on neither side — a short viewport with the caret mid-screen —
  it opens on the roomier side and clamps to that room, scrolling internally.
  A clamped menu is entirely reachable; an overflowing one puts options past
  an edge where they cannot be clicked at all.
- A final clamp keeps the box inside the viewport even when the _caret_ is
  outside it, which happens when a short window is resized with the composer
  scrolled below the fold.
- Placement is decided from the MENU's measured height. Lexical pins the
  anchor element's inline height to the caret box (19.5px against a 226px
  menu), so anything read off the anchor describes the caret, not the menu.
- No visible jump: the menu is laid out but hidden on its first frame and
  placed in a layout effect, before the browser paints. Verified by sampling
  every animation frame from the moment it enters the DOM — one painted
  state, already correct.
- The decision itself is pure, DOM-free logic in `typeahead-placement.ts`
  (`typeahead-placement.test.ts`, 28 tests), including a sweep that asserts
  the menu never leaves the viewport at any caret position, on or off screen.
- No transition is attached to the flip, so there is nothing for
  `prefers-reduced-motion` to gate — deliberately: animating a correction to
  a position the user has not seen yet has nothing to communicate.
- Layering is unchanged. The menu is still a positioned `z-[100]` element
  above the `z-50` `Sheet` backdrop and panel; `absolute` replaces `relative`,
  both positioned, so the fix from Wave 6.4.15b still holds.

New story `MiniEditor > Mentions in a bottom Sheet` puts the composer on the
viewport floor inside `Sheet side="bottom"`, so this stays checkable.

## [0.83.0]

### Added: `Sheet` supports `side="bottom"` — a real bottom sheet, not a stretched drawer

`Sheet` only slid from the left or right. A chat-style thread (studio's task
Activity panel) needs a bottom sheet instead: near-full-height, rounded top
corners, drag-to-dismiss.

- New `side="bottom"`: slides up to `90dvh` (capped at `min(90dvh, 720px)` on
  `sm:` and wider, where it also becomes a centered `max-w-lg` floating card
  with a `bottom-6` gap, instead of stretching edge-to-edge) — desktop gets
  the same primitive, not a mobile-only special case. Rounded top corners
  (`rounded-2xl` all round once floating at `sm:`), safe-area-bottom inset on
  the scrollable body so content clears the home indicator.
- Drag-to-dismiss, gated on scroll position: a gesture that starts on the
  scrollable body only arms into a dismiss-drag when that body has no
  remaining upward scroll (`scrollTop <= 0`). If there's scroll left, the
  pointerdown handler captures nothing and native scroll handles the
  gesture untouched — scroll wins, not dismiss. A dedicated grab handle is
  exempt from that gate, matching every native bottom-sheet affordance. The
  arbitration is pure, DOM-free logic in `sheet-drag.ts` (`sheet-drag.test.ts`,
  11 tests) so the load-bearing rule is verified directly, not just eyeballed.
- Respects `prefers-reduced-motion` (via framer-motion's `useReducedMotion`)
  for both the open/close transition and the drag-release snap-back.
- The page's own scroll is locked while any `Sheet` is open (all sides) —
  a near-full-height bottom sheet leaves a sliver of the page visible on
  purpose, and without the lock that sliver competes with the sheet for the
  gesture.

## [0.82.0]

### Fixed: the social icon is derived from the link's URL, not the stored platform

The 0.81.0 mapping was correct but it trusted `link.type`, and the stored
platform is not trustworthy. user-service persists the enum without validating
it and blind-casts it back on read, so any client can put any value on any row —
and most did. Of the 37 production links that claim X, 26 point somewhere that
is not X: YouTube channels, LinkedIn profiles, Instagram accounts, a Pinterest
board and a long tail of plain company websites, all rendering the X logo.

- New `resolveSocialLinkType(url, storedType?)` and
  `resolveSocialLinkIcon(url, storedType?)` resolve a link URL-first.
  `ProfileHero` now uses them, and `data-platform` reports the resolved
  platform rather than the stored one.
- Matching is on the parsed host with an optional `www.`, never on a substring
  of the raw URL — `notyoutube.com` is not YouTube, and a path containing the
  word "instagram" is not Instagram. Known hosts: `x.com`/`twitter.com`,
  `bsky.app`, `youtube.com`/`youtu.be`, `instagram.com`, `tiktok.com`,
  `linkedin.com`.
- A readable URL decides both ways. A known host gives that platform; a
  readable URL on any other host resolves to `website`, _not_ to the stored
  platform — if the link were X it would be on `x.com`. This is what makes a
  platform the enum has no member for (Pinterest, Facebook, Reddit) degrade to
  the globe instead of inheriting a junk enum.
- The stored platform is consulted only when nothing can be read from the value
  at all — a bare handle like `@name`, or empty/garbage input — where it is the
  single remaining signal. A malformed or relative URL never throws.
- `SocialLinkType`, `socialLinkIcon` and the new resolvers moved to
  `#/lib/social-links` and are still exported from the package root, so
  existing imports are unchanged. `socialLinkIcon(type)` is kept for callers
  that have already resolved a platform; prefer `resolveSocialLinkIcon` wherever
  a URL is available.

## [0.81.0]

### Fixed: profile social links render the right logo

- `ProfileHero` picked its social icon with a single `link.type === 'x'`
  ternary, so every platform except X fell to the generic `LinkSimple` chain
  icon — including `bluesky`, which was already in the type union. Icon
  selection is now a lookup keyed by platform.
- `SocialLink['type']` is widened and exported as `SocialLinkType`:
  `x | bluesky | youtube | instagram | tiktok | linkedin | website`. The named
  members mirror the picker studio offers (plus LinkedIn) so the compose and
  read surfaces agree on which logo represents a platform.
- The fallback is now `Globe`, not `LinkSimple`. Anything unrecognised — an
  unspecified platform, or a value that slips past the type, which the profile
  API permits because it does not constrain the stored enum — renders the globe.
- New export `socialLinkIcon(type)` resolves the same icon outside the hero, so
  surfaces like platform's profile About tab stop keeping their own copy of the
  decision.
- Each link now carries `data-slot="profile-hero-social-link"` and
  `data-platform`.

## [0.75.0]

### Changed: Inter across every typographic role

- `--font-display` and a new `--font-serif` now resolve to Inter, matching the
  new Figma foundation (file `e5dghsmu54gH7g6KumhS0Q`). This flips roughly 130
  `font-display` / `font-serif` usages across platform, studio and this package
  in a single token edit rather than a per-file sweep.
- The typekit `@import` **stays**. Two surfaces still offer an explicit serif
  opt-in and both name the family inline rather than reading the token, so the
  face must remain loaded: the editor's game-block font picker
  (`GAME_BLOCK_FONT_FAMILY`) and page-flip's `HeadingFont`
  (`src/page-flip/faces/face-spec.ts`).
- Type scale from the Figma variables: H2 28/500, H3 20/600, H4 16/600,
  H5 14/600, H6 12/400, P3 14/400·18, Captions 12/400·18, Caption Bold 12/600·16.

### Changed: 4px controls / 8px surfaces radius scale

- `--radius` `0.45rem` → `0.5rem`, so sm/md/lg/xl land on 4/6/8/12px.
- `--radius-btl-sm` `2px` → `4px`, which carries the editor's 46 usages.
- `Button` was `rounded-none` on the base and on four size variants → `rounded-[4px]`.
- Literal `rounded-[2px]` → `rounded-[4px]` package-wide.
- Dropdowns are split by role instead of swept flat: the popup is a surface and
  takes 8px, its rows are controls and take 4px. Applies to both `site-nav` and
  `dropdown-menu`.
- Oversized media radii (`rounded-[10px]`) → 8px.
- Pills and avatars are untouched — `rounded-full` already matches the Figma's
  `rounded-[99px]`, and the nav's liquid-glass treatment is deliberately kept
  over the flat `#151515` the static mock shows.

### Changed: `AmbientEmitter` is more subtle

- The glow was dominating pages it was meant to sit behind. Preset opacity drops
  about 30% (sm `0.25`→`0.18`, md `0.32`→`0.22`, lg `0.4`→`0.28`) and center mode
  stops over-boosting its gradient base (`×1.2`→`×1.0`, `saturate(1.5)`→`1.3`).
- Luminance adaptation, the analysis cache and the mount fade-in are unchanged,
  so dark images keep their automatic boost.

### Fixed: the Le Monde serif never actually loaded

- Code across four repos asked for `le-monde-journal-std`, which the typekit kit
  does not publish — it ships `lemonde-journal`, `le-monde-journal-std-2` and
  `le-monde-livre-std`. Every reference fell through to a generic serif, so the
  "classic" heading option in programme issues has never rendered Le Monde.
- Now `lemonde-journal`: the journal cut, and the only journal cut with a real
  700 weight. Verified in Chromium against a bare-`serif` baseline —
  `le-monde-journal-std` measured identically to `serif` (unresolved), while
  `le-monde-journal-std-2` measured the same at 400 and 700 (no true bold).

## [0.74.0]

### Fixed: `ThoughtCard` — header meta row no longer overflows at narrow mobile widths

- The author header row (display name + tier badge + @handle + timestamp) had
  no shrink/truncation mechanism: every part was `whitespace-nowrap` with no
  `min-w-0`, so at narrow widths (320–430px) a long display name pushed
  `@handle` and the timestamp off the right edge of the content column
  instead of wrapping or truncating.
- Fix is scoped to the name only, since it's the one field of unbounded
  length: the name's wrapping flex group (`div.flex.items-center.gap-1`,
  holding the name + verified check + tier badge) gains `min-w-0`, and the
  name element itself switches from `whitespace-nowrap` to `truncate`. That
  combination is what lets the flexbox shrink algorithm assign all of the
  available shrink to the name (down to an ellipsis) while every sibling
  that doesn't opt in (tier `Badge`, `VerifiedBadge` — both already
  `shrink-0` in their own component styles) keeps its natural size and never
  disappears. `@handle`/timestamp are unaffected — they only stop overflowing
  because the name no longer forces them off-screen, not because they
  changed.
- Desktop is untouched: `min-w-0` and `truncate` are no-ops whenever there's
  enough room, so nothing changes above the mobile breakpoint.
- Measured in Storybook (new `Header — mobile overflow (320/375/430)` story)
  against the content column at 320/375/430px, before vs after, using both
  the reported repro (short name, still enough combined meta to overflow)
  and a deliberately long display name: before, overflow ranged up to
  ~200px past the column's right edge; after, 0px overflow (or negative,
  i.e. comfortably fits) at every width, in both cases, with the "Line
  Breaker" tier badge fully visible throughout.

## [0.73.0]

### Fixed: `ThoughtComposer` — Post stayed disabled for a card-only thought (block, no typed text)

- `canSubmit` was gated on `hasText` (`text.length > 0`) OR a GIF/image
  attachment — a thought carrying ONLY a host-inserted block (Lineup / Game
  Stats / any StatsBomb viz, via `extraNodes`) has zero typed characters, so
  Post stayed disabled with no way to post a card-only thought.
- `MiniEditor`'s `onChange` now reports a second argument, `isEmpty`: true
  only when the root has neither text NOR a non-text (decorator/block) child.
  A card-only editor state is `text === ''` but `isEmpty === false`.
- `ThoughtComposer` now derives its content-gating state from `isEmpty`
  (`hasEditorContent`) instead of `hasText.length`; `hasText` itself is
  unchanged and still drives only the remaining-chars counter's visibility.
  Inserting a block with no caption now enables Post; an entirely empty
  composer still keeps it disabled.

## [0.72.0]

### Changed: `ThoughtCard` — game/decorator blocks render full-bleed to the card edges

- A rendered thought carrying a game block (lineup / game-stats / StatsBomb
  viz) previously showed the block inset by the card's content-column gutter
  (avatar column + horizontal padding), so it had side margins. It now spans
  the full thought-card width, edge to edge — matching the full-width composer
  (0.70.0). The thought's TEXT/caption keeps its normal inset; only the block
  bleeds.
- `ThoughtBody` gains an optional `blockClassName` prop, applied to a wrapper
  around each host (`blockRenderers`) block only — never around text
  paragraphs. Omitted → the block renders as a bare fragment, exactly as
  before (no DOM change for callers that don't bleed, e.g. `ThoughtComment`
  and raw `ThoughtBody`).
- `ThoughtCard` passes `blockClassName="-mr-4 -ml-[76px]"`: the content column
  is inset by the left gutter (`px-4` 16 + avatar 48 + `gap-3` 12 = 76px) and
  `px-4` (16px) on the right, so those negative margins pull the block back out
  to both card edges. Measured in Storybook: block spans the full card width
  (0px from each edge), text paragraph stays inset (76px left / 16px right),
  no horizontal overflow.

## [0.71.0]

### Changed: `Popover` — forward `collisionAvoidance` + `collisionPadding`

- The `Popover` primitive now forwards `collisionAvoidance` and
  `collisionPadding` to the base-ui popover, so a host (the game-blocks menu)
  can tune how the panel shifts/flips to stay on-screen.

## [0.70.0]

### Changed: `ThoughtComposer` (non-compact) — avatar moved to a header row, content goes full-width

- The main composer now leads with a header ROW: the avatar (36px) plus the
  viewer's display name and `@handle`, left-aligned. Below it, the text input
  and anything inserted into the editor (a lineup / game-block card) span the
  FULL composer width — the avatar no longer opens a ~62px left side-gutter
  that squeezed embedded blocks into a narrow right column.
- New optional props `displayName` and `handle` feed the header. When neither
  is supplied the header is the avatar alone (still full-width content), so
  existing avatar-only callers keep working. Pass `handle` without the `@`.
- Footer simplified to a standard full-width composer footer: media toolbar at
  the left content edge, count + Post pushed right with `ml-auto`. This drops
  the whole avatar-gutter apparatus the last three fixes were about
  (`max-w-[460px]` cap → `w-fit`/`flex-wrap` → `pl-[62px]` wrap-alignment):
  with no gutter there is nothing to align to. `flex-wrap` stays only as an
  overflow guard — on a very narrow Pro composer (~≤340px, four toolbar icons
  - count + Post can't share a line) the count+Post cluster drops to its own
    line and `ml-auto` keeps it right-aligned. Measured: no horizontal overflow
    and no overlap at 320/375/430/600px in both free (3-icon) and Pro (4-icon)
    configs; the editable surface now spans the full content width (e.g. 542px
    inside a 600px composer, vs ~482px with the old gutter).
- Compact mode (the grade-submission sheet) is untouched — the redesign is
  gated to `!compact`, and compact keeps its headerless, full-width
  `justify-between` split.

## [0.67.0]

### Fixed: `ThoughtComposer` wrapped footer line was not indented under the toolbar

- 0.66.0 fixed the dead gap by making the footer row shrink-to-fit and wrap.
  But the avatar-clearing `pl-[62px]` indent still lived on the inner toolbar
  div only, so when the row wrapped, the count+Post line started from the
  card's far-left content edge while the toolbar icons above it were indented
  62px. "497 Post" sat left of the icons instead of under them.
- Moved the `pl-[62px]` indent from the inner toolbar div onto the outer
  footer row (non-compact only), so both flex children share one indent.
  Single-line layout is unchanged (the toolbar still starts 62px in, and the
  count/Post positions are byte-identical, measured); when the row wraps, the
  count+Post line now starts from the same indented edge and drops directly
  under the icons.
- Measured (wrapped states, count's left edge vs the first toolbar icon's
  left edge): 320px free, 320/375/430px Pro all wrap with a 0px delta, the
  count sits exactly under the first icon. Non-wrapped 600px is unchanged
  from 0.66.0. Compact mode untouched (indent change is `!compact`-gated).

## [0.66.0]

### Fixed: `ThoughtComposer` footer still had a dead gap below ~460px, after 0.65.0

- 0.65.0 capped the footer row at `max-w-[460px]` so `justify-between` had less
  width to spread across on wide composers. That only ever shrinks the row:
  on any composer narrower than 460px, which is every real mobile width and
  several real desktop widths too, the cap never engages, so
  `justify-between` still spread the toolbar and the count+Post cluster
  across the row's full (uncapped) width, gap unchanged. Reported again on
  prod at a ~430px composer.
- The width of the row was never the problem. `justify-between` distributes
  space across whatever width the row is forced to stretch to, and no
  max-width removes that distribution below the cap, or stops it from
  reopening on hosts wider than 460px (confirmed up to ~1112px on the
  sidebar-less entity Thoughts tab). Replaced the cap with `w-fit`: the row
  now sizes to its own content (toolbar + `gap-4` + count/Post), so the two
  clusters sit only `gap-4` apart at any host width. `flex-wrap` is the
  fallback for hosts too narrow to fit both clusters on one line, e.g. the
  Pro-tier `composerActions` slot on the ~343px `/thoughts` mobile composer,
  where the count+Post cluster now drops to its own line under the toolbar
  instead of forcing a squeeze. `justify-between` stays in the class list
  for both branches; it has nothing left to distribute once the row no
  longer stretches past its content.
- Measured via new Storybook stories (`Footer - {320,375,430,600}px,
{free,Pro} tier`) at every combination: toolbar-to-Post distance is
  12-16px everywhere, whether as a single-line gap or as the vertical gap
  between two wrapped lines. Never a dead gap, at any width or tier.
- Compact mode (the grade-submission sheet) is untouched, still gated by
  the same `!compact` guard.

## [0.65.0]

### Fixed — `ThoughtComposer`: large dead gap in the footer row before Post

- The bottom row (toolbar icons + char-count + Post) used `justify-between`
  across the full composer width. With only 3-4 sparse icons on one side and
  a compact count+Post cluster on the other, this stretched an awkward, very
  visible empty gap between them on any wide host composer (e.g. the
  `/thoughts` feed composer) — worse the wider the composer got.
- Fixed by capping the row's width (`max-w-[460px]`, non-compact only) so
  `justify-between` distributes space within a bounded strip instead of the
  full card width: toolbar stays left, count+Post stay grouped tight to its
  right, any leftover width becomes harmless trailing space past Post rather
  than a gap between the two clusters. Capping only ever shrinks the row
  from its previous full-stretch size, so mobile (already narrower than the
  cap) and every other width below 460px render byte-identical to before —
  verified against the `submit-rating-sheet` compact-mode consumer (its own
  narrow split layout, no Post button, left untouched via the `!compact`
  guard) and the `/thoughts` desktop + mobile composer live on prod.

## [0.64.0]

### Fixed — `SiteNav`: signed-in header overflowed at 320px, worse on content pages with "Go back"

- DS 0.61.0/0.62.0 made the mobile signed-in actions cluster byte-identical
  to desktop (Search / Docs / Notifications / Create / Account, all always
  shown) — this fit down to ~375px but not 320px, and a content page (which
  also renders a "Go back" pill in the same row via `onGoBack`) overflowed
  even at 375px: measured 40.43px past the viewport with the full cluster.
  Added a priority-based responsive collapse, context-aware on whether
  `onGoBack` is set (`isCompact = onGoBack != null` — derived internally
  from the existing prop rather than a new one, so it can't drift out of
  sync with what's actually on screen): Search / Notifications / Avatar
  never drop; Docs (lightbulb) is the first to hide (`min-[320px]` default /
  `min-[440px]` compact); the "Create" pill swaps its text for a "+" glyph
  below 375px (same frosted pill container at every width — the owner
  explicitly wanted the pill's visual treatment preserved, not a shrink to a
  bare icon square); `GoBack` gained an `iconOnly` prop (chevron only, no
  label, `aria-label` still carries the accessible name) that `SiteNav`
  toggles below `min-[400px]`.
- Every threshold was measured (Storybook + Playwright, not guessed) against
  the real rendered natural widths of every cluster item at 320/360/375px —
  see the `site-nav.tsx` `GO_BACK_ICON_ONLY_CLASSNAME` doc comment for the
  full derivation. Two measured deltas worth flagging: (1) a content page's
  "Go back" costs ~100px of left-side width vs. the bare logo, not the
  ~50-80px originally estimated; (2) because of that, Go-back only returns
  to its labeled form at 400px, not the ~360px originally estimated — at
  375px, re-labeling it (with Docs already hidden and Create already "+")
  would overflow by 16.43px. Confirmed clean (zero overflow, positive
  margin) at all 6 required combinations (320/360/375 × with/without
  "Go back").

## [0.63.0]

### Fixed — `PredictionLeaderboardPanel`: rank-1 viewer opened hidden above the fold; scroll snapped back on re-render

- Traced a residual report that a rank-1 (top of the leaderboard) viewer's
  own row opened scrolled just out of view, with rank 2 reading as the
  first visible row. Root cause: the viewer-centring `useLayoutEffect`
  reads `row.offsetTop` assuming it's relative to the scroll container, but
  neither the container nor the `<ol>` between it and the rows set a CSS
  `position`, so both stayed `static` and `offsetTop` resolved all the way
  to `<body>` — the row's distance from the top of the PAGE, not the list.
  A mid-pack viewer's resulting target was still in-range so it silently
  over-scrolled instead of erroring; a rank-1 (or rank-2) viewer's target
  came out small-but-positive instead of negative, so the `Math.max(0, …)`
  clamp no longer caught it. Fix: the scroll container is now `relative`,
  making it the row's `offsetParent` so `offsetTop` is genuinely
  list-relative. Verified with live DOM measurements in Storybook — a
  rank-1 viewer now opens at `scrollTop=0` (rank 1 pinned at the top), a
  rank-60 viewer centres within a fraction of a pixel of true-centre.
- Folds in a second, previously-unreleased fix: the same effect's one-shot
  guard keyed on the sliced `visibleEntries` array reference, so a host
  that re-renders on a timer (the league hub's per-second "Kickoff in"
  countdown) handing back a brand-new-but-equal `entries` array re-ran the
  centring on top of any manual scroll — any reader who scrolled away from
  their own row got snapped back within a second. Re-keyed on the viewer's
  rank + handle instead, so an equivalent re-render is a no-op.

## [0.62.0]

### Changed — `SiteNav` avatar: drop ring/border, shrink 24px → 20px

- The Account-trigger avatar (`ACCOUNT_AVATAR_CLASSNAME`) no longer inherits
  the shared `Avatar` primitive's `ring-background` + mix-blend-darken
  after-border. Both exist in `avatar.tsx` to cut an avatar out from a
  busy/bright backdrop (avatar stacks, profile hero, thought cards) — set
  against the 0.61.0 header's frosted `bg-white/10` pill, the ring read as a
  hard black ring hugging the pill's edges (owner feedback). Neutralised
  locally (`ring-0 after:border-transparent`) on this one consumer only; the
  shared primitive and every other consumer are untouched.
- Avatar size drops `size-6` (24px) → `size-5` (20px), giving it visible
  clearance from the pill edges now that the ring isn't filling that space.

### Changed — `SiteNav` mobile actions cluster: parity with desktop

- Mobile compose trigger swaps the bare circular "+" icon button for the same
  "Create" text pill desktop uses (`CREATE_PILL_CLASSNAME`, shared constant)
  — the "+" read as an unrelated control next to the boxed
  search/notif/avatar buttons.
- Mobile Account trigger is wrapped in the same frosted pill as desktop
  (`ACCOUNT_TRIGGER_CLASSNAME`, shared constant) and gains the `CaretDown`
  glyph — previously a bare, unboxed 34px avatar, taller than the cluster's
  other 32px buttons.
- The lightbulb "Docs" icon (0.61.0 was desktop-only) now shows on both
  breakpoints — owner call for exact parity between the two clusters; the
  mobile hamburger's About > Learn row is a harmless duplicate path, same as
  Search already was.
- Actions-cluster gap opens to `8px` on mobile (`gap-[8px] sm:gap-[4px]`, was
  a flat `4px`) — the same five items at 4px read as squished on a narrow
  screen.

### Added — hover polish on the actions cluster (reduced-motion aware)

- Search and Notifications get a spring "pop" on hover (`IconPop`: tilt +
  scale for Search, lift + scale for Notifications) instead of a static color
  swap.
- The Docs lightbulb crossfades from an outline glyph to a BTL-red filled
  glyph with a soft glow on hover ("switching the bulb on"), via
  framer-motion variant propagation.
- The "Create" pill opts into the existing global `data-shimmer="brand"`
  hover sweep (already used on the `BtlWordmark`) instead of a bespoke
  effect.
- All of the above route through `useReducedMotion()` — under reduced
  motion, elements fall back to the plain background/text hover transitions
  only, with no scale/tilt/crossfade.

## [0.61.0]

### Changed — mobile logged-out header: Search moved into the hamburger

- On mobile, the logged-out top bar packed **Search / Log in / Sign Up /
  hamburger** into one row — too tight, and `Log in` in particular had almost
  no touch target next to the boxed `Sign Up` button. `Search` (text control)
  is now `hidden` on mobile and shown only at `sm:` and up; a `Search` item
  was added to the top of the mobile hamburger (logged-out only — signed-in
  mobile already has its own persistent Search icon, so it isn't duplicated
  there).
- `Log in` gains mobile-only vertical padding (`py-2.5`, matching `Sign Up`'s)
  so it has a proper tap target using the space Search vacated;
  `sm:py-0` reverts it to the original bare-text link on desktop, which is
  otherwise unchanged.

### Changed — `SiteNav` signed-in header restyle (Figma 719-5697)

- The signed-in actions cluster (desktop) is restyled to match Figma
  719-5697: `Search` and `Notifications` become 32px frosted icon slots
  (`bg-white/5`, `rounded-[4px]`, 14px glyph) instead of bare 22–24px icons;
  the actions cluster gap tightens from `gap-4` (16px) to the spec's `4px`
  (the boxed icons supply their own visual separation, so the wider gap is no
  longer needed).
- Compose's desktop trigger changes from a circular ＋ icon button to a
  labelled **"Create"** text pill (`rounded-[4px]`, `bg-white/10`,
  `border-white/5`, `backdrop-blur`); the dropdown it opens is unchanged.
  Mobile keeps the compact circular ＋ trigger (unchanged) — a wider text
  pill would fight the mobile-conscious goal of not growing the already-busy
  mobile action row.
- The Account-dropdown avatar trigger (desktop) is wrapped in the same
  frosted pill as Create and gains a `CaretDown` glyph next to a smaller
  (24px, was 34px) avatar, so it reads as a dropdown trigger rather than a
  plain avatar. Mobile avatar trigger is unchanged (bare 34px avatar). The
  legacy `avatarMenu` fallback path (superseded by the Account dropdown,
  documented as legacy, not used by platform) is untouched.
- New: a lightbulb "Docs" icon (`Lightbulb` from `@phosphor-icons/react`,
  external link) in the signed-in actions cluster, between Search and
  Notifications — desktop only. It reuses the existing `learnHref` prop (the
  same destination the logged-out cluster already shows as "Learn" text) so
  both auth states share one source of truth; the consumer no longer needs to
  gate `learnHref` to logged-out only. Not shown on signed-in mobile: the
  mobile hamburger's tabs already include an About > Learn row pointing at
  the same destination, so a 6th icon on the mobile action row would
  duplicate it rather than add anything.
- `Search`/`Notification` icon glyphs are unchanged (reused the existing
  `SearchIcon`/`NotificationIcon` — Figma's exported assets are the same
  glyphs redrawn at a different scale). `CaretDown` and `Lightbulb` are
  Phosphor icons (exact name + glyph match to the Figma export), consistent
  with how the Account dropdown already sources its row icons.

## [0.60.0]

### Fixed — duplicate "Learn" in the logged-out mobile hamburger

- On mobile, the logged-out hamburger showed "Learn" twice: once as the About
  tab's child (rendered inline with the tab's other children) and again as a
  separate standalone logged-out item (added in 0.58.0). Removed the standalone
  item so "Learn" appears exactly once — under About.
- Desktop is unaffected: the logged-out top-bar cluster still shows its "Learn"
  text link (driven by `learnHref`), and About's "Learn" child is unchanged.

## [0.59.0]

### Changed — mobile logged-out Search is now text; per-tab dropdown header

- The logged-out header's Search control is now the **"Search" text** control
  at every viewport (mobile + desktop), sitting left of Log in — the mobile
  magnifying-glass icon is gone. Mobile logged-out top bar now reads:
  `[Search] [Log in] [Sign Up] [hamburger]`, all text/button. (The search icon
  is still used for the signed-in header.)
- `NavTab` gains an optional `menuHeader?: string`. When set, that tab's
  dropdown renders a section header (12px Inter Medium, dimmed `grey-500/70` —
  the same style as the compose/Account headers) with a tight header→list gap.
  Omit it for a headerless dropdown. The DS default/story fixtures set the
  Media tab's `menuHeader` to **"Watch & Listen"**; About stays headerless.

## [0.58.0]

### Fixed — mobile logged-out header: de-duplicated controls, Log in moved to top bar

- On mobile, the logged-out hamburger menu duplicated **Search** and **Sign Up**
  (both already in the top bar). Removed **Search**, **Sign Up**, and **Log in**
  from the collapsed menu — it now shows only the nav tabs + **Learn** (which has
  no top-bar equivalent).
- **Log in** now renders as a text link in the mobile top bar, immediately left
  of the Sign Up button (same `onLoginClick` handler and text styling as the
  desktop header). Mobile logged-out top bar now reads: `[Search icon] [Log in]
[Sign Up] [hamburger]`.
- The **Search icon** now shows in the mobile top bar when logged out (it was
  previously signed-in only); desktop logged-out still uses the "Search" text
  control. No desktop changes.

## [0.57.0]

### Fixed — compose + Account dropdown rows were not clickable

- Rows in the compose ("Create Content") and Account dropdowns did nothing on
  click. Root cause: each row's link/button was rendered with
  `display:contents` (`className="contents"`), so the anchor/button generated
  no box and was effectively non-interactive — the visible padded area was the
  wrapper `<div>`, which isn't a link.
- Fix: the link/button is now the full-size clickable row — the row layout
  classes (`flex`, gap, `rounded`, padding, `w-full`, `cursor-pointer`) live on
  the `LinkComponent`/`<a>`/`<button>` itself. The outer `<div>` is kept only
  as a measured wrapper (ref + hover tracking + z-order), so the sliding hover
  highlight still works and the visuals are unchanged (210px widths, py-6
  rhythm). No `display:contents` on interactive elements anymore.
- The Account "Studio" row keeps `target="_blank"` (opens in a new tab).

## [0.56.0]

### Changed — one consistent, tighter dropdown vertical rhythm

- All SiteNav dropdowns now share one tight vertical rhythm so they read as a
  family. Only verticality changed — widths (compose/Media/Account `w-[210px]`,
  About `w-[317px]`), colors, icons, and copy are all unchanged.
- Icon rows (compose, Media, Account) are uniformly `py-[6px]` (Media was
  `py-[7px]`), so the three read equally tight.
- About title + description rows drop from `py-[16px]` to `py-[8px]` (tighter
  between-item spacing) and the title↔description gap goes to `gap-[0px]`, so
  the description sits flush under its title (their line-heights supply the
  separation) and each pair reads as one tight block.
- Header→list gap stays tight + consistent (`gap-[4px]`) on the headered
  panels (compose "Create Content", Account).

## [0.55.0]

### Changed — `SiteNav` logged-out Sign Up button corners

- The logged-out header's solid-red "Sign Up" button now has square corners
  (`rounded-none`) instead of `rounded-[4px]`. Everything else is unchanged:
  same size (`px-4 py-2.5 text-xs`), `bg-red-100`, white text, links to
  `signUpHref` (e.g. `/register`).

### Changed — compact compose + Account dropdowns

- The compose ("Create Content") and Account dropdowns adopt a `compact`
  treatment (the reference for a tight nav dropdown): tighter row padding
  (`py-6` vs `py-7`) and a tighter header→list gap (`gap-4` vs `gap-8`), so
  they read short/crisp vertically. Media rows stay `py-7`, no header.
- Fixed panel widths per spec: compose / Media / Account = `w-[210px]`;
  About = `w-[317px]` (wider so its 14px descriptions stay on one line).
- Every interactive dropdown row now has `cursor-pointer`; disabled rows
  (compose "Soon") use `cursor-not-allowed`.
- The section header ("Create Content" / "Account") is nudged slightly dimmer
  (`text-grey-500/70`) so it reads as a quiet caption, not an item.
- Unchanged: the flowy subtle sliding hover, 12px `grey-500` labels, 14px
  icons, and the 12px Inter Medium header.

### Changed — solid dropdown/popover backgrounds + mobile logged-out menu

- All SiteNav dropdown/popover panels are now a solid `grey-200` (`#151515`)
  to match the new nav dropdowns: removed the glassy `bg-grey-200/90` +
  `backdrop-blur-xl` from the legacy avatar menu (desktop + mobile), the
  mobile hamburger panel, and the mobile notification popover container.
  (The always-visible tab-bar capsule keeps its own translucency.)
- Fix (regression from 0.54.0): the logged-out mobile hamburger menu now
  includes Search / Learn / Log in / Sign Up (→ `signUpHref`). They were only
  in the desktop `hidden sm:flex` cluster, so mobile users couldn't reach them.

## [0.54.0]

### Changed — `SiteNav` dropdown restyle (compose, nav tab submenus, Account)

- Every SiteNav dropdown — the compose (＋) panel, the Media/About nav-tab
  hover submenus, and the Account avatar-hover menu — now shares one panel
  (`NavDropdownPanel`), per Figma 2941-11302 ("Create Content") / 3010-11985
  ("Media") / 3010-12052 ("About") / 3009-11910 ("Account") and the "On"
  states 3010-12001 / 3010-12102: a flat `grey-200` panel (`#151515`, 4px
  radius, 8px padding, 8px gap). Each panel grows to fit its content (`w-max`)
  over a modest per-panel min-width for breathing room — About widest
  (`min-w-320px`), Media/Account a touch narrower (`min-w-248px`), compose
  hugs its content. Rows come in two shapes:
  - **icon + label** (compose, Media, Account): a 14px leading icon + 12px
    `grey-500` label, `py-7`, `gap-8`, `pl-8 pr-16`.
  - **title + description** (About): a 12px `grey-400` (`#ccc4c4`) title over
    a 14px `grey-500` description, `py-16`, `gap-8`, `pl-8 pr-16`, no icon.
    Resting titles stay `grey-400`; only the hovered title goes white.
    Descriptions stay `grey-500` always.
- Headers: only the compose ("Create Content") and Account ("Account") panels
  keep a 12px `grey-500` section header — the Media/About panels omit it (the
  tab already names them). Header row is `pl-8 pr-16 py-8`.
- Row hover reuses the middle-nav tab MOTION: a SINGLE highlight that springs
  (`PILL_SPRING`) vertically to the hovered row — the tabs' flowy slide/morph
  — rather than an independent per-row `:hover` background. Its appearance is
  a subtle 5% white fill + 5% white 1px border (`rounded-[4px]`), not a bright
  glass. The hovered row's icon + label brighten to white; resting rows stay
  muted. Replaces the compose panel's 0.53.0 glass/gradient.
- Disabled rows (compose "Soon") grey to `grey-300`, pin a 10px red-100
  "Soon" badge right, and aren't hoverable (the highlight skips them).
- `NavTab`'s `children` items gain optional `icon?: React.ReactNode` (mirrors
  `ComposeItem.icon`; fixed 14px slot) and `description?: string` (renders the
  title + description row; takes precedence over `icon`). Additive.

### Added — `SiteNav` Account dropdown (logged-in avatar hover)

- When logged in, hovering the avatar opens an "Account" dropdown (Figma
  3009-11910) built from the shared panel: Profile (Phosphor `UserCircle`),
  Studio (`Hammer`, opens in a new tab), Log out (`SignOut`, an action row).
- New props: `profileHref?: string`, `studioHref?: string`, `onLogout?: () =>
void`. Supplying any enables the Account dropdown (it takes precedence over
  the legacy `avatarMenu`). `NavDropdownPanel` rows gain an optional
  `onSelect?: () => void` for button/action rows (e.g. Log out).

### Changed — `SiteNav` logged-out (public) header restyle

- The logged-out header (no compose/bell/avatar) now renders a text-based
  public actions cluster instead of a lone red "Login" button: **Search**
  (text, not the signed-in search icon), **Learn**, **Log in**, and a
  solid-red **Sign Up** button (`bg-red-100`, white text). The button keeps
  the old Login button's dimensions (`px-4 py-2.5 text-xs`) but with
  `rounded-[4px]` corners rather than a pill. The tabs keep their existing
  active pill highlight.
- New props: `learnHref?: string` (renders the "Learn" link) and
  `signUpHref?: string` (renders the "Sign Up" button, e.g. `/register`).
  `onLoginClick` now drives the "Log in" text control, and `onSearchClick`
  renders as the "Search" text control when logged out (still the icon when
  signed in). All additive; omitting a prop hides that control.

## [0.53.0]

### Changed — `SiteNav` compose (＋) dropdown restyle

- The compose menu's dark panel now has its own dedicated visual language
  instead of the shared uppercase About/avatar menu chrome: a near-black
  (`#0d0d0d`) rounded-14px panel, a "Create Content" header, ~44px icon +
  label rows with a top-lit glass gradient highlight on hover, and disabled
  rows (Newsletter, Visuals) greyed out with a red "Soon" badge pinned to
  the right instead of just dimmed text.
- `ComposeItem` gains an optional `icon?: React.ReactNode` so hosts can pass
  a leading glyph (e.g. a Phosphor icon) per content type; `SiteNav` stays
  icon-set-agnostic and just renders whatever the host supplies. Additive
  and backward-compatible — existing `composeItems` without `icon` still
  render (icon slot is simply omitted).

## [0.52.0]

### Added — editor-aware `composerActions` + `MiniEditor` `onEditorReady`

- `MiniEditor` gains an optional `onEditorReady?: (editor: LexicalEditor) => void`
  prop. It fires once with the underlying Lexical editor when the composer
  mounts (via a tiny internal plugin inside the `LexicalComposer`), letting a
  host dispatch commands / insert nodes into the editor from outside the
  Lexical context.
- `ThoughtComposer`'s `composerActions` slot now also accepts a render function:
  `React.ReactNode | ((editor: LexicalEditor | null) => React.ReactNode)`. The
  composer captures its inner editor (via `onEditorReady` on the mounted
  `MiniEditor`) and passes it to the function, so a host-provided action-row
  button (e.g. a game-blocks menu next to the emoji button) can insert nodes
  into the composer's editor.

Additive and backward-compatible: the plain-`ReactNode` `composerActions` usage
and existing `MiniEditor` callers are unaffected.

## [0.51.0]

- ThoughtCard + ThoughtComment forward the `blockRenderers` prop to their inner
  ThoughtBody, so host-injected block nodes render read-only in the feed/panels.

## [0.50.0]

### Added — host-injected custom Lexical blocks in the thought composer

- `MiniEditor` gains an optional `extraNodes?: Array<Klass<LexicalNode>>` prop.
  The classes are registered on the Lexical editor alongside the built-in
  `MentionNode`, so a host can define its own block/decorator node types and
  have them round-trip through the composer.
- `ThoughtComposer` forwards `extraNodes` and `plugins` through to its inner
  `MiniEditor` (both the compact and non-compact editors), and adds a
  `composerActions?: React.ReactNode` slot rendered in the action/toolbar row
  next to the built-in media controls — the slot a host uses to add its own
  insert button (e.g. a tier-gated "Lineup" button).
- `ThoughtBody` gains an optional
  `blockRenderers?: Record<string, (node) => React.ReactNode>` prop. When a
  top-level serialized block's `type` matches a key, that renderer draws the
  block read-only instead of the default paragraph; paragraph/text/mention
  rendering is unchanged.

Together these let a host inject custom Lexical block nodes into the thought
composer and render them read-only, without design-system taking a dependency
on them. Additive and backward-compatible: existing callers are unaffected.

## [0.47.0] — 2026-06-30

### Added — Discord link in `SiteFooter`

- `FooterSocialLink['platform']` now accepts `'discord'`, mapped to a `DiscordLogo`
  icon. The default socials include the BTL community server
  (`discord.gg/RKsPDwjfJa`) alongside X, LinkedIn, and YouTube.

## [0.46.0] — 2026-06-30

### Added — penalty-shootout winner marker on `MatchHeader` + `FixtureRow`

- A tie decided on penalties can now mark the winner with an optional
  `penaltyWinner?: 'home' | 'away'` prop on both `MatchHeaderProps` and
  `FixtureRowData`. The scoreline stays the drawn result (e.g. 1–1); a small red
  superscript "p" renders next to the winning side's score (`1–1ᵖ`).
- The marker is a visual glyph only (`data-slot="*-penalty-marker"`,
  `aria-hidden`). On the header, the score's `aria-label` spells out
  "{winner} won on penalties" so assistive tech doesn't read a bare "p". On the
  fixture row, callers should carry the equivalent wording on the row's own
  label. Omitting the prop leaves both surfaces unchanged.

## [0.45.0] — 2026-06-30

### Changed — `FixtureRow` centres the kickoff time on upcoming rows

- Upcoming (not-yet-played) fixture rows now render the kickoff time in the
  **centre** slot — the same column the score occupies on played rows — so the
  matchup reads symmetrically: `home · time · away`. Previously the time sat in
  the far-left lead cell with an empty placeholder in the centre, which left a
  visual void between the two teams and pulled the names off-axis from the
  score rows above/below them in a mixed list.
- The lead cell is now an empty, width-reserved spacer on upcoming rows (the
  grid still reserves its column), so mixed FT/live/upcoming lists keep every
  team block at the same x-position. Played rows (live/result) are unchanged.
- The upcoming centre cell carries `data-kind="kickoff"` on the
  `fixture-row-score` slot; no score digits or dash are ever emitted there, so a
  scheduled fixture cannot leak a fabricated "0 - 0". Replaces the former
  `FixtureScorePlaceholder`.

## [0.43.1] — 2026-06-25

### Fixed — inverted Pro / Line-Breaker tier badge colors

- The tier badge on thought surfaces (`ThoughtCard`, `ThoughtComment`, and
  `AuthorLine` via `tierVariantMap`) had its colors backwards: Pro showed the
  loud brand red and Line Breaker (the top tier) showed a muted gray outline.
  Now Line Breaker gets the tinted brand red and Pro is muted, matching
  `ProfileHero`. Added a `tintedBrand` `Badge` variant as the single source of
  the Line-Breaker treatment (`ProfileHero` now uses it too, dropping its inline
  classes).

## [0.42.7] — 2026-06-19

### Added — Pro / Line-Breaker tier badge on thought authors

- `ThoughtCard` and `ThoughtComment` now render the author's tier as a `Badge`
  beside the name, reusing `AuthorLine`'s `tierVariantMap` (now exported). `Pro`
  → solid, `Line Breaker` → outline; `Free`/absent → no badge. The comment badge
  carries `dark` so the outline stays legible on the black Thoughts panel.

### Fixed — panel timestamps link to the thought permalink

- `ThoughtComment` renders `createdAt` as a `Link` to `thought.permalinkHref`
  (with a plain-text fallback), matching `ThoughtCard`.

## [0.41.16] — 2026-06-16

### Fixed — `GoBack` renders in Inter, not the serif display face

- `goBackVariants` carried `font-display`, which resolves to
  `'le-monde-journal-std', Georgia, serif`. Every `GoBack` (platform `SiteNav`
  back button, studio back bar, membership backs) was rendering in a serif.
  Swapped to `font-sans` (`'Inter'`); `font-bold` and all other classes
  unchanged.

## [0.40.18] — 2026-06-12

### Changed — cover falls back to the page doodle texture

- A cover with no photo (no upload, no auto-picked hero) now paints the same
  tactical-doodle page texture the inner spreads use (`paintBase`), instead of a
  flat dark plate. Canvas + DOM. The profile programme card inherits it — it
  renders the cover face.

## [0.40.15] — 2026-06-12

### Fixed — book occasionally blank until a nudge; + arrow-key paging

- The 3D book could render blank after the static poster until an interaction.
  Cause: drei `Environment` (studio HDR) suspends, and with no Suspense boundary
  it blanked the whole Canvas until a re-render (an arrow press). The Environment
  is now isolated in its own `Suspense`, so the book paints immediately and the
  HDR lighting pops in when ready. Frameloop pinned to `always`.
- Left/right arrow keys now flip pages on desktop (once the book is up).

## [0.40.14] — 2026-06-12

### Added — `PredictionLeaderboardPanel` bounded height + viewer-anchored window (Wave 6.34o)

- The row list now lives inside an internal scroll container (`max-h-[480px]`,
  ~10-12 rows comfortably). The column header (RANK / PLAYER / PTS) sticks
  to the top of the scroll area; the `pendingNote` footer stays OUTSIDE the
  scroll region as a panel-level affordance. Short leaderboards still
  collapse to content height — only longer lists hit the ceiling.
- New optional `viewerWindowSize?: number` prop. When set, the panel slices
  the entries to a viewer-anchored window of that many rows total: ~half
  above + half below the viewer, clamped at the top/bottom of the list.
  When the viewer isn't on the leaderboard (signed-out / non-member), the
  panel falls back to the top `viewerWindowSize` rows. The viewer row is
  scrolled into view (`block: 'center'`) on mount so the user lands looking
  at their own slot. Off when undefined — back-compat for story consumers.

## [0.40.13] — 2026-06-12

### Changed — crisp logos (source-res whitening) + staggerable stat faces

- `whitenLogo` now processes at the source crest's OWN resolution (capped) and
  the caller scales the result into the layout box, instead of pre-shrinking the
  crest to the small on-page size and re-enlarging it (which pixelated the
  engraving). High-quality downscale on the face canvas. Note: provider crests
  are only 150px, so very large on-page sizes are still source-limited.
- Content `stat` faces gain `align: top | center | bottom`. Two stat faces shown
  as a spread (the first-call + first-grade pages) can now stagger vertically so
  their big values don't bunch at the gutter.

## [0.40.12] — 2026-06-12

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

## [0.40.11] — 2026-06-12

### Fixed — `FixtureRow` keeps the kickoff time on one line (#136)

## [0.40.10] — 2026-06-12

### Changed — `PredictionLeaderboard` PLAYER eyebrow flushes with the avatar (#134)

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
