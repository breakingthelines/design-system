'use client';

import * as React from 'react';

import { Check, Minus, Plus } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { matchesSearchQuery } from '#/lib/search-match';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';

/* ─────────────────────────────────────────────────────────────────────────────
 * PlayerMultiSelectField (Wave 6.4.11)
 *
 * A labeled, checkable list of players used inside the SubmitPredictionSheet
 * for the two new rubric field kinds:
 *
 *   - GOALSCORERS  — pick the players you think will score.
 *                    Soft gating via `hint` ("Pick up to 2 home, 1 away")
 *                    plus an optional `maxSelectable` HARD cap when the host
 *                    knows the exact ceiling (e.g. PLAYER_CARDS = 3).
 *   - PLAYER_CARDS — pick up to 3 players you think will be booked.
 *
 * The component is render-only: state lives in the host. Selection is a flat
 * list of player ids. Players can come from either side of a fixture; the host
 * controls grouping/ordering. Rows are uniform regardless of side so the
 * caller can render a single flat list when lineups are not split by team yet
 * (e.g. pre-XI / squad fallback).
 *
 * No score gating in here — gating belongs to the host. The hint slot is
 * purely advisory copy.
 *
 * Wave 6.25m — `searchable` prop adds a small search input above the list.
 * When the roster is a full match-day squad (~23 players per side, or 46
 * across both) scanning by sight is painful; the search lets the viewer type a
 * surname to filter visible rows. Selections persist across filters; the cap
 * is computed against the full selection set. Matching is case- AND
 * accent-insensitive (see `matchPlayer` below).
 *
 * Wave 6.25n — `mode` prop adds a per-player COUNTER variant. In
 * `mode="counter"` each row renders [−] [count] [+] instead of a checkbox.
 * Picking "saka" three times means "saka scores three goals". The host
 * owns a `counts: Record<playerId, number>` map (default 0 = not picked)
 * and reacts to `onCountsChange(next)`. Settlement on the server credits
 * `min(picked_count, actual_goals) * pointsPerPick` per player, with no
 * aggregate cap on the field. Other props (`label`, `description`,
 * `hint`, `searchable`, `emptyCopy`) work identically in counter mode.
 *
 * Wave 6.25s — `maxTotalCount` HARD cap on the SUM of counts across all
 * rows (counter mode only). When the sum reaches the cap every row's
 * increment button is disabled; the user must − a different row to free
 * room. Used by the prediction modal to gate the goalscorer counter by
 * the predicted side score (home picks ≤ predicted home score, away
 * picks ≤ predicted away score — each picker is filtered to one side
 * and carries its own `maxTotalCount`). When the cap is reached the
 * field renders `data-at-total-cap="true"` on the fieldset so callers
 * can style the surrounding scaffolding (e.g. fade the heading badge).
 * Decrement is never blocked by the total cap — only the per-row
 * increment.
 *
 * Lowering the cap below the current sum (e.g. user picked 2 then
 * lowered the predicted score to 1) does NOT silently drop picks; it
 * leaves the existing counts intact and disables every row's
 * increment. The user clears room manually via −. This mirrors how the
 * multi-mode `maxSelectable` cap is enforced — picks above the cap are
 * preserved when the cap shrinks under them.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerMultiSelectOption {
  /** Stable id (player id) returned through `onChange`. */
  id: string;
  /** Display name (already abbreviated by the host). */
  name: string;
  /** Optional shirt number, rendered as eyebrow next to the name. */
  jerseyNumber?: number;
  /** Optional avatar image URL. Falls back to initials. */
  avatarUrl?: string;
  /** Optional caption (team name, role) under the name. */
  caption?: string;
}

/**
 * Wave 6.25n — selection mode.
 *
 *   - `multi`   (default): row is a toggleable checkbox. State is a flat
 *                          `selectedIds: readonly string[]`. A player can
 *                          appear at most once.
 *   - `counter`           : row renders [−] [count] [+]. State is a
 *                          `counts: Record<playerId, number>` map (default
 *                          0 = not picked). A player can be picked N
 *                          times; the host sends one entry per count to
 *                          the server.
 */
