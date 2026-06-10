import { describe, expect, it } from 'vitest';

import {
  MatchFormationGradeHero,
  type MatchFormationGradeHeroTeam,
  type PlayerGradeMarker,
} from '../match-formation-grade-hero';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const home: MatchFormationGradeHeroTeam = {
  name: 'Arsenal',
  formation: '4-3-3',
  players: Array.from({ length: 11 }).map((_, i) => ({
    id: `h${i + 1}`,
    name: `P${i + 1}`,
    positionSlot: i + 1,
    grade: i === 5 ? (1 as const) : i === 0 ? (3 as const) : (4 as const),
  })) satisfies PlayerGradeMarker[],
};

const away: MatchFormationGradeHeroTeam = {
  name: 'Chelsea',
  formation: '4-2-3-1',
  players: Array.from({ length: 11 }).map((_, i) => ({
    id: `a${i + 1}`,
    name: `A${i + 1}`,
    positionSlot: i + 1,
    grade: i === 8 ? (2 as const) : (5 as const),
  })) satisfies PlayerGradeMarker[],
};

describe('MatchFormationGradeHero', () => {
  it('renders the hero shell with team title + toggle + pitch', () => {
    const markup = render(<MatchFormationGradeHero teams={{ home, away }} />);
    expect(hasSlot(markup, 'match-formation-grade-hero')).toBe(true);
    expect(hasSlot(markup, 'match-formation-grade-hero-title')).toBe(true);
    expect(hasSlot(markup, 'match-formation-grade-hero-toggle')).toBe(true);
    expect(hasSlot(markup, 'match-formation-grade-hero-pitch')).toBe(true);
  });

  it('defaults to the home side, with home team name in the title', () => {
    const markup = render(<MatchFormationGradeHero teams={{ home, away }} />);
    expect(getSlotAttr(markup, 'match-formation-grade-hero', 'data-active-side')).toBe('home');
    expect(slotText(markup, 'match-formation-grade-hero-title')).toContain('Arsenal');
  });

  it('honours defaultSide=away', () => {
    const markup = render(
      <MatchFormationGradeHero teams={{ home, away }} defaultSide="away" />,
    );
    expect(getSlotAttr(markup, 'match-formation-grade-hero', 'data-active-side')).toBe('away');
    expect(slotText(markup, 'match-formation-grade-hero-title')).toContain('Chelsea');
  });

  it('places a marker per starter (capped at 11)', () => {
    const markup = render(<MatchFormationGradeHero teams={{ home, away }} />);
    expect(countSlot(markup, 'match-formation-grade-hero-marker')).toBe(11);
  });

  it('flags the top-graded marker via data-top-graded', () => {
    const markup = render(<MatchFormationGradeHero teams={{ home, away }} />);
    // home: best grade is the player at positionSlot 6 (grade 1, id "h6").
    expect(markup).toContain('data-player-id="h6"');
    expect(markup).toContain('data-top-graded="true"');
  });

  it('renders the empty-state fallback when a side has no players', () => {
    const empty: MatchFormationGradeHeroTeam = { name: 'Arsenal', players: [] };
    const markup = render(<MatchFormationGradeHero teams={{ home: empty, away: empty }} />);
    expect(countSlot(markup, 'match-formation-grade-hero-marker')).toBe(0);
    expect(markup).toContain('Be the first to grade this match');
  });

  it('greyscale markers when no graded entries exist (no top-graded ring)', () => {
    const ungradedHome: MatchFormationGradeHeroTeam = {
      ...home,
      players: home.players.map((p) => ({ ...p, grade: undefined })),
    };
    const markup = render(<MatchFormationGradeHero teams={{ home: ungradedHome, away }} />);
    expect(countSlot(markup, 'match-formation-grade-hero-marker')).toBe(11);
    expect(markup).not.toContain('data-top-graded="true"');
  });

  it('respects controlled side prop', () => {
    const markup = render(<MatchFormationGradeHero teams={{ home, away }} side="away" />);
    expect(getSlotAttr(markup, 'match-formation-grade-hero', 'data-active-side')).toBe('away');
  });
});
