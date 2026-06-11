'use client';

import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionLeaderboardPanel (Wave 6.25a · 6.25f polish)
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
 *   - Viewer row: subtle `bg-red-100/[0.06]` + 2px left accent border. The
 *     "You" badge is gone — the row chrome reads as "this is you".
 *   - Rank chip drops to `text-white/55` (`text-white/70` for top 3) in a
 *     mono-style display face so the leaderboard reads as a table, not a
 *     row stack.
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
  className?: string;
}

export function PredictionLeaderboardPanel({
  leagueLabel,
  squadHandle,
  entries,
  viewerEntry,
  pendingNote,
  emptyMessage,
  eyebrow = 'Leaderboard',
  className,
}: PredictionLeaderboardPanelProps) {
  const hasEntries = entries.length > 0;
  // Hide a separate `viewerEntry` row when the viewer is already in
  // the listed top-N — the in-list highlight is enough.
  const viewerAlreadyListed =
    viewerEntry !== undefined &&
    entries.some(
      (entry) =>
        entry.isViewer === true || (entry.userHandle && entry.userHandle === viewerEntry.userHandle)
    );
  const showStickyViewer = viewerEntry !== undefined && !viewerAlreadyListed;

  return (
    <section
      data-slot="prediction-leaderboard-panel"
      className={cn(
        'bg-grey-200 flex w-full max-w-[640px] flex-col gap-4 rounded-[4px] border border-white/5 p-5',
        className
      )}
    >
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
          <h3 className="font-display text-base font-semibold tracking-tight text-white">
            {leagueLabel}
          </h3>
          {squadHandle ? (
            <span className="font-content text-[11px] tracking-tight text-white/45">
              @{squadHandle}
            </span>
          ) : null}
        </div>
      </header>

      {hasEntries ? (
        <div data-slot="prediction-leaderboard-table" className="flex flex-col">
          <LeaderboardColumnHeader />
          <ol
            data-slot="prediction-leaderboard-entries"
            className="flex flex-col divide-y divide-white/[0.04]"
          >
            {entries.map((entry) => (
              <LeaderboardRow key={`${entry.rank}-${entry.userHandle}`} entry={entry} />
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

function LeaderboardColumnHeader() {
  return (
    <div
      data-slot="prediction-leaderboard-column-header"
      className="font-content flex items-center gap-3 border-b border-white/[0.06] px-3 pb-2 text-[10px] tracking-[0.14em] text-white/35 uppercase"
    >
      <span className="w-7 shrink-0 text-right">Rank</span>
      {/* 24px avatar slot — keep aligned with the row's avatar column. */}
      <span aria-hidden className="w-6 shrink-0" />
      <span className="min-w-0 flex-1">Player</span>
      <span className="shrink-0 text-right">Pts</span>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: PredictionLeaderboardPanelEntry }) {
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
      data-slot="prediction-leaderboard-row"
      data-viewer={entry.isViewer || undefined}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 transition-colors',
        entry.isViewer
          ? 'border-l-2 border-red-100 bg-red-100/[0.06] pl-[10px]'
          : 'border-l-2 border-transparent hover:bg-white/[0.03]'
      )}
    >
      <span
        data-slot="prediction-leaderboard-rank"
        className={cn(
          'font-display w-7 shrink-0 text-right text-sm font-semibold tabular-nums',
          entry.isViewer ? 'text-red-100' : isTopThree ? 'text-white/70' : 'text-white/55'
        )}
      >
        {entry.rank}
      </span>
      <Avatar
        data-slot="prediction-leaderboard-avatar"
        size="sm"
        className={cn('size-6 ring-0 after:hidden')}
      >
        {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={handleLabel} /> : null}
        <AvatarFallback branded aria-label={handleLabel} />
      </Avatar>
      <a
        href={route}
        data-slot="prediction-leaderboard-name"
        className="font-content flex min-w-0 flex-1 flex-col leading-tight transition-colors"
      >
        <span
          data-slot="prediction-leaderboard-handle"
          className={cn(
            'truncate text-sm font-semibold',
            entry.isViewer ? 'text-white' : 'text-white group-hover:text-white'
          )}
        >
          {handleLabel}
        </span>
        {showSecondary ? (
          <span
            data-slot="prediction-leaderboard-display-name"
            className="font-content truncate text-xs text-white/55"
          >
            {displayName}
          </span>
        ) : null}
      </a>
      <span
        data-slot="prediction-leaderboard-points"
        className={cn(
          'font-content shrink-0 text-right text-sm font-semibold tabular-nums',
          entry.isViewer ? 'text-white' : 'text-white/85'
        )}
      >
        {entry.points} pts
      </span>
    </li>
  );
}

export default PredictionLeaderboardPanel;