export type PlayerMultiSelectMode = 'multi' | 'counter';

interface PlayerMultiSelectFieldBaseProps extends Omit<
  React.ComponentProps<'fieldset'>,
  'onChange'
> {
  /** Field heading, e.g. "Goalscorers". */
  label: string;
  /** Optional helper copy below the label, e.g. "1 pt per correct pick". */
  description?: string;
  /**
   * Advisory copy under the description that surfaces soft constraints
   * (e.g. score-implied caps). Render-only — does NOT enforce a cap.
   */
  hint?: string;
  /** Players to render. Ordering is preserved. */
  players: readonly PlayerMultiSelectOption[];
  /**
   * Empty-state copy when `players` is empty (e.g. "Lineups land before
   * kickoff."). Defaults to a generic line.
   */
  emptyCopy?: string;
  /**
   * Wave 6.25m — when true, the field renders a small search input above
   * the list. The query filters rows by a case- and accent-insensitive
   * substring on `player.name`. Selections are preserved across filters (a
   * hidden row stays selected), and the at-cap state is computed against the
   * full selection set, not the visible subset. Off by default for back-compat
   * — existing consumers see no visual change unless they opt in.
   */
  searchable?: boolean;
  /**
   * Optional placeholder for the search input. Defaults to "Search players".
   */
  searchPlaceholder?: string;
  /**
   * Optional override for how a row is matched against the search query.
   * Only consulted when `searchable` is on and the query is non-empty.
   *
   * The default is `matchesSearchQuery(player.name, query)` — an
   * accent-folded, case-insensitive substring on the name only. That is the
   * right default and most hosts should leave it alone. The hook exists
   * because the row carries `jerseyNumber` and `caption` too, and a host that
   * wants either of those searchable (or wants fuzzy/ranked matching) would
   * otherwise have to fork the whole component to get it. Compose with the
   * exported `matchesSearchQuery` rather than reimplementing the fold:
   *
   * ```tsx
   * matchPlayer={(p, q) =>
   *   matchesSearchQuery(p.name, q) || String(p.jerseyNumber ?? '') === q.trim()
   * }
   * ```
   *
   * It is a PREDICATE, not a list transform, so an override cannot reorder,
   * duplicate or fabricate rows — ordering and the selection/cap invariants
   * stay owned by the component. An empty query short-circuits to "show
   * everything" before this is called, so a faulty matcher cannot break the
   * rest state.
   */
  matchPlayer?: (player: PlayerMultiSelectOption, query: string) => boolean;
}

interface PlayerMultiSelectFieldMultiProps extends PlayerMultiSelectFieldBaseProps {
  /** Default mode — toggleable checkboxes, distinct selections. */
  mode?: 'multi';
  /** Currently selected player ids (controlled). */
  selectedIds: readonly string[];
  /** Selection change handler. Fires the next id list. */
  onChange: (ids: string[]) => void;
  /**
   * Optional HARD cap on the number of selections. When set, attempts to
   * select beyond the cap are silently dropped and the row goes into a
   * `data-disabled="capped"` state. Omit for an uncapped field (server
   * settles 1 pt per correct hit).
   */
  maxSelectable?: number;
  // Counter-mode props are not allowed in multi mode.
  counts?: never;
  onCountsChange?: never;
  maxPerPlayer?: never;
  maxTotalCount?: never;
}

