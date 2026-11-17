import { describe, expect, it } from 'vitest';

import { playerShortName } from '../player-short-name';

/**
 * The shared short-name table. viz mirrors it in
 * src/football/lib/__tests__/player-name.test.ts; keep the two identical.
 * [name, provider short form or undefined, expected]
 */
const SHORT_NAME_TABLE: readonly (readonly [string, string | undefined, string])[] = [
  ['Ángel Di María', undefined, 'Di María'],
  ['Alexis Mac Allister', undefined, 'Mac Allister'],
  ['Virgil van Dijk', undefined, 'van Dijk'],
  ['Virgil Van Dijk', undefined, 'Van Dijk'],
  ['Kevin De Bruyne', undefined, 'De Bruyne'],
  ['Marc-André ter Stegen', undefined, 'ter Stegen'],
  ['Salem Al-Dawsari', undefined, 'Al-Dawsari'],
  ['Salem Al Dawsari', undefined, 'Al Dawsari'],
  ['Edwin van der Sar', undefined, 'van der Sar'],
  ['Marcos de la Fuente', undefined, 'de la Fuente'],
  ['Rodrigo De Paul', undefined, 'De Paul'],
  ['Stephan El Shaarawy', undefined, 'El Shaarawy'],
  ['Brandon Mc Donald', undefined, 'Mc Donald'],
  ['Rodri', undefined, 'Rodri'],
  ['Marquinhos', undefined, 'Marquinhos'],
  ['Lionel Messi', undefined, 'Messi'],
  ['Ben White', undefined, 'White'],
  ['Vinícius Júnior', undefined, 'Vinícius Júnior'],
  ['Pedro Neto', undefined, 'Pedro Neto'],
  ['van Dijk', undefined, 'van Dijk'],
  ['Á. Di María', undefined, 'Di María'],
  ['V. van Dijk', undefined, 'van Dijk'],
  ['Randal Kolo Muani', 'R. Kolo Muani', 'Kolo Muani'],
  ['Ángel Di María', 'Á. Di María', 'Di María'],
  ['Alexis Mac Allister', 'A. Mac Allister', 'Mac Allister'],
  ['Rodri', 'Rodri', 'Rodri'],
  ['João Pedro Junqueira de Jesus', 'João Pedro', 'João Pedro'],
  ['Vinícius José Paixão de Oliveira Júnior', 'Vinícius Júnior', 'Vinícius Júnior'],
  [' Lionel  Messi ', undefined, 'Messi'],
  ['', 'K. Mbappé', 'Mbappé'],
  ['', undefined, ''],
];

describe('playerShortName', () => {
  it.each(SHORT_NAME_TABLE)('%s (%s) is %s', (name, short, expected) => {
    expect(playerShortName(name, short)).toBe(expected);
  });

  it('reads undefined as empty', () => {
    expect(playerShortName(undefined)).toBe('');
  });
});
