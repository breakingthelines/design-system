'use client';

import * as React from 'react';

import { DotsThreeVerticalIcon, ArticleNyTimesIcon, FlagIcon, TrashIcon } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu';
import type { ThoughtItem } from '#/types/content';

/**
 * ThoughtOverflowMenu — the canonical `…` affordance pinned to the
 * top-right of every thought surface (the long-form {@link ThoughtCard}
 * timeline tile and the threaded {@link ThoughtComment} primitive). Lifted
 * into its own file in Wave 6.19 for the same reason
 * {@link FromGradePill} was lifted in 6.16: keep both call-sites
 * structurally identical so the menu inherits any future change once.
 *
 * Three intent affordances:
 *  - **Expand to article** — open the Studio compose route pre-seeded
 *    with the thought as a draft source (see Wave 6.11
 *    `compose.new-from-source`). The host owns the route resolution and
 *    URL construction; this component only fires the `onExpandToArticle`
 *    callback so the menu stays router-agnostic.
 *  - **Report** — flag the thought for moderation. Backend support is
 *    pending (no `ReportThought` RPC at time of writing), so hosts wire
 *    this to a "Reports coming soon" toast and document the gap.
 *  - **Delete** — author-only. The host gates rendering by passing
 *    `canDelete`; when false, the item is omitted entirely. The host owns
 *    the `DeleteThought` RPC call.
 *
 * The menu never *closes itself optimistically* on these actions — that
 * stays on the host so the parent feed can drive the optimistic UI (e.g.
 * fading out a deleted thought) consistently with the rest of the page.
 */
export interface ThoughtOverflowMenuProps {
  /**
   * The thought this menu is anchored to. The menu only reads `id` and
   * forwards the full object to `onExpandToArticle` so hosts can compose
   * the deep-link URL with the full set of fields (subject_refs, body,
   * etc).
   */
  thought: ThoughtItem;
  /**
   * When true, the destructive "Delete" affordance renders. Hosts compute
   * this from `viewerId === thought.publisherId` (or any equivalent
   * authorisation check) — the menu stays viewer-id-agnostic.
   */
  canDelete?: boolean;
  /** Fired when the user picks "Expand to article". */
  onExpandToArticle?: (thought: ThoughtItem) => void;
  /** Fired when the user picks "Report". */
  onReport?: (thought: ThoughtItem) => void;
  /** Fired when the user picks "Delete". */
  onDelete?: (thought: ThoughtItem) => void;
  /**
   * Surface tone hint — light surfaces (ThoughtCard) use foreground tints;
   * dark surfaces (ThoughtComment on match panel) use white tints. Mirrors
   * the {@link FromGradePill} tone hint.
   */
  tone?: 'light' | 'dark';
  /** Optional className applied to the trigger button (for positioning). */
  className?: string;
}

function ThoughtOverflowMenu({
  thought,
  canDelete = false,
  onExpandToArticle,
  onReport,
  onDelete,
  tone = 'light',
  className,
}: ThoughtOverflowMenuProps) {
  // Without any actionable handlers the menu is dead weight; skip render so
  // surfaces that don't wire actions (e.g. unauthenticated public reads)
  // don't show a confusing `…` that does nothing.
  if (!onExpandToArticle && !onReport && !(canDelete && onDelete)) {
    return null;
  }

  const triggerClasses =
    tone === 'dark'
      ? 'text-white/60 hover:text-white hover:bg-white/[0.06]'
      : 'text-foreground/50 hover:text-foreground hover:bg-foreground/[0.06]';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Stop propagation so clicking the menu trigger never accidentally
        // navigates the surrounding card (ThoughtCard supports an `onClick`
        // open-thread affordance; the menu must not trip it).
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
        aria-label="More actions"
        data-slot="thought-overflow-menu-trigger"
        className={cn(
          'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-100/40',
          triggerClasses,
          className
        )}
      >
        <DotsThreeVerticalIcon weight="bold" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={4}
        // Keep the popup narrow — three text rows + icons read better at
        // the same width regardless of which surface invoked us.
        className="min-w-[180px]"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
      >
        {onExpandToArticle && (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onExpandToArticle(thought);
            }}
          >
            <ArticleNyTimesIcon />
            <span>Expand to article</span>
          </DropdownMenuItem>
        )}
        {onReport && (
          <DropdownMenuItem
            onClick={(event) => {
              event.stopPropagation();
              onReport(thought);
            }}
          >
            <FlagIcon />
            <span>Report</span>
          </DropdownMenuItem>
        )}
        {canDelete && onDelete && (
          <>
            {(onExpandToArticle || onReport) && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant="destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(thought);
              }}
            >
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ThoughtOverflowMenu };
