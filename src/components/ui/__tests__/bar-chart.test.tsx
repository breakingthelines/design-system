import { describe, expect, it } from 'vitest';

import { BarChart, barChartSeriesColor, barHeightPercents, stackTotals } from '../bar-chart';
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

  it('paints flat bars, with no gradient toward the foot', () => {
    const markup = render(<BarChart bars={[1, 2]} activeIndex={1} />);

    expect(markup).not.toMatch(/gradient|bg-linear|from-\[|to-muted/);
    expect(getSlotAttr(markup, 'bar-chart-bar', 'class')).toContain(
      'bg-[color-mix(in_oklab,var(--color-foreground)_18%,var(--color-muted))]'
    );
  });
});

describe('stackTotals', () => {
  it('sums each bucket across the series, reading a short series as zero', () => {
    expect(
      stackTotals([
        { key: 'a', label: 'A', values: [1, 2, 3] },
        { key: 'b', label: 'B', values: [4, 5] },
      ])
    ).toEqual([5, 7, 3]);
  });

  it('ignores negative values rather than shrinking the stack', () => {
    expect(stackTotals([{ key: 'a', label: 'A', values: [2, -3] }])).toEqual([2, 0]);
  });
});

describe('BarChart with series', () => {
  const series = [
    { key: 'chat', label: 'Chat', values: [3, 1, 0] },
    { key: 'eval', label: 'Eval', values: [1, 1, 0] },
  ];

  it('scales each bar to its bucket total', () => {
    const markup = render(<BarChart series={series} />);
    const bars = markup.split('data-slot="bar-chart-bar"');

    expect(countSlot(markup, 'bar-chart-bar')).toBe(3);
    expect(getSlotAttr(markup, 'bar-chart', 'style')).toContain('--bar-chart-count:3');
    expect(bars[1]).toContain('height:100%');
    expect(bars[2]).toContain('height:50%');
    expect(bars[3]).toContain('height:0%');
  });

  it('splits each bar into layers by share of its total, first series at the foot', () => {
    const markup = render(<BarChart series={series} />);
    const first = sliceSlot(markup, 'bar-chart-bar') ?? '';

    expect(getSlotAttr(markup, 'bar-chart-bar', 'class')).toContain('flex-col-reverse');
    expect(first.split('data-slot="bar-chart-segment"')).toHaveLength(3);
    expect(first).toMatch(/data-series="chat"[^>]*height:75%/);
    expect(first).toMatch(/data-series="eval"[^>]*height:25%/);
  });

  it('draws no layer for a zero value or an empty bucket', () => {
    const markup = render(<BarChart series={series} />);
    const bars = markup.split('data-slot="bar-chart-bar"');

    expect(countSlot(markup, 'bar-chart-segment')).toBe(4);
    expect(bars[3]).not.toContain('bar-chart-segment');
  });

  it('gives each layer its own token-derived tone unless the caller names one', () => {
    const markup = render(
      <BarChart
        series={[
          { key: 'a', label: 'A', values: [1] },
          { key: 'b', label: 'B', values: [1] },
          { key: 'c', label: 'C', values: [1], color: 'var(--color-primary)' },
        ]}
      />
    );

    expect(barChartSeriesColor(0)).not.toBe(barChartSeriesColor(1));
    expect(markup).toContain('var(--color-foreground) 72%');
    expect(markup).toContain('var(--color-foreground) 46%');
    expect(markup).toContain('background-color:var(--color-primary)');
    expect(markup).not.toMatch(/gradient|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('names the layers in a legend, in stack order', () => {
    const markup = render(<BarChart series={series} />);

    expect(countSlot(markup, 'bar-chart-legend-item')).toBe(2);
    expect(slotText(markup, 'bar-chart-legend')).toBe('Chat Eval');
  });

  it('has no legend for a single series or a plain chart', () => {
    expect(hasSlot(render(<BarChart series={[series[0]]} />), 'bar-chart-legend')).toBe(false);
    expect(hasSlot(render(<BarChart bars={[1, 2]} />), 'bar-chart-legend')).toBe(false);
  });

  it('keeps the pressable form and its labels', () => {
    const markup = render(
      <BarChart
        series={series}
        activeIndex={0}
        onSelect={() => {}}
        barLabel={(index) => `Day ${index + 1}`}
      />
    );
    const first = sliceSlot(markup, 'bar-chart-bar') ?? '';

    expect(first.startsWith('<button')).toBe(true);
    expect(first).toContain('aria-pressed="true"');
    expect(first).toContain('bar-chart-segment');
    expect(markup).toContain('aria-label="Day 3"');
  });
});
