import { describe, expect, it } from 'vitest';

import { EntityPageShell } from '../entity-page-shell';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('EntityPageShell', () => {
  it('writes the entity kind to a data-attribute on the root', () => {
    const markup = render(<EntityPageShell kind="player" name="Mohamed Salah" />);
    expect(getSlotAttr(markup, 'entity-page-shell', 'data-kind')).toBe('player');
  });

  it('renders the localised eyebrow per kind', () => {
    expect(
      slotText(render(<EntityPageShell kind="player" name="x" />), 'entity-page-shell-eyebrow')
    ).toBe('Player');
    expect(
      slotText(
        render(<EntityPageShell kind="prediction_league" name="x" />),
        'entity-page-shell-eyebrow'
      )
    ).toBe('Prediction League');
    expect(
      slotText(render(<EntityPageShell kind="rating_club" name="x" />), 'entity-page-shell-eyebrow')
    ).toBe('Grading Club');
  });

  it('renders the display name into the title slot', () => {
    const markup = render(<EntityPageShell kind="team" name="Arsenal FC" />);
    expect(slotText(markup, 'entity-page-shell-title')).toBe('Arsenal FC');
  });

  it('renders the secondary line when supplied', () => {
    const markup = render(
      <EntityPageShell kind="competition" name="Premier League" secondary="2026/27 season" />
    );
    expect(slotText(markup, 'entity-page-shell-secondary')).toBe('2026/27 season');
  });

  it('renders the meta list when supplied, one entry per row', () => {
    const markup = render(
      <EntityPageShell
        kind="player"
        name="Mohamed Salah"
        meta={[
          { id: 'pos', label: 'Position', value: 'RW' },
          { id: 'team', label: 'Team', value: 'Liverpool' },
        ]}
      />
    );
    expect(countSlot(markup, 'entity-page-shell-meta-entry')).toBe(2);
    expect(slotText(markup, 'entity-page-shell-meta')).toContain('Liverpool');
  });

  it('renders actions, tabs, and notice slots when provided', () => {
    const markup = render(
      <EntityPageShell
        kind="player"
        name="Mohamed Salah"
        actions={<button type="button">Follow</button>}
        tabs={<nav>tab-rail</nav>}
        notice={<p data-slot="notice-test">notice</p>}
      >
        body
      </EntityPageShell>
    );
    expect(hasSlot(markup, 'entity-page-shell-actions')).toBe(true);
    expect(hasSlot(markup, 'entity-page-shell-tabs')).toBe(true);
    expect(hasSlot(markup, 'entity-page-shell-notice')).toBe(true);
    expect(slotText(markup, 'entity-page-shell-content')).toContain('body');
  });

  it('renders the meta block only when at least one entry is supplied', () => {
    const markup = render(<EntityPageShell kind="player" name="x" />);
    expect(hasSlot(markup, 'entity-page-shell-meta')).toBe(false);
  });
});
