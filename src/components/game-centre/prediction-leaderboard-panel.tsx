'use client';

import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionLeaderboardPanel (Wave 6.25a · 6.25f polish · 6.34o bounded window
 * · 6.34p tight avatar+@handle cluster)
 *
 * Merged "Your standing" + "Active prediction leagues" panel, scoped to ONE
 * selected league. Replaces the duplicated standing-card grid + leagues
 * strip the Predictions sub-tab carried through Wave 6.5.
 *
 * Wave 6.25f polish:
 *   - Tightly-packed standings-table rhythm (Rank · Player · Pts header eyebrow,
 *     `divide-y` rows, `py-2.5 px-3` row padding).
 *   - Two-line player cell: `@handle` primary, `displayName` secondary — pulls
 *     the displayName off the host-projected `userName` field and renders it
 *     only when it adds information (i.e. isn't an `@handle` echo).
 *   - 24px branded Avatar in front of the player cell; falls back to BTL chrome
 *     when no `avatarUrl` is wired.
 *   - Viewer row: quiet `bg-red-100/[0.04]` tint only — no border, no badge. The
 *     "You" badge is gone — the row chrome reads as "this is you".
 *   - Rank chip drops to `text-white/55` (`text-white/70` for top 3) in a
 *     mono-style display face so the leaderboard reads as a table, not a
 *     row stack.
 *
 * Wave 6.34p — tight cluster:
 *   - Avatar + @handle live inside ONE PLAYER cell with `gap-2` so the avatar
 *     reads as "the avatar of @handle" instead of floating in its own slot.
 *     The PLAYER column header drops its 24px avatar spacer so the eyebrow
 *     flushes with the avatar's left edge.
 *   - Row text shrinks one step: rank/handle/points `text-sm` → `text-xs`,
 *     secondary display name `text-xs` → `text-[11px]`, so long handles
 *     like `@user_cpmq17gj3c` fit cleanly inside the 640px-max panel without
 *     cramping the PTS column.
 *
 * Wave 6.34q — RANK column breathing room:
 *   - Wave 6.34p removed the avatar-slot spacer from the header, which
 *     collapsed the visible gap between RANK and PLAYER eyebrows (they read
 *     as one word: "RANKPLAYER"). Widen the RANK column from `w-7` (28px)
 *     to `w-12` (48px) in BOTH header and row so there's a comfortable gap
 *     between the RANK eyebrow + number and the PLAYER eyebrow + avatar.
 *     PLAYER eyebrow stays flush with the avatar's left edge (since both
 *     header and row widen by the same amount).
 *
 * Wave 6.34o — bounded panel:
 *   - The row list lives inside an internal scroll container with a
 *     `max-h-[480px]` ceiling (fits ~10-12 rows comfortably). The column
 *     header (RANK / PLAYER / PTS) sticks to the top of the scroll area
 *     so it stays visible while scrolling. `pendingNote` stays OUTSIDE
 *     the scroll region — it's a panel-level affordance, not a list one.
 *   - Optional `viewerWindowSize` slices the entries to a viewer-anchored
 *     window (25 above + 25 below by default). Off when undefined — the
 *     panel renders the full list and lets the scroll container clamp it.
 *     When the viewer isn't in the leaderboard (signed-out, not a member),
 *     the window falls back to the top `viewerWindowSize` rows.
 *   - The first time the viewer's row is available, the list scrolls (via
 *     `list.scrollTop`, never `scrollIntoView` — see the effect below) so
 *     the user lands looking at their own slot in the slice, then leaves the
 *     reader's scroll position alone — a re-render that hands back an
 *     equivalent `entries` array (e.g. a per-second countdown tick upstream)
 *     is a no-op, not a re-centre. The scroll container is `relative` so
 *     `row.offsetTop` reads as list-relative — without it the maths still
 *     runs but centres against the row's position on the PAGE instead of
 *     in the list, which silently clips rank 1 (or rank 2) above the fold
 *     for a top-of-leaderboard viewer. A rank-1 viewer opens with `scrollTop
 *     = 0` (rank 1 pinned at the top, never centred past it); everyone else
 *     centres, clamped at the tail for a near-bottom viewer.
 *
 * Honest empty states:
 *   - `entries` empty + no `pendingNote` → "Be the first to pick in this
 *      league." (the league has nobody on it yet, or the standings RPC
 *      isn't shipped yet — the host can override with `emptyMessage`).
 *   - `viewerEntry` undefined → the sticky footer row is suppressed; the
 *      viewer either isn't in the league (the host should route them to
 *      the league page) or live rank wiring hasn't landed yet.
 *
 * The component does NOT fetch standings. The host owns the data flow,
 * including graceful degradation when no `ListLeagueStandings` RPC exists
 * yet (today: pass `entries=[]` + a `pendingNote` that explains the gap).
 *
 * Render-only — controlled by props. The viewer can pin to the bottom by
 * passing `viewerEntry` with `isViewer: true`; we render it inside the
 * scrolling list when its rank falls inside the visible window, otherwise
 * as a sticky footer row separated from the list by a hairline rule.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionLeaderboardPanelEntry {
  /** 1-based rank within the league. */
  rank: number;
  /**
   * Stable user handle (without leading `@`). Should never be a UUID — the host
   * projection is expected to swap a missing hydrated handle for a safe label
   * (e.g. "Player") before passing the row in.
   */
  userHandle: string;
  /** Display name. Rendered as a secondary line below the handle. */
  userName?: string;
  /** Avatar URL when hydrated. Falls back to the branded BTL placeholder. */
  avatarUrl?: string;
  /** Season points accumulated. */
  points: number;
  /** Mark the viewer's row — paints with the BTL accent. */
  isViewer?: boolean;
  /** Optional profile route override. Defaults to `/@<handle>`. */
  route?: string;
}

