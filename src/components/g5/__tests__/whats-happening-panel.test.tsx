import { describe, expect, it } from 'vitest';

import type { FixtureRowData } from '../fixture-row';
import { rowLiveRealBarca, rowUpcomingFlamengoVasco, whatsHappeningGroups } from '../fixtures';
import {
  groupFixturesByDate,
  WhatsHappeningPanel,
  WHATS_HAPPENING_EMPTY_LINE,
} from '../whats-happening-panel';
import { countSlot, hasSlot, render, slotText, textContent } from './test-utils';

describe('WhatsHappeningPanel', () => {
  it('renders the title, filter bar, date groups and rows', () => {
    const markup = render(<WhatsHappeningPanel groups={whatsHappeningGroups} />);
    expect(hasSlot(markup, 'whats-happening-panel')).toBe(true);
    expect(slotText(markup, 'whats-happening-title')).toBe('What is happening');
    expect(hasSlot(markup, 'fixture-filter-bar')).toBe(true);
    // Two date groups in the fixture sample (May 19 + May 20).
    expect(countSlot(markup, 'fixture-group')).toBe(2);
    // 5 + 1 fixtures across the groups.
    expect(countSlot(markup, 'fixture-row')).toBe(6);
  });

  it('accepts a custom title', () => {
    const markup = render(<WhatsHappeningPanel groups={whatsHappeningGroups} title="Live now" />);
    expect(slotText(markup, 'whats-happening-title')).toBe('Live now');
  });

  it('hides the filter bar when showFilters is false', () => {
    const markup = render(
      <WhatsHappeningPanel groups={whatsHappeningGroups} showFilters={false} />
    );
    expect(hasSlot(markup, 'fixture-filter-bar')).toBe(false);
  });

  it('renders the View-all CTA only when a href is supplied', () => {
    const withCta = render(
      <WhatsHappeningPanel groups={whatsHappeningGroups} viewAllHref="/game/football" />
    );
    expect(hasSlot(withCta, 'whats-happening-view-all')).toBe(true);
    expect(slotText(withCta, 'whats-happening-view-all')).toContain('View all matches');
    expect(withCta).toContain('href="/game/football"');

    const withoutCta = render(<WhatsHappeningPanel groups={whatsHappeningGroups} />);
    expect(hasSlot(withoutCta, 'whats-happening-view-all')).toBe(false);
  });

  it('renders the honest empty state when there are no fixtures', () => {
    const markup = render(<WhatsHappeningPanel groups={[]} viewAllHref="/game/football" />);
    expect(hasSlot(markup, 'whats-happening-empty')).toBe(true);
    expect(slotText(markup, 'whats-happening-empty')).toBe(WHATS_HAPPENING_EMPTY_LINE);
    expect(countSlot(markup, 'fixture-row')).toBe(0);
    // The CTA still renders alongside the empty state.
    expect(hasSlot(markup, 'whats-happening-view-all')).toBe(true);
  });

  it('treats groups whose fixtures are all filtered out as empty', () => {
    const markup = render(
      <WhatsHappeningPanel groups={[{ id: 'd1', dateLabel: 'Monday', fixtures: [] }]} />
    );
    expect(hasSlot(markup, 'whats-happening-empty')).toBe(true);
    expect(hasSlot(markup, 'fixture-group')).toBe(false);
  });
});

describe('groupFixturesByDate', () => {
  const fixtures: FixtureRowData[] = [
    { ...rowLiveRealBarca, id: 'a' },
    { ...rowLiveRealBarca, id: 'b' },
    { ...rowUpcomingFlamengoVasco, id: 'c' },
  ];

  it('coalesces fixtures sharing a bucket key, preserving order', () => {
    const groups = groupFixturesByDate(fixtures, (fixture) =>
      fixture.id === 'c'
        ? { key: '2026-05-20', label: 'Wednesday, May 20' }
        : { key: '2026-05-19', label: 'Tuesday, May 19' }
    );
    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe('2026-05-19');
    expect(groups[0].dateLabel).toBe('Tuesday, May 19');
    expect(groups[0].fixtures.map((f) => f.id)).toEqual(['a', 'b']);
    expect(groups[1].fixtures.map((f) => f.id)).toEqual(['c']);
  });

  it('returns an empty array for no fixtures', () => {
    expect(groupFixturesByDate([], () => ({ key: 'x', label: 'x' }))).toEqual([]);
  });

  it('keeps non-adjacent same-key fixtures in their first bucket', () => {
    const mixed: FixtureRowData[] = [
      { ...rowLiveRealBarca, id: 'a' },
      { ...rowUpcomingFlamengoVasco, id: 'b' },
      { ...rowLiveRealBarca, id: 'c' },
    ];
    const groups = groupFixturesByDate(mixed, (fixture) =>
      fixture.id === 'b' ? { key: 'k2', label: 'Day 2' } : { key: 'k1', label: 'Day 1' }
    );
    // a + c share k1 even though b (k2) sits between them.
    expect(groups).toHaveLength(2);
    expect(groups[0].fixtures.map((f) => f.id)).toEqual(['a', 'c']);
    expect(groups[1].fixtures.map((f) => f.id)).toEqual(['b']);
  });
});

describe('WhatsHappeningPanel a11y', () => {
  it('labels the region by its title', () => {
    const markup = render(<WhatsHappeningPanel groups={whatsHappeningGroups} />);
    expect(markup).toContain('aria-label="What is happening"');
  });

  it('shows the kickoff time but no score for an upcoming row', () => {
    // Upcoming rows render the kickoff time only — no score, so no "0 - 0" can
    // leak into the panel's accessible text (the staging fixtures-panel bug).
    const markup = render(
      <WhatsHappeningPanel
        groups={[{ id: 'd', dateLabel: 'Wed', fixtures: [rowUpcomingFlamengoVasco] }]}
      />
    );
    const text = textContent(markup);
    expect(text).toContain('Flamengo');
    expect(text).toContain('Vasco');
    expect(text).toContain('9 PM');
    expect(text).not.toContain('0 - 0');
    expect(text).not.toContain('0-0');
  });
});
