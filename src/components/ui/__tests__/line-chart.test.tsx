import { describe, expect, it } from 'vitest';

import { buildAreaPath, buildSmoothLinePath, getLinePoints, LineChart } from '../line-chart';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('getLinePoints', () => {
  it('spreads the series across the full width and insets the extremes', () => {
    const points = getLinePoints([0, 5, 10]);

    expect(points.map((point) => point.x)).toEqual([0, 50, 100]);
    // 10px of padding top and bottom, so the peak is at 10 and the floor at 90.
    expect(points[0].y).toBe(90);
    expect(points[2].y).toBe(10);
  });

  it('draws a constant series flat instead of dividing by zero', () => {
    const points = getLinePoints([30, 30, 30]);

    expect(points.every((point) => Number.isFinite(point.y))).toBe(true);
    expect(new Set(points.map((point) => point.y))).toEqual(new Set([90]));
  });

  it('holds a single point at the origin rather than at NaN', () => {
    expect(getLinePoints([7])).toEqual([{ x: 0, y: 90 }]);
  });
});

describe('buildSmoothLinePath / buildAreaPath', () => {
  it('draws nothing for a series that cannot make a line', () => {
    expect(buildSmoothLinePath([])).toBe('');
    expect(buildSmoothLinePath(getLinePoints([4]))).toBe('');
    expect(buildAreaPath(getLinePoints([4]))).toBe('');
  });

  it('closes the area down to the baseline so it can be filled', () => {
    const area = buildAreaPath(getLinePoints([1, 2, 3]));

    expect(area.startsWith('M ')).toBe(true);
    expect(area.endsWith('Z')).toBe(true);
    expect(area).toContain('L 100,100');
    expect(area).toContain('L 0,100');
  });
});

describe('LineChart', () => {
  it('draws the line and the area, and nothing it was not given', () => {
    const markup = render(<LineChart series={[1, 4, 2, 8]} />);

    expect(hasSlot(markup, 'line-chart-line')).toBe(true);
    expect(hasSlot(markup, 'line-chart-area')).toBe(true);
    expect(hasSlot(markup, 'line-chart-axis')).toBe(false);
    expect(hasSlot(markup, 'line-chart-tooltip')).toBe(false);
  });

  it('gives the axis one track per label, not a fixed eight', () => {
    // The local version pinned the grid to eight columns, so the three-label
    // axis its own call site passed sat crammed into the left third.
    const markup = render(<LineChart series={[1, 2, 3]} xLabels={['Jun 1', 'Jul 16', 'Aug 30']} />);

    expect(countSlot(markup, 'line-chart-axis-label')).toBe(3);
    expect(getSlotAttr(markup, 'line-chart', 'style')).toContain('--line-chart-x-count:3');
    expect(getSlotAttr(markup, 'line-chart-axis', 'class')).toContain(
      'repeat(var(--line-chart-x-count,1),minmax(0,1fr))'
    );
  });

  it('renders the readout on the last point when it is not told which', () => {
    const markup = render(
      <LineChart series={[1, 2, 3, 9]} tooltip={{ title: '$2,250', subtitle: 'Earned' }} />
    );

    expect(slotText(markup, 'line-chart-tooltip-title')).toBe('$2,250');
    expect(slotText(markup, 'line-chart-tooltip-subtitle')).toBe('Earned');
    // The last point of a four-value series sits at x=100%.
    expect(getSlotAttr(markup, 'line-chart-dot', 'style')).toContain('--line-chart-point-x:100%');
  });

  it('holds the readout at the index it is given', () => {
    const markup = render(
      <LineChart
        series={[1, 2, 3, 9]}
        activeIndex={1}
        tooltip={{ title: '2', subtitle: 'Views' }}
      />
    );

    expect(getSlotAttr(markup, 'line-chart-tooltip', 'style')).toContain(
      '--line-chart-point-x:33.33'
    );
  });

  it('waits for the pointer before drawing a readout when it is interactive', () => {
    const markup = render(
      <LineChart series={[1, 2, 3]} interactive tooltip={{ title: '3', subtitle: 'Views' }} />
    );

    expect(hasSlot(markup, 'line-chart-dot')).toBe(false);
    expect(hasSlot(markup, 'line-chart-tooltip')).toBe(false);
    expect(getSlotAttr(markup, 'line-chart-plot', 'data-interactive')).toBe('true');
    expect(getSlotAttr(markup, 'line-chart-plot', 'class')).toContain('cursor-pointer');
  });

  it('publishes the point x as a custom property so the narrow rule can clamp it', () => {
    // An inline `left` could not be overridden, and a dot centred on the last
    // point would hang past the chart's right edge and widen the page.
    const markup = render(<LineChart series={[1, 2, 3]} />);
    const dotClass = getSlotAttr(markup, 'line-chart-dot', 'class') ?? '';

    expect(dotClass).toContain('left-[clamp(4px,var(--line-chart-point-x,50%),calc(100%_-_4px))]');
    expect(dotClass).toContain('md:left-[var(--line-chart-point-x,50%)]');
    expect(getSlotAttr(markup, 'line-chart-dot', 'style')).not.toMatch(/(^|;)left:/);
  });

  it('takes the plot height as a property rather than a class override', () => {
    const markup = render(<LineChart series={[1, 2]} height={120} />);

    expect(getSlotAttr(markup, 'line-chart', 'style')).toContain('--line-chart-height:120px');
    expect(getSlotAttr(markup, 'line-chart-plot', 'class')).toContain(
      'h-[var(--line-chart-height,220px)]'
    );
  });

  it('hides the plot from assistive tech and leaves the axis readable', () => {
    const markup = render(<LineChart series={[1, 2, 3]} xLabels={['A', 'B', 'C']} />);

    expect(getSlotAttr(markup, 'line-chart-svg', 'aria-hidden')).toBe('true');
    expect(getSlotAttr(markup, 'line-chart-dot', 'aria-hidden')).toBe('true');
    expect(slotText(markup, 'line-chart-axis')).toBe('A B C');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(
      <LineChart
        series={[1, 5, 3]}
        xLabels={['A', 'B', 'C']}
        tooltip={{ title: '5', subtitle: 'Peak' }}
      />
    );

    // The stroke and both gradient stops are the foreground, which flips with
    // the theme. The local version drew #ffffff over a #bfbfbf-to-#2B2B2B fade,
    // which was legible on a dark panel only.
    expect(getSlotAttr(markup, 'line-chart-line', 'class')).toContain('stroke-foreground');
    expect(markup).toContain('var(--color-foreground)');
    expect(markup).toContain('var(--color-muted)');
    expect(getSlotAttr(markup, 'line-chart-tooltip', 'class')).toContain('bg-popover');
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });
});
