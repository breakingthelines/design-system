'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '#/lib/utils';

import { PredictionStakesBadge } from './prediction-stakes-badge';
import type { CountdownPhase } from './prediction-countdown-card';

/* ─────────────────────────────────────────────────────────────────────────────
 * PredictionsHero (Wave 6.5)
 *
 * The lifecycle-aware top card for the Predictions sub-tab. Replaces the
 * trimmed `PredictionCountdownCard` in the sub-tab body — the countdown card
 * is still exported for compact contexts (Arena, league pages), but here we
 * commit to a single hero that adapts its shape per `state`:
 *
 *   state="scheduled"  → giant countdown + stakes line + CTA
 *   state="live"       → live clock + "Picks locked at kickoff" + match ribbon
 *   state="finished"   → result line + "How you did" points ribbon + per-side score
 *
 * Stake-and-rank framing: every state surfaces ONE primary number (countdown,
 * minute, or points earned) at display weight. The card is the lobby for the
 * stake; the modal is the act of staking.
 *
 * Motion:
 *   - SCHEDULED: a soft red border-pulse when `phase === "imminent"` (T-30 → 0).
 *     The colour crossfade is driven by `motion`'s tween — no gradient slop.
 *   - FINISHED: the points ribbon flies in with a tight stagger on first paint.
 * ──────────────────────────────────────────────────────────────────────────── */

export type PredictionsHeroState = 'scheduled' | 'live' | 'finished';

export interface PredictionsHeroProps extends React.ComponentProps<'div'> {
  state: PredictionsHeroState;
  /** Competition + round caption, e.g. "Premier League · Matchday 12". */
  caption?: string;
  /**
   * SCHEDULED — countdown label + phase.
   * Reuse the host's `formatCountdown` + phase classifier.
   */
  countdownLabel?: string;
  countdownPhase?: CountdownPhase;
  /**
   * SCHEDULED — total points on offer for this match. Drives the stakes
   * line ("Up to N points on offer"). Hidden when undefined.
   */
  stakesTotal?: number;
  /** SCHEDULED — primary CTA (rendered as-is). */
  cta?: React.ReactNode;
  /**
   * LIVE — live clock string ("67'", "HT", "ET 12'").
   * The card flips into a "picks locked at kickoff" posture.
   */
  liveClock?: string;
  /** LIVE / FINISHED — score line ("1 — 0"). Rendered tabular-nums. */
  scoreLine?: string;
  /** LIVE / FINISHED — short match label ("Arsenal v Spurs"). */
  matchLabel?: string;
  /**
   * FINISHED — points earned by the viewer. Renders the "How you did" ribbon.
   * Undefined = viewer didn't predict (renders a "You didn't pick" rest state).
   */
  pointsEarned?: number;
  /** FINISHED — total points that were on offer. */
  pointsAvailable?: number;
  /**
   * Drops the in-card eyebrow on whichever state body is active so the host
   * can render an external `SectionHeading` instead. Defaults to false so
   * existing consumers (Arena widget, stories) keep their in-card label.
   *   - SCHEDULED → suppresses "Kickoff in" (Wave 6.25h)
   *   - LIVE      → suppresses "Picks locked at kickoff" (Wave 6.25z)
   *   - FINISHED  → suppresses "Full time" (Wave 6.25z)
   */
  hideHeader?: boolean;
}

