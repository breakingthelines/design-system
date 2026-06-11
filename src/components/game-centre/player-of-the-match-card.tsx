'use client';

import * as React from 'react';
import { Star } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { GradeBox } from '#/components/ui/grade-box';
import { type RatingScaleValue } from '#/components/ui/rating-scale';

import { FallbackState, type FallbackReason } from './fallback-state';

/* ─────────────────────────────────────────────────────────────────────────────
 * PlayerOfTheMatchCard (Match page — Game Day ratings module)
 *
 * Compact card highlighting the match's standout player. A starred eyebrow,
 * then the player's avatar, name (with an optional club crest beside it) and a
 * prominent rating badge.
 *
 * The rating follows the BTL canonical 1-6 inverse scale (1 is best). The
 * badge reuses `ratingDescriptor` so its label/semantics match `RatingSummary`
 * and the rest of the rating surface, and it carries
 * `data-direction="lower-is-better"` like `RatingScale` so consumers and tests
 * can verify the inversion is preserved.
 *
 * Honest by default: with no resolved player, or no rating reported yet, the
 * card renders a tight `FallbackState` (defaulting to the canonical
 * `POTM_NOT_REPORTED` reason) — the same pattern `RatingSummary` uses.
 *
 * Router-agnostic: when `href` is set the name links via the
 * `useLinkComponent` context (defaults to `<a>`). Render-only otherwise.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerOfTheMatchCardProps {
  /** Player display name. */
  name: string;
  /** Optional avatar image URL. Falls back to initials. */
  avatarUrl?: string;
  /** Optional club name (crest alt + initials fallback). */
  clubName?: string;
  /** Optional club crest URL, rendered beside the name. */
  clubCrestUrl?: string;
  /** BTL rating, 1 (best) to 6 (worst). Omit to render the empty state. */
  rating?: number;
  /** Scale maximum. Defaults to 6 (the BTL inverse scale). */
  ratingMax?: number;
  /** Optional route to the player page. When set, the name becomes a link. */
  href?: string;
  /**
   * Render mode. `ready` shows the card; `empty` shows the fallback only;
   * `loading` shows a skeleton. When no usable `rating` is present the card
   * renders the fallback regardless of `state`.
   */
  state?: 'ready' | 'empty' | 'loading';
  /** Fallback override (used when empty). Defaults to `POTM_NOT_REPORTED`. */
  fallbackReason?: FallbackReason;
  /**
   * Whether to render the inner "PLAYER OF THE MATCH" eyebrow (star icon +
   * uppercase label). Defaults to `true` — back-compat with hosts that
   * embed the card without an external heading. Set to `false` when an
   * external SectionHeading already announces the section (e.g. the Match
   * Centre Game Day Timeline sub-tab) to avoid duplicating the label.
   * Wave 6.24b.
   */
  showEyebrow?: boolean;
  className?: string;
}

const DEFAULT_RATING_MAX = 6;

export function PlayerOfTheMatchCard({
  name,
  avatarUrl,
  clubName,
  clubCrestUrl,
  rating,
  ratingMax = DEFAULT_RATING_MAX,
  href,
  state = 'ready',
  fallbackReason,
  showEyebrow = true,
  className,
}: PlayerOfTheMatchCardProps) {
  const Link = useLinkComponent();
  // Wave 6.24 — wrapper picks up the universal Wave 6 card chrome
  // (rounded-[4px] + border-white/5 + bg-grey-200 + p-5) so the card reads
  // as part of the same panel family as the match hero, formation hero,
  // and player-grade-list. Square corners + heavier border used to make
  // the card sit alone visually; this aligns it with the rounded chrome
  // that runs across the page.
  const wrapper = cn(
    'flex w-full flex-col gap-4 rounded-[4px] border border-white/5 bg-[var(--color-grey-200)] p-5 text-white',
    className
  );

  const scaleValue = toRatingScaleValue(rating);

  if (state === 'loading') {
    return (
      <div data-slot="player-of-the-match-card" data-state="loading" className={wrapper}>
        {showEyebrow ? <PotmEyebrow /> : null}
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
            <div className="h-2.5 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
          </div>
          {/* Wave 6.24 — skeleton mirrors the new GradeBox sm footprint
              (~28px square + ~10px label strip beneath). */}
          <div className="flex shrink-0 flex-col items-center gap-0.5">
            <div className="h-7 w-7 animate-pulse rounded-[4px] bg-white/[0.04]" />
            <div className="h-2 w-10 animate-pulse rounded-sm bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'empty' || scaleValue === undefined) {
    return (
      <div data-slot="player-of-the-match-card" data-state="empty" className={wrapper}>
        {showEyebrow ? <PotmEyebrow /> : null}
        <FallbackState reason={fallbackReason ?? 'POTM_NOT_REPORTED'} />
      </div>
    );
  }

  const initials = initialsFromName(name);
  const crestInitials = clubName ? initialsFromName(clubName) : undefined;

  return (
    <div
      data-slot="player-of-the-match-card"
      data-state="ready"
      data-direction="lower-is-better"
      data-rating-max={ratingMax}
      className={wrapper}
    >
      <PotmEyebrow />
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="shrink-0 border border-white/10">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-xs font-semibold tracking-tight">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {href ? (
              <Link
                href={href}
                className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-white hover:text-[var(--color-red-100)]"
              >
                {name}
              </Link>
            ) : (
              <span className="min-w-0 truncate font-display text-base font-semibold tracking-tight text-white">
                {name}
              </span>
            )}
            {clubCrestUrl || crestInitials ? (
              <span
                data-slot="player-of-the-match-card-crest"
                aria-hidden="true"
                className="relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[var(--color-grey-300)] text-[8px] font-bold tracking-tight text-white"
              >
                {clubCrestUrl ? (
                  <img
                    src={clubCrestUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  crestInitials
                )}
              </span>
            ) : null}
          </div>
          {clubName ? (
            <p
              data-slot="player-of-the-match-card-club"
              className="mt-0.5 truncate text-[12px] text-white/55"
            >
              {clubName}
            </p>
          ) : null}
        </div>

        {/* Wave 6.24 — the canonical GradeBox replaces the bespoke bordered
            "value / max" block. Same visual language as every cast grade on
            the page (player grade rows, from-grade pill, ratings hero):
            one shape across the system. `sm` (28px square) with the
            qualitative label underneath gives a compact ~50px footprint
            that no longer crowds the player name. The aggregate scale
            (1-6 inverse) is reinforced by the gradient: 1 = deepest red,
            6 = dim grey — same rhyme the user already reads everywhere. */}
        <GradeBox
          data-slot="player-of-the-match-card-rating"
          value={scaleValue}
          size="sm"
          showLabel
          className="shrink-0"
        />
      </div>
    </div>
  );
}

function PotmEyebrow() {
  return (
    <header
      data-slot="player-of-the-match-card-eyebrow"
      className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--color-red-100)] uppercase"
    >
      <Star weight="fill" aria-hidden="true" className="size-3.5" />
      <span>Player of the Match</span>
    </header>
  );
}

function toRatingScaleValue(value: number | undefined): RatingScaleValue | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 6) return undefined;
  return rounded as RatingScaleValue;
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}
