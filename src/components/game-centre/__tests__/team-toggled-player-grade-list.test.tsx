import { describe, expect, it } from 'vitest';

import { TeamToggledPlayerGradeList, type PlayerGradeRow } from '../team-toggled-player-grade-list';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

const home: readonly PlayerGradeRow[] = [
  { id: 'h1', name: 'D. Raya', grade: 3 },
  { id: 'h2', name: 'B. White', grade: 2 },
  { id: 'h3', name: 'G. Magalhães', grade: 2 },
  { id: 'h4', name: 'W. Saliba', grade: 1 },
  { id: 'h5', name: 'M. Lewis', grade: 3 },
  { id: 'h6', name: 'D. Rice', grade: 1 },
  { id: 'h7', name: 'M. Ødegaard', grade: 2 },
  { id: 'h8', name: 'K. Havertz', grade: 4 },
  { id: 'h9', name: 'B. Saka', grade: 1 },
  { id: 'h10', name: 'G. Martinelli', grade: 3 },
  { id: 'h11', name: 'L. Trossard', grade: 2 },
  { id: 'h12', name: 'F. Vieira', grade: 4, isSub: true },
  { id: 'h13', name: 'J. Timber', grade: 3, isSub: true },
];

const away: readonly PlayerGradeRow[] = [
  { id: 'a1', name: 'R. Sánchez', grade: 4 },
  { id: 'a2', name: 'M. Gusto', grade: 5 },
  { id: 'a3', name: 'A. Disasi', grade: 4 },
];

describe('TeamToggledPlayerGradeList', () => {
  it('renders the toggle and a rows list', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} />);
    expect(hasSlot(markup, 'team-toggled-player-grade-list')).toBe(true);
    expect(hasSlot(markup, 'team-toggled-player-grade-list-toggle')).toBe(true);
    expect(hasSlot(markup, 'team-toggled-player-grade-list-rows')).toBe(true);
  });

  it('defaults to the home side', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} />);
    expect(getSlotAttr(markup, 'team-toggled-player-grade-list', 'data-active-side')).toBe('home');
  });

  it('renders every row passed in (subs visible by default, host filters upstream)', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} />);
    // Home has 13 rows (incl. 2 subs); all 13 render — no internal cap.
    expect(countSlot(markup, 'team-toggled-player-grade-list-row')).toBe(home.length);
    // No subs toggle ships any more (Wave 6.14).
    expect(hasSlot(markup, 'team-toggled-player-grade-list-subs-toggle')).toBe(false);
    // `isSub` still rides through as `data-sub` for styling hooks.
    expect(markup).toContain('data-sub="true"');
  });

  it('sorts by grade ascending (best first)', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} />);
    // Saliba, Rice, Saka — grade 1, sorted alphabetically by name within tier
    const saka = markup.indexOf('B. Saka');
    const rice = markup.indexOf('D. Rice');
    const saliba = markup.indexOf('W. Saliba');
    expect(saka).toBeGreaterThan(-1);
    expect(rice).toBeGreaterThan(-1);
    expect(saliba).toBeGreaterThan(-1);
    // A row with grade 4 (Havertz) must appear AFTER any of the grade-1 rows.
    const havertz = markup.indexOf('K. Havertz');
    expect(havertz).toBeGreaterThan(saka);
    expect(havertz).toBeGreaterThan(rice);
    expect(havertz).toBeGreaterThan(saliba);
  });

  it('renders the away side when controlled', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} side="away" />);
    expect(getSlotAttr(markup, 'team-toggled-player-grade-list', 'data-active-side')).toBe('away');
    expect(countSlot(markup, 'team-toggled-player-grade-list-row')).toBe(away.length);
    expect(markup).toContain('R. S');
  });

  it('renders a fallback when the active side is empty', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home: [], away }} />);
    expect(hasSlot(markup, 'team-toggled-player-grade-list-row')).toBe(false);
    expect(slotText(markup, 'game-centre-fallback-state').length).toBeGreaterThan(0);
  });

  it('honours a custom emptyReason', () => {
    const markup = render(
      <TeamToggledPlayerGradeList
        teams={{ home: [], away }}
        emptyReason="LIST_RATINGS_RPC_PENDING"
      />
    );
    expect(markup).toContain('data-reason="LIST_RATINGS_RPC_PENDING"');
  });

  it('suppresses the internal toggle when hideToggle is true', () => {
    const markup = render(<TeamToggledPlayerGradeList teams={{ home, away }} hideToggle />);
    // Rows still render; the pill toggle is gone.
    expect(hasSlot(markup, 'team-toggled-player-grade-list-toggle')).toBe(false);
    expect(hasSlot(markup, 'team-toggled-player-grade-list-rows')).toBe(true);
  });

  it('still honours controlled side when hideToggle is true', () => {
    const markup = render(
      <TeamToggledPlayerGradeList teams={{ home, away }} hideToggle side="away" />
    );
    expect(getSlotAttr(markup, 'team-toggled-player-grade-list', 'data-active-side')).toBe('away');
    expect(countSlot(markup, 'team-toggled-player-grade-list-row')).toBe(away.length);
  });
});
