import { describe, expect, it } from 'vitest';

import { PredictionFormCard } from '../prediction-form-card';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('PredictionFormCard', () => {
  it('exposes the open state on the root', () => {
    const markup = render(
      <PredictionFormCard matchLabel="Arsenal v Manchester United" contextLabel="PL" />
    );
    expect(getSlotAttr(markup, 'prediction-form-card', 'data-state')).toBe('open');
    expect(slotText(markup, 'prediction-form-card-status').toLowerCase()).toContain('open');
  });

  it('renders three outcome radio buttons in fixed order', () => {
    const markup = render(<PredictionFormCard matchLabel="m" />);
    expect(countSlot(markup, 'prediction-form-card-outcome-option')).toBe(3);
    const home = markup.indexOf('data-value="home"');
    const draw = markup.indexOf('data-value="draw"');
    const away = markup.indexOf('data-value="away"');
    expect(home).toBeGreaterThan(-1);
    expect(home).toBeLessThan(draw);
    expect(draw).toBeLessThan(away);
  });

  it('marks the active outcome option', () => {
    const markup = render(<PredictionFormCard matchLabel="m" outcomePick="draw" />);
    const drawSlice = markup.split('data-value="draw"')[1] ?? '';
    expect(drawSlice).toContain('data-active="true"');
    expect(drawSlice).toContain('aria-checked="true"');
  });

  it('renders both exact-score inputs and exposes the side', () => {
    const markup = render(<PredictionFormCard matchLabel="m" exactScore={{ home: 2, away: 1 }} />);
    expect(countSlot(markup, 'prediction-form-card-score-input')).toBe(2);
    expect(markup).toContain('data-side="home"');
    expect(markup).toContain('data-side="away"');
  });

  it('renders a module field per descriptor', () => {
    const markup = render(
      <PredictionFormCard
        matchLabel="m"
        modules={[
          { id: 'btts', label: 'BTTS', control: <span /> },
          { id: 'top', label: 'Top scorer', control: <span />, helpText: 'choose any starter' },
        ]}
      />
    );
    expect(countSlot(markup, 'prediction-form-card-module')).toBe(2);
    expect(markup).toContain('data-module-id="btts"');
    expect(markup).toContain('data-module-id="top"');
    expect(markup.toLowerCase()).toContain('choose any starter');
  });

  it('flips data-state to disabled when disabled', () => {
    const markup = render(<PredictionFormCard matchLabel="m" disabled />);
    expect(getSlotAttr(markup, 'prediction-form-card', 'data-state')).toBe('disabled');
  });

  it('renders the footer slot when provided', () => {
    const markup = render(<PredictionFormCard matchLabel="m" footer={<button>Submit</button>} />);
    expect(hasSlot(markup, 'prediction-form-card-footer')).toBe(true);
    expect(markup).toContain('Submit');
  });
});
