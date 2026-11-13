import { describe, expect, it } from 'vitest';

import { ambientSampleUrl } from '../ambient-emitter';

// The colour sample is a separate CORS request. Taken from the full-size src it
// downloaded every hero image twice; analysisSrc lets the caller hand it a
// small copy of the same image instead.
describe('ambientSampleUrl', () => {
  const big = 'https://cdn.example/media/_opt/a/hero.1600.webp';
  const small = 'https://cdn.example/media/_opt/a/hero.800.webp';

  it('samples analysisSrc when given', () => {
    expect(ambientSampleUrl(big, small)).toBe(`${small}?__ambient_probe=1`);
  });

  it('falls back to src', () => {
    expect(ambientSampleUrl(big)).toBe(`${big}?__ambient_probe=1`);
    expect(ambientSampleUrl(big, '')).toBe(`${big}?__ambient_probe=1`);
  });

  it('keeps an existing query string and never doubles the probe param', () => {
    expect(ambientSampleUrl('https://x/a.png?v=2')).toBe('https://x/a.png?v=2&__ambient_probe=1');
    expect(ambientSampleUrl('https://x/a.png?__ambient_probe=1')).toBe(
      'https://x/a.png?__ambient_probe=1'
    );
  });

  it('returns undefined with no image', () => {
    expect(ambientSampleUrl()).toBeUndefined();
  });
});
