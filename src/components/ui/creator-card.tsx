'use client';

import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { formatCount } from '#/lib/format';
import { entityMonogram } from '#/lib/entity-image';
import { useLinkComponent } from '#/components/ui/link-context';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';

/* ─────────────────────────────────────────────────────────────────────────────
 * CreatorCard
 *
 * A presentational card for a creator (a BTL person) — powers the homepage
 * "Creators to Watch" rail and any ranked creator list. Unlike SearchEntityCard
 * (football entities), this represents a user: avatar with an optional rank
 * badge, name + handle + verified tick, a short bio, and a Followers / Thoughts
 * stat line.
 *
 * Presentational only: the whole card links to `item.href` via the host's
 * router (useLinkComponent), matching the other cards so SSR + client routing
 * both work. Counts use the shared `formatCount` (1.2k / 1M); a missing avatar
 * falls back to a branded monogram. The stat line is pinned to the card bottom
 * (`mt-auto`) so footers align across an equal-height grid.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface CreatorCardItem {
  id: string;
  /** Display name, e.g. "Zach Lowy". */
  name: string;
  /** Handle without the leading "@". */
  handle: string;
  /** Avatar URL; absent → branded monogram fallback. */
  avatarUrl?: string;
  /** Short bio; clamped to two lines. */
  bio?: string;
  verified?: boolean;
  /** Follower count; rendered via formatCount when present. */
  followerCount?: number;
  /** Thought count; shown as the second stat when present. */
  thoughtCount?: number;
  /** Destination, e.g. /@zachlowy. */
  href: string;
  /** 1-based rank; renders the numbered badge on the avatar when present. */
  rank?: number;
}

export interface CreatorCardProps {
  item: CreatorCardItem;
  className?: string;
}

/* ─────────────────────────────────────────────────
 * Stat — bold count + muted label, e.g. "8.5k Followers".
 * ───────────────────────────────────────────────── */
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span data-slot="creator-stat" className="inline-flex items-baseline gap-1">
      <span className="font-semibold text-white">{formatCount(value)}</span>
      <span className="text-white/40">{label}</span>
    </span>
  );
}

function CreatorCard({ item, className }: CreatorCardProps) {
  const LinkComponent = useLinkComponent();
  const hasStats = item.followerCount != null || item.thoughtCount != null;

  return (
    <motion.article
      data-slot="creator-card"
      whileHover={{ y: -4 }}
      transition={motionTokens.spring.gentle}
      className={cn(
        'group/creator-card relative h-full overflow-hidden rounded-2xl text-white',
        'border border-white/8 bg-white/[0.025] transition-colors',
        'hover:border-white/14 hover:bg-white/[0.04]',
        className
      )}
    >
      <LinkComponent
        href={item.href}
        data-slot="creator-link"
        className="flex h-full flex-col gap-4 p-5"
      >
        {/* ── identity row: avatar (+ rank) | name + handle ── */}
        <div className="flex items-start gap-4">
          <span data-slot="creator-avatar" className="relative shrink-0">
            <Avatar size="lg" className="size-12">
              <AvatarImage src={item.avatarUrl} />
              <AvatarFallback branded>{entityMonogram(item.name)}</AvatarFallback>
            </Avatar>
            {item.rank != null ? (
              <span
                data-slot="creator-rank"
                aria-label={`Rank ${item.rank}`}
                className={cn(
                  'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full',
                  'bg-[var(--color-grey-300)] text-[11px] font-bold leading-none tabular-nums text-white',
                  'ring-2 ring-background'
                )}
              >
                {item.rank}
              </span>
            ) : null}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <h3
                data-slot="creator-name"
                className="truncate font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white transition-colors group-hover/creator-card:text-red-100"
              >
                {item.name}
              </h3>
              {item.verified ? <VerifiedBadge size="sm" className="size-3.5" /> : null}
            </div>
            <p data-slot="creator-handle" className="mt-1.5 truncate text-xs text-white/40">
              @{item.handle}
            </p>
          </div>
        </div>

        {/* ── bio ── */}
        {item.bio ? (
          <p
            data-slot="creator-bio"
            className="line-clamp-2 text-xs leading-5 tracking-[-0.12px] text-white/45"
          >
            {item.bio}
          </p>
        ) : null}

        {/* ── stats (pinned to bottom for grid alignment) ── */}
        {hasStats ? (
          <div data-slot="creator-stats" className="mt-auto flex items-center gap-4 text-xs">
            {item.followerCount != null ? (
              <Stat value={item.followerCount} label="Followers" />
            ) : null}
            {item.thoughtCount != null ? <Stat value={item.thoughtCount} label="Thoughts" /> : null}
          </div>
        ) : null}
      </LinkComponent>
    </motion.article>
  );
}

export { CreatorCard };
