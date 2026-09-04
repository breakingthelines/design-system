import { describe, expect, it } from 'vitest';

import { BarChart, barHeightPercents } from '../bar-chart';
import { countSlot, getSlotAttr, hasSlot, render, sliceSlot, slotText } from './test-utils';

describe('barHeightPercents', () => {
  it('scales to the largest value, so the tallest bar fills the plot', () => {
    expect(barHeightPercents([25, 50, 100])).toEqual([25, 50, 100]);
  });

  it('leaves an empty window empty rather than stretching it to look full', () => {
    expect(barHeightPercents([0, 0, 0])).toEqual([0, 0, 0]);
    expect(barHeightPercents([])).toEqual([]);
  });
});

describe('BarChart', () => {
  it('scales the values itself, so no call site has to know the plot height', () => {
    // The local version took pixel heights and its own call site computed them
    // against a 120px ceiling inside a 220px plot.
    const markup = render(<BarChart bars={[5, 10]} />);
    const bars = markup.split('data-slot="bar-chart-bar"');

    expect(countSlot(markup, 'bar-chart-bar')).toBe(2);
    expect(bars[1]).toContain('height:50%');
    expect(bars[2]).toContain('height:100%');
  });

  it('gives both grids one track per bar, not a fixed fourteen', () => {
    // The local grid was pinned to fourteen columns, so a seven-day window left
    // half the plot empty and a ninety-day one ran off the end of it.
    const markup = render(
      <BarChart
        bars={[1, 2, 3, 4, 5, 6, 7]}
        labels={Array.from({ length: 7 }, (_, index) => ({ top: '1', bottom: `Day ${index + 1}` }))}
      />
    );

    expect(getSlotAttr(markup, 'bar-chart', 'style')).toContain('--bar-chart-count:7');
    expect(getSlotAttr(markup, 'bar-chart-plot', 'class')).toContain(
      'repeat(var(--bar-chart-count,1),44px)'
    );
    expect(getSlotAttr(markup, 'bar-chart-plot', 'class')).toContain(
      'md:[grid-template-columns:repeat(var(--bar-chart-count,1),minmax(0,1fr))]'
    );
    expect(getSlotAttr(markup, 'bar-chart-labels', 'class')).toContain(
      'repeat(var(--bar-chart-count,1),44px)'
    );
  });

  it('draws plain marks when there is nothing to select', () => {
    // Ninety unreachable buttons labelled "Select bar 1" were what the local
    // version put in the tab order on a chart with no onSelect.
    const markup = render(<BarChart bars={[1, 2, 3]} />);

    expect(markup).not.toContain('<button');
    expect(markup).not.toContain('Select bar');
    expect(getSlotAttr(markup, 'bar-chart-bar', 'aria-hidden')).toBe('true');
  });

  it('makes the bars buttons once they do something', () => {
    const markup = render(<BarChart bars={[1, 2, 3]} activeIndex={1} onSelect={() => {}} />);
    const first = sliceSlot(markup, 'bar-chart-bar') ?? '';

    expect(first.startsWith('<button')).toBe(true);
    expect(markup).toContain('aria-label="Select bar 1"');
    expect(first).toContain('aria-pressed="false"');
    expect(first).toContain('focus-visible:outline-ring');
  });

  it('lets the caller name a bucket rather than its position', () => {
    const markup = render(
      <BarChart bars={[1, 2]} onSelect={() => {}} barLabel={(index) => `Dec ${11 + index}`} />
    );

    expect(markup).toContain('aria-label="Dec 11"');
    expect(markup).toContain('aria-label="Dec 12"');
    expect(markup).not.toContain('Select bar');
  });

  it('reads every bar as selected when there is no selection', () => {
    const markup = render(<BarChart bars={[1, 2, 3]} />);

    expect(markup.split('data-active="true"')).toHaveLength(4);
    expect(markup).not.toContain('data-active="false"');
  });

  it('lifts one bar and brightens its label once there is a selection', () => {
    const markup = render(
      <BarChart
        bars={[1, 2, 3]}
        activeIndex={2}
        labels={[
          { top: '1', bottom: 'A' },
          { top: '2', bottom: 'B' },
          { top: '3', bottom: 'C' },
        ]}
      />
    );
    const bars = markup.split('data-slot="bar-chart-bar"');
    const labels = markup.split('data-slot="bar-chart-label"');

    expect(bars[1]).toContain('data-active="false"');
    expect(bars[3]).toContain('data-active="true"');
    expect(labels[1]).not.toContain('text-foreground');
    expect(labels[3]).toContain('text-foreground');
  });

  it('leaves the tail unlabelled rather than throwing on a short label list', () => {
    const markup = render(<BarChart bars={[1, 2, 3]} labels={[{ top: '1', bottom: 'A' }]} />);

    expect(countSlot(markup, 'bar-chart-label')).toBe(3);
    expect(countSlot(markup, 'bar-chart-label-top')).toBe(1);
    expect(slotText(markup, 'bar-chart-labels')).toBe('1 A');
  });

  it('takes the plot height as a property rather than a class override', () => {
    const markup = render(<BarChart bars={[1]} height={120} />);

    expect(getSlotAttr(markup, 'bar-chart', 'style')).toContain('--bar-chart-height:120px');
    expect(getSlotAttr(markup, 'bar-chart-plot', 'class')).toContain(
      'h-[var(--bar-chart-height,220px)]'
    );
  });

  it('scrolls the bars and their labels as one, so they cannot drift apart', () => {
    const markup = render(<BarChart bars={[1, 2]} labels={[{ top: '1', bottom: 'A' }]} />);
    const wrapper = getSlotAttr(markup, 'bar-chart', 'class') ?? '';

    expect(wrapper).toContain('overflow-x-auto');
    expect(wrapper).toContain('md:overflow-x-visible');
    // The plot must not clip below md or the wrapper could not scroll the
    // off-screen columns back into view.
    expect(getSlotAttr(markup, 'bar-chart-plot', 'class')).toContain('overflow-visible');
    expect(getSlotAttr(markup, 'bar-chart-plot', 'class')).toContain('md:overflow-hidden');
  });

  it('has no labels row at all when it was given none', () => {
    expect(hasSlot(render(<BarChart bars={[1, 2]} />), 'bar-chart-labels')).toBe(false);
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(
      <BarChart bars={[1, 2]} activeIndex={1} labels={[{ top: '1', bottom: 'A' }]} />
    );
    const bars = markup.split('data-slot="bar-chart-bar"');

    // Both tones mix the foreground toward the panel, so the bars sit above the
    // surface under :root and under .dark from one definition.
    expect(bars[1]).toContain('var(--color-foreground)');
    expect(bars[2]).toContain('var(--color-foreground)');
    expect(bars[2]).toContain('border-border');
    expect(getSlotAttr(markup, 'bar-chart-labels', 'class')).toContain('text-muted-foreground');
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});
