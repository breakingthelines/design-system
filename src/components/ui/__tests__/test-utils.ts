import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Tiny render helpers for design-system unit tests. The unit test project
 * runs in a node environment without a DOM, so we render trees to a static
 * markup string and assert against it.
 *
 * This mirrors `src/components/g5/__tests__/test-utils.ts` so the
 * conventions are consistent.
 */

export function render(element: React.ReactElement): string {
  return renderToStaticMarkup(element);
}

export function hasSlot(markup: string, slot: string): boolean {
  return markup.includes(`data-slot="${slot}"`);
}

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

export function sliceSlot(markup: string, slot: string): string | undefined {
  const slotNeedle = `data-slot="${slot}"`;
  const slotIdx = markup.indexOf(slotNeedle);
  if (slotIdx === -1) return undefined;
  const openIdx = markup.lastIndexOf('<', slotIdx);
  if (openIdx === -1) return undefined;
  const tagMatch = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(markup.slice(openIdx));
  if (!tagMatch) return undefined;
  const tagName = tagMatch[1];
  const openTagEnd = markup.indexOf('>', openIdx);
  if (openTagEnd === -1) return undefined;
  if (markup[openTagEnd - 1] === '/') {
    return markup.slice(openIdx, openTagEnd + 1);
  }
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

export function getSlotAttr(markup: string, slot: string, attribute: string): string | undefined {
  const slice = sliceSlot(markup, slot);
  if (!slice) return undefined;
  const openTagEnd = slice.indexOf('>');
  if (openTagEnd === -1) return undefined;
  const openTag = slice.slice(0, openTagEnd + 1);
  const re = new RegExp(`\\s${attribute}="([^"]*)"`);
  const match = re.exec(openTag);
  return match ? match[1] : undefined;
}

export function textContent(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slotText(markup: string, slot: string): string {
  const slice = sliceSlot(markup, slot);
  return slice ? textContent(slice) : '';
}
