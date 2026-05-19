import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Tiny render helpers for the G5 unit tests. The design-system unit project
 * runs in a node environment without a DOM, so we lean on
 * `react-dom/server.renderToStaticMarkup` to flatten the component tree to a
 * string and then make focused assertions against that string.
 *
 * This keeps the tests deterministic and DOM-free, while still letting us
 * verify that nested function components contribute the expected slots,
 * data-attributes, and text.
 */

export type PropsBag = Record<string, unknown>;

export type TypedReactElement = Omit<React.ReactElement, 'props'> & { props: PropsBag };

export function isElement(value: unknown): value is TypedReactElement {
  return React.isValidElement(value);
}

export function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

/**
 * Whether `markup` contains a tag carrying `data-slot="<slot>"`. We do a
 * permissive search — the order of attributes is implementation-defined.
 */
export function hasSlot(markup: string, slot: string): boolean {
  return markup.includes(`data-slot="${slot}"`);
}

/**
 * Count the number of times `data-slot="<slot>"` appears in `markup`.
 */
export function countSlot(markup: string, slot: string): number {
  const needle = `data-slot="${slot}"`;
  let count = 0;
  let index = markup.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = markup.indexOf(needle, index + needle.length);
  }
  return count;
}

/**
 * Extract the substring representing the *first* element that carries the
 * supplied `data-slot`. Returns the markup from the opening `<tag` up to and
 * including the matching closing tag (balanced by name, allowing nested
 * children of the same tag type).
 */
export function sliceSlot(markup: string, slot: string): string | undefined {
  const slotNeedle = `data-slot="${slot}"`;
  const slotIdx = markup.indexOf(slotNeedle);
  if (slotIdx === -1) return undefined;
  // Walk back to the nearest '<' that opens the element holding this slot.
  const openIdx = markup.lastIndexOf('<', slotIdx);
  if (openIdx === -1) return undefined;
  // Read the tag name.
  const tagMatch = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(markup.slice(openIdx));
  if (!tagMatch) return undefined;
  const tagName = tagMatch[1];
  // Find the end of the opening tag.
  const openTagEnd = markup.indexOf('>', openIdx);
  if (openTagEnd === -1) return undefined;
  // Self-closing?
  if (markup[openTagEnd - 1] === '/') {
    return markup.slice(openIdx, openTagEnd + 1);
  }
  // Walk forward counting balanced <tagName ...> ... </tagName>.
  let depth = 1;
  let cursor = openTagEnd + 1;
  const openPattern = new RegExp(`<${tagName}(\\s|>)`, 'g');
  const closePattern = new RegExp(`</${tagName}>`, 'g');
  while (depth > 0 && cursor < markup.length) {
    openPattern.lastIndex = cursor;
    closePattern.lastIndex = cursor;
    const nextOpen = openPattern.exec(markup);
    const nextClose = closePattern.exec(markup);
    if (!nextClose) return undefined;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      cursor = nextClose.index + nextClose[0].length;
      if (depth === 0) {
        return markup.slice(openIdx, cursor);
      }
    }
  }
  return undefined;
}

/**
 * Returns the value of a single attribute on the (first) element that carries
 * `data-slot="<slot>"`. Undefined if not present.
 */
export function getSlotAttr(
  markup: string,
  slot: string,
  attribute: string
): string | undefined {
  const slice = sliceSlot(markup, slot);
  if (!slice) return undefined;
  // Read just the opening tag (up to first '>').
  const openTagEnd = slice.indexOf('>');
  if (openTagEnd === -1) return undefined;
  const openTag = slice.slice(0, openTagEnd + 1);
  const re = new RegExp(`\\s${attribute}="([^"]*)"`);
  const match = re.exec(openTag);
  return match ? match[1] : undefined;
}

/**
 * Strip every HTML tag from `markup`, returning visible text only.
 */
export function textContent(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns the visible text content of the (first) element carrying
 * `data-slot="<slot>"`.
 */
export function slotText(markup: string, slot: string): string {
  const slice = sliceSlot(markup, slot);
  return slice ? textContent(slice) : '';
}

/**
 * Iterate over every element carrying `data-slot="<slot>"`. Yields the slice
 * of markup for each occurrence (balanced opening + closing tag).
 */
export function* eachSlot(markup: string, slot: string): Generator<string> {
  const slotNeedle = `data-slot="${slot}"`;
  let cursor = 0;
  while (cursor < markup.length) {
    const slotIdx = markup.indexOf(slotNeedle, cursor);
    if (slotIdx === -1) return;
    const openIdx = markup.lastIndexOf('<', slotIdx);
    if (openIdx === -1) return;
    const slice = sliceSlot(markup.slice(openIdx), slot);
    if (!slice) return;
    yield slice;
    cursor = openIdx + slice.length;
  }
}

/**
 * Returns the value of an attribute on the opening tag of `slice`. Tolerates
 * any attribute ordering. Undefined if the attribute is absent.
 */
export function getAttr(slice: string, attribute: string): string | undefined {
  const openTagEnd = slice.indexOf('>');
  if (openTagEnd === -1) return undefined;
  const openTag = slice.slice(0, openTagEnd + 1);
  const re = new RegExp(`\\s${attribute}="([^"]*)"`);
  const match = re.exec(openTag);
  return match ? match[1] : undefined;
}
