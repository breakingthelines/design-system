import { describe, expect, it } from 'vitest';

import { PredictionPickCard, formatKickoffShort } from '../prediction-pick-card';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('PredictionPickCard', () => {
  it('exposes the result on the root for snapshot tests', () => {
    const markup = render(
      <PredictionPickCard
        matchLabel="Arsenal v Manchester United"
        outcomePick="home"
        result="won"
      />
    );
    expect(getSlotAttr(markup, 'prediction-pick-card', 'data-result')).toBe('won');
  });

  it('defaults result to pending when omitted', () => {
    const markup = render(<PredictionPickCard matchLabel="m" outcomePick="draw" />);
    expect(getSlotAttr(markup, 'prediction-pick-card', 'data-result')).toBe('pending');
  });

  it('renders the localised outcome label', () => {
    const home = render(<PredictionPickCard matchLabel="m" outcomePick="home" />);
    expect(slotText(home, 'prediction-pick-card-outcome-value')).toBe('Home');
    const draw = render(<PredictionPickCard matchLabel="m" outcomePick="draw" />);
    expect(slotText(draw, 'prediction-pick-card-outcome-value')).toBe('Draw');
  });

  it('renders the exact score as font-mono digits', () => {
    const markup = render(
      <PredictionPickCard matchLabel="m" outcomePick="home" exactScore={{ home: 2, away: 1 }} />
    );
    expect(hasSlot(markup, 'prediction-pick-card-exact-score')).toBe(true);
    expect(slotText(markup, 'prediction-pick-card-exact-score')).toContain('2');
    expect(slotText(markup, 'prediction-pick-card-exact-score')).toContain('1');
  });

  it('reports honest "no exact score" when omitted', () => {
    const markup = render(<PredictionPickCard matchLabel="m" outcomePick="home" />);
    expect(slotText(markup, 'prediction-pick-card-score').toLowerCase()).toContain(
      'no exact score'
    );
  });

  it('renders the final score alongside the exact-score pick when supplied', () => {
    const markup = render(
      <PredictionPickCard
        matchLabel="m"
        outcomePick="home"
        exactScore={{ home: 2, away: 1 }}
        finalScore={{ home: 1, away: 1 }}
      />
    );
    expect(hasSlot(markup, 'prediction-pick-card-final-score')).toBe(true);
  });

  it('renders one module per descriptor', () => {
    const markup = render(
      <PredictionPickCard
        matchLabel="m"
        outcomePick="home"
        modules={[
          { id: 'btts', label: 'BTTS', value: 'Yes', status: 'correct' },
          { id: 'top', label: 'Top scorer', value: 'Saka', status: 'pending' },
        ]}
      />
    );
    expect(countSlot(markup, 'prediction-pick-card-module')).toBe(2);
    expect(markup).toContain('data-module-id="btts"');
    expect(markup).toContain('data-module-id="top"');
  });

  it('renders the points footer only when pointsAwarded is supplied', () => {
    const withPoints = render(
      <PredictionPickCard matchLabel="m" outcomePick="home" pointsAwarded={5} result="won" />
    );
    expect(hasSlot(withPoints, 'prediction-pick-card-points')).toBe(true);
    expect(slotText(withPoints, 'prediction-pick-card-points')).toContain('5');

    const withoutPoints = render(<PredictionPickCard matchLabel="m" outcomePick="home" />);
    expect(hasSlot(withoutPoints, 'prediction-pick-card-points')).toBe(false);
  });

  it('renders the kickoff label when provided, formatted as DD MMM · HH:MM', () => {
    const markup = render(
      <PredictionPickCard matchLabel="m" outcomePick="home" kickoffIso="2026-05-10T15:00:00Z" />
    );
    const text = slotText(markup, 'prediction-pick-card-kickoff');
    expect(text).toMatch(/MAY/);
    expect(text).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatKickoffShort', () => {
  it('returns undefined for empty / invalid input', () => {
    expect(formatKickoffShort()).toBeUndefined();
    expect(formatKickoffShort('not-a-date')).toBeUndefined();
  });

  it('returns "DD MMM · HH:MM" for a valid ISO datetime', () => {
    const label = formatKickoffShort('2026-05-10T15:00:00Z');
    expect(label).toBeTruthy();
    expect(label).toContain('·');
  });
});
