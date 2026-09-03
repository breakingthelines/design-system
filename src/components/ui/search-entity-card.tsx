'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { useTilt } from '#/hooks/use-tilt';
import { useLinkComponent } from '#/components/ui/link-context';
import { entityMonogram } from '#/lib/entity-image';
import type { VariantFn } from '#/lib/cva';

/* ─────────────────────────────────────────────────────────────────────────────
 * SearchEntityCard
 *
 * A presentational card for a football entity search hit (club, player,
 * manager, competition, country). Entities are NOT content: they have no
 * author, no engagement, and no "breaking the lines" cover. Rendering one with
 * ContentCard produced an "Unknown" byline, a 0/0 engagement bar, and the BTL
 * wordmark placeholder — this card is the dedicated surface that replaces that
 * misuse.
 *
 * Two variants mirror ContentCard so hits sit in the same result grid/list:
 *   - grid → crest/photo on top, name + type pill below.
 *   - list → horizontal, circular crest/photo on the left.
 *
 * The whole card links to `item.href` via the host's router (useLinkComponent),
 * matching ContentCard's navigation so SSR and client routing both work. When
 * `item.imageUrl` is absent the frame falls back to a name monogram.
 * ──────────────────────────────────────────────────────────────────────────── */

export type SearchEntityKind = 'club' | 'player' | 'manager' | 'competition' | 'country';

export interface SearchEntityCardItem {
  id: string;
  kind: SearchEntityKind;
  name: string;
  /** Crest / photo URL; may be absent → monogram fallback. */
  imageUrl?: string;
  /** Destination, e.g. /game/football/{kind}/{routeId}/{slug}. */
  href: string;
  /** Optional second line, e.g. country or league. */
  secondary?: string;
}

export interface SearchEntityCardProps {
  item: SearchEntityCardItem;
  variant?: 'grid' | 'list';
}

const ENTITY_KIND_LABELS: Record<SearchEntityKind, string> = {
  club: 'Club',
  player: 'Player',
  manager: 'Manager',
  competition: 'Competition',
  country: 'Country',
};

/** Human-readable label for an entity kind, e.g. 'club' → 'Club'. */
export function entityKindLabel(kind: SearchEntityKind): string {
  return ENTITY_KIND_LABELS[kind] ?? kind;
}

export type SearchEntityCardVariant = 'grid' | 'list';

const searchEntityCardVariants: VariantFn<{ variant?: SearchEntityCardVariant | null }> = cva(
  'group/entity-card relative overflow-hidden text-white transition-colors',
  {
    variants: {
      variant: {
        grid: 'flex flex-col backdrop-blur-[20px]',
        list: 'flex flex-col backdrop-blur-[20px]',
      } satisfies Record<SearchEntityCardVariant, string>,
    },
    defaultVariants: {
      variant: 'grid',
    },
  }
);

/* ─────────────────────────────────────────────────
 * EntityGlyph — crest/photo in a circular frame, or a name monogram.
 * Clubs, competitions, players, managers and countries all read as a circle,
 * matching the RefGlyph pattern (no BtlPlaceholder wordmark).
 * ───────────────────────────────────────────────── */
function EntityGlyph({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  return (
    <span
      data-slot="entity-glyph"
      aria-hidden="true"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'border border-white/10 bg-[var(--color-grey-300)] font-semibold tracking-tight text-white',
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span data-slot="entity-monogram">{entityMonogram(name)}</span>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────
 * TypePill — small uppercase kind label.
 * ───────────────────────────────────────────────── */
function TypePill({ kind }: { kind: SearchEntityKind }) {
  return (
    <span
      data-slot="entity-type-pill"
      data-kind={kind}
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5',
        'border border-white/12 bg-white/[0.04]',
        'text-[10px] font-semibold tracking-[0.14em] text-[var(--color-grey-500)] uppercase'
      )}
    >
      {entityKindLabel(kind)}
    </span>
  );
}

function SearchEntityCard({ item, variant = 'grid' }: SearchEntityCardProps) {
  const isList = variant === 'list';
  const LinkComponent = useLinkComponent();

  // Mouse-tracking 3D tilt — gentler for list cards, matching ContentCard.
  const tilt = useTilt(isList ? 3 : 8);

  /* ── LIST variant ─────────────────────────────── */
  if (isList) {
    return (
      <motion.article
        data-slot="search-entity-card"
        data-kind={item.kind}
        data-variant="list"
        style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        whileHover={{ y: -4 }}
        transition={motionTokens.spring.gentle}
        className={searchEntityCardVariants({ variant })}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
      >
        <LinkComponent href={item.href} data-slot="entity-link" className="flex items-center gap-4">
          <EntityGlyph
            name={item.name}
            imageUrl={item.imageUrl}
            className="size-[64px] text-base"
          />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <TypePill kind={item.kind} />
            <h3
              data-slot="entity-name"
              className="line-clamp-1 font-[family-name:var(--font-content)] text-sm font-semibold leading-none tracking-[-0.42px] text-white transition-colors group-hover/entity-card:text-red-100"
            >
              {item.name}
            </h3>
            {item.secondary ? (
              <p
                data-slot="entity-secondary"
                className="line-clamp-1 text-xs font-normal leading-4 tracking-[-0.12px] text-[#ccc4c4]"
              >
                {item.secondary}
              </p>
            ) : null}
          </div>
        </LinkComponent>
      </motion.article>
    );
  }

  /* ── GRID variant (default) ───────────────────── */
  return (
    <motion.article
      data-slot="search-entity-card"
      data-kind={item.kind}
      data-variant="grid"
      style={{ transformPerspective: 1000, rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      whileHover={{ y: -6 }}
      transition={motionTokens.spring.gentle}
      className={searchEntityCardVariants({ variant })}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <LinkComponent
        href={item.href}
        data-slot="entity-link"
        className="flex flex-col items-center gap-5 px-4 py-7 text-center"
      >
        <EntityGlyph name={item.name} imageUrl={item.imageUrl} className="size-[112px] text-2xl" />

        <div className="flex flex-col items-center gap-3">
          <TypePill kind={item.kind} />
          <h3
            data-slot="entity-name"
            className="line-clamp-2 font-[family-name:var(--font-content)] text-base font-semibold leading-tight tracking-[-0.48px] text-white transition-colors group-hover/entity-card:text-red-100"
          >
            {item.name}
          </h3>
          {item.secondary ? (
            <p
              data-slot="entity-secondary"
              className="line-clamp-1 text-sm font-normal leading-[18px] tracking-[-0.126px] text-[#ccc4c4]"
            >
              {item.secondary}
            </p>
          ) : null}
        </div>
      </LinkComponent>
    </motion.article>
  );
}

export { SearchEntityCard, searchEntityCardVariants };
