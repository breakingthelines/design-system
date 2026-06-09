import { describe, expect, it } from 'vitest';

import { FallbackNotice, normaliseFallbackReason } from '../fallback-notice';
import { countSlot, getSlotAttr, hasSlot, render, slotText } from './test-utils';

describe('normaliseFallbackReason', () => {
  it('maps each original numeric proto value to its key', () => {
    expect(normaliseFallbackReason(1)).toBe('lineups_missing');
    expect(normaliseFallbackReason(2)).toBe('timeline_missing');
    expect(normaliseFallbackReason(3)).toBe('rich_actions_unavailable');
    expect(normaliseFallbackReason(4)).toBe('live_score_stale');
    expect(normaliseFallbackReason(5)).toBe('provider_outage');
    expect(normaliseFallbackReason(6)).toBe('unresolved_identity');
    expect(normaliseFallbackReason(7)).toBe('settlement_pending');
  });

  it('maps every v0.15.0 numeric tag (14-46) to a non-empty key', () => {
    for (let tag = 14; tag <= 46; tag += 1) {
      const key = normaliseFallbackReason(tag);
      expect(key, `tag ${tag}`).toBeDefined();
      expect(typeof key, `tag ${tag}`).toBe('string');
    }
  });

  it('maps the new Arena (L1) tags', () => {
    expect(normaliseFallbackReason(14)).toBe('follow_graph_empty');
    expect(normaliseFallbackReason(15)).toBe('no_moves_pending');
    expect(normaliseFallbackReason(16)).toBe('user_not_in_squad');
  });

  it('maps the new eligibility + Prediction League / Ratings Club tags', () => {
    expect(normaliseFallbackReason(17)).toBe('viewer_not_eligible');
    expect(normaliseFallbackReason(18)).toBe('prediction_league_not_found');
    expect(normaliseFallbackReason(19)).toBe('ratings_club_not_found');
    expect(normaliseFallbackReason(20)).toBe('league_name_taken');
    expect(normaliseFallbackReason(21)).toBe('club_name_taken');
    expect(normaliseFallbackReason(22)).toBe('league_not_started');
    expect(normaliseFallbackReason(23)).toBe('no_results_yet');
  });

  it('maps the new Studio cockpit and engagement tags', () => {
    expect(normaliseFallbackReason(26)).toBe('no_content_yet');
    expect(normaliseFallbackReason(27)).toBe('insights_not_yet_available');
    expect(normaliseFallbackReason(28)).toBe('draft_not_found');
    expect(normaliseFallbackReason(29)).toBe('edit_locked');
    expect(normaliseFallbackReason(31)).toBe('no_engagement_yet');
    expect(normaliseFallbackReason(33)).toBe('source_not_available');
  });

  it('maps the new match and window lifecycle tags', () => {
    expect(normaliseFallbackReason(38)).toBe('match_not_started');
    expect(normaliseFallbackReason(42)).toBe('match_void');
    expect(normaliseFallbackReason(43)).toBe('rating_not_yet_open');
    expect(normaliseFallbackReason(45)).toBe('prediction_locked');
    expect(normaliseFallbackReason(46)).toBe('prediction_not_yet_open');
    expect(normaliseFallbackReason(47)).toBe('lineup_not_yet_announced');
  });

  it('returns undefined for the UNSPECIFIED proto value (0)', () => {
    expect(normaliseFallbackReason(0)).toBeUndefined();
  });

  it('returns undefined for numeric tags above the known range', () => {
    expect(normaliseFallbackReason(48)).toBeUndefined();
    expect(normaliseFallbackReason(1000)).toBeUndefined();
  });

  it('accepts SCREAMING_SNAKE proto labels with or without the prefix', () => {
    expect(normaliseFallbackReason('FALLBACK_REASON_LINEUPS_MISSING')).toBe('lineups_missing');
    expect(normaliseFallbackReason('LINEUPS_MISSING')).toBe('lineups_missing');
    expect(normaliseFallbackReason('FALLBACK_REASON_SETTLEMENT_PENDING')).toBe(
      'settlement_pending'
    );
  });

  it('accepts SCREAMING_SNAKE labels for v0.15.0 additions', () => {
    expect(normaliseFallbackReason('FALLBACK_REASON_FOLLOW_GRAPH_EMPTY')).toBe(
      'follow_graph_empty'
    );
    expect(normaliseFallbackReason('VIEWER_NOT_ELIGIBLE')).toBe('viewer_not_eligible');
    expect(normaliseFallbackReason('FALLBACK_REASON_MATCH_POSTPONED')).toBe('match_postponed');
    expect(normaliseFallbackReason('PREDICTION_NOT_YET_OPEN')).toBe('prediction_not_yet_open');
  });

  it('accepts already-normalised keys', () => {
    expect(normaliseFallbackReason('lineups_missing')).toBe('lineups_missing');
    expect(normaliseFallbackReason('viewer_not_eligible')).toBe('viewer_not_eligible');
    expect(normaliseFallbackReason('source_not_available')).toBe('source_not_available');
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

  it('renders new v0.15.0 reasons with honest copy', () => {
    const markup = render(
      <FallbackNotice
        reasons={['VIEWER_NOT_ELIGIBLE', 'MATCH_POSTPONED', 'NO_OPPORTUNITIES_YET']}
      />
    );
    expect(getSlotAttr(markup, 'fallback-notice', 'data-reason-count')).toBe('3');
    expect(markup).toContain('data-reason="viewer_not_eligible"');
    expect(markup).toContain('data-reason="match_postponed"');
    expect(markup).toContain('data-reason="no_opportunities_yet"');
    expect(markup.toLowerCase()).toContain('hidden from you');
    expect(markup.toLowerCase()).toContain('match postponed');
    expect(markup.toLowerCase()).toContain('no opportunities yet');
  });

  it('uses each reasons honest copy — never invents fill', () => {
    const markup = render(<FallbackNotice reasons={['LINEUPS_MISSING']} />);
    expect(markup.toLowerCase()).toContain('lineups not announced');
    expect(markup.toLowerCase()).not.toContain('mock');
    expect(markup.toLowerCase()).not.toContain('placeholder');
  });

  it('uses RSS-first external-only podcast fallback copy', () => {
    const markup = render(<FallbackNotice reasons={['EXTERNAL_PODCAST_UNAVAILABLE']} />);
    const text = markup.toLowerCase();

    expect(text).toContain('rss enclosure');
    expect(text).toContain('provider or source externally');
    expect(text).not.toContain('spotify');
    expect(text).not.toContain('apple');
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
