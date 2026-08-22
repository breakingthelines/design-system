/* ─────────────────────────────────────────────────────────────────────────────
 * Accent-insensitive matching for in-component search inputs.
 *
 * Football data carries names exactly as the provider ships them, which means
 * it carries their diacritics: "João Pedro", "Thomas Müller", "Mesut Özil",
 * "Enzo Fernández", "Atlético Madrid". A plain
 * `value.toLowerCase().includes(query)` only matches those when the viewer
 * reproduces the accent, and most keyboards make that anything from awkward to
 * impossible. Typing "joao" found nothing.
 *
 * The fix is to fold BOTH sides of the comparison, never just one. Folding the
 * candidate alone would let "joao" find "João Pedro" while breaking the viewer
 * who DOES type "João"; folding the query alone would do the reverse. With both
 * folded the two spellings collapse onto the same key and either input finds
 * the player.
 *
 * Folding is for MATCHING only. Nothing here touches what is rendered — rows
 * keep the real, accented name.
 *
 * `lib/country-flags.ts` has its own stricter normaliser and keeps it: that one
 * is a lookup key for a fixed table and wants punctuation gone. This one is a
 * substring matcher over free text typed by a human, and must not.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Decomposition + combining-mark strip, then lower-case.
 *
 * `NFD` splits a precomposed letter into its base letter plus its combining
 * marks (ã → a + U+0303), and the marks all live in the Combining Diacritical
 * Marks block (U+0300..U+036F), so removing that range leaves the base letters.
 * That covers the Latin alphabets BTL ingests: ã/á/â, ü/ö, ç, ñ, and the
 * Slavic č/š/ž.
 *
 * Deliberately NOT a slug: punctuation, spaces and apostrophes survive, so
 * "N'Golo" and "Nuno Tavares" keep matching on the substrings a viewer types.
 * Letters that are their own codepoint rather than a base plus a mark (ß, ł, đ,
 * ø) also survive unchanged, and still match themselves — this widens what
 * matches, it never narrows it.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Whether `query` is a substring of `candidate`, comparing both accent-folded.
 *
 * An empty (or whitespace-only) query matches everything, which is what a
 * search input wants in its rest state.
 */
export function matchesSearchQuery(candidate: string, query: string): boolean {
  const folded = foldForSearch(query).trim();
  if (folded === '') return true;
  return foldForSearch(candidate).includes(folded);
}
