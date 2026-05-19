import { describe, expect, it } from 'vitest';

import {
  Issue1CoverFallback,
  composeCoverHeadline,
  computeCoverAccent,
} from '../issue1-cover-fallback';
import { getSlotAttr, render, slotText } from './test-utils';

describe('composeCoverHeadline (pure)', () => {
  it('pads single-digit issue numbers and strips leading @ on handles', () => {
    expect(composeCoverHeadline({ issueNumber: 1, ownerHandle: '@ando' })).toEqual({
      issueLabel: 'Issue',
      numberLabel: '01',
      ownerLabel: '@ando',
      archetypeLabel: 'A first edition',
    });
  });

  it('preserves multi-digit issue numbers', () => {
    expect(
      composeCoverHeadline({ issueNumber: 12, ownerHandle: 'zachlowy' }).numberLabel
    ).toBe('12');
  });

  it('clamps non-positive issue numbers up to 1', () => {
    expect(composeCoverHeadline({ issueNumber: 0, ownerHandle: 'ando' }).numberLabel).toBe(
      '01'
    );
    expect(composeCoverHeadline({ issueNumber: -3, ownerHandle: 'ando' }).numberLabel).toBe(
      '01'
    );
  });

  it('lowercases the archetype in the caption line', () => {
    const headline = composeCoverHeadline({
      issueNumber: 1,
      ownerHandle: 'ando',
      archetype: 'Tactician',
    });
    expect(headline.archetypeLabel).toBe('The tactician edition');
  });
});

describe('computeCoverAccent (deterministic)', () => {
  it('returns the override exactly when one is supplied', () => {
    expect(computeCoverAccent('ando', '#ff00ff')).toBe('#ff00ff');
  });

  it('falls back to the first palette entry for an empty handle', () => {
    expect(computeCoverAccent('')).toBe('var(--color-red-300)');
    expect(computeCoverAccent('@')).toBe('var(--color-red-300)');
  });

  it('is stable for the same handle across repeated calls', () => {
    const first = computeCoverAccent('zachlowy');
    const second = computeCoverAccent('@ZachLowy');
    expect(first).toBe(second);
  });

  it('only ever returns a palette entry', () => {
    const palette = new Set([
      'var(--color-red-300)',
      '#c0521c',
      '#2b6cb0',
      '#3f7a4d',
      '#7a3eb7',
      '#a06a00',
    ]);
    for (const handle of ['ando', 'mattlaw', 'zachlowy', 'seyf', 'lowy', 'paolo']) {
      expect(palette.has(computeCoverAccent(handle))).toBe(true);
    }
  });
});

describe('Issue1CoverFallback render', () => {
  it('renders the masthead, issue number, owner handle, and corner mark', () => {
    const markup = render(
      <Issue1CoverFallback issueNumber={1} ownerHandle="ando" archetype="Tactician" />
    );
    expect(getSlotAttr(markup, 'issue1-cover-fallback', 'data-issue-number')).toBe('01');
    expect(getSlotAttr(markup, 'issue1-cover-fallback', 'data-archetype')).toBe(
      'Tactician'
    );
    expect(slotText(markup, 'cover-masthead')).toContain('Breaking the Lines');
    expect(slotText(markup, 'cover-issue-number')).toBe('01');
    expect(slotText(markup, 'cover-owner')).toBe('@ando');
    // The Tailwind `uppercase` utility transforms case visually only — the
    // underlying string remains the lower-case form composed by the helper.
    expect(slotText(markup, 'cover-issue-archetype')).toBe('The tactician edition');
    expect(slotText(markup, 'cover-corner-mark')).toContain('BTL/01');
  });

  it('uses the deterministic palette accent when none is supplied', () => {
    const markup = render(<Issue1CoverFallback issueNumber={1} ownerHandle="ando" />);
    expect(getSlotAttr(markup, 'issue1-cover-fallback', 'data-accent')).toBe(
      computeCoverAccent('ando')
    );
  });
});
