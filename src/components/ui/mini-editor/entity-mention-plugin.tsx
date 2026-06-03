'use client';

import * as React from 'react';
import { LexicalTypeaheadMenuPlugin, MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type { TextNode } from 'lexical';
import { createPortal } from 'react-dom';

import { entityImage, type EntityImageManifest } from '#/lib/entity-image';
import { entityImageTypeForSubject } from './entity-mention-node';
import { $createEntityMentionNode } from './entity-mention-node';

/* ────────────────────────────────────────────────────────────
 * Contract
 *
 * `EntityHit` is the SEARCH-lane result row and the node payload, both equal to
 * the `context.v1.SubjectRef` display snapshot. The platform wires `onSearch`
 * to the entity-search endpoint; it MUST return this exact shape (no extra
 * fields), so a hit drops straight into {@link $createEntityMentionNode}.
 * ──────────────────────────────────────────────────────────── */

export interface EntityHit {
  /** BTL canonical identity id — a content-hashed `btl_football_*` id. */
  canonicalId: string;
  /** Lower-cased SubjectType (`team` | `player` | `coach` | `venue` | `competition`). */
  subjectType: string;
  /** Display label (e.g. "Aston Villa", "Erling Haaland"). */
  label: string;
  /** Canonical slug. */
  slug: string;
  /** Optional CORS-clean image URL snapshot. */
  imageUrl?: string;
  /** Optional fully-resolved canonical href. */
  canonicalUrl?: string;
}

export interface EntityMentionPluginProps {
  /**
   * Search callback wired by the host to the entity-search endpoint. Returns
   * {@link EntityHit}s (the SubjectRef shape). Disambiguation from the user
   * @mention plugin is by TRIGGER: this plugin owns its own `trigger` char, so
   * a host that mounts both gives each a distinct trigger.
   */
  onSearch: (query: string) => Promise<EntityHit[]>;
  /** Imagery manifest, used to resolve each hit's crest via {@link entityImage}. */
  manifest: EntityImageManifest;
  /** Trigger character. Default `'@'`. Set a distinct char to co-exist with the user @mention plugin. */
  trigger?: string;
  /** Debounce (ms) for `onSearch`. Default 150. */
  debounceMs?: number;
  /** Min query length before searching (excludes the trigger). Default 0. */
  minQueryLength?: number;
}

const TYPE_BADGE: Record<string, string> = {
  team: 'Team',
  player: 'Player',
  coach: 'Manager',
  venue: 'Stadium',
  competition: 'Competition',
};

/** A typeahead option wrapping one {@link EntityHit}. */
class EntityMentionOption extends MenuOption {
  hit: EntityHit;

  constructor(hit: EntityHit) {
    super(hit.canonicalId);
    this.hit = hit;
  }
}

/* ────────────────────────────────────────────────────────────
 * Dropdown row
 * ──────────────────────────────────────────────────────────── */

function EntityMentionRow({
  option,
  manifest,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  option: EntityMentionOption;
  manifest: EntityImageManifest;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const { hit } = option;
  const crestUrl = entityImage(
    entityImageTypeForSubject(hit.subjectType),
    hit.canonicalId,
    manifest,
    {
      imageUrl: hit.imageUrl,
    }
  );
  const badge = TYPE_BADGE[hit.subjectType] ?? hit.subjectType;

  return (
    <li
      key={option.key}
      ref={option.setRefElement.bind(option)}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
    >
      {crestUrl ? (
        <img
          src={crestUrl}
          alt=""
          aria-hidden="true"
          className="size-6 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >
          {hit.label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{hit.label}</span>
      <span className="shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60 uppercase">
        {badge}
      </span>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────
 * EntityMentionPlugin
 *
 * Built on Lexical's first-party {@link LexicalTypeaheadMenuPlugin}: trigger
 * matching, query extraction, keyboard navigation, menu positioning, and node
 * splitting on select are all owned by the Lexical typeahead API. We therefore
 * do NOT register manual key commands or a text-content listener (the approach
 * the older user MentionPlugin takes).
 *
 * useEffect decision: there is NO React data-flow useEffect here. The async
 * search runs from the typeahead's own `onQueryChange` lifecycle hook (debounced
 * via a ref-held timer); results land in state guarded by a mounted ref. The
 * only `useEffect` is a one-line mount/unmount latch that exists purely to make
 * the async setState safe — it carries no derived data and has no deps churn.
 * ──────────────────────────────────────────────────────────── */

export function EntityMentionPlugin({
  onSearch,
  manifest,
  trigger = '@',
  debounceMs = 150,
  minQueryLength = 0,
}: EntityMentionPluginProps) {
  const [options, setOptions] = React.useState<EntityMentionOption[]>([]);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);
  const requestIdRef = React.useRef(0);

  // Mount/unmount latch only — no derived data, guards the async setState below.
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Trigger matcher: `<trigger>` followed by query chars (letters, digits,
  // spaces, common name punctuation) so multi-word entity labels match.
  const triggerFn = React.useCallback(
    (text: string) => {
      const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|\\s)${escaped}([\\p{L}\\p{N}][\\p{L}\\p{N} .'\\-]*)?$`, 'u');
      const match = re.exec(text);
      if (match === null) return null;
      const matchingString = match[1] ?? '';
      const replaceableString = `${trigger}${matchingString}`;
      return {
        leadOffset: match.index + (match[0].length - replaceableString.length),
        matchingString,
        replaceableString,
      };
    },
    [trigger]
  );

  const handleQueryChange = React.useCallback(
    (matchingString: string | null) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (matchingString === null || matchingString.length < minQueryLength) {
        setOptions([]);
        return;
      }

      const requestId = ++requestIdRef.current;
      timerRef.current = setTimeout(() => {
        onSearch(matchingString)
          .then((hits) => {
            // Drop stale responses + post-unmount writes.
            if (!mountedRef.current || requestId !== requestIdRef.current) return;
            setOptions(hits.map((hit) => new EntityMentionOption(hit)));
          })
          .catch(() => {
            if (!mountedRef.current || requestId !== requestIdRef.current) return;
            setOptions([]);
          });
      }, debounceMs);
    },
    [onSearch, debounceMs, minQueryLength]
  );

  const handleSelectOption = React.useCallback(
    (option: EntityMentionOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      const { hit } = option;
      const mention = $createEntityMentionNode({
        canonicalId: hit.canonicalId,
        subjectType: hit.subjectType,
        label: hit.label,
        slug: hit.slug,
        imageUrl: hit.imageUrl,
      });
      if (nodeToReplace) {
        nodeToReplace.replace(mention);
      }
      mention.select();
      closeMenu();
      setOptions([]);
    },
    []
  );

  return (
    <LexicalTypeaheadMenuPlugin<EntityMentionOption>
      options={options}
      onQueryChange={handleQueryChange}
      onSelectOption={handleSelectOption}
      triggerFn={triggerFn}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) =>
        anchorElementRef.current && options.length > 0
          ? createPortal(
              <ul className="z-50 mt-1 min-w-[220px] max-w-[320px] list-none rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                {options.map((option, index) => (
                  <EntityMentionRow
                    key={option.key}
                    option={option}
                    manifest={manifest}
                    isSelected={selectedIndex === index}
                    onClick={() => {
                      setHighlightedIndex(index);
                      selectOptionAndCleanUp(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  />
                ))}
              </ul>,
              anchorElementRef.current
            )
          : null
      }
    />
  );
}
