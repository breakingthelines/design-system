import { describe, expect, it } from 'vitest';

import { SearchEntityCard, entityKindLabel } from '../search-entity-card';
import type { SearchEntityCardItem } from '../search-entity-card';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

const club: SearchEntityCardItem = {
  id: 'btl_football_team_t8596499a',
  kind: 'club',
  name: 'Arsenal',
  imageUrl: 'https://media.example/arsenal.png',
  href: '/game/football/club/btl_football_team_t8596499a/arsenal',
  secondary: 'Premier League',
};

const player: SearchEntityCardItem = {
  id: 'btl_football_player_p1',
  kind: 'player',
  name: 'Bukayo Saka',
  href: '/game/football/player/btl_football_player_p1/bukayo-saka',
};

describe('SearchEntityCard', () => {
  it('renders the entity name, type pill and links to href (grid)', () => {
    const markup = render(<SearchEntityCard item={club} variant="grid" />);
    expect(getSlotAttr(markup, 'search-entity-card', 'data-kind')).toBe('club');
    expect(getSlotAttr(markup, 'search-entity-card', 'data-variant')).toBe('grid');
    expect(slotText(markup, 'entity-name')).toBe('Arsenal');
    expect(slotText(markup, 'entity-type-pill')).toBe('Club');
    expect(getSlotAttr(markup, 'entity-link', 'href')).toBe(club.href);
  });

  it('renders the list variant with its own data-variant', () => {
    const markup = render(<SearchEntityCard item={club} variant="list" />);
    expect(getSlotAttr(markup, 'search-entity-card', 'data-variant')).toBe('list');
    expect(slotText(markup, 'entity-name')).toBe('Arsenal');
  });

  it('renders the crest image when imageUrl is present, no monogram', () => {
    const markup = render(<SearchEntityCard item={club} />);
    expect(markup).toContain('src="https://media.example/arsenal.png"');
    expect(hasSlot(markup, 'entity-monogram')).toBe(false);
  });

  it('falls back to a name monogram when imageUrl is absent', () => {
    const markup = render(<SearchEntityCard item={player} />);
    expect(hasSlot(markup, 'entity-monogram')).toBe(true);
    // entityMonogram('Bukayo Saka') → "BS"
    expect(slotText(markup, 'entity-monogram')).toBe('BS');
  });

  it('does NOT render an author byline or engagement bar', () => {
    const markup = render(<SearchEntityCard item={club} />);
    expect(hasSlot(markup, 'author-accent')).toBe(false);
    expect(markup).not.toContain('data-slot="engagement-bar"');
  });

  it('renders the optional secondary line when provided and omits it otherwise', () => {
    const withSecondary = render(<SearchEntityCard item={club} />);
    expect(slotText(withSecondary, 'entity-secondary')).toBe('Premier League');

    const withoutSecondary = render(<SearchEntityCard item={player} />);
    expect(hasSlot(withoutSecondary, 'entity-secondary')).toBe(false);
  });

  it('defaults to the grid variant', () => {
    const markup = render(<SearchEntityCard item={club} />);
    expect(getSlotAttr(markup, 'search-entity-card', 'data-variant')).toBe('grid');
  });
});

describe('entityKindLabel', () => {
  it('maps each kind to its human label', () => {
    expect(entityKindLabel('club')).toBe('Club');
    expect(entityKindLabel('player')).toBe('Player');
    expect(entityKindLabel('manager')).toBe('Manager');
    expect(entityKindLabel('competition')).toBe('Competition');
    expect(entityKindLabel('country')).toBe('Country');
  });
});
