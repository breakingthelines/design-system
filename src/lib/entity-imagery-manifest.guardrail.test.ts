import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ENTITY_IMAGERY_SEED_MANIFEST } from './entity-imagery-manifest';

/**
 * Canonical-id guardrail.
 *
 * Canonical BTL identity entity ids are CONTENT-HASHED: the suffix after the
 * `btl_football_<type>_` prefix is an opaque hex hash that NEVER starts with a
 * digit (e.g. `t9d7dd08f`, `l91f82788`, `p2804f5db`). A digit-suffixed literal
 * like `btl_football_team_42` is a provider-derived id that identity never
 * mints — keying imagery (or anything) by it silently resolves to nothing
 * (crests monogram instead of loading). This guard fails the build the moment
 * such a literal reappears in design-system source, so the cold-start seeds
 * cannot regress to provider ids again.
 *
 * The platform repo carries the mirror of this guard
 * (`app/components/first-touch/screens/crests.canonical-id.test.ts`).
 */
const FORBIDDEN = /btl_football_(team|competition|player|coach|season|venue|official)_\d/;

const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNED_EXT = /\.(ts|tsx|js|jsx|json)$/;

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      yield* walk(full);
    } else if (SCANNED_EXT.test(name)) {
      yield full;
    }
  }
}

describe('canonical-id guardrail', () => {
  it('every seed manifest key is a content-hashed canonical id (no digit suffix)', () => {
    for (const id of Object.keys(ENTITY_IMAGERY_SEED_MANIFEST.entities)) {
      expect(id, `seed key "${id}" must not use a provider-derived numeric suffix`).not.toMatch(
        FORBIDDEN
      );
    }
  });

  it('no source file contains a provider-derived btl_football_*_<digit> literal', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      // The guard test itself defines the forbidden pattern in a comment/regex.
      if (file.endsWith('entity-imagery-manifest.guardrail.test.ts')) continue;
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (FORBIDDEN.test(line)) {
          offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(
      offenders,
      `found provider-derived canonical-id literals:\n${offenders.join('\n')}`
    ).toEqual([]);
  });
});
