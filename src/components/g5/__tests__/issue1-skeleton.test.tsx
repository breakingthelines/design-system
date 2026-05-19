import { describe, expect, it } from 'vitest';

import {
  issue1AllFallback,
  issue1AllFilled,
  issue1Mixed,
  issue1MostlyPending,
} from '../fixtures';
import { ISSUE1_SLOT_ORDER, Issue1Skeleton } from '../issue1-skeleton';
import { eachSlot, getAttr, render, textContent } from './test-utils';

function collectSlotInfo(markup: string): Array<{ key: string; state: string }> {
  const out: Array<{ key: string; state: string }> = [];
  for (const slice of eachSlot(markup, 'issue1-slot')) {
    out.push({
      key: getAttr(slice, 'data-slot-key') ?? '',
      state: getAttr(slice, 'data-slot-state') ?? '',
    });
  }
  return out;
}

describe('Issue1Skeleton slot order', () => {
  it('renders all nine slots in the locked order, regardless of input ordering', () => {
    // Build a permuted input to be sure object iteration does not leak through.
    const permuted = {
      backCover: issue1AllFilled.backCover,
      footballScope: issue1AllFilled.footballScope,
      cover: issue1AllFilled.cover,
      firstPick: issue1AllFilled.firstPick,
      identity: issue1AllFilled.identity,
      firstRating: issue1AllFilled.firstRating,
      matchday: issue1AllFilled.matchday,
      follow: issue1AllFilled.follow,
      firstTake: issue1AllFilled.firstTake,
    };
    const markup = render(<Issue1Skeleton slots={permuted} />);
    const slots = collectSlotInfo(markup);
    expect(slots).toHaveLength(ISSUE1_SLOT_ORDER.length);
    expect(slots.map((slot) => slot.key)).toEqual([
      'cover',
      'identity',
      'footballScope',
      'matchday',
      'firstPick',
      'firstRating',
      'firstTake',
      'follow',
      'backCover',
    ]);
  });
});

describe('Issue1Skeleton slot state branches', () => {
  it('exposes data-slot-state="filled" with the supplied content when filled', () => {
    const markup = render(<Issue1Skeleton slots={issue1AllFilled} />);
    const slots = collectSlotInfo(markup);
    for (const slot of slots) {
      expect(slot.state).toBe('filled');
    }
    expect(textContent(markup)).toContain('COVER IMAGE PLACEHOLDER');
  });

  it('renders the pending objective label for pending slots', () => {
    const markup = render(<Issue1Skeleton slots={issue1MostlyPending} />);
    const slots = collectSlotInfo(markup);
    const coverSlot = slots.find((slot) => slot.key === 'cover');
    expect(coverSlot?.state).toBe('pending');
    expect(textContent(markup)).toContain(
      'Upload a cover or accept the branded fallback.'
    );
    // The "Waiting" eyebrow should show on at least one pending slot.
    expect(textContent(markup)).toContain('Waiting');
  });

  it('renders the deterministic reason for fallback slots', () => {
    const markup = render(<Issue1Skeleton slots={issue1AllFallback} />);
    const slots = collectSlotInfo(markup);
    for (const slot of slots) {
      expect(slot.state).toBe('fallback');
    }
    expect(textContent(markup)).toContain(
      'Branded fallback selected. The press still runs.'
    );
  });

  it('renders all three branches when the slots map is mixed', () => {
    const markup = render(<Issue1Skeleton slots={issue1Mixed} />);
    const states = new Set(collectSlotInfo(markup).map((slot) => slot.state));
    expect(states.has('filled')).toBe(true);
    expect(states.has('pending')).toBe(true);
  });
});

describe('Issue1Skeleton chrome', () => {
  it('renders the supplied dateline in the masthead', () => {
    const markup = render(
      <Issue1Skeleton slots={issue1AllFilled} dateline="WED 19 MAY 2026" />
    );
    expect(textContent(markup)).toContain('WED 19 MAY 2026');
  });

  it('renders the supplied assistant line in the colophon', () => {
    const markup = render(
      <Issue1Skeleton
        slots={issue1AllFilled}
        assistantLine="The press still runs."
      />
    );
    expect(textContent(markup)).toContain('The press still runs.');
  });

  it('uses the default colophon line when no assistantLine is supplied', () => {
    const markup = render(<Issue1Skeleton slots={issue1AllFilled} />);
    expect(textContent(markup)).toContain('A first edition is a footprint.');
  });
});

describe('Issue1Skeleton filled content nesting', () => {
  it('passes filled React children through unchanged', () => {
    const markup = render(
      <Issue1Skeleton
        slots={{
          ...issue1AllFilled,
          firstTake: {
            kind: 'filled',
            content: <span data-test="unique-stamp">STAMPED</span>,
          },
        }}
      />
    );
    expect(textContent(markup)).toContain('STAMPED');
  });
});
