import { describe, expect, it } from 'vitest';

import { FallbackNotice, normaliseFallbackReason } from '../fallback-notice';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('normaliseFallbackReason', () => {
  it('maps each numeric proto value to its key', () => {
    expect(normaliseFallbackReason(1)).toBe('lineups_missing');
    expect(normaliseFallbackReason(2)).toBe('timeline_missing');
    expect(normaliseFallbackReason(3)).toBe('rich_actions_unavailable');
    expect(normaliseFallbackReason(4)).toBe('live_score_stale');
    expect(normaliseFallbackReason(5)).toBe('provider_outage');
    expect(normaliseFallbackReason(6)).toBe('unresolved_identity');
    expect(normaliseFallbackReason(7)).toBe('settlement_pending');
  });

  it('returns undefined for the UNSPECIFIED proto value (0)', () => {
    expect(normaliseFallbackReason(0)).toBeUndefined();
  });

  it('accepts SCREAMING_SNAKE proto labels with or without the prefix', () => {
    expect(normaliseFallbackReason('FALLBACK_REASON_LINEUPS_MISSING')).toBe('lineups_missing');
    expect(normaliseFallbackReason('LINEUPS_MISSING')).toBe('lineups_missing');
    expect(normaliseFallbackReason('FALLBACK_REASON_SETTLEMENT_PENDING')).toBe(
      'settlement_pending'
    );
  });

  it('accepts already-normalised keys', () => {
    expect(normaliseFallbackReason('lineups_missing')).toBe('lineups_missing');
  });

  it('returns undefined for unknown / empty input', () => {
    expect(normaliseFallbackReason('')).toBeUndefined();
    expect(normaliseFallbackReason('garbage')).toBeUndefined();
  });
});

describe('FallbackNotice', () => {
  it('renders one reason row per recognised proto value', () => {
    const markup = render(<FallbackNotice reasons={[1, 5]} />);
    expect(getSlotAttr(markup, 'fallback-notice', 'data-reason-count')).toBe('2');
    expect(countSlot(markup, 'fallback-notice-reason')).toBe(2);
    // Each reason carries its key on a data-attribute so callers can target them.
    expect(markup).toContain('data-reason="lineups_missing"');
    expect(markup).toContain('data-reason="provider_outage"');
  });

  it('uses each reasons honest copy — never invents fill', () => {
    const markup = render(<FallbackNotice reasons={['LINEUPS_MISSING']} />);
    expect(markup.toLowerCase()).toContain('lineups not announced');
    expect(markup.toLowerCase()).not.toContain('mock');
    expect(markup.toLowerCase()).not.toContain('placeholder');
  });

  it('returns null when every reason is unknown / UNSPECIFIED', () => {
    const markup = render(<FallbackNotice reasons={[0, 'garbage']} />);
    expect(markup).toBe('');
  });

  it('falls back to the first reasons title in compact variant', () => {
    const markup = render(<FallbackNotice reasons={['PROVIDER_OUTAGE']} variant="compact" />);
    expect(getSlotAttr(markup, 'fallback-notice', 'data-variant')).toBe('compact');
    expect(slotText(markup, 'fallback-notice-title').toLowerCase()).toContain('provider outage');
  });

  it('respects an explicit title override', () => {
    const markup = render(<FallbackNotice reasons={[1]} title="Lineups pending" />);
    expect(slotText(markup, 'fallback-notice-eyebrow')).toBe('Lineups pending');
  });

  it('exposes the reason count even when default variant is used', () => {
    const markup = render(<FallbackNotice reasons={[1, 4, 7]} />);
    expect(getSlotAttr(markup, 'fallback-notice', 'data-reason-count')).toBe('3');
    expect(hasSlot(markup, 'fallback-notice-eyebrow')).toBe(true);
  });
});
