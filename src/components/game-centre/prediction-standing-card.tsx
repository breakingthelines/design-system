'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionStandingCard (Wave 6.5)
 *
 * Surfaces the viewer's standing inside an active Prediction League on the
 * Predictions sub-tab. The card has three honest states:
 *
 *   state="ready"        → rank / total + season points + GW status
 *   state="membership"   → "You're in" + GW status, no rank wiring yet
 *   state="not-joined"   → "Join the league to track your standing"
 *
 * The component is render-only — hosts compute the state and pass the values
 * pre-derived. When rank wiring isn't shipped on the host yet the
 * `membership` variant gracefully degrades to a "Coming soon: live rank"
 * eyebrow so the surface stays honest.
 * ──────────────────────────────────────────────────────────────────────────── */

export type PredictionStandingState = 'ready' | 'membership' | 'not-joined';

export type PredictionGwStatus = 'pending' | 'submitted' | 'locked' | 'settled';

const GW_STATUS_LABEL: Record<PredictionGwStatus, string> = {
  pending: 'Pick pending',
  submitted: 'Pick locked in',
  locked: 'GW locked',
  settled: 'GW settled',
};

export interface PredictionStandingCardProps extends React.ComponentProps<'div'> {
  state: PredictionStandingState;
  /** League name — e.g. "Premier League Predictor". */
  leagueName: string;
  /** Optional squad handle eyebrow ("@breakingthelines"). */
  squadHandle?: string;
  /** Optional league route — when supplied the card is a link target. */
  route?: string;
  /** Viewer's rank inside the league (1-based). `ready` only. */
  rank?: number;
  /** Total entrants in the league. `ready` only. */
  totalEntrants?: number;
  /** Season points so far. `ready` only. */
  seasonPoints?: number;
  /** Gameweek status badge. */
  gwStatus?: PredictionGwStatus;
  /** Optional gameweek number, paired with `gwStatus` ("GW 12 pending"). */
  gwNumber?: number;
  /** Optional "Coming soon" eyebrow override. */
  comingSoonLabel?: string;
}

function PredictionStandingCard({
  state,
  leagueName,
  squadHandle,
  route,
  rank,
  totalEntrants,
  seasonPoints,
  gwStatus,
  gwNumber,
  comingSoonLabel,
  className,
  ...props
}: PredictionStandingCardProps) {
  const isReady = state === 'ready';
  const isMembership = state === 'membership';
  const isNotJoined = state === 'not-joined';

  const gwLine = gwStatus
    ? gwNumber !== undefined
      ? `GW ${gwNumber} · ${GW_STATUS_LABEL[gwStatus]}`
      : GW_STATUS_LABEL[gwStatus]
    : undefined;

  const cardClass = cn(
    'bg-grey-200 relative flex flex-col gap-3 rounded-[4px] border border-white/5 p-5',
    className
  );

  const Inner = (
    <>
      {/* eyebrow row: league + squad */}
      <div className="flex items-baseline justify-between gap-3">
        <span
          data-slot="prediction-standing-name"
          className="font-content truncate text-sm font-semibold text-white"
        >
          {leagueName}
        </span>
        {squadHandle ? (
          <span className="font-content text-[10px] tracking-[0.12em] text-white/40 lowercase">
            @{squadHandle}
          </span>
        ) : null}
      </div>

      {/* body */}
      {isReady ? (
        <div className="flex items-baseline gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
              Rank
            </span>
            <span
              data-slot="prediction-standing-rank"
              className="font-display text-3xl leading-none font-bold tracking-tight text-white tabular-nums"
            >
              {rank ?? '–'}
            </span>
          </div>
          {totalEntrants !== undefined ? (
            <span className="font-content text-xs text-white/40 tabular-nums">
              / {totalEntrants}
            </span>
          ) : null}
          {seasonPoints !== undefined ? (
            <div className="ml-auto flex flex-col gap-1 text-right">
              <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
                Season
              </span>
              <span
                data-slot="prediction-standing-season-points"
                className="font-display text-xl leading-none font-bold tracking-tight text-white tabular-nums"
              >
                {seasonPoints}
                <span className="font-content ml-1 text-xs font-medium text-white/40">pts</span>
              </span>
            </div>
          ) : null}
        </div>
      ) : isMembership ? (
        <div className="flex flex-col gap-1">
          <span className="font-content text-xs text-white/70">You&apos;re in.</span>
          <span
            data-slot="prediction-standing-coming-soon"
            className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase"
          >
            {comingSoonLabel ?? 'Live rank coming soon'}
          </span>
        </div>
      ) : isNotJoined ? (
        <span className="font-content text-xs text-white/55">
          Join the league to track your standing.
        </span>
      ) : null}

      {/* footer */}
      {gwLine ? (
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span
            data-slot="prediction-standing-gw-status"
            data-status={gwStatus}
            className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase"
          >
            {gwLine}
          </span>
          {route ? (
            <span className="font-content text-[10px] tracking-[0.12em] text-[var(--color-red-100)]/80 uppercase">
              Open league →
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (route) {
    return (
      <a
        href={route}
        data-slot="prediction-standing-card"
        data-state={state}
        className={cn(cardClass, 'transition-colors hover:border-white/15')}
      >
        {Inner}
      </a>
    );
  }

  return (
    <div data-slot="prediction-standing-card" data-state={state} className={cardClass} {...props}>
      {Inner}
    </div>
  );
}

export { PredictionStandingCard };
