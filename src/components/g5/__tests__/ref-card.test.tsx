import { describe, expect, it, vi } from 'vitest';

import {
  CompetitionRefCard,
  GameRoundRefCard,
  RefCard,
  TeamRefCard,
} from '../ref-card';
import {
  competitionRefPremierLeague,
  gameRoundRefGameweek34,
  teamRefArsenal,
} from '../fixtures';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('RefCard variant + interactivity', () => {
  it('defaults to a non-interactive container when no onToggle is provided', () => {
    const markup = render(<RefCard data={teamRefArsenal} />);
    expect(markup.startsWith('<div')).toBe(true);
    // selection mark slot still renders because variant defaults to "selectable"
    expect(hasSlot(markup, 'ref-card-mark')).toBe(true);
  });

  it('renders a button when onToggle is provided', () => {
    const markup = render(
      <RefCard data={teamRefArsenal} onToggle={() => undefined} />
    );
    expect(markup.startsWith('<button')).toBe(true);
    expect(getSlotAttr(markup, 'ref-card', 'aria-pressed')).toBe('false');
  });

  it('omits the selection mark in static variant', () => {
    const markup = render(<RefCard data={teamRefArsenal} variant="static" />);
    expect(hasSlot(markup, 'ref-card-mark')).toBe(false);
  });
});

describe('TeamRefCard toggle behaviour', () => {
  it('forwards onToggle to the underlying RefCard primitive', () => {
    const onToggle = vi.fn();
    // TeamRefCard is a thin facade — call it once to grab the inner element
    // and forward the toggle handler to RefCard. We then call RefCard with
    // the merged props to verify the click handler is wired through.
    const facade = TeamRefCard({ data: teamRefArsenal, onToggle });
    expect(facade.type).toBe(RefCard);
    const refProps = facade.props as { onToggle: () => void };
    refProps.onToggle();
    expect(onToggle).toHaveBeenCalledTimes(1);
    // And the rendered markup of the facade is a button (proves the handler
    // is bound in real composition).
    const markup = render(<TeamRefCard data={teamRefArsenal} onToggle={onToggle} />);
    expect(markup.startsWith('<button')).toBe(true);
  });

  it('reflects the selected state on the data attribute and aria-pressed', () => {
    const markup = render(
      <TeamRefCard
        data={teamRefArsenal}
        selected
        onToggle={() => undefined}
      />
    );
    expect(getSlotAttr(markup, 'ref-card', 'data-selected')).toBe('true');
    expect(getSlotAttr(markup, 'ref-card', 'aria-pressed')).toBe('true');
    expect(getSlotAttr(markup, 'ref-card-mark', 'data-selected')).toBe('true');
  });

  it('uses the default kind label "Team" in its eyebrow', () => {
    const markup = render(<TeamRefCard data={teamRefArsenal} />);
    expect(slotText(markup, 'ref-card').toUpperCase()).toContain('TEAM');
  });
});

describe('CompetitionRefCard + GameRoundRefCard kind labels', () => {
  it('CompetitionRefCard shows "Competition" eyebrow', () => {
    const markup = render(
      <CompetitionRefCard data={competitionRefPremierLeague} />
    );
    expect(slotText(markup, 'ref-card').toUpperCase()).toContain('COMPETITION');
  });

  it('GameRoundRefCard shows "Round" eyebrow by default', () => {
    const markup = render(<GameRoundRefCard data={gameRoundRefGameweek34} />);
    expect(slotText(markup, 'ref-card').toUpperCase()).toContain('ROUND');
  });
});
