'use client';

import * as React from 'react';
import { CaretDown, Plus } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionLeagueSelector (Wave 6.25a)
 *
 * The trigger that scopes the Predictions sub-tab to a single league. The
 * selected league drives:
 *   - the kickoff hero (countdown + stakes for that league's rubric)
 *   - the leaderboard panel below (standings for that league)
 *   - the submit modal (the pick is staked into that league)
 *
 * Render-only. The host owns the selection state (URL param `?lg=`) and
 * passes the current `leagueInstanceId` + the menu options. Single-league
 * fixtures still render the trigger so the IA stays consistent — the menu
 * is just shorter. When `options.length === 0` the component renders an
 * inert disabled-looking shell.
 *
 * Chrome matches the Wave 6.22 restyled BTL `DropdownMenu` chrome (dark
 * surface, hairline border, red-accent gradient line at the top, dense
 * row rhythm).
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PredictionLeagueSelectorOption {
  /** Stable league instance id — the value emitted by `onSelect`. */
  leagueInstanceId: string;
  /** Display name for the league. */
  label: string;
  /** Optional squad eyebrow ("breakingthelines"). Rendered without the leading `@`. */
  squadHandle?: string;
  /** True when the viewer is enrolled in this league. */
  joined?: boolean;
}

export interface PredictionLeagueSelectorBrowse {
  /** Route to a "browse leagues" surface. When omitted no browse row renders. */
  route: string;
  /** Optional label override. Defaults to "Browse leagues". */
  label?: string;
}

export interface PredictionLeagueSelectorProps {
  /** Active league instance id. Looked up against `options` for the trigger label. */
  value?: string;
  /** All leagues covering this fixture that the viewer can scope to. */
  options: readonly PredictionLeagueSelectorOption[];
  /** Called when the viewer picks a league. Emits the league instance id. */
  onSelect: (leagueInstanceId: string) => void;
  /** Optional "Browse leagues" affordance for the menu's footer. */
  browse?: PredictionLeagueSelectorBrowse;
  /** Override eyebrow label. Defaults to "Scope". */
  eyebrow?: string;
  /** Compact mode — hides the eyebrow row, keeps the trigger only. */
  compact?: boolean;
  className?: string;
}

export function PredictionLeagueSelector({
  value,
  options,
  onSelect,
  browse,
  eyebrow = 'Scope',
  compact = false,
  className,
}: PredictionLeagueSelectorProps) {
  const active = options.find((opt) => opt.leagueInstanceId === value) ?? options[0];
  const hasOptions = options.length > 0;
  const triggerLabel = active?.label ?? 'No prediction league';
  const triggerSquad = active?.squadHandle;

  return (
    <div data-slot="prediction-league-selector" className={cn('w-full', className)}>
      {compact ? null : (
        <span
          data-slot="prediction-league-selector-eyebrow"
          className="font-content mb-1.5 block text-[10px] tracking-[0.16em] text-white/40 uppercase"
        >
          {eyebrow}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="prediction-league-selector-trigger"
          data-disabled={hasOptions ? undefined : true}
          disabled={!hasOptions}
          className={cn(
            'bg-grey-200 group flex w-full items-center justify-between gap-3 rounded-[4px] border border-white/10 px-4 py-3 text-left transition-colors',
            'hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
            'data-[state=open]:border-red-100/40',
            'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60'
          )}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              data-slot="prediction-league-selector-trigger-label"
              className="font-content truncate text-sm font-semibold text-white"
            >
              {triggerLabel}
            </span>
            {triggerSquad ? (
              <span className="font-content truncate text-[11px] tracking-tight text-white/45">
                @{triggerSquad}
              </span>
            ) : null}
          </span>
          <CaretDown
            weight="bold"
            className="size-3.5 shrink-0 text-white/55 transition-transform group-data-[state=open]:rotate-180"
          />
        </DropdownMenuTrigger>
        {hasOptions ? (
          <DropdownMenuContent
            align="start"
            className="min-w-[--radix-dropdown-menu-trigger-width] w-[var(--anchor-width,320px)]"
          >
            <DropdownMenuLabel>Your prediction leagues</DropdownMenuLabel>
            {options.map((opt) => {
              const isActive = opt.leagueInstanceId === active?.leagueInstanceId;
              return (
                <DropdownMenuItem
                  key={opt.leagueInstanceId}
                  data-slot="prediction-league-selector-option"
                  data-active={isActive || undefined}
                  onClick={() => onSelect(opt.leagueInstanceId)}
                  className={cn(
                    // The base DropdownMenuItem chrome forces UPPERCASE +
                    // tracking; we override it here because the row is
                    // bigger (label + squad handle) and the league name is
                    // a proper noun, not a label-shaped action.
                    'flex items-start gap-3 px-3 py-2 tracking-normal normal-case text-white/85',
                    isActive ? 'bg-white/[0.04] text-white' : null
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-content truncate text-sm font-medium text-white">
                      {opt.label}
                    </span>
                    {opt.squadHandle ? (
                      <span className="font-content truncate text-[11px] tracking-tight text-white/45">
                        @{opt.squadHandle}
                      </span>
                    ) : null}
                  </span>
                  {opt.joined === false ? (
                    <span className="font-content ml-auto self-center rounded bg-white/[0.06] px-2 py-0.5 text-[10px] tracking-[0.12em] text-white/55 uppercase">
                      Open
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            {browse ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-slot="prediction-league-selector-browse"
                  render={<a href={browse.route} />}
                  className="flex items-center gap-2 px-3 py-2 text-white/75 hover:text-white"
                >
                  <Plus weight="bold" className="size-3.5" />
                  <span className="font-content text-sm font-medium">
                    {browse.label ?? 'Browse leagues'}
                  </span>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        ) : null}
      </DropdownMenu>
    </div>
  );
}

export default PredictionLeagueSelector;
