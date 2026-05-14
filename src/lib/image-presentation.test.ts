import { describe, expect, it } from 'vitest';

import { focalAreaToObjectPosition, resolveImagePresentation } from './image-presentation';

describe('image presentation', () => {
  it('uses the focal-area center as object-position', () => {
    expect(focalAreaToObjectPosition({ x: 0.1, y: 0.2, width: 0.4, height: 0.2 })).toBe('30% 30%');
  });

  it('accepts percentage-style focal area values defensively', () => {
    expect(focalAreaToObjectPosition({ x: 25, y: 10, width: 50, height: 20 })).toBe('50% 20%');
  });

  it('resolves contain-bleed foregrounds as contain images with focal origin', () => {
    expect(
      resolveImagePresentation({
        fitMode: 'contain-bleed',
        focalArea: { x: 0.5, y: 0.2, width: 0.2, height: 0.2 },
        zoom: 1.25,
      })
    ).toEqual({
      fitMode: 'contain-bleed',
      objectFit: 'contain',
      objectPosition: '60% 30%',
      transform: 'scale(1.25)',
      transformOrigin: '60% 30%',
    });
  });

  it('keeps a missing presentation undefined for backward-compatible image rendering', () => {
    expect(resolveImagePresentation(undefined)).toBeUndefined();
  });
});
