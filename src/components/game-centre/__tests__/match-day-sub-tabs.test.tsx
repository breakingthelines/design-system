import { describe, expect, it, vi } from 'vitest';

import { MatchDaySubTabs, type MatchDaySubTabItem } from '../match-day-sub-tabs';
import { hasSlot, render } from './test-utils';

const tabs: ReadonlyArray<MatchDaySubTabItem<'timeline' | 'ratings' | 'predictions'>> = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'ratings', label: 'Ratings', count: 24 },
  { id: 'predictions', label: 'Predictions' },
];

describe('MatchDaySubTabs', () => {
  it('renders the rounded-pill row with one button per tab', () => {
    const tree = render(<MatchDaySubTabs tabs={tabs} activeTab="timeline" onChange={() => {}} />);
    expect(hasSlot(tree, 'match-day-sub-tabs')).toBe(true);
    expect(tree).toContain('role="tablist"');
    expect(tree).toContain('aria-label="Match-day sub-tabs"');
    expect(tree).toContain('Timeline');
    expect(tree).toContain('Ratings');
    expect(tree).toContain('Predictions');
    // One button per tab.
    const buttonCount = (tree.match(/<button\b/g) ?? []).length;
    expect(buttonCount).toBe(3);
  });

  it('marks the active tab via aria-selected + data-active', () => {
    const tree = render(<MatchDaySubTabs tabs={tabs} activeTab="ratings" onChange={() => {}} />);
    // Pull out the <button> open-tag for each tab id and assert against its
    // own attribute set. (Attribute order is JSX-prop-order dependent — don't
    // hard-code which side data-tab-id sits on.)
    const ratingsTag = tree.match(/<button\b[^>]*data-tab-id="ratings"[^>]*>/)?.[0] ?? '';
    const timelineTag = tree.match(/<button\b[^>]*data-tab-id="timeline"[^>]*>/)?.[0] ?? '';
    const predictionsTag = tree.match(/<button\b[^>]*data-tab-id="predictions"[^>]*>/)?.[0] ?? '';
    expect(ratingsTag).toContain('aria-selected="true"');
    expect(ratingsTag).toContain('data-active');
    expect(timelineTag).toContain('aria-selected="false"');
    expect(timelineTag).not.toContain('data-active');
    expect(predictionsTag).not.toContain('data-active');
  });

  it('renders the optional count beside the label when > 0', () => {
    const tree = render(<MatchDaySubTabs tabs={tabs} activeTab="timeline" onChange={() => {}} />);
    // The ratings button carries count=24 — the count span sits inside it.
    expect(tree).toMatch(/Ratings<span[^>]*>24<\/span>/);
    // Timeline + Predictions have no count → no <span> with a number inside
    // the button immediately after the label.
    expect(tree).not.toMatch(/Timeline<span[^>]*>\d+<\/span>/);
    expect(tree).not.toMatch(/Predictions<span[^>]*>\d+<\/span>/);
  });

  it('does not render a count span when count is zero', () => {
    const zeroTabs: ReadonlyArray<MatchDaySubTabItem> = [
      { id: 'timeline', label: 'Timeline', count: 0 },
    ];
    const tree = render(
      <MatchDaySubTabs tabs={zeroTabs} activeTab="timeline" onChange={() => {}} />
    );
    // No "0" rendered as a standalone count.
    expect(tree).not.toMatch(/>0</);
  });

  it('passes a custom ariaLabel through to the tablist', () => {
    const tree = render(
      <MatchDaySubTabs
        tabs={tabs}
        activeTab="timeline"
        onChange={() => {}}
        ariaLabel="Match-day modes"
      />
    );
    expect(tree).toContain('aria-label="Match-day modes"');
  });

  it('exposes the active tab via data-active for stable styling hooks', () => {
    const onChange = vi.fn();
    const tree = render(
      <MatchDaySubTabs tabs={tabs} activeTab="predictions" onChange={onChange} />
    );
    const predictionsTag = tree.match(/<button\b[^>]*data-tab-id="predictions"[^>]*>/)?.[0] ?? '';
    expect(predictionsTag).toContain('data-active');
    // Static render — no event invoked.
    expect(onChange).not.toHaveBeenCalled();
  });
});
