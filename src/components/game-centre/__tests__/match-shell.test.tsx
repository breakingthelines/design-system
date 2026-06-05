import { describe, expect, it } from 'vitest';

import { MatchAdRail, MatchAdSlot, MatchRecapStrip, MatchShell } from '../match-shell';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('MatchShell', () => {
  it('renders the main column with the three-column preset by default', () => {
    const markup = render(
      <MatchShell>
        <div>content</div>
      </MatchShell>
    );
    expect(getSlotAttr(markup, 'match-shell', 'data-columns')).toBe('three');
    expect(getSlotAttr(markup, 'match-shell', 'data-has-aside')).toBe('false');
    expect(hasSlot(markup, 'match-shell-main')).toBe(true);
    expect(hasSlot(markup, 'match-shell-aside')).toBe(false);
  });

  it('renders the aside rail only when aside content is supplied', () => {
    const markup = render(
      <MatchShell aside={<div>rail</div>}>
        <div>content</div>
      </MatchShell>
    );
    expect(getSlotAttr(markup, 'match-shell', 'data-has-aside')).toBe('true');
    expect(hasSlot(markup, 'match-shell-aside')).toBe(true);
    expect(slotText(markup, 'match-shell-aside')).toContain('rail');
  });

  it('carries the two-column preset for the Stats layout', () => {
    const markup = render(
      <MatchShell columns="two">
        <div>stats</div>
      </MatchShell>
    );
    expect(getSlotAttr(markup, 'match-shell', 'data-columns')).toBe('two');
  });
});

describe('MatchAdRail + MatchAdSlot', () => {
  it('stacks AD slots inside the rail', () => {
    const markup = render(
      <MatchAdRail>
        <MatchAdSlot height={400} />
        <MatchAdSlot height={339} />
      </MatchAdRail>
    );
    expect(hasSlot(markup, 'match-ad-rail')).toBe(true);
    // Two placeholder slots.
    expect((markup.match(/data-slot="match-ad-slot"/g) ?? []).length).toBe(2);
  });

  it('renders the default AD label and applies the gradient', () => {
    const markup = render(<MatchAdSlot />);
    expect(slotText(markup, 'match-ad-slot')).toContain('AD');
    expect(markup).toContain('from-[#191919]');
    expect(markup).toContain('to-[#262525]');
  });

  it('honours a custom label', () => {
    const markup = render(<MatchAdSlot label="Sponsored" />);
    expect(slotText(markup, 'match-ad-slot')).toContain('Sponsored');
  });
});

describe('MatchRecapStrip', () => {
  const props = {
    home: { label: 'Arsenal', shortLabel: 'ARS' },
    away: { label: 'Chelsea', shortLabel: 'CHE' },
    scoreHome: 1,
    scoreAway: 2,
  };

  it('renders the status, both sides and the score', () => {
    const markup = render(<MatchRecapStrip {...props} />);
    expect(slotText(markup, 'match-recap-strip-status')).toContain('FT');
    expect(slotText(markup, 'match-recap-strip')).toContain('Arsenal');
    expect(slotText(markup, 'match-recap-strip')).toContain('Chelsea');
    const score = slotText(markup, 'match-recap-strip-score');
    expect(score).toContain('1');
    expect(score).toContain('2');
  });

  it('honours a custom status label', () => {
    const markup = render(<MatchRecapStrip {...props} statusLabel="HT" />);
    expect(slotText(markup, 'match-recap-strip-status')).toContain('HT');
  });
});
