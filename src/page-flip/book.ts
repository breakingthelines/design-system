import type { BookMode } from './use-book-layout';

/** Which way a turn moves: toward a later page (`forward`) or earlier (`backward`). */
export type FlipDirection = 'forward' | 'backward';

/**
 * Book paper model — maps a flat list of page faces onto *leaves* and *spreads*,
 * and works out which faces a turn shows.
 *
 * A magazine is a stack of **leaves**; each leaf has two faces (front + back).
 * At rest you see a **spread**: a left face (the back of the leaf you just
 * turned) and a right face (the front of the next leaf). The cover is special —
 * a single right-hand face with nothing to its left.
 *
 * To reuse the page-index controller unchanged, we collapse the book into a
 * sequence of **turn positions** (`positionCount`). Each `next()`/`prev()`
 * advances one position; the renderer turns exactly one leaf per position.
 *
 *   single mode:  position p  ⇒  shows face p          (positionCount = N)
 *   spread mode:  position 0  ⇒  cover (face 0, right only)
 *                 position k  ⇒  spread of faces (2k-1, 2k)   (k ≥ 1)
 *                 positionCount = ceil((N - 1) / 2) + 1
 *
 * When turning from position p to p+1 the *leaf that lifts* is the right-hand
 * face at p; its underside (back of that leaf) is the left face of the next
 * spread, and the face revealed underneath is the right face of the next
 * spread. That is exactly the {@link TurnFaces} triple the curl shader needs
 * (front / back / revealed), so the underside is always a real page — never the
 * front mirrored.
 */

/** Faces visible at rest for a given turn position. */
export interface SpreadFaces {
  /** Left page index, or `null` for the cover (nothing to the left). */
  left: number | null;
  /** Right page index, or `null` past the end (blank back endpaper). */
  right: number | null;
}

/** The three faces a single turn animates. Indices are into the flat page list. */
export interface TurnFaces {
  /** Front of the leaf that lifts (the page the user grabs). */
  front: number | null;
  /** Underside of that leaf (the next page — drives `uPageBack`). */
  back: number | null;
  /** Face revealed underneath as the leaf lifts away (drives `uPageB`). */
  revealed: number | null;
}

/** Number of turn positions for `pageCount` faces in the given mode. */
export function positionCount(pageCount: number, mode: BookMode): number {
  if (pageCount <= 0) return 0;
  if (mode === 'single') return pageCount;
  // Cover is position 0; the rest pair up into spreads.
  return Math.ceil((pageCount - 1) / 2) + 1;
}

/** Faces shown at rest at `position`. */
export function facesAt(position: number, pageCount: number, mode: BookMode): SpreadFaces {
  if (mode === 'single') {
    return { left: null, right: inRange(position, pageCount) ? position : null };
  }
  if (position <= 0) {
    // Cover: single right-hand face.
    return { left: null, right: inRange(0, pageCount) ? 0 : null };
  }
  const left = 2 * position - 1;
  const right = 2 * position;
  return {
    left: inRange(left, pageCount) ? left : null,
    right: inRange(right, pageCount) ? right : null,
  };
}

/**
 * The faces a turn animates. `from` is the current position; `direction`
 * forward turns toward `from+1`, backward toward `from-1`.
 *
 * Forward: the right-hand leaf at `from` lifts. Its front is that right face;
 * its back is the next spread's LEFT face; the revealed face is the next
 * spread's RIGHT face.
 *
 * Backward: the turn is the mirror — the left-hand leaf of the *current* spread
 * folds back to the right, revealing the previous spread. We model it as the
 * same lift run in reverse: front = current left face, back = previous spread's
 * right face, revealed = previous spread's left face.
 */
export function turnFaces(
  from: number,
  direction: 'forward' | 'backward',
  pageCount: number,
  mode: BookMode
): TurnFaces {
  if (mode === 'single') {
    if (direction === 'forward') {
      return {
        front: pick(from, pageCount),
        back: pick(from + 1, pageCount),
        revealed: pick(from + 1, pageCount),
      };
    }
    return {
      front: pick(from, pageCount),
      back: pick(from - 1, pageCount),
      revealed: pick(from - 1, pageCount),
    };
  }

  const here = facesAt(from, pageCount, mode);
  if (direction === 'forward') {
    const next = facesAt(from + 1, pageCount, mode);
    return { front: here.right, back: next.left, revealed: next.right };
  }
  const prev = facesAt(from - 1, pageCount, mode);
  return { front: here.left, back: prev.right, revealed: prev.left };
}

function inRange(i: number, count: number): boolean {
  return i >= 0 && i < count;
}

function pick(i: number, count: number): number | null {
  return inRange(i, count) ? i : null;
}
