'use client';

import * as React from 'react';
import {
  Cake,
  Crosshair,
  Flag,
  GlobeHemisphereWest,
  MapPin,
  Money,
  Ruler,
  Scroll,
  SneakerMove,
  TShirt,
  Trophy,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { imageChain, useSourceChain } from '#/components/ui/entity-asset-image';
import { useLinkComponent } from '#/components/ui/link-context';

/* ─────────────────────────────────────────────────────────────────────────────
 * EntityMetaChips (Entity page — identity meta strip)
 *
 * A horizontal strip of small icon + value chips summarising an entity's
 * identity facts (nationality, position, contract, stadium, …). Each chip is a
 * 16px Phosphor icon beside a 12px white value. The strip wraps so it stays
 * legible on narrow columns.
 *
 * The component is field-agnostic: the consumer passes the resolved `chips`
 * (icon + value). The icon set differs per entity kind, so this module also
 * exports per-kind icon configs (`PLAYER_META_ICONS`, `MANAGER_META_ICONS`,
 * `TEAM_META_ICONS`) keyed by the canonical field name. Hosts can look up the
 * icon for a known field and pass `{ icon, value }`, or build chips by hand.
 *
 * Render-only: props in, JSX out. No fetching, no router awareness.
 * ──────────────────────────────────────────────────────────────────────────── */

export type EntityMetaKind = 'player' | 'manager' | 'team' | 'competition';

export interface EntityMetaChip {
  /** Phosphor icon component (16px). Omit when `flagSrc` / `imageSrc` is set. */
  icon?: Icon;
  /** Circular flag image URL (a country chip) — rendered instead of `icon`. */
  flagSrc?: string;
  /**
   * Square crest / logo image URL (a club or competition chip) — rendered with
   * `object-contain` (un-cropped) instead of `icon`. Takes precedence over
   * `icon`; `flagSrc` (circular) takes precedence over this.
   */
  imageSrc?: string;
  /**
   * Ordered addresses for `imageSrc`, from `entityAssetCandidates` — BTL's own
   * art, then the mirrored provider layer. Each 404 advances to the next; the
   * chip falls back to `icon` only once every address has missed, which is the
   * whole reason this exists: `imageSrc` alone was chosen over `icon` BEFORE
   * the image loaded, so a 404 left a broken glyph and no icon.
   */
  imageSources?: readonly string[];
  /** Display value, e.g. "England", "27 (b. 1998)", "Right". */
  value: React.ReactNode;
  /**
   * Optional route. When set, the chip becomes a link (via the
   * `useLinkComponent` context) — used for the league / manager chips that
   * deep-link to another entity page.
   */
  href?: string;
  /** Optional stable key. Falls back to the field index. */
  id?: string;
  /** Optional accessible label for the icon (defaults to hidden). */
  label?: string;
}

export interface EntityMetaChipsProps {
  /** Entity kind — recorded as a data attribute for styling / tests. */
  kind: EntityMetaKind;
  /** Resolved chips, left to right. Empty renders nothing. */
  chips: readonly EntityMetaChip[];
  className?: string;
}

/* Canonical per-kind field → icon maps. Values are supplied by the consumer;
 * these only fix the iconography so every surface renders the same glyph for
 * the same field. */

export const PLAYER_META_ICONS = {
  nationality: Flag,
  dob: Cake,
  position: Crosshair,
  foot: SneakerMove,
  height: Ruler,
  shirt: TShirt,
  marketValue: Money,
  contract: Scroll,
} satisfies Record<string, Icon>;

export const MANAGER_META_ICONS = {
  nationality: Flag,
  role: Crosshair,
  dob: Cake,
  height: Ruler,
  contract: Scroll,
} satisfies Record<string, Icon>;

export const TEAM_META_ICONS = {
  country: Flag,
  competition: Trophy,
  stadium: MapPin,
  manager: UsersThree,
} satisfies Record<string, Icon>;

export const COMPETITION_META_ICONS = {
  country: Flag,
  confederation: GlobeHemisphereWest,
} satisfies Record<string, Icon>;

export type PlayerMetaField = keyof typeof PLAYER_META_ICONS;
export type ManagerMetaField = keyof typeof MANAGER_META_ICONS;
export type TeamMetaField = keyof typeof TEAM_META_ICONS;
export type CompetitionMetaField = keyof typeof COMPETITION_META_ICONS;

export function EntityMetaChips({ kind, chips, className }: EntityMetaChipsProps) {
  const Link = useLinkComponent();
  if (chips.length === 0) return null;

  return (
    <ul
      data-slot="entity-meta-chips"
      data-kind={kind}
      className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-white', className)}
    >
      {chips.map((chip, idx) => {
        const glyph = <ChipGlyph chip={chip} />;
        const value = (
          <span className="text-[12px] leading-none tracking-tight text-white">{chip.value}</span>
        );
        return (
          <li
            key={chip.id ?? `entity-meta-chip-${idx}`}
            data-slot="entity-meta-chip"
            className="inline-flex items-center"
          >
            {chip.href ? (
              <Link
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-sm transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:ring-[var(--color-red-100)] focus-visible:outline-none"
              >
                {glyph}
                {value}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {glyph}
                {value}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A chip's leading glyph: the country flag, else the entity image chain, else
 * the Phosphor icon.
 *
 * The image and the icon are alternatives resolved AT LOAD TIME, not at render
 * time. A chip carrying a competition badge address used to suppress its Trophy
 * icon before the browser had said whether the badge exists, so a 404 produced
 * a broken glyph and no fallback at all. Now every address is tried in turn and
 * the icon is what is left when none of them resolves.
 */
function ChipGlyph({ chip }: { chip: EntityMetaChip }) {
  const ChipIcon = chip.icon;
  const { src, onError, imgRef } = useSourceChain(imageChain(chip.imageSources, chip.imageSrc));
  const hidden = chip.label ? undefined : true;

  if (chip.flagSrc) {
    return (
      <img
        src={chip.flagSrc}
        alt={chip.label ?? ''}
        aria-hidden={hidden}
        loading="lazy"
        className="size-4 shrink-0 rounded-full object-cover"
      />
    );
  }
  if (src) {
    return (
      <img
        key={src}
        src={src}
        alt={chip.label ?? ''}
        aria-hidden={hidden}
        loading="lazy"
        ref={imgRef}
        onError={onError}
        className="size-4 shrink-0 object-contain"
      />
    );
  }
  if (ChipIcon) {
    return (
      <ChipIcon
        aria-hidden={hidden}
        aria-label={chip.label}
        weight="regular"
        className="size-4 shrink-0 text-[var(--color-grey-500)]"
      />
    );
  }
  return null;
}
