import { createEditor, type LexicalEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import {
  $createEntityMentionNode,
  EntityMentionNode,
  entityImageTypeForSubject,
  type EntityMentionPayload,
  type SerializedEntityMentionNode,
} from './entity-mention-node';

// Canonical ids are CONTENT-HASHED — the suffix after `btl_football_<type>_`
// is an opaque hex hash that never starts with a digit. These fixtures use that
// real shape on purpose; a provider-derived numeric suffix would trip the
// guardrail in `lib/entity-imagery-manifest.guardrail.test.ts`.
const fullPayload: EntityMentionPayload = {
  canonicalId: 'btl_football_team_taaaa1111',
  subjectType: 'team',
  label: 'Aston Villa',
  slug: 'aston-villa',
  imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_team_taaaa1111.svg',
};

// Lexical nodes can only be constructed inside an active editor context, so we
// run every node operation through a headless editor that knows the node.
function makeEditor(): LexicalEditor {
  return createEditor({
    namespace: 'EntityMentionNodeTest',
    nodes: [EntityMentionNode],
    onError: (error) => {
      throw error;
    },
  });
}

function inUpdate<T>(editor: LexicalEditor, fn: () => T): T {
  let result!: T;
  editor.update(
    () => {
      result = fn();
    },
    { discrete: true }
  );
  return result;
}

describe('EntityMentionNode', () => {
  it('reports its node type (distinct from the user mention node)', () => {
    expect(EntityMentionNode.getType()).toBe('entity-mention');
  });

  it('exposes the canonical id + subject accessors', () => {
    const editor = makeEditor();
    const accessors = inUpdate(editor, () => {
      const node = $createEntityMentionNode(fullPayload);
      return {
        canonicalId: node.getCanonicalId(),
        subjectType: node.getSubjectType(),
        label: node.getEntityLabel(),
        slug: node.getSlug(),
        imageUrl: node.getImageUrl(),
      };
    });

    expect(accessors).toEqual({
      canonicalId: 'btl_football_team_taaaa1111',
      subjectType: 'team',
      label: 'Aston Villa',
      slug: 'aston-villa',
      imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_team_taaaa1111.svg',
    });
  });

  it('renders the bare label as its text content (for plain-text extraction)', () => {
    const editor = makeEditor();
    const text = inUpdate(editor, () => $createEntityMentionNode(fullPayload).getTextContent());
    expect(text).toBe('Aston Villa');
  });

  it('serialises every payload field via exportJSON', () => {
    const editor = makeEditor();
    const json = inUpdate(editor, () => $createEntityMentionNode(fullPayload).exportJSON());

    expect(json).toMatchObject({
      type: 'entity-mention',
      version: 1,
      canonicalId: 'btl_football_team_taaaa1111',
      subjectType: 'team',
      label: 'Aston Villa',
      slug: 'aston-villa',
      imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_team_taaaa1111.svg',
    });
  });

  it('round-trips through exportJSON → importJSON preserving canonicalId + subjectType', () => {
    const editor = makeEditor();
    const { original, restored } = inUpdate(editor, () => {
      const node = $createEntityMentionNode(fullPayload);
      const json = node.exportJSON();
      return { original: json, restored: EntityMentionNode.importJSON(json).exportJSON() };
    });

    expect(restored).toEqual(original);
    expect(restored.canonicalId).toBe('btl_football_team_taaaa1111');
    expect(restored.subjectType).toBe('team');
  });

  it('round-trips a player mention (canonical id + subjectType preserved)', () => {
    const editor = makeEditor();
    const payload: EntityMentionPayload = {
      canonicalId: 'btl_football_player_pcccc3333',
      subjectType: 'player',
      label: 'Erling Haaland',
      slug: 'erling-haaland',
    };
    const restored = inUpdate(editor, () =>
      EntityMentionNode.importJSON($createEntityMentionNode(payload).exportJSON()).exportJSON()
    );
    expect(restored.canonicalId).toBe('btl_football_player_pcccc3333');
    expect(restored.subjectType).toBe('player');
    expect(restored.label).toBe('Erling Haaland');
  });

  it('round-trips when the optional imageUrl is omitted', () => {
    const minimal: SerializedEntityMentionNode = {
      type: 'entity-mention',
      version: 1,
      detail: 0,
      format: 0,
      mode: 'segmented',
      style: '',
      text: 'Premier League',
      canonicalId: 'btl_football_competition_ldddd4444',
      subjectType: 'competition',
      label: 'Premier League',
      slug: 'premier-league',
    };

    const editor = makeEditor();
    const json = inUpdate(editor, () => EntityMentionNode.importJSON(minimal).exportJSON());

    expect(json.canonicalId).toBe('btl_football_competition_ldddd4444');
    expect(json.subjectType).toBe('competition');
    expect(json.label).toBe('Premier League');
    expect(json.imageUrl).toBeUndefined();
  });

  it('clone preserves all fields (canonicalId + subjectType included)', () => {
    const editor = makeEditor();
    const { original, cloned } = inUpdate(editor, () => {
      const node = $createEntityMentionNode(fullPayload);
      return { original: node.exportJSON(), cloned: EntityMentionNode.clone(node).exportJSON() };
    });

    expect(cloned).toEqual(original);
    expect(cloned.canonicalId).toBe(original.canonicalId);
    expect(cloned.subjectType).toBe(original.subjectType);
  });
});

describe('entityImageTypeForSubject', () => {
  it('maps SubjectType → EntityImageType (team→crest, coach→manager, venue→stadium)', () => {
    expect(entityImageTypeForSubject('team')).toBe('crest');
    expect(entityImageTypeForSubject('coach')).toBe('manager');
    expect(entityImageTypeForSubject('venue')).toBe('stadium');
    expect(entityImageTypeForSubject('player')).toBe('player');
    expect(entityImageTypeForSubject('competition')).toBe('competition');
  });

  it('falls back to player for an unknown subject type', () => {
    expect(entityImageTypeForSubject('unknown')).toBe('player');
  });
});