function PredictionsHero({
  state,
  caption,
  countdownLabel,
  countdownPhase,
  stakesTotal,
  cta,
  liveClock,
  scoreLine,
  // `matchLabel` survives on the type for external surfaces (Arena widget,
  // etc.) but the hero body never paints it — the viewer is already on the
  // match page, so "CF v THF" in the bottom-right of LIVE/FINISHED is
  // redundant (Wave 6.25b).
  matchLabel: _matchLabel,
  pointsEarned,
  pointsAvailable,
  hideHeader = false,
  className,
  ...props
}: PredictionsHeroProps) {
  return (
    <div
      data-slot="predictions-hero"
      data-state={state}
      className={cn(
        'bg-grey-200 relative overflow-hidden rounded-[4px] border border-white/5 p-5',
        'flex flex-col gap-4',
        className
      )}
      {...props}
    >
      {/* eyebrow */}
      {caption ? (
        <span
          data-slot="predictions-hero-eyebrow"
          className="font-content text-[10px] tracking-[0.16em] text-white/40 uppercase"
        >
          {caption}
        </span>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {state === 'scheduled' ? (
          <ScheduledBody
            key="scheduled"
            countdownLabel={countdownLabel ?? 'TBC'}
            countdownPhase={countdownPhase ?? 'far'}
            stakesTotal={stakesTotal}
            cta={cta}
            hideHeader={hideHeader}
          />
        ) : state === 'live' ? (
          <LiveBody
            key="live"
            liveClock={liveClock ?? 'Live'}
            scoreLine={scoreLine}
            hideHeader={hideHeader}
          />
        ) : (
          <FinishedBody
            key="finished"
            scoreLine={scoreLine}
            pointsEarned={pointsEarned}
            pointsAvailable={pointsAvailable}
            hideHeader={hideHeader}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// SCHEDULED: giant countdown + stakes + CTA
// ──────────────────────────────────────────────────────────────────

function ScheduledBody({
  countdownLabel,
  countdownPhase,
  stakesTotal,
  cta,
  hideHeader,
}: {
  countdownLabel: string;
  countdownPhase: CountdownPhase;
  stakesTotal?: number;
  cta?: React.ReactNode;
  hideHeader?: boolean;
}) {
  const isImminent = countdownPhase === 'imminent';
  const isLive = countdownPhase === 'live';
  const accent = isImminent || isLive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        {hideHeader ? null : (
          <span
            data-slot="predictions-hero-eyebrow-status"
            className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase"
          >
            Kickoff in
          </span>
        )}
        <motion.span
          data-slot="predictions-hero-countdown"
          data-phase={countdownPhase}
          animate={{
            color: accent ? 'var(--color-red-100)' : '#ffffff',
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="font-display text-[40px] leading-none font-bold tracking-tight tabular-nums sm:text-[48px]"
        >
          {countdownLabel}
        </motion.span>
      </div>

      {/* Stakes line + CTA row.
          When the rubric hasn't landed yet (`stakesTotal === undefined`) we
          hide the stakes line entirely instead of surfacing a technical
          "Stakes load with the rubric." placeholder. The CTA still renders
          so the lobby remains actionable. Wave 6.25a (B5). */}
      {stakesTotal !== undefined || cta !== undefined ? (
        <div
          data-slot="predictions-hero-stakes-row"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4"
        >
          {stakesTotal !== undefined ? (
            <div data-slot="predictions-hero-stakes" className="flex items-baseline gap-3">
              <PredictionStakesBadge points={stakesTotal} modifier="pts" tone="total" />
              <span className="font-content text-xs text-white/55">on offer this match</span>
            </div>
          ) : null}
          {cta !== undefined ? (
            <div data-slot="predictions-hero-cta" className="ml-auto">
              {cta}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* T-30 imminent: a subtle red border-pulse on the card. We render it as
          an absolute ring that fades in/out, so it stacks on top of the card's
          static border. Pure mask — no gradient. */}
      {isImminent ? (
        <motion.div
          aria-hidden
          data-slot="predictions-hero-urgency-ring"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.0, 0.6, 0.0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 rounded-[4px] ring-1 ring-[var(--color-red-100)]/55"
        />
      ) : null}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
// LIVE: clock + locked posture + match score
// ──────────────────────────────────────────────────────────────────

function LiveBody({
  liveClock,
  scoreLine,
  hideHeader,
}: {
  liveClock: string;
  // `matchLabel` is intentionally NOT rendered here (Wave 6.25b): the viewer
  // is already on the match page so repeating "CF v THF" is redundant. The
  // prop survives on `PredictionsHeroProps` so external surfaces (Arena
  // widget etc.) keep their type, but the hero body itself never paints it.
  scoreLine?: string;
  hideHeader?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-baseline gap-3">
        <motion.span
          aria-hidden
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block size-2 rounded-full bg-[var(--color-red-100)]"
        />
        <span
          data-slot="predictions-hero-live-clock"
          className="font-display text-[40px] leading-none font-bold tracking-tight text-[var(--color-red-100)] tabular-nums sm:text-[48px]"
        >
          {liveClock}
        </span>
        {scoreLine ? (
          <span
            data-slot="predictions-hero-live-score"
            className="font-display ml-auto text-[28px] leading-none font-bold tracking-tight text-white tabular-nums"
          >
            {scoreLine}
          </span>
        ) : null}
      </div>

      {hideHeader ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
            Picks locked at kickoff
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────
// FINISHED: result + "How you did" ribbon
// ──────────────────────────────────────────────────────────────────

function FinishedBody({
  scoreLine,
  pointsEarned,
  pointsAvailable,
  hideHeader,
}: {
  // `matchLabel` is intentionally NOT rendered here (Wave 6.25b): the viewer
  // is already on the match page so "CF v THF" in the bottom-right is
  // redundant. The prop survives on `PredictionsHeroProps` so external
  // surfaces (Arena widget etc.) keep their type.
  scoreLine?: string;
  pointsEarned?: number;
  pointsAvailable?: number;
  hideHeader?: boolean;
}) {
  const cast = pointsEarned !== undefined;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-baseline gap-3">
        {hideHeader ? null : (
          <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
            Full time
          </span>
        )}
        {scoreLine ? (
          <span
            data-slot="predictions-hero-final-score"
            className="font-display text-[40px] leading-none font-bold tracking-tight text-white tabular-nums sm:text-[48px]"
          >
            {scoreLine}
          </span>
        ) : null}
      </div>

      <div
        data-slot="predictions-hero-recap-ribbon"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4"
      >
        {cast ? (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: 0.08 }}
            className="flex items-baseline gap-2"
          >
            <span className="font-content text-[10px] tracking-[0.16em] text-white/55 uppercase">
              You earned
            </span>
            <span
              data-slot="predictions-hero-points-earned"
              className="font-display text-2xl leading-none font-bold tracking-tight text-[var(--color-red-100)] tabular-nums"
            >
              {pointsEarned}
            </span>
            {pointsAvailable !== undefined ? (
              <span className="font-content text-xs text-white/55 tabular-nums">
                of {pointsAvailable} on offer
              </span>
            ) : null}
          </motion.div>
        ) : (
          <span className="font-content text-xs text-white/55">
            You didn&apos;t place a pick on this one.
          </span>
        )}
      </div>
    </motion.div>
  );
}

export { PredictionsHero };