export interface PredictionLeaderboardPanelProps {
  /** Heading text — typically the league name. */
  leagueLabel: string;
  /** Optional squad eyebrow ("breakingthelines"). Rendered without leading `@`. */
  squadHandle?: string;
  /** Top-of-leaderboard entries (already sorted by rank ascending). */
  entries: readonly PredictionLeaderboardPanelEntry[];
  /**
   * Viewer's own row when not in the top-N. Rendered as a sticky footer row
   * with a hairline divider above it. Omit when the viewer isn't enrolled
   * or when their row already appears in `entries`.
   */
  viewerEntry?: PredictionLeaderboardPanelEntry;
  /**
   * Optional footer note — typically "Pending GW7 · Picks lock at kickoff
   * in 14:13:29" composed by the host. Rendered below the list.
   */
  pendingNote?: string;
  /**
   * Optional override for the empty-state body copy. Defaults to the
   * "Be the first to pick in this league." message.
   */
  emptyMessage?: string;
  /**
   * Optional eyebrow shown above the heading ("Leaderboard"). Defaults to
   * "Leaderboard"; pass an empty string to suppress.
   */
  eyebrow?: string;
  /**
   * Wave 6.25h-a: when `true`, suppresses the internal LEADERBOARD eyebrow
   * AND the league title heading. The Predictions sub-tab now lifts a
   * `<SectionHeading title="Leaderboard" />` OUTSIDE the panel so the
   * "League → Kickoff in → Leaderboard" rhythm reads consistently above
   * each card. The selector already shows the active league name; the
   * panel's duplicate league title is redundant once hoisted. Off-by-
   * default — back-compat for stories + any other consumer.
   */
  hideHeader?: boolean;
  /**
   * Wave 6.34o: when set, slice the entries to a viewer-anchored window of
   * this many rows total (the viewer sits in the middle when possible).
   * E.g. `viewerWindowSize={50}` → 25 above + 25 below. Clamped at the
   * top/bottom of the list. When the viewer isn't enrolled (no row marked
   * `isViewer`), falls back to the top `viewerWindowSize` rows so signed-
   * out / non-member viewers still see the leaderboard truncated to the
   * same shape rather than the full list.
   *
   * Off when undefined — the panel renders the full `entries` list and
   * lets the internal scroll container do the clamping. Story consumers
   * (a 5-row fixture) keep their existing behaviour.
   */
  viewerWindowSize?: number;
  className?: string;
}

const DEFAULT_MAX_HEIGHT_CLASS = 'max-h-[480px]';

