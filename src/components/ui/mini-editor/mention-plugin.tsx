'use client';

import * as React from 'react';
import { LexicalTypeaheadMenuPlugin, MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import type { TextNode } from 'lexical';
import { createPortal } from 'react-dom';

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';

import { $createMentionNode, type MentionItem, type MentionKind } from './mention-node';
import { decideTypeaheadPlacement } from './typeahead-placement';

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
      {/* Branded fallback: missing OR broken images resolve to the BTL logo
          (Base UI swaps to the fallback on load error), never a broken-image
          glyph or a bare initial. */}
      <Avatar size="sm" aria-hidden="true" className="shrink-0">
        {item.imageUrl ? <AvatarImage src={item.imageUrl} alt="" /> : null}
        <AvatarFallback branded />
      </Avatar>
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      <span className="shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60 uppercase">
        {badge}
      </span>
    </li>
  );
}

/* ────────────────────────────────────────────────────────────
 * Dropdown menu — placement
 *
 * Lexical positions its anchor box, never the menu inside it, and its one
 * attempt at a flip is unreachable for a composer this size. From
 * `LexicalTypeaheadMenuPlugin` (0.43.0) `positionMenu()`:
 *
 *     if ((top + menuHeight > window.innerHeight ||
 *          top + menuHeight > rootElementRect.bottom) &&
 *         top - rootElementRect.top > menuHeight + height) { ...flip... }
 *
 * The first clause correctly notices the overflow. The second asks whether
 * the menu would fit above the caret WITHIN THE CONTENTEDITABLE ROOT — and a
 * MiniEditor root is ~60px tall, so `top - rootElementRect.top` is at most a
 * line or two and the guard is false no matter how much viewport sits above.
 * Measured live in a bottom sheet at 390x780: overflow clause true, room
 * clause false (25px available vs 245.5px required), 716px of unused viewport
 * directly above the caret, menu 166px off-screen.
 *
 * So placement is taken over here. The menu is absolutely positioned inside
 * Lexical's anchor box, which keeps Lexical's caret tracking (the box follows
 * the caret; the menu rides along) while the vertical offset becomes ours.
 * The decision itself is in `typeahead-placement.ts`, pure and unit tested.
 *
 * No transition is attached to the flip, so there is nothing here for
 * `prefers-reduced-motion` to gate — and deliberately so: a menu that
 * animates between sides reads as a glitch, and animating a correction to a
 * position the user has not seen yet has nothing to communicate.
 * ──────────────────────────────────────────────────────────── */

/** Gap between the caret line and the menu's near edge. */
const MENU_GAP_PX = 6;
/** Breathing room kept between the menu and the viewport edge. */
const VIEWPORT_MARGIN_PX = 8;

/** Pre-measurement style: laid out, so it can be measured, but never painted. */
const UNMEASURED_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  visibility: 'hidden',
};

function MentionMenu({
  anchor,
  options,
  selectedIndex,
  onSelect,
  onHighlight,
}: {
  anchor: HTMLElement;
  options: MentionOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onHighlight: (index: number) => void;
}) {
  const menuRef = React.useRef<HTMLUListElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>(UNMEASURED_STYLE);

  const measure = React.useCallback(() => {
    const menu = menuRef.current;
    if (menu === null) return;

    // Lexical has not placed the anchor yet — measuring now would decide
    // against a meaningless position. Stay hidden; the observer below fires
    // the moment it does place it, still before the browser paints.
    if (anchor.style.top === '') return;

    // Measure the menu's NATURAL height, with any clamp from a previous pass
    // lifted. Without this a clamp latches: the clamped height reads back as
    // "fits", the clamp is dropped, the menu overflows, it is clamped again.
    // Read back synchronously, so no paint can occur in between.
    const previousMaxHeight = menu.style.maxHeight;
    menu.style.maxHeight = '';
    const menuHeight = menu.getBoundingClientRect().height;
    menu.style.maxHeight = previousMaxHeight;

    const anchorRect = anchor.getBoundingClientRect();
    const { offsetTop, maxHeight } = decideTypeaheadPlacement({
      anchorTop: anchorRect.top,
      anchorHeight: anchorRect.height,
      menuHeight,
      viewportHeight: window.innerHeight,
      gap: MENU_GAP_PX,
      margin: VIEWPORT_MARGIN_PX,
    });

    setStyle({
      position: 'absolute',
      left: 0,
      top: offsetTop,
      maxHeight: maxHeight ?? undefined,
      visibility: 'visible',
    });
  }, [anchor]);

  // Layout effect, not effect: this runs after the menu is in the DOM and
  // measurable but BEFORE the browser paints, so the menu is never painted at
  // the unplaced position. That is what keeps a flip from reading as a jump —
  // the wrong position is never on screen for even one frame, on open and on
  // every change to the option list.
  React.useLayoutEffect(() => {
    measure();
  }, [measure, options]);

  // Lexical re-runs its own `positionMenu()` on scroll, on window resize and
  // whenever the caret moves, and each pass rewrites the anchor's inline
  // styles. Watching that attribute picks up every one of those without
  // polling and without reaching into Lexical's internals. Writes here land on
  // the menu, not the anchor, so this cannot feed itself.
  React.useLayoutEffect(() => {
    const observer = new MutationObserver(measure);
    observer.observe(anchor, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [anchor, measure]);

  return (
    <ul
      ref={menuRef}
      style={style}
      // z-[100] (Wave 6.4.15b): the Lexical typeahead anchor is appended to
      // `document.body`, NOT to the editor's DOM tree, and the grade /
      // prediction submission sheets are full-screen `z-[60]` overlays while
      // the DS Sheet's backdrop and panel are `z-50`. Earlier waves (6.4.15,
      // 6.4.15a) tried `z-[70]` then `z-[100]` alone — both were no-ops
      // because a `z-index` only applies to a POSITIONED element and the UL
      // was `position: static` by default, so the menu inherited the sheet's
      // stacking context and rendered behind the modal body. Diagnosed at
      // runtime via Playwright on staging (Wave 6.4.15b) with
      // `elementsFromPoint`. The UL is still positioned — `absolute` now
      // rather than `relative`, set from `style` above — so `z-[100]` still
      // applies and still wins over the sheet.
      className="z-[100] max-h-72 min-w-[220px] max-w-[320px] list-none overflow-y-auto overscroll-contain rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {options.map((option, index) => (
        <MentionRow
          key={option.key}
          option={option}
          isSelected={selectedIndex === index}
          onClick={() => onSelect(index)}
          onMouseEnter={() => onHighlight(index)}
        />
      ))}
    </ul>
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
              <MentionMenu
                anchor={anchorElementRef.current}
                options={options}
                selectedIndex={selectedIndex}
                onSelect={(index) => {
                  setHighlightedIndex(index);
                  const option = options[index];
                  if (option) selectOptionAndCleanUp(option);
                }}
                onHighlight={setHighlightedIndex}
              />,
              anchorElementRef.current
            )
          : null
      }
    />
  );
}
