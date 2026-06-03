'use client';

import * as React from 'react';
import { LexicalTypeaheadMenuPlugin, MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type { TextNode } from 'lexical';
import { createPortal } from 'react-dom';

import { $createMentionNode, type MentionItem, type MentionKind } from './mention-node';

export type { MentionItem, MentionKind };

/* ────────────────────────────────────────────────────────────
 * Contract
 *
 * `onSearch` is wired by the host to its federated mention-search lane and MUST
 * return {@link MentionItem}s — the polymorphic contract identical to the
 * `@breakingthelines/editor` package. The list is FLAT and RELEVANCE-RANKED: do
 * not reorder it here, search rank is meaningful. Imagery is pre-resolved by the
 * host into `imageUrl`; this plugin renders it directly (monogram fallback) and
 * is therefore decoupled from any imagery manifest.
 * ──────────────────────────────────────────────────────────── */

interface MentionPluginProps {
  /** Federated mention search wired by the host. Returns relevance-ranked {@link MentionItem}s. */
  onSearch: (query: string) => Promise<MentionItem[]>;
  /** Debounce (ms) for `onSearch`. Default 150. */
  debounceMs?: number;
  /** Min query length before searching (excludes the `@`). Default 0. */
  minQueryLength?: number;
}

/** Dropdown badge label per kind. */
const KIND_BADGE: Record<MentionKind, string> = {
  user: 'Person',
  squad: 'Squad',
  club: 'Club',
  player: 'Player',
  manager: 'Manager',
  competition: 'Competition',
  country: 'Country',
};

/** A typeahead option wrapping one {@link MentionItem}. */
class MentionOption extends MenuOption {
  item: MentionItem;

  constructor(item: MentionItem) {
    super(item.id);
    this.item = item;
  }
}

/* ────────────────────────────────────────────────────────────
 * Dropdown row
 * ──────────────────────────────────────────────────────────── */

function MentionRow({
  option,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  option: MentionOption;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const { item } = option;
  const badge = KIND_BADGE[item.kind] ?? item.kind;

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
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          aria-hidden="true"
          className="size-6 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium"
        >
          {item.label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      <span className="shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60 uppercase">
        {badge}
      </span>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────
 * MentionPlugin
 *
 * Built on Lexical's first-party {@link LexicalTypeaheadMenuPlugin}: trigger
 * matching, query extraction, keyboard navigation, menu positioning, and node
 * splitting on select are all owned by the Lexical typeahead API. We therefore
 * do NOT register manual key commands or a text-content listener.
 *
 * useEffect decision: there is NO React data-flow useEffect here. The async
 * search runs from the typeahead's own `onQueryChange` lifecycle hook (debounced
 * via a ref-held timer); results land in state guarded by a mounted ref. The
 * only `useEffect` is a one-line mount/unmount latch that exists purely to make
 * the async setState safe — it carries no derived data and has no deps churn.
 * ──────────────────────────────────────────────────────────── */

// Single `@` trigger followed by query chars (letters, digits, spaces, common
// name punctuation) so multi-word labels — like football entity names — match.
const TRIGGER_RE = /(?:^|\s)@([\p{L}\p{N}][\p{L}\p{N} .'-]*)?$/u;

export function MentionPlugin({
  onSearch,
  debounceMs = 150,
  minQueryLength = 0,
}: MentionPluginProps) {
  const [options, setOptions] = React.useState<MentionOption[]>([]);

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

  const triggerFn = React.useCallback((text: string) => {
    const match = TRIGGER_RE.exec(text);
    if (match === null) return null;
    const matchingString = match[1] ?? '';
    const replaceableString = `@${matchingString}`;
    return {
      leadOffset: match.index + (match[0].length - replaceableString.length),
      matchingString,
      replaceableString,
    };
  }, []);

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
          .then((items) => {
            // Drop stale responses + post-unmount writes.
            if (!mountedRef.current || requestId !== requestIdRef.current) return;
            setOptions(items.map((item) => new MentionOption(item)));
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
    (option: MentionOption, nodeToReplace: TextNode | null, closeMenu: () => void) => {
      const mention = $createMentionNode(option.item);
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
    <LexicalTypeaheadMenuPlugin<MentionOption>
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
                  <MentionRow
                    key={option.key}
                    option={option}
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
