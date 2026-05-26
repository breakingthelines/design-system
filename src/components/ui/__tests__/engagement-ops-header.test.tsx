import { describe, expect, it } from 'vitest';

import { EngagementOpsHeader } from '../engagement-ops-header';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('EngagementOpsHeader', () => {
  const kpis = [
    { id: 'readers', label: 'Readers', value: 1240, delta: 12, deltaUnit: 'percent' as const },
    { id: 'subs', label: 'Subscribers', value: 88, delta: 0 },
    { id: 'thoughts', label: 'Thoughts', value: 53, delta: -5 },
    { id: 'ratings', label: 'Ratings', value: undefined },
  ];

  it('exposes the kpi count on the root', () => {
    const markup = render(<EngagementOpsHeader title="Arsenal Squad" kpis={kpis} />);
    expect(getSlotAttr(markup, 'engagement-ops-header', 'data-kpi-count')).toBe('4');
  });

  it('renders one cell per kpi', () => {
    const markup = render(<EngagementOpsHeader title="Arsenal Squad" kpis={kpis} />);
    expect(countSlot(markup, 'engagement-ops-header-kpi')).toBe(4);
  });

  it('marks the empty kpi cell with data-empty', () => {
    const markup = render(<EngagementOpsHeader title="Arsenal Squad" kpis={kpis} />);
    const slice = markup.split('data-id="ratings"')[1] ?? '';
    expect(slice).toContain('data-empty="true"');
  });

  it('falls back to em-dash for undefined values', () => {
    const markup = render(<EngagementOpsHeader title="X" kpis={kpis} />);
    expect(markup).toContain('—');
  });

  it('writes the delta direction', () => {
    const markup = render(<EngagementOpsHeader title="X" kpis={kpis} />);
    expect(markup).toContain('data-direction="up"');
    expect(markup).toContain('data-direction="flat"');
    expect(markup).toContain('data-direction="down"');
  });

  it('renders window toggles when supplied', () => {
    const markup = render(
      <EngagementOpsHeader
        title="X"
        kpis={kpis}
        windows={[
          { id: '7d', label: '7d', isActive: true },
          { id: '14d', label: '14d' },
          { id: '30d', label: '30d' },
        ]}
      />
    );
    expect(countSlot(markup, 'engagement-ops-header-window')).toBe(3);
    expect(markup).toContain('aria-selected="true"');
  });

  it('renders the subtitle and eyebrow when supplied', () => {
    const markup = render(
      <EngagementOpsHeader
        title="Arsenal Squad"
        eyebrow="Engagement overview"
        subtitle={<span>Last 7 days</span>}
        kpis={kpis}
      />
    );
    expect(hasSlot(markup, 'engagement-ops-header-eyebrow')).toBe(true);
    expect(slotText(markup, 'engagement-ops-header-eyebrow').toLowerCase()).toContain(
      'engagement overview'
    );
    expect(slotText(markup, 'engagement-ops-header-subtitle')).toContain('Last 7 days');
  });
});
