import { createEditor, type LexicalEditor } from 'lexical';
import { describe, expect, it } from 'vitest';

import {
  $createMentionNode,
  isHandleKind,
  MentionNode,
  type MentionItem,
  type SerializedMentionNode,
} from './mention-node';

// Football canonical ids are CONTENT-HASHED — the suffix after
// `btl_football_<type>_` is an opaque hex hash that never starts with a digit.
// User/squad ids are handle-keyed. Both flow through the SAME node now.
const clubItem: MentionItem = {
  id: 'btl_football_club_taaaa1111',
  kind: 'club',
  label: 'Aston Villa',
  slug: 'aston-villa',
  imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_club_taaaa1111.svg',
};

const userItem: MentionItem = {
  id: 'usr_zach',
  kind: 'user',
  label: 'zach',
  slug: '@zach',
  imageUrl: 'https://i.pravatar.cc/150?u=zach',
};

// Lexical nodes can only be constructed inside an active editor context, so we
// run every node operation through a headless editor that knows the node.
function makeEditor(): LexicalEditor {
  return createEditor({
    namespace: 'MentionNodeTest',
    nodes: [MentionNode],
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

describe('MentionNode', () => {
  it('reports the unified node type', () => {
    expect(MentionNode.getType()).toBe('mention');
  });

  it('exposes the polymorphic accessors', () => {
    const editor = makeEditor();
    const accessors = inUpdate(editor, () => {
      const node = $createMentionNode(clubItem);
      return {
        id: node.getMentionId(),
        kind: node.getMentionKind(),
        label: node.getMentionLabel(),
        slug: node.getSlug(),
        url: node.getMentionUrl(),
        imageUrl: node.getImageUrl(),
      };
    });

    expect(accessors).toEqual({
      id: 'btl_football_club_taaaa1111',
      kind: 'club',
      label: 'Aston Villa',
      slug: 'aston-villa',
      url: undefined,
      imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_club_taaaa1111.svg',
    });
  });

  it('renders the bare label for an entity kind (plain-text extraction)', () => {
    const editor = makeEditor();
    const text = inUpdate(editor, () => $createMentionNode(clubItem).getTextContent());
    expect(text).toBe('Aston Villa');
  });

  it('renders @label for a handle kind (user/squad)', () => {
    const editor = makeEditor();
    const text = inUpdate(editor, () => $createMentionNode(userItem).getTextContent());
    expect(text).toBe('@zach');
  });

  it('serialises every payload field via exportJSON', () => {
    const editor = makeEditor();
    const json = inUpdate(editor, () => $createMentionNode(clubItem).exportJSON());

    expect(json).toMatchObject({
      type: 'mention',
      version: 1,
      mentionId: 'btl_football_club_taaaa1111',
      mentionKind: 'club',
      label: 'Aston Villa',
      slug: 'aston-villa',
      imageUrl: 'https://media.breakingthelines.dev/btl/crest/btl_football_club_taaaa1111.svg',
    });
  });

  it('round-trips through exportJSON → importJSON preserving id + kind', () => {
    const editor = makeEditor();
    const { original, restored } = inUpdate(editor, () => {
      const node = $createMentionNode(clubItem);
      const json = node.exportJSON();
      return { original: json, restored: MentionNode.importJSON(json).exportJSON() };
    });

    expect(restored).toEqual(original);
    expect(restored.mentionId).toBe('btl_football_club_taaaa1111');
    expect(restored.mentionKind).toBe('club');
  });

  it('round-trips a player mention (id + kind preserved)', () => {
    const editor = makeEditor();
    const item: MentionItem = {
      id: 'btl_football_player_pcccc3333',
      kind: 'player',
      label: 'Erling Haaland',
      slug: 'erling-haaland',
    };
    const restored = inUpdate(editor, () =>
      MentionNode.importJSON($createMentionNode(item).exportJSON()).exportJSON()
    );
    expect(restored.mentionId).toBe('btl_football_player_pcccc3333');
    expect(restored.mentionKind).toBe('player');
    expect(restored.label).toBe('Erling Haaland');
  });

  it('round-trips a user mention preserving the bare label (no double @)', () => {
    const editor = makeEditor();
    const restored = inUpdate(editor, () =>
      MentionNode.importJSON($createMentionNode(userItem).exportJSON()).exportJSON()
    );
    expect(restored.mentionId).toBe('usr_zach');
    expect(restored.mentionKind).toBe('user');
    // Stored label stays bare; the `@` is presentational.
    expect(restored.label).toBe('zach');
    expect(restored.text).toBe('@zach');
  });

  it('round-trips when the optional imageUrl is omitted', () => {
    const minimal: SerializedMentionNode = {
      type: 'mention',
      version: 1,
      detail: 0,
      format: 0,
      mode: 'segmented',
      style: '',
      text: 'Premier League',
      mentionId: 'btl_football_competition_ldddd4444',
      mentionKind: 'competition',
      label: 'Premier League',
      slug: 'premier-league',
    };

    const editor = makeEditor();
    const json = inUpdate(editor, () => MentionNode.importJSON(minimal).exportJSON());

    expect(json.mentionId).toBe('btl_football_competition_ldddd4444');
    expect(json.mentionKind).toBe('competition');
    expect(json.label).toBe('Premier League');
    expect(json.imageUrl).toBeUndefined();
  });

  it('clone preserves all fields (id + kind included)', () => {
    const editor = makeEditor();
    const { original, cloned } = inUpdate(editor, () => {
      const node = $createMentionNode(clubItem);
      return { original: node.exportJSON(), cloned: MentionNode.clone(node).exportJSON() };
    });

    expect(cloned).toEqual(original);
    expect(cloned.mentionId).toBe(original.mentionId);
    expect(cloned.mentionKind).toBe(original.mentionKind);
  });
});

describe('isHandleKind', () => {
  it('treats user + squad as handle kinds', () => {
    expect(isHandleKind('user')).toBe(true);
    expect(isHandleKind('squad')).toBe(true);
  });

  it('treats football kinds as non-handle (bare label) kinds', () => {
    expect(isHandleKind('club')).toBe(false);
    expect(isHandleKind('player')).toBe(false);
    expect(isHandleKind('manager')).toBe(false);
    expect(isHandleKind('competition')).toBe(false);
    expect(isHandleKind('country')).toBe(false);
  });
});