interface PlayerMultiSelectFieldCounterProps extends PlayerMultiSelectFieldBaseProps {
  /** Wave 6.25n — per-player counter mode. */
  mode: 'counter';
  /**
   * Per-player count map (controlled). Missing keys are treated as 0.
   * The component never writes a 0 entry back via `onCountsChange` —
   * decrementing to 0 omits the key from the next map (so callers can
   * use object key presence as "is picked at all").
   */
  counts: Readonly<Record<string, number>>;
  /** Counts change handler. Fires the next counts map. */
  onCountsChange: (counts: Record<string, number>) => void;
  /**
   * Optional HARD cap on the count per individual player. Defaults to no
   * per-player cap. The aggregate (sum across all players) is governed
   * separately via `maxTotalCount`.
   */
  maxPerPlayer?: number;
  /**
   * Wave 6.25s — Optional HARD cap on the SUM of counts across all rows.
   * When the sum reaches the cap, every row's increment button is
   * disabled; decrement stays enabled so the user can clear room. Omit
   * (or pass `undefined`) for an unbounded aggregate. The cap is computed
   * against the full `counts` map, not the visible (post-search) subset.
   * Lowering the cap below the current sum does NOT mutate state — picks
   * remain visible and the user clears room with −.
   */
  maxTotalCount?: number;
  // Multi-mode props are not allowed in counter mode.
  selectedIds?: never;
  onChange?: never;
  maxSelectable?: never;
}

export type PlayerMultiSelectFieldProps =
  | PlayerMultiSelectFieldMultiProps
  | PlayerMultiSelectFieldCounterProps;