export function PredictionLeaderboardPanel({
  leagueLabel,
  squadHandle,
  entries,
  viewerEntry,
  pendingNote,
  emptyMessage,
  eyebrow = 'Leaderboard',
  hideHeader = false,
  viewerWindowSize,
  className,
}: PredictionLeaderboardPanelProps) {
  // Wave 6.34o: slice the entries to a viewer-anchored window when the host
  // asks for one. Otherwise pass the full list straight through.
  const visibleEntries = React.useMemo(
    () => sliceViewerWindow(entries, viewerWindowSize),
    [entries, viewerWindowSize]
  );

  const hasEntries = visibleEntries.length > 0;
  // Hide a separate `viewerEntry` row when the viewer is already in
  // the visible slice — the in-list highlight is enough.
  const viewerAlreadyListed =
    viewerEntry !== undefined &&
    visibleEntries.some(
      (entry) =>
        entry.isViewer === true || (entry.userHandle && entry.userHandle === viewerEntry.userHandle)
    );
  const showStickyViewer = viewerEntry !== undefined && !viewerAlreadyListed;

  // Wave 6.34o: centre the viewer's row in the visible window the first time
  // it becomes available, then leave the reader's own scrolling alone.
  //
  // We set the CONTAINER's scrollTop directly rather than calling
  // `row.scrollIntoView({block:'center'})`. scrollIntoView bubbles to EVERY
  // scrollable ancestor including the document — so when this list isn't
  // overflowing yet (short leaderboard, or rows still settling during the
  // initial data load) the inner container has nothing to scroll and the
  // browser instead scrolls the whole PAGE to centre the row, yanking a reader
  // who has started scrolling back toward the top. Driving `list.scrollTop`
  // keeps the adjustment strictly inside this container and can never move the
  // window. Only scroll when the content actually overflows.
  //
  // Fix: this used to depend on `[visibleEntries]` (the sliced array).
  // Hosts that re-render on a timer — e.g. the league hub's per-second
  // "Kickoff in" countdown (`useNowTick`) — hand this component a
  // brand-new-but-equal `entries` array on every tick, which produced a new
  // `visibleEntries` reference every second and re-ran the centring on top of
  // whatever the reader had scrolled to: the list opened already off rank 1,
  // and any manual scroll snapped back within a second. The reader's own
  // scroll position is not derivable from props, so once we've centred a
  // given viewer row we must stop — there's no "current scroll" to diff
  // against. We key the one-shot guard on the viewer's rank + handle instead
  // of the array reference: identical content (a re-render with an
  // equivalent array) is a no-op, while a genuine change — the viewer's rank
  // moves, or a different league/viewer is shown — re-centres, matching the
  // original "re-anchor on a real switch" intent without re-arming on every
  // incidental re-render.
  //
  // Second bug (found tracing a "rank 1 opens hidden behind the fold" report
  // once the above was fixed): `row.offsetTop` is only relative to THIS
  // list when `list` is the row's nearest positioned CSS ancestor
  // (`offsetParent`). Neither this container nor the `<ol>` between it and
  // the rows set a `position`, so both stayed `static` and `row.offsetTop`
  // resolved all the way up to `<body>` — i.e. the row's distance from the
  // top of the PAGE (panel header + everything the host renders above the
  // leaderboard), not its distance from the top of the scrollable list.
  // For a mid-pack viewer the resulting `target` was still in-range so it
  // silently over-scrolled instead of erroring; for a rank-1 (or rank-2)
  // viewer it was small-but-positive instead of the intended negative
  // value, so `Math.max(0, …)` no longer clamped it back to 0 — the list
  // opened scrolled a few dozen px down, clipping rank 1 above the fold
  // with rank 2 reading as the first visible row. `relative` on the list
  // (below) makes IT the offsetParent, so `row.offsetTop` is genuinely
  // list-relative and the existing clamp math is correct for every rank.
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const viewerRowRef = React.useRef<HTMLLIElement | null>(null);
  const viewerRowInView = visibleEntries.find((entry) => entry.isViewer);
  const viewerAnchorKey = viewerRowInView
    ? `${viewerRowInView.rank}-${viewerRowInView.userHandle}`
    : undefined;
  const anchoredKeyRef = React.useRef<string | undefined>(undefined);
  React.useLayoutEffect(() => {
    if (!viewerAnchorKey || anchoredKeyRef.current === viewerAnchorKey) return;
    const list = listRef.current;
    const row = viewerRowRef.current;
    if (!list || !row) return; // refs not attached yet — retry next render
    anchoredKeyRef.current = viewerAnchorKey; // one-shot per viewer position
    if (list.scrollHeight <= list.clientHeight) return; // not scrollable → nothing to centre, never touch the page
    const target = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
    const max = list.scrollHeight - list.clientHeight;
    list.scrollTop = Math.max(0, Math.min(target, max));
  }, [viewerAnchorKey]);

  return (
    <section
      data-slot="prediction-leaderboard-panel"
      className={cn(
        'bg-grey-200 flex w-full max-w-[640px] flex-col gap-4 rounded-[4px] border border-white/5 p-5',
        className
      )}
    >
      {hideHeader ? null : (
        <header className="flex flex-col gap-1">
          {eyebrow ? (
            <span
              data-slot="prediction-leaderboard-eyebrow"
              className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase"
            >
              {eyebrow}
            </span>
          ) : null}
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-content text-base font-semibold tracking-tight text-white">
              {leagueLabel}
            </h3>
            {squadHandle ? (
              <span className="font-content text-[11px] tracking-tight text-white/45">
                @{squadHandle}
              </span>
            ) : null}
          </div>
        </header>
      )}

      {hasEntries ? (
        <div
          ref={listRef}
          data-slot="prediction-leaderboard-table"
          // `relative` is load-bearing, not decorative: it makes this the
          // CSS offsetParent for the rows, which the centring effect above
          // requires to read `row.offsetTop` as list-relative. Don't drop
          // it — see the effect's comment for the bug this prevents.
          className={cn(
            'relative flex flex-col overflow-y-auto overscroll-contain',
            DEFAULT_MAX_HEIGHT_CLASS
          )}
        >
          {/* Sticky column header lives inside the scroll container so
              RANK / PLAYER / PTS stays pinned at the top while rows
              scroll past. `bg-grey-200` matches the panel background so
              the rows don't peek through the header. */}
          <LeaderboardColumnHeader className="bg-grey-200 sticky top-0 z-10" />
          <ol
            data-slot="prediction-leaderboard-entries"
            className="flex flex-col divide-y divide-white/[0.04]"
          >
            {visibleEntries.map((entry) => (
              <LeaderboardRow
                key={`${entry.rank}-${entry.userHandle}`}
                entry={entry}
                rowRef={entry.isViewer ? viewerRowRef : undefined}
              />
            ))}
          </ol>
        </div>
      ) : (
        <p
          data-slot="prediction-leaderboard-empty"
          className="font-content rounded border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-xs text-white/55"
        >
          {emptyMessage ?? 'Be the first to pick in this league.'}
        </p>
      )}

      {showStickyViewer ? (
        <div
          data-slot="prediction-leaderboard-viewer"
          className="border-t border-white/[0.08] pt-3"
        >
          <LeaderboardRow entry={{ ...viewerEntry!, isViewer: true }} />
        </div>
      ) : null}

      {pendingNote ? (
        <p
          data-slot="prediction-leaderboard-pending"
          className="font-content border-t border-white/[0.06] pt-3 text-[11px] tracking-tight text-white/55"
        >
          {pendingNote}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Wave 6.34o: produce a viewer-anchored slice of the leaderboard.
 *
 * Cases:
 *   - `viewerWindowSize` undefined / non-positive / list shorter than the
 *     window → pass the list straight through (no slicing).
 *   - Viewer in top half of the window → window starts at rank 1.
 *   - Viewer in bottom half → window ends at the last entry.
 *   - Viewer mid-pack → centred, `before` rows above + `after` rows below.
 *   - Viewer not in the list (signed-out / non-member) → top
 *     `viewerWindowSize` rows.
 */
function sliceViewerWindow(
  entries: readonly PredictionLeaderboardPanelEntry[],
  viewerWindowSize: number | undefined
): readonly PredictionLeaderboardPanelEntry[] {
  if (!viewerWindowSize || viewerWindowSize <= 0) return entries;
  if (entries.length <= viewerWindowSize) return entries;

  const viewerIndex = entries.findIndex((entry) => entry.isViewer);
  if (viewerIndex < 0) {
    // Viewer not on the leaderboard — show the top `viewerWindowSize` rows.
    return entries.slice(0, viewerWindowSize);
  }

  // Split the window roughly in half: `before` rows above the viewer +
  // viewer + `after` rows below.
  const before = Math.floor((viewerWindowSize - 1) / 2);
  const after = viewerWindowSize - 1 - before;

  let start = viewerIndex - before;
  let end = viewerIndex + after + 1; // `slice` end is exclusive.

  // Clamp at the top of the list — push the surplus to the tail so the
  // window still hits `viewerWindowSize` rows.
  if (start < 0) {
    end += -start;
    start = 0;
  }
  // Clamp at the bottom — push the surplus to the head.
  if (end > entries.length) {
    start -= end - entries.length;
    end = entries.length;
  }
  if (start < 0) start = 0;

  return entries.slice(start, end);
}

function LeaderboardColumnHeader({ className }: { className?: string }) {
  // Wave 6.34p: drop the dedicated avatar-slot spacer so the PLAYER eyebrow
  // flushes with the avatar's left edge. Rows now pair avatar + @handle as a
  // single gap-2 cluster inside the PLAYER cell, so the eyebrow sits over the
  // cluster's leading edge (the avatar), not over the @handle alone.
  //
  // Wave 6.34q: widen the RANK column from `w-7` to `w-12` so the RANK and
  // PLAYER eyebrows aren't visually touching. The row's rank cell widens by
  // the same amount, so PLAYER eyebrow stays flush with the avatar's left
  // edge.
  return (
    <div
      data-slot="prediction-leaderboard-column-header"
      className={cn(
        'font-content flex items-center gap-3 border-b border-white/[0.06] px-3 pb-2 text-[10px] tracking-[0.14em] text-white/35 uppercase',
        className
      )}
    >
      <span className="w-12 shrink-0 text-left">Rank</span>
      <span className="min-w-0 flex-1">Player</span>
      <span className="shrink-0 text-right">Pts</span>
    </div>
  );
}

function LeaderboardRow({
  entry,
  rowRef,
}: {
  entry: PredictionLeaderboardPanelEntry;
  rowRef?: React.Ref<HTMLLIElement>;
}) {
  const route = entry.route ?? `/@${entry.userHandle}`;
  const handleLabel = entry.userHandle ? `@${entry.userHandle}` : 'Player';
  // Only render the displayName as a secondary line when it adds information
  // over the `@handle` echo (e.g. "@tommy" / "Thomas Anderson", but not
  // "@tommy" / "@tommy"). Trim to keep blank-string seeds from leaking.
  const displayName = entry.userName?.trim() ?? '';
  const showSecondary =
    displayName.length > 0 &&
    displayName.toLowerCase() !== handleLabel.toLowerCase() &&
    displayName !== entry.userHandle;
  const isTopThree = entry.rank <= 3;
  return (
    <li
      ref={rowRef}
      data-slot="prediction-leaderboard-row"
      data-viewer={entry.isViewer || undefined}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 transition-colors',
        entry.isViewer ? 'bg-red-100/[0.04]' : 'hover:bg-white/[0.03]'
      )}
    >
      <span
        data-slot="prediction-leaderboard-rank"
        className={cn(
          // Wave 6.34q: widened from `w-7` to `w-12` so the rank number has
          // breathing room before the avatar/@handle cluster — matches the
          // RANK column header so PLAYER eyebrow stays flush-left with the
          // avatar's left edge.
          'font-display w-12 shrink-0 text-left text-xs font-semibold tabular-nums',
          entry.isViewer ? 'text-red-100' : isTopThree ? 'text-white/70' : 'text-white/55'
        )}
      >
        {entry.rank}
      </span>
      {/* Wave 6.34p: avatar + name anchor live inside ONE PLAYER cell with a
          tight gap-2. The avatar reads as "the avatar of @handle" instead of
          floating in a separate column, and the PLAYER eyebrow above flushes
          with the avatar's left edge. */}
      <a
        href={route}
        data-slot="prediction-leaderboard-name"
        className="font-content flex min-w-0 flex-1 items-center gap-2 leading-tight transition-colors"
      >
        <Avatar
          data-slot="prediction-leaderboard-avatar"
          size="sm"
          className={cn('size-6 shrink-0 ring-0 after:hidden')}
        >
          {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={handleLabel} /> : null}
          <AvatarFallback branded aria-label={handleLabel} />
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span
            data-slot="prediction-leaderboard-handle"
            className={cn(
              'truncate text-xs font-semibold',
              entry.isViewer ? 'text-white' : 'text-white group-hover:text-white'
            )}
          >
            {handleLabel}
          </span>
          {showSecondary ? (
            <span
              data-slot="prediction-leaderboard-display-name"
              className="font-content truncate text-[11px] text-white/55"
            >
              {displayName}
            </span>
          ) : null}
        </span>
      </a>
      <span
        data-slot="prediction-leaderboard-points"
        className={cn(
          'font-content shrink-0 text-right text-xs font-semibold tabular-nums',
          entry.isViewer ? 'text-white' : 'text-white/85'
        )}
      >
        {entry.points} pts
      </span>
    </li>
  );
}

export default PredictionLeaderboardPanel;
