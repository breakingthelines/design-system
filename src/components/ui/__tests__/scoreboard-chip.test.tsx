import { describe, expect, it } from 'vitest';

import { ScoreboardChip } from '../scoreboard-chip';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('ScoreboardChip', () => {
  it('renders status-specific copy', () => {
    expect(slotText(render(<ScoreboardChip status="scheduled" />), 'scoreboard-chip-label')).toBe(
      'Kick-off'
    );
    expect(slotText(render(<ScoreboardChip status="live" />), 'scoreboard-chip-label')).toBe(
      'Live'
    );
    expect(slotText(render(<ScoreboardChip status="half_time" />), 'scoreboard-chip-label')).toBe(
      'Half time'
    );
    expect(slotText(render(<ScoreboardChip status="finished" />), 'scoreboard-chip-label')).toBe(
      'Full time'
    );
    expect(slotText(render(<ScoreboardChip status="postponed" />), 'scoreboard-chip-label')).toBe(
      'Postponed'
    );
    expect(slotText(render(<ScoreboardChip status="cancelled" />), 'scoreboard-chip-label')).toBe(
      'Cancelled'
    );
  });

  it('exposes the status via a data-attribute', () => {
    expect(
      getSlotAttr(render(<ScoreboardChip status="live" />), 'scoreboard-chip', 'data-status')
    ).toBe('live');
  });

  it('only renders the pulse dot for live state', () => {
    expect(hasSlot(render(<ScoreboardChip status="live" />), 'scoreboard-chip-dot')).toBe(true);
    expect(hasSlot(render(<ScoreboardChip status="scheduled" />), 'scoreboard-chip-dot')).toBe(
      false
    );
    expect(hasSlot(render(<ScoreboardChip status="finished" />), 'scoreboard-chip-dot')).toBe(
      false
    );
  });

  it('renders an optional clock label when supplied', () => {
    const markup = render(<ScoreboardChip status="live" clockLabel="78'" />);
    expect(hasSlot(markup, 'scoreboard-chip-clock')).toBe(true);
    expect(slotText(markup, 'scoreboard-chip-clock')).toContain("78'");
  });
});
