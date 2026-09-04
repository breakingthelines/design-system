import { describe, expect, it } from 'vitest';

import { MetricCard, readDeltaDirection } from '../metric-card';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('MetricCard', () => {
  it('renders the label, the value and nothing it was not given', () => {
    const markup = render(<MetricCard label="Views" value="12,340" />);

    expect(slotText(markup, 'metric-card-label')).toBe('Views');
    expect(slotText(markup, 'metric-card-value')).toBe('12,340');
    expect(hasSlot(markup, 'metric-card-footer')).toBe(false);
    expect(hasSlot(markup, 'metric-card-delta')).toBe(false);
    expect(hasSlot(markup, 'metric-card-hint')).toBe(false);
  });

  it('draws no delta for an empty string, so no dot is left floating', () => {
    // Four of the five content-detail metrics pass delta: "" and detail: "".
    // The local version rendered the delta span and its coloured dot anyway.
    const markup = render(<MetricCard label="Likes" value="0" delta="" hint="" />);

    expect(hasSlot(markup, 'metric-card-delta')).toBe(false);
    expect(hasSlot(markup, 'metric-card-delta-dot')).toBe(false);
    expect(hasSlot(markup, 'metric-card-footer')).toBe(false);
  });

  it('keeps the footer for a hint with no delta', () => {
    const markup = render(<MetricCard label="Views" value="12" hint="Article view starts" />);

    expect(hasSlot(markup, 'metric-card-footer')).toBe(true);
    expect(hasSlot(markup, 'metric-card-delta')).toBe(false);
    expect(slotText(markup, 'metric-card-hint')).toBe('Article view starts');
  });

  it('reads the direction out of a signed delta', () => {
    expect(readDeltaDirection('+12.4%')).toBe('up');
    expect(readDeltaDirection('-3 this week')).toBe('down');
    // The typographic minus, not the hyphen.
    expect(readDeltaDirection('−3')).toBe('down');
    expect(readDeltaDirection('▲ 8')).toBe('up');
    expect(readDeltaDirection('▼ 8')).toBe('down');
    expect(readDeltaDirection(12)).toBe('up');
    expect(readDeltaDirection(-12)).toBe('down');
    expect(readDeltaDirection(0)).toBe('flat');
  });

  it('treats an unsigned delta as flat, not as a rise', () => {
    // "3 pending", "over the last 7 days" and "busiest hour" are all deltas at
    // real call sites. None of them is an increase.
    expect(readDeltaDirection('3 pending')).toBe('flat');
    expect(readDeltaDirection('over the last 7 days')).toBe('flat');
    expect(readDeltaDirection('')).toBe('flat');
  });

  it('colours a signed delta by its sign without being told', () => {
    const up = render(<MetricCard label="Revenue" value="£8.2k" delta="+12.4%" />);
    const down = render(<MetricCard label="Revenue" value="£8.2k" delta="-4.1%" />);

    expect(getSlotAttr(up, 'metric-card-delta', 'data-direction')).toBe('up');
    expect(getSlotAttr(up, 'metric-card-delta', 'data-tone')).toBe('positive');
    expect(getSlotAttr(down, 'metric-card-delta', 'data-direction')).toBe('down');
    expect(getSlotAttr(down, 'metric-card-delta', 'data-tone')).toBe('negative');
  });

  it('does not paint an unsigned delta green', () => {
    // The local version defaulted deltaTone to "positive", so every caption
    // passed through the delta slot came out as good news.
    const markup = render(<MetricCard label="Views" value="12" delta="over the last 7 days" />);

    expect(getSlotAttr(markup, 'metric-card-delta', 'data-tone')).toBe('neutral');
    expect(getSlotAttr(markup, 'metric-card-delta', 'class')).toContain('text-muted-foreground');
  });

  it('inverts the tone for a metric where up is bad', () => {
    const markup = render(
      <MetricCard label="Refunds" value="18" delta="+6" higherIsBetter={false} />
    );

    expect(getSlotAttr(markup, 'metric-card-delta', 'data-direction')).toBe('up');
    expect(getSlotAttr(markup, 'metric-card-delta', 'data-tone')).toBe('negative');
  });

  it('lets an explicit tone beat the sign', () => {
    const markup = render(
      <MetricCard label="Flags" value="4" delta="3 pending" deltaTone="negative" />
    );

    expect(getSlotAttr(markup, 'metric-card-delta', 'data-tone')).toBe('negative');
  });

  it('marks the tone dot decorative — the sign is already in the text', () => {
    const markup = render(<MetricCard label="Revenue" value="£1" delta="+2%" />);

    expect(getSlotAttr(markup, 'metric-card-delta-dot', 'aria-hidden')).toBe('true');
    expect(slotText(markup, 'metric-card-delta')).toBe('+2%');
  });

  it('never colours the hint with the delta tone', () => {
    const markup = render(
      <MetricCard label="Revenue" value="£1" delta="+2%" hint="vs last week" />
    );

    expect(getSlotAttr(markup, 'metric-card-hint', 'class')).toContain('text-muted-foreground');
    expect(countSlot(markup, 'metric-card-hint')).toBe(1);
  });

  it('carries a density rather than leaving padding to a call-site override', () => {
    const comfortable = render(<MetricCard label="A" value="1" />);
    const spacious = render(<MetricCard label="A" value="1" density="spacious" />);

    expect(getSlotAttr(comfortable, 'metric-card', 'class')).toContain('px-4');
    expect(getSlotAttr(spacious, 'metric-card', 'class')).toContain('px-5');
    expect(getSlotAttr(spacious, 'metric-card', 'class')).not.toContain('py-6');
  });

  it('themes from tokens only, so light and dark both resolve', () => {
    const markup = render(
      <MetricCard label="Revenue" value="£8.2k" delta="+12.4%" hint="vs last week" />
    );
    const card = getSlotAttr(markup, 'metric-card', 'class') ?? '';

    expect(card).toContain('bg-card');
    expect(card).toContain('border-border');
    expect(card).toContain('text-card-foreground');
    // The status hues are mixed toward --color-foreground, which flips with the
    // theme, so one class is legible on both surfaces.
    expect(getSlotAttr(markup, 'metric-card-delta', 'class')).toContain('var(--color-foreground)');
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(markup).not.toMatch(/rgba?\(/);
  });

  it('renders no chart, and takes no node that could hold one', () => {
    const markup = render(<MetricCard label="Views" value="12" delta="+2%" />);

    expect(markup).not.toContain('<svg');
    expect(markup).not.toContain('<canvas');
  });
});
