'use client';

import * as React from 'react';
import { Star } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { ratingDescriptor, type RatingScaleValue } from '#/components/ui/rating-scale';

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
  className,
}: PlayerOfTheMatchCardProps) {
  const Link = useLinkComponent();
  const wrapper = cn(
    'flex w-full flex-col gap-4 border border-white/10 bg-[var(--color-grey-200)] p-5 text-white',
    className
  );

  const scaleValue = toRatingScaleValue(rating);

  if (state === 'loading') {
    return (
      <div data-slot="player-of-the-match-card" data-state="loading" className={wrapper}>
        <PotmEyebrow />
        <div className="flex items-center gap-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
            <div className="h-2.5 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
          </div>
          <div className="size-10 shrink-0 animate-pulse rounded-sm bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  if (state === 'empty' || scaleValue === undefined) {
    return (
      <div data-slot="player-of-the-match-card" data-state="empty" className={wrapper}>
        <PotmEyebrow />
        <FallbackState reason={fallbackReason ?? 'POTM_NOT_REPORTED'} />
      </div>
    );
  }

  const descriptor = ratingDescriptor(scaleValue);
  const initials = initialsFromName(name);
  const crestInitials = clubName ? initialsFromName(clubName) : undefined;

  return (
    <div
      data-slot="player-of-the-match-card"
      data-state="ready"
      data-direction="lower-is-better"
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

        <span
          data-slot="player-of-the-match-card-rating"
          data-direction="lower-is-better"
          data-value={scaleValue}
          title={`${descriptor.label} · lower is better`}
          className={cn(
            'flex shrink-0 flex-col items-center justify-center px-2.5 py-1.5',
            'border border-[var(--color-red-100)] bg-[var(--color-red-100)]/15'
          )}
        >
          <span className="font-mono text-lg leading-none font-bold tabular-nums text-[var(--color-red-100)]">
            {formatRating(rating, scaleValue)}
          </span>
          <span className="mt-0.5 text-[9px] tracking-[0.08em] text-[var(--color-red-100)]/80 uppercase">
            / {ratingMax}
          </span>
        </span>
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

/**
 * Display the rating to one decimal when the source value is fractional
 * (e.g. an aggregate "5.2"), otherwise show the rounded integer.
 */
function formatRating(raw: number | undefined, fallback: RatingScaleValue): string {
  if (raw === undefined || !Number.isFinite(raw)) return String(fallback);
  return Number.isInteger(raw) ? String(raw) : raw.toFixed(1);
}

function initialsFromName(label: string): string {
  const parts = label
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '');
  return parts.slice(0, 2).join('') || '··';
}
