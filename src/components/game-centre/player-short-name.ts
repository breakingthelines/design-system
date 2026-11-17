/* ─────────────────────────────────────────────────────────────────────────────
 * playerShortName: the one rule for a player's short name on match surfaces
 * (timeline rows, assists, strip dot labels).
 *
 * In order:
 *  1. The provider's short form wins when given and abbreviated. API-Football
 *     writes "Á. Di María", "R. Kolo Muani", "V. van Dijk": the leading
 *     initials are its own mark of the disposable forename, so they go and
 *     the rest stays whole. That is the only way to keep a compound surname
 *     with no particle ("Kolo Muani").
 *  2. A name with leading initials is treated the same way.
 *  3. A single token is the name ("Rodri", "Marquinhos").
 *  4. Otherwise the last token, with any particles directly before it
 *     ("Ángel Di María" is "Di María", "Edwin van der Sar" is "van der Sar"),
 *     and a generational suffix keeps the token before it ("Vinícius Júnior").
 *     The first token is a forename and is only taken as a particle when it is
 *     written in lower case ("van Dijk").
 *
 * viz mirrors this rule (src/football/lib/player-name.ts) with the same test
 * table; change both together.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Lower-cased surname particles that stay with the surname after them. */
export const PLAYER_NAME_PARTICLES: ReadonlySet<string> = new Set([
  'abu',
  'al',
  'ben',
  'bin',
  'da',
  'dal',
  'dalla',
  'das',
  'de',
  'dei',
  'del',
  'della',
  'den',
  'der',
  'des',
  'di',
  'do',
  'dos',
  'du',
  'el',
  'ibn',
  'la',
  'le',
  'lo',
  'mac',
  'mc',
  'op',
  'san',
  'santa',
  'st',
  'st.',
  'te',
  'ten',
  'ter',
  'van',
  'von',
]);

/** Generational suffixes that never stand alone as a short name. */
const SUFFIXES: ReadonlySet<string> = new Set([
  'jr',
  'jr.',
  'junior',
  'júnior',
  'filho',
  'neto',
  'sobrinho',
  'ii',
  'iii',
  'iv',
]);

/** A single letter and a dot: an abbreviated forename ("Á."). */
const INITIAL = /^\p{L}\.$/u;

function tokens(name: string | undefined): string[] {
  return (name ?? '').trim().split(/\s+/).filter(Boolean);
}

/** The tokens after any leading initials, or undefined when there are none. */
function afterInitials(parts: readonly string[]): string[] | undefined {
  let start = 0;
  while (start < parts.length && INITIAL.test(parts[start]!)) start += 1;
  if (start === 0 || start >= parts.length) return undefined;
  return parts.slice(start);
}

/**
 * A player's short name: "Di María" for "Ángel Di María", "Mac Allister" for
 * "Alexis Mac Allister", "Kolo Muani" for "Randal Kolo Muani" when the
 * provider's "R. Kolo Muani" is given as `providerShort`.
 */
export function playerShortName(name: string | undefined, providerShort?: string): string {
  const short = afterInitials(tokens(providerShort));
  if (short) return short.join(' ');
  const parts = tokens(name);
  if (parts.length === 0) return tokens(providerShort).join(' ');
  const rest = afterInitials(parts);
  if (rest) return rest.join(' ');
  if (parts.length === 1) return parts[0]!;
  let start = parts.length - 1;
  if (SUFFIXES.has(parts[start]!.toLowerCase())) start -= 1;
  while (start > 0 && PLAYER_NAME_PARTICLES.has(parts[start - 1]!.toLowerCase())) {
    const prev = parts[start - 1]!;
    // The first token is a forename ("Ben White") unless written in lower case.
    if (start - 1 === 0 && prev !== prev.toLowerCase()) break;
    start -= 1;
  }
  return parts.slice(start).join(' ');
}
