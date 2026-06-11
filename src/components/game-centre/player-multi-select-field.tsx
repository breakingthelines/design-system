'use client';

import * as React from 'react';

import { Check } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
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
 * Wave 6.25m — `searchable` prop adds a small case-insensitive search input
 * above the list. When the roster is a full match-day squad (~23 players per
 * side, or 46 across both) scanning by sight is painful; the search lets the
 * viewer type a surname to filter visible rows. Selections persist across
 * filters; the cap is computed against the full selection set.
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

export interface PlayerMultiSelectFieldProps extends Omit<
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
  /**
   * Empty-state copy when `players` is empty (e.g. "Lineups land before
   * kickoff."). Defaults to a generic line.
   */
  emptyCopy?: string;
  /**
   * Wave 6.25m — when true, the field renders a small search input above
   * the list. The query filters rows by a case-insensitive substring on
   * `player.name`. Selections are preserved across filters (a hidden row
   * stays selected), and the at-cap state is computed against the full
   * selection set, not the visible subset. Off by default for back-compat
   * — existing consumers see no visual change unless they opt in.
   */
  searchable?: boolean;
  /**
   * Optional placeholder for the search input. Defaults to "Search players".
   */
  searchPlaceholder?: string;
}

function PlayerMultiSelectField({
  label,
  description,
  hint,
  players,
  selectedIds,
  onChange,
  maxSelectable,
  emptyCopy = 'No players available yet.',
  searchable = false,
  searchPlaceholder = 'Search players',
  className,
  ...props
}: PlayerMultiSelectFieldProps) {
  // Keep a stable lookup so we don't allocate per row.
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const atCap = typeof maxSelectable === 'number' && selectedSet.size >= maxSelectable;

  // Wave 6.25m — local search state. Off by default; only allocated when the
  // host opts in via `searchable`. Filter is a case-insensitive substring on
  // `player.name`. We deliberately do NOT filter on jersey or caption — name
  // is the field viewers reach for.
  const [query, setQuery] = React.useState('');
  const visiblePlayers = React.useMemo(() => {
    if (!searchable) return players;
    const q = query.trim().toLowerCase();
    if (q === '') return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchable, players, query]);

  const handleToggle = React.useCallback(
    (id: string) => {
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
    [maxSelectable, onChange, selectedIds, selectedSet]
  );

  return (
    <fieldset
      data-slot="player-multi-select-field"
      data-at-cap={atCap || undefined}
      className={cn('flex flex-col gap-2 border-0 p-0', className)}
      {...props}
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
          'flex w-full items-center gap-3 rounded-[4px] px-2 py-2 text-left transition-colors',
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

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}

export { PlayerMultiSelectField };
