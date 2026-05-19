import { describe, expect, it } from 'vitest';

import { FixtureCard, formatKickoff, initialsFromLabel } from '../fixture-card';
import {
  fixtureFinishedLivCity,
  fixtureLiveMadridDerby,
  fixtureProvisionalChelsea,
  fixtureScheduledArsVMun,
} from '../fixtures';
import type { G5FixtureCardData } from '../types';
import { getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('FixtureCard status branches', () => {
  it('renders the scheduled kickoff block with a formatted kickoff time', () => {
    const markup = render(<FixtureCard data={fixtureScheduledArsVMun} />);
    expect(hasSlot(markup, 'fixture-kickoff')).toBe(true);
    expect(getSlotAttr(markup, 'fixture-status', 'data-status')).toBe('scheduled');
    const kickoffText = slotText(markup, 'fixture-kickoff');
    // The kickoff time renders as zero-padded HH:MM regardless of timezone shift.
    expect(kickoffText).toMatch(/\b\d{2}:\d{2}\b/);
    expect(kickoffText).toMatch(/MAY/);
  });

  it('renders a live indicator and a score for in-play games', () => {
    const markup = render(<FixtureCard data={fixtureLiveMadridDerby} />);
    expect(getSlotAttr(markup, 'fixture-status', 'data-status')).toBe('live');
    expect(hasSlot(markup, 'fixture-score')).toBe(true);
    const scoreText = slotText(markup, 'fixture-score');
    expect(scoreText).toContain('2');
    expect(scoreText).toContain('1');
  });

  it('renders the full-time pill and final score for finished games', () => {
    const markup = render(<FixtureCard data={fixtureFinishedLivCity} />);
    expect(getSlotAttr(markup, 'fixture-status', 'data-status')).toBe('finished');
    const scoreText = slotText(markup, 'fixture-score');
    expect(scoreText).toContain('1');
    expect(scoreText).toContain('2');
  });
});

describe('FixtureCard provisional chip', () => {
  it('omits the provisional chip when fallbackReasons is empty or missing', () => {
    const markup = render(<FixtureCard data={fixtureScheduledArsVMun} variant="full" />);
    expect(hasSlot(markup, 'fixture-provisional')).toBe(false);
    expect(getSlotAttr(markup, 'fixture-card', 'data-provisional')).toBeUndefined();
  });

  it('shows the provisional chip when fallbackReasons is non-empty', () => {
    const markup = render(<FixtureCard data={fixtureProvisionalChelsea} variant="full" />);
    expect(hasSlot(markup, 'fixture-provisional')).toBe(true);
    expect(slotText(markup, 'fixture-provisional').toLowerCase()).toContain('provisional');
    expect(getSlotAttr(markup, 'fixture-card', 'data-provisional')).toBe('true');
  });

  it('does NOT render the provisional chip in compact variant even when reasons exist', () => {
    const markup = render(<FixtureCard data={fixtureProvisionalChelsea} variant="compact" />);
    // The compact variant suppresses the bottom strip entirely.
    expect(hasSlot(markup, 'fixture-provisional')).toBe(false);
  });
});

describe('FixtureCard interactivity', () => {
  it('renders a non-interactive article by default', () => {
    const markup = render(<FixtureCard data={fixtureScheduledArsVMun} />);
    // The card root is the first tag in the markup.
    expect(markup.startsWith('<article')).toBe(true);
  });

  it('renders a button when onClick is provided', () => {
    const markup = render(<FixtureCard data={fixtureScheduledArsVMun} onClick={() => undefined} />);
    expect(markup.startsWith('<button')).toBe(true);
    // And it carries an explicit type="button" so it never submits a form.
    expect(/^<button[^>]*\stype="button"/.test(markup)).toBe(true);
  });
});

describe('FixtureCard pure helpers', () => {
  it('initialsFromLabel returns padded sentinel for empty input', () => {
    expect(initialsFromLabel('')).toBe('··');
    expect(initialsFromLabel('   ')).toBe('··');
  });

  it('initialsFromLabel takes first + last initial for multi-word labels', () => {
    expect(initialsFromLabel('Real Madrid')).toBe('RM');
    expect(initialsFromLabel('Manchester United')).toBe('MU');
  });

  it('initialsFromLabel takes the first two letters for single-word labels', () => {
    expect(initialsFromLabel('Arsenal')).toBe('AR');
  });

  it('formatKickoff returns TBD/— for invalid input', () => {
    expect(formatKickoff()).toEqual({ dateLabel: 'TBD', timeLabel: '—' });
    expect(formatKickoff('not-a-date')).toEqual({ dateLabel: 'TBD', timeLabel: '—' });
  });

  it('formatKickoff returns padded HH:MM and an upper-case dateLabel', () => {
    const result = formatKickoff('2026-05-19T19:30:00Z');
    expect(result.timeLabel).toMatch(/^\d{2}:\d{2}$/);
    expect(result.dateLabel).toBe(result.dateLabel.toUpperCase());
    expect(result.dateLabel).toMatch(/MAY/);
  });
});

describe('FixtureCard accent + crest fallback', () => {
  it('renders the crest slot even when no accent is provided', () => {
    const bareData: G5FixtureCardData = {
      ...fixtureScheduledArsVMun,
      home: { label: 'Home Side' },
      away: { label: 'Away Side' },
    };
    const markup = render(<FixtureCard data={bareData} />);
    expect(hasSlot(markup, 'fixture-crest')).toBe(true);
  });
});
