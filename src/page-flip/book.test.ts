import { describe, expect, it } from 'vitest';

import { facesAt, positionCount, turnFaces } from './book';

describe('book paper model', () => {
  describe('positionCount', () => {
    it('single mode: one position per page', () => {
      expect(positionCount(4, 'single')).toBe(4);
      expect(positionCount(1, 'single')).toBe(1);
      expect(positionCount(0, 'single')).toBe(0);
    });

    it('spread mode: cover + paired spreads', () => {
      // 1 cover + spreads(1,2),(3,4) = 3 positions for 5 faces.
      expect(positionCount(5, 'spread')).toBe(3);
      // 1 cover + spread(1,2) = 2 positions for 3 faces.
      expect(positionCount(3, 'spread')).toBe(2);
      // 1 cover + spread(1,2) (right blank) = 2 positions for 2 faces.
      expect(positionCount(2, 'spread')).toBe(2);
      // Just a cover.
      expect(positionCount(1, 'spread')).toBe(1);
    });
  });

  describe('facesAt — spread', () => {
    it('position 0 is the cover: right-only', () => {
      expect(facesAt(0, 5, 'spread')).toEqual({ left: null, right: 0 });
    });

    it('position 1 is the first inner spread (1,2)', () => {
      expect(facesAt(1, 5, 'spread')).toEqual({ left: 1, right: 2 });
    });

    it('position 2 is the second spread (3,4)', () => {
      expect(facesAt(2, 5, 'spread')).toEqual({ left: 3, right: 4 });
    });

    it('a missing right page reads as a blank back endpaper', () => {
      // 4 faces: cover(0), spread(1,2), spread(3, —)
      expect(facesAt(2, 4, 'spread')).toEqual({ left: 3, right: null });
    });
  });

  describe('facesAt — single', () => {
    it('shows exactly one face, on the right', () => {
      expect(facesAt(0, 4, 'single')).toEqual({ left: null, right: 0 });
      expect(facesAt(2, 4, 'single')).toEqual({ left: null, right: 2 });
    });
  });

  describe('turnFaces — the curl triple', () => {
    it('single forward: front=p, back/revealed=p+1', () => {
      expect(turnFaces(0, 'forward', 4, 'single')).toEqual({ front: 0, back: 1, revealed: 1 });
    });

    it('single backward: front=p, back/revealed=p-1', () => {
      expect(turnFaces(2, 'backward', 4, 'single')).toEqual({ front: 2, back: 1, revealed: 1 });
    });

    it('spread cover→spread forward: cover lifts to reveal the first spread', () => {
      // from cover(0): front=cover right(0), back=next.left(1), revealed=next.right(2)
      expect(turnFaces(0, 'forward', 5, 'spread')).toEqual({ front: 0, back: 1, revealed: 2 });
    });

    it('spread→spread forward: the right leaf lifts to the next spread', () => {
      // from spread(1,2): front=2, back=next.left(3), revealed=next.right(4)
      expect(turnFaces(1, 'forward', 5, 'spread')).toEqual({ front: 2, back: 3, revealed: 4 });
    });

    it('spread→cover backward: the left leaf folds back to the cover', () => {
      // from spread(1,2): front=left(1), back=prev.right(0), revealed=prev.left(null=cover)
      expect(turnFaces(1, 'backward', 5, 'spread')).toEqual({
        front: 1,
        back: 0,
        revealed: null,
      });
    });

    it('the underside is never the front (no mirror)', () => {
      // Across every forward turn, back !== front whenever a next page exists.
      for (let p = 0; p < positionCount(7, 'spread') - 1; p++) {
        const t = turnFaces(p, 'forward', 7, 'spread');
        if (t.front != null && t.back != null) {
          expect(t.back).not.toBe(t.front);
        }
      }
    });
  });
});
