'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionSummary
 *
 * Aggregate prediction block re-used in:
 *   - Match page Overview (compact)
 *   - Match page Predictions tab (top of list)
 *   - Prediction League page (top of round)
 *   - Arena Featured Pulse (future)
 *
 * Predictions are always inside a Prediction League in v1. `activeLeagues`
 * lists the squads currently running a league that includes this fixture;
 * `myPick` is the viewer's pick in whichever active league they're in;
 * `pulse` is the aggregate home/draw/away share where the service exposes it.
 *
 * Like `RatingSummary`, this primitive does not submit predictions; that
 * is the consumer's job.
 *
 * Router-agnostic links: league anchors render `<a href>` by default.
 * Wrap the tree in `<LinkProvider component={...}>` to swap.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface ActivePredictionLeagueRef {
  squadHandle: string;
  name: string;
  /** Public route to the league. */
  route: string;
  /** Viewer eligibility into this league for the current game. */
  viewerEligible?: boolean;
}

export interface PredictionSummaryProps {
  /** Viewer's pick label, if they have picked through any active league. */
  myPick?: string;
  /** Active leagues running on this game/round. */
  activeLeagues?: readonly ActivePredictionLeagueRef[];
  /** Aggregate prediction shape, counts (we render percentages). */
  pulse?: { home: number; draw: number; away: number; total: number };
  state: 'empty' | 'loading' | 'partial' | 'ready';
  fallbackReason?: FallbackReason;
  /** Compact one-column variant for overview cards. */
  variant?: 'compact' | 'full';
  /** Optional "Submit prediction" CTA composed by the caller (gated action). */
  cta?: React.ReactNode;
  className?: string;
}

export function PredictionSummary({
  myPick,
  activeLeagues,
  pulse,
  state,
  fallbackReason,
  variant = 'full',
  cta,
  className,
}: PredictionSummaryProps) {
  const Link = useLinkComponent();
  const wrapper = cn('space-y-4', className);

  if (state === 'loading') {
    return (
      <div data-slot="prediction-summary" data-state="loading" className={wrapper}>
        <div className="h-12 animate-pulse rounded-md bg-white/[0.04]" />
        <div className="h-20 animate-pulse rounded-md bg-white/[0.04]" />
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div data-slot="prediction-summary" data-state="empty" className={wrapper}>
        <FallbackState reason={fallbackReason ?? 'NO_ACTIVE_PREDICTION_LEAGUE'} cta={cta} />
      </div>
    );
  }

  const leagues = activeLeagues ?? [];
  const pulsePercent = computePulsePercent(pulse);

  return (
    <div data-slot="prediction-summary" data-state={state} className={wrapper}>
      <div
        className={
          variant === 'compact'
            ? 'grid gap-3'
            : 'grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
        }
      >
        {/* My pick */}
        <section
          data-slot="prediction-summary-mine"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              Your pick
            </h3>
          </header>
          {myPick ? (
            <p className="text-base font-semibold text-white">{myPick}</p>
          ) : (
            <>
              <p className="text-sm text-white/55">
                {leagues.length > 0
                  ? 'Pick this match in an active prediction league.'
                  : 'No prediction leagues active on this fixture.'}
              </p>
              {cta ? <div className="mt-3">{cta}</div> : null}
            </>
          )}
        </section>

        {/* Game pulse */}
        <section
          data-slot="prediction-summary-pulse"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-2 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              Pulse
            </h3>
            {pulse && pulse.total > 0 ? (
              <span className="text-xs text-white/45">{pulse.total} picks</span>
            ) : null}
          </header>
          {pulsePercent ? (
            <PulseBar percent={pulsePercent} />
          ) : (
            <p className="text-sm text-white/55">Pulse opens once picks land.</p>
          )}
        </section>
      </div>

      {/* Active leagues */}
      {leagues.length > 0 ? (
        <section
          data-slot="prediction-summary-leagues"
          className="rounded-md border border-white/10 bg-white/[0.03] p-4"
        >
          <header className="mb-3 flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
              Active prediction leagues
            </h3>
            <span className="text-xs text-white/45">{leagues.length} leagues</span>
          </header>
          <ul className="space-y-2">
            {leagues.map((league) => (
              <li
                key={league.route}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={league.route}
                  className="min-w-0 truncate text-white/75 hover:text-white"
                >
                  {league.name}
                </Link>
                <span className="shrink-0 text-xs text-white/45">@{league.squadHandle}</span>
                {league.viewerEligible === false ? (
                  <span className="shrink-0 rounded bg-white/[0.06] px-2 py-0.5 text-[11px] tracking-wide text-white/55">
                    Not eligible
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function computePulsePercent(pulse?: {
  home: number;
  draw: number;
  away: number;
  total: number;
}): { home: number; draw: number; away: number } | undefined {
  if (!pulse || pulse.total <= 0) return undefined;
  const safe = (n: number) => Math.max(0, Math.min(100, Math.round((n / pulse.total) * 100)));
  return { home: safe(pulse.home), draw: safe(pulse.draw), away: safe(pulse.away) };
}

function PulseBar({ percent }: { percent: { home: number; draw: number; away: number } }) {
  return (
    <div data-slot="prediction-pulse-bar" className="space-y-2">
      <div className="flex h-2 w-full overflow-hidden rounded-sm bg-white/[0.04]">
        <div
          className="bg-red-100"
          style={{ width: `${percent.home}%` }}
          aria-label={`Home ${percent.home}%`}
        />
        <div
          className="bg-white/30"
          style={{ width: `${percent.draw}%` }}
          aria-label={`Draw ${percent.draw}%`}
        />
        <div
          className="bg-red-300"
          style={{ width: `${percent.away}%` }}
          aria-label={`Away ${percent.away}%`}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs text-white/55">
        <PulseStat label="Home" value={percent.home} />
        <PulseStat label="Draw" value={percent.draw} />
        <PulseStat label="Away" value={percent.away} />
      </dl>
    </div>
  );
}

function PulseStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] tracking-wide text-white/45 uppercase">{label}</dt>
      <dd className="text-sm font-semibold text-white">{value}%</dd>
    </div>
  );
}
