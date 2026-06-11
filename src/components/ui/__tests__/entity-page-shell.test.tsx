import { describe, expect, it } from 'vitest';

import { EntityPageShell } from '../entity-page-shell';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('EntityPageShell', () => {
  it('writes the entity kind to a data-attribute on the root', () => {
    const markup = render(<EntityPageShell kind="player" name="Mohamed Salah" />);
    expect(getSlotAttr(markup, 'entity-page-shell', 'data-kind')).toBe('player');
  });

  it('does not render a kind eyebrow (the secondary line carries identity context)', () => {
    const markup = render(<EntityPageShell kind="player" name="x" />);
    expect(hasSlot(markup, 'entity-page-shell-eyebrow')).toBe(false);
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

  it('renders a contain-fit logo crest for team / competition and a cover-fit avatar for player / manager', () => {
    const logo = render(
      <EntityPageShell
        kind="competition"
        name="Premier League"
        imageUrl="https://cdn.example/pl.png"
      />
    );
    expect(getSlotAttr(logo, 'entity-page-shell-crest', 'data-variant')).toBe('logo');

    const portrait = render(
      <EntityPageShell
        kind="player"
        name="Mohamed Salah"
        imageUrl="https://cdn.example/salah.jpg"
      />
    );
    expect(getSlotAttr(portrait, 'entity-page-shell-crest', 'data-variant')).toBe('avatar');
  });

  it('renders the meta block only when at least one entry is supplied', () => {
    const markup = render(<EntityPageShell kind="player" name="x" />);
    expect(hasSlot(markup, 'entity-page-shell-meta')).toBe(false);
  });

  it('prefers the metaChips slot over the plain-text meta row when both are given', () => {
    const markup = render(
      <EntityPageShell
        kind="player"
        name="Mohamed Salah"
        meta={[{ id: 'pos', label: 'Position', value: 'RW' }]}
        metaChips={<span data-slot="chips-test">chips</span>}
      />
    );
    expect(hasSlot(markup, 'chips-test')).toBe(true);
    // the plain-text rows are suppressed once the composed chip strip is supplied
    expect(countSlot(markup, 'entity-page-shell-meta-entry')).toBe(0);
  });
});