function PlayerMultiSelectField(props: PlayerMultiSelectFieldProps) {
  const {
    label,
    description,
    hint,
    players,
    emptyCopy = 'No players available yet.',
    searchable = false,
    searchPlaceholder = 'Search players',
    matchPlayer,
    className,
    mode = 'multi',
    ...rest
  } = props as PlayerMultiSelectFieldProps & { mode?: PlayerMultiSelectMode };

  // Wave 6.25m — local search state. Off by default; only allocated when the
  // host opts in via `searchable`. The filter is a case- AND accent-insensitive
  // substring on `player.name`: both the query and the name are NFD-folded, so
  // "joao" and "João" both find "João Pedro" and neither spelling is privileged
  // over the other. We deliberately do NOT filter on jersey or caption — name
  // is the field viewers reach for — but a host that wants to can say so via
  // `matchPlayer`.
  const [query, setQuery] = React.useState('');
  const visiblePlayers = React.useMemo(() => {
    if (!searchable) return players;
    if (query.trim() === '') return players;
    const match =
      matchPlayer ?? ((p: PlayerMultiSelectOption) => matchesSearchQuery(p.name, query));
    return players.filter((p) => match(p, query));
  }, [searchable, players, query, matchPlayer]);

  // Pluck the rest of the discriminated props out for the render branches.
  // Casts here are safe because the public type is a discriminated union on
  // `mode`; the body just funnels each variant into its own renderer.
  const multiProps =
    mode === 'multi'
      ? (rest as Omit<
          PlayerMultiSelectFieldMultiProps,
          keyof PlayerMultiSelectFieldBaseProps | 'mode'
        >)
      : null;
  const counterProps =
    mode === 'counter'
      ? (rest as Omit<
          PlayerMultiSelectFieldCounterProps,
          keyof PlayerMultiSelectFieldBaseProps | 'mode'
        >)
      : null;

  // Pre-compute at-cap state for the multi-mode HTML attribute. Counter
  // mode has no aggregate-cap-by-count, but Wave 6.25s introduces an
  // optional `maxTotalCount` cap on the SUM across all rows; that drives
  // a separate `data-at-total-cap` attribute on the fieldset so the
  // surrounding scaffolding can react.
  const selectedSet = React.useMemo(
    () => new Set(multiProps?.selectedIds ?? []),
    [multiProps?.selectedIds]
  );
  const atCap =
    multiProps != null &&
    typeof multiProps.maxSelectable === 'number' &&
    selectedSet.size >= multiProps.maxSelectable;

  // Wave 6.25s — counter-mode aggregate total + cap state. Computed
  // against the FULL counts map (not the visible/search-filtered subset)
  // so cap enforcement stays stable while the user filters by name.
  const totalCount = React.useMemo(() => {
    if (!counterProps) return 0;
    let sum = 0;
    for (const v of Object.values(counterProps.counts)) {
      if (typeof v === 'number' && v > 0) sum += v;
    }
    return sum;
  }, [counterProps]);
  const atTotalCap =
    counterProps != null &&
    typeof counterProps.maxTotalCount === 'number' &&
    totalCount >= counterProps.maxTotalCount;

  // ─── Multi-mode handlers ────────────────────────────────────────────
  const handleToggle = React.useCallback(
    (id: string) => {
      if (!multiProps) return;
      const { selectedIds, onChange, maxSelectable } = multiProps;
      if (selectedSet.has(id)) {
        onChange(selectedIds.filter((current) => current !== id));
        return;
      }
      if (typeof maxSelectable === 'number' && selectedSet.size >= maxSelectable) {
        // Silently drop — the row is already visually capped.
        return;
      }
      onChange([...selectedIds, id]);
    },
    [multiProps, selectedSet]
  );

  // ─── Counter-mode handlers ──────────────────────────────────────────
  // Decrementing to 0 omits the key from the next map so callers can use
  // `id in counts` as "is picked at all". Incrementing respects an optional
  // per-player cap (`maxPerPlayer`).
  const handleIncrement = React.useCallback(
    (id: string) => {
      if (!counterProps) return;
      const { counts, onCountsChange, maxPerPlayer, maxTotalCount } = counterProps;
      const next = (counts[id] ?? 0) + 1;
      if (typeof maxPerPlayer === 'number' && next > maxPerPlayer) {
        return;
      }
      // Wave 6.25s — refuse any increment that would push the SUM of
      // counts past `maxTotalCount`. Decrement-then-increment another
      // row is the recovery path; the row-level disabled state guides
      // the user there.
      if (typeof maxTotalCount === 'number' && totalCount >= maxTotalCount) {
        return;
      }
      onCountsChange({ ...counts, [id]: next });
    },
    [counterProps, totalCount]
  );

  const handleDecrement = React.useCallback(
    (id: string) => {
      if (!counterProps) return;
      const { counts, onCountsChange } = counterProps;
      const current = counts[id] ?? 0;
      if (current <= 0) return;
      const nextValue = current - 1;
      const nextCounts = { ...counts };
      if (nextValue === 0) {
        delete nextCounts[id];
      } else {
        nextCounts[id] = nextValue;
      }
      onCountsChange(nextCounts);
    },
    [counterProps]
  );

  // Strip the per-mode keys before spreading to the fieldset (otherwise
  // React warns about unknown DOM attributes).
  const fieldsetRest: Record<string, unknown> = { ...rest };
  delete fieldsetRest.selectedIds;
  delete fieldsetRest.onChange;
  delete fieldsetRest.maxSelectable;
  delete fieldsetRest.counts;
  delete fieldsetRest.onCountsChange;
  delete fieldsetRest.maxPerPlayer;
  delete fieldsetRest.maxTotalCount;

  return (
    <fieldset
      data-slot="player-multi-select-field"
      data-mode={mode}
      data-at-cap={atCap || undefined}
      data-at-total-cap={atTotalCap || undefined}
      className={cn('flex flex-col gap-2 border-0 p-0', className)}
      {...fieldsetRest}
    >
      <div className="flex flex-col gap-1">
        <legend
          data-slot="player-multi-select-field-label"
          className="font-content block text-[10px] tracking-[0.16em] text-white/40 uppercase"
        >
          {label}
        </legend>
        {description ? (
          <p
            data-slot="player-multi-select-field-description"
            className="font-content text-[11px] text-white/55"
          >
            {description}
          </p>
        ) : null}
        {hint ? (
          <p
            data-slot="player-multi-select-field-hint"
            className="font-content text-[11px] text-white/40"
          >
            {hint}
          </p>
        ) : null}
      </div>

      {searchable && players.length > 0 ? (
        <input
          data-slot="player-multi-select-field-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={`Search ${label}`}
          className="font-content rounded-[3px] border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:bg-white/[0.06] focus:outline-none"
        />
      ) : null}

      {players.length === 0 ? (
        <p
          data-slot="player-multi-select-field-empty"
          className="font-content rounded border border-white/10 bg-white/[0.04] p-3 text-xs text-white/55"
        >
          {emptyCopy}
        </p>
      ) : visiblePlayers.length === 0 ? (
        <p
          data-slot="player-multi-select-field-no-matches"
          className="font-content rounded border border-white/10 bg-white/[0.04] p-3 text-xs text-white/55"
        >
          No players match {`"${query}"`}.
        </p>
      ) : (
        <ul
          data-slot="player-multi-select-field-rows"
          role="group"
          aria-label={label}
          className="flex max-h-72 flex-col gap-0.5 overflow-y-auto"
        >
          {visiblePlayers.map((player) => {
            if (mode === 'counter' && counterProps) {
              const count = counterProps.counts[player.id] ?? 0;
              // Disable `+` when EITHER the per-player cap or the
              // aggregate total cap (Wave 6.25s) is reached. Decrement
              // is unaffected so the user can clear room.
              const perPlayerCapped =
                typeof counterProps.maxPerPlayer === 'number' && count >= counterProps.maxPerPlayer;
              const capReached = perPlayerCapped || atTotalCap;
              return (
                <PlayerMultiSelectCounterRow
                  key={player.id}
                  player={player}
                  count={count}
                  capReached={capReached}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                />
              );
            }
            const checked = selectedSet.has(player.id);
            const disabled = !checked && atCap;
            return (
              <PlayerMultiSelectRow
                key={player.id}
                player={player}
                checked={checked}
                disabled={disabled}
                onToggle={handleToggle}
              />
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}

function PlayerMultiSelectRow({
  player,
  checked,
  disabled,
  onToggle,
}: {
  player: PlayerMultiSelectOption;
  checked: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const initials = initialsFromName(player.name);
  const handleClick = () => {
    if (disabled) return;
    onToggle(player.id);
  };

  return (
    <li
      data-slot="player-multi-select-field-row"
      data-player-id={player.id}
      data-checked={checked || undefined}
      data-disabled={disabled ? 'capped' : undefined}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          // Wave 6.25p — fixed `min-h-[44px]` so multi-mode rows line up
          // vertically with counter-mode rows when the two field variants
          // sit side-by-side (Goalscorers + Bookings in the prediction
          // modal). Counter rows are visually taller because the [−][+]
          // buttons are size-6 (24px) vs the size-5 (20px) check chip
          // here; without a uniform min-height, row N drifts a few pixels
          // between the two columns.
          'flex min-h-[44px] w-full items-center gap-3 rounded-[4px] px-2 py-2 text-left transition-colors',
          checked
            ? 'bg-[var(--color-red-100)]/[0.10] text-white hover:bg-[var(--color-red-100)]/[0.14]'
            : 'text-white/70 hover:bg-white/[0.04] hover:text-white',
          disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
          !disabled && 'cursor-pointer'
        )}
      >
        <Avatar size="sm" className="shrink-0 border border-white/10">
          {player.avatarUrl ? <AvatarImage src={player.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-[10px] font-semibold tracking-tight">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            data-slot="player-multi-select-field-row-name"
            className="truncate text-[13px] font-semibold tracking-tight"
          >
            {typeof player.jerseyNumber === 'number' ? (
              <span
                data-slot="player-multi-select-field-row-jersey"
                className="mr-1.5 inline-flex min-w-[1.25rem] justify-center font-mono text-[10px] text-white/45 tabular-nums"
              >
                {player.jerseyNumber}
              </span>
            ) : null}
            {player.name}
          </span>
          {player.caption ? (
            <span
              data-slot="player-multi-select-field-row-caption"
              className="truncate text-[11px] text-white/45"
            >
              {player.caption}
            </span>
          ) : null}
        </div>

        <span
          data-slot="player-multi-select-field-row-check"
          data-checked={checked || undefined}
          aria-hidden
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
            checked
              ? 'border-[var(--color-red-100)] bg-[var(--color-red-100)] text-white'
              : 'border-white/20 bg-transparent text-transparent'
          )}
        >
          <Check size={12} weight="bold" />
        </span>
      </button>
    </li>
  );
}

function PlayerMultiSelectCounterRow({
  player,
  count,
  capReached,
  onIncrement,
  onDecrement,
}: {
  player: PlayerMultiSelectOption;
  count: number;
  capReached: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}) {
  const initials = initialsFromName(player.name);
  const picked = count > 0;
  return (
    <li
      data-slot="player-multi-select-field-row"
      data-row-variant="counter"
      data-player-id={player.id}
      data-count={count}
      data-checked={picked || undefined}
    >
      <div
        className={cn(
          // Wave 6.25p — see PlayerMultiSelectRow above for the rationale;
          // both row variants share `min-h-[44px]` so the two columns of
          // the prediction modal (Goalscorers + Bookings) keep row N
          // aligned across the divider regardless of which control the
          // row carries.
          'flex min-h-[44px] w-full items-center gap-3 rounded-[4px] px-2 py-2 transition-colors',
          picked ? 'bg-[var(--color-red-100)]/[0.10] text-white' : 'text-white/70'
        )}
      >
        <Avatar size="sm" className="shrink-0 border border-white/10">
          {player.avatarUrl ? <AvatarImage src={player.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-[10px] font-semibold tracking-tight">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            data-slot="player-multi-select-field-row-name"
            className="truncate text-[13px] font-semibold tracking-tight"
          >
            {typeof player.jerseyNumber === 'number' ? (
              <span
                data-slot="player-multi-select-field-row-jersey"
                className="mr-1.5 inline-flex min-w-[1.25rem] justify-center font-mono text-[10px] text-white/45 tabular-nums"
              >
                {player.jerseyNumber}
              </span>
            ) : null}
            {player.name}
          </span>
          {player.caption ? (
            <span
              data-slot="player-multi-select-field-row-caption"
              className="truncate text-[11px] text-white/45"
            >
              {player.caption}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Decrement ${player.name}`}
            disabled={!picked}
            onClick={() => onDecrement(player.id)}
            data-slot="player-multi-select-field-counter-decrement"
            className={cn(
              'inline-flex size-6 items-center justify-center rounded-[4px] border transition-colors',
              picked
                ? 'cursor-pointer border-white/20 bg-white/[0.06] text-white/80 hover:bg-white/[0.10] hover:text-white'
                : 'cursor-not-allowed border-white/10 bg-transparent text-white/25'
            )}
          >
            <Minus size={12} weight="bold" />
          </button>
          <span
            data-slot="player-multi-select-field-counter-value"
            data-picked={picked || undefined}
            className={cn(
              'inline-flex min-w-[1.5rem] justify-center font-mono text-[12px] tabular-nums',
              picked ? 'text-white' : 'text-white/35'
            )}
          >
            {count}
          </span>
          <button
            type="button"
            aria-label={`Increment ${player.name}`}
            disabled={capReached}
            onClick={() => onIncrement(player.id)}
            data-slot="player-multi-select-field-counter-increment"
            className={cn(
              'inline-flex size-6 items-center justify-center rounded-[4px] border transition-colors',
              capReached
                ? 'cursor-not-allowed border-white/10 bg-transparent text-white/25'
                : 'cursor-pointer border-[var(--color-red-100)]/40 bg-[var(--color-red-100)]/[0.14] text-white hover:bg-[var(--color-red-100)]/[0.22]'
            )}
          >
            <Plus size={12} weight="bold" />
          </button>
        </div>
      </div>
    </li>
  );
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}

export { PlayerMultiSelectField };
