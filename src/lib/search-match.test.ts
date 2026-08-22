import { describe, expect, it } from 'vitest';

import { foldForSearch, matchesSearchQuery } from './search-match';

describe('foldForSearch', () => {
  it('strips combining marks and lower-cases', () => {
    expect(foldForSearch('João Pedro')).toBe('joao pedro');
    expect(foldForSearch('Enzo Fernández')).toBe('enzo fernandez');
    expect(foldForSearch('Thomas Müller')).toBe('thomas muller');
    expect(foldForSearch('Mesut Özil')).toBe('mesut ozil');
    expect(foldForSearch('Nicolò Barella')).toBe('nicolo barella');
  });

  it('is idempotent — folding an already-folded value is a no-op', () => {
    expect(foldForSearch(foldForSearch('João Pedro'))).toBe(foldForSearch('João Pedro'));
  });

  it('keeps punctuation, spaces and apostrophes (it is not a slug)', () => {
    expect(foldForSearch("N'Golo Kanté")).toBe("n'golo kante");
    expect(foldForSearch('Nuno Tavares')).toBe('nuno tavares');
    expect(foldForSearch('A. Alexander-Arnold')).toBe('a. alexander-arnold');
  });

  it('leaves letters that are their own codepoint rather than base + mark', () => {
    // ø, ß, ł and đ do not decompose under NFD. They still match themselves;
    // folding widens what matches, it never narrows it.
    expect(foldForSearch('M. Ødegaard')).toBe('m. ødegaard');
    expect(foldForSearch('Robert Lewandowski')).toBe('robert lewandowski');
  });
});

describe('matchesSearchQuery', () => {
  // The reported bug, both directions. Neither may regress in fixing the other.
  it('matches an unaccented query against an accented candidate', () => {
    expect(matchesSearchQuery('João Pedro', 'joao')).toBe(true);
    expect(matchesSearchQuery('Enzo Fernández', 'fernandez')).toBe(true);
    expect(matchesSearchQuery('K. Mbappé', 'mbappe')).toBe(true);
  });

  it('still matches an accented query against an accented candidate', () => {
    expect(matchesSearchQuery('João Pedro', 'João')).toBe(true);
    expect(matchesSearchQuery('João Pedro', 'joão')).toBe(true);
    expect(matchesSearchQuery('Enzo Fernández', 'Fernández')).toBe(true);
  });

  it('matches an accented query against an unaccented candidate', () => {
    // Someone with an accent-capable keyboard searching a name the provider
    // ships plain still finds it.
    expect(matchesSearchQuery('Joao Cancelo', 'joão')).toBe(true);
  });

  it('leaves unaccented names entirely unaffected', () => {
    expect(matchesSearchQuery('B. Saka', 'saka')).toBe(true);
    expect(matchesSearchQuery('B. Saka', 'SAKA')).toBe(true);
    expect(matchesSearchQuery('B. Saka', 'palmer')).toBe(false);
  });

  it('does not collapse names that differ by more than an accent', () => {
    // Folding must not turn a non-match into a match. "Muller" and "Miller"
    // differ in a base letter, not a diacritic.
    expect(matchesSearchQuery('Thomas Müller', 'miller')).toBe(false);
    expect(matchesSearchQuery('João Pedro', 'joan')).toBe(false);
  });

  it('accepts either spelling of a name whose accent is its only distinguishing mark', () => {
    // Two real squad-mates who differ only by the diacritic. Folding makes the
    // pair mutually reachable rather than unreachable — a query for either
    // spelling surfaces both rows, and the viewer picks by sight. That is the
    // deliberate trade: a substring search widens, it never hides a row the
    // old behaviour would have shown.
    expect(matchesSearchQuery('Nicolò Zaniolo', 'nicolo')).toBe(true);
    expect(matchesSearchQuery('Nicolo Barella', 'nicolò')).toBe(true);
    // And an exact accented query still finds its exact accented candidate.
    expect(matchesSearchQuery('Nicolò Zaniolo', 'Nicolò')).toBe(true);
  });

  it('treats an empty or whitespace-only query as matching everything', () => {
    expect(matchesSearchQuery('B. Saka', '')).toBe(true);
    expect(matchesSearchQuery('B. Saka', '   ')).toBe(true);
  });

  it('trims a query with surrounding whitespace', () => {
    expect(matchesSearchQuery('João Pedro', '  joao  ')).toBe(true);
  });
});
