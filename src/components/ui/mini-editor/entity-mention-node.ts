import {
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  TextNode,
} from 'lexical';

import { type EntityImageType, entityImage, type EntityImageManifest } from '#/lib/entity-image';

/* ────────────────────────────────────────────────────────────
 * Entity mention contract
 *
 * An ENTITY mention is a typed inline reference to a FOOTBALL entity (team,
 * player, coach/manager, venue/stadium, competition). Unlike the USER
 * {@link MentionNode} (keyed by `userId`), entity mentions are keyed by the
 * BTL CANONICAL identity id — a content-hashed `btl_football_*` id. The two
 * node types are intentionally separate so an editor can register both and a
 * reader can resolve each by its own key space.
 *
 * The payload mirrors `context.v1.SubjectRef`'s display snapshot:
 *   { canonicalId, subjectType, label, slug, imageUrl?, canonicalUrl? }
 * which is exactly the shape the entity SEARCH lane returns as an
 * {@link EntityHit}. `subjectType` is the lower-cased SubjectType (e.g.
 * `'team'`, `'player'`, `'coach'`, `'venue'`, `'competition'`).
 * ──────────────────────────────────────────────────────────── */

/** Lower-cased `context.v1.SubjectType` for the football entities we mention. */
export type EntitySubjectType = 'team' | 'player' | 'coach' | 'venue' | 'competition';

/**
 * Map a {@link EntitySubjectType} to the {@link EntityImageType} the ds
 * imagery resolver understands. (`team`→crest, `coach`→manager,
 * `venue`→stadium; player/competition pass through.)
 */
export function entityImageTypeForSubject(subjectType: string): EntityImageType {
  switch (subjectType) {
    case 'team':
      return 'crest';
    case 'coach':
      return 'manager';
    case 'venue':
      return 'stadium';
    case 'competition':
      return 'competition';
    case 'player':
    default:
      return 'player';
  }
}

/**
 * Resolve a mention's crest/portrait URL via the ds imagery resolver, honouring
 * a CORS-clean `imageUrl` snapshot from the SubjectRef. Shared by the editor DOM
 * and the reader renderer so both render identically. Returns `null` for the
 * monogram fallback.
 */
export function resolveEntityMentionImage(
  subjectType: string,
  canonicalId: string,
  manifest: EntityImageManifest,
  imageUrl?: string | null
): string | null {
  return entityImage(entityImageTypeForSubject(subjectType), canonicalId, manifest, { imageUrl });
}

/**
 * Payload for creating an {@link EntityMentionNode}. Equals the
 * `context.v1.SubjectRef` display snapshot (and the search {@link EntityHit}).
 */
export interface EntityMentionPayload {
  /** BTL canonical identity id — a content-hashed `btl_football_*` id. */
  canonicalId: string;
  /** Lower-cased SubjectType (`team` | `player` | `coach` | `venue` | `competition`). */
  subjectType: string;
  /** Display label rendered inline (e.g. "Aston Villa", "Erling Haaland"). */
  label: string;
  /** Canonical slug (drives the entity's public route). */
  slug: string;
  /** Optional CORS-clean image URL snapshot (wins over the imagery manifest). */
  imageUrl?: string;
  /** Optional fully-resolved canonical href for the rendered link. */
  canonicalUrl?: string;
}

export type SerializedEntityMentionNode = Spread<
  {
    canonicalId: string;
    subjectType: string;
    label: string;
    slug: string;
    imageUrl?: string;
  },
  SerializedTextNode
>;

/**
 * EntityMentionNode represents an inline football-entity mention in the editor.
 *
 * Extends {@link TextNode} (matching the user {@link MentionNode}'s base-class
 * approach) so it renders inline and supports selection/deletion. The visible
 * text is the bare `label` (no `@` prefix — the leading crest is the affordance,
 * and entity labels carry spaces). Round-trips losslessly through Lexical
 * `body_json` (exportJSON/importJSON) and `body_html` (exportDOM/importDOM).
 */
export class EntityMentionNode extends TextNode {
  __canonicalId: string;
  __subjectType: string;
  __entityLabel: string;
  __slug: string;
  __imageUrl?: string;

  static getType(): string {
    return 'entity-mention';
  }

  static clone(node: EntityMentionNode): EntityMentionNode {
    return new EntityMentionNode(
      {
        canonicalId: node.__canonicalId,
        subjectType: node.__subjectType,
        label: node.__entityLabel,
        slug: node.__slug,
        imageUrl: node.__imageUrl,
      },
      node.__key
    );
  }

  constructor(payload: EntityMentionPayload, key?: NodeKey) {
    super(payload.label, key);
    this.__canonicalId = payload.canonicalId;
    this.__subjectType = payload.subjectType;
    this.__entityLabel = payload.label;
    this.__slug = payload.slug;
    this.__imageUrl = payload.imageUrl;
  }

  getCanonicalId(): string {
    return this.__canonicalId;
  }

  getSubjectType(): string {
    return this.__subjectType;
  }

  getEntityLabel(): string {
    return this.__entityLabel;
  }

  getSlug(): string {
    return this.__slug;
  }

  getImageUrl(): string | undefined {
    return this.__imageUrl;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'entity-mention';
    dom.setAttribute('data-entity-id', this.__canonicalId);
    dom.setAttribute('data-entity-type', this.__subjectType);
    dom.style.color = 'var(--color-red-100, #ef4444)';
    dom.style.fontWeight = '500';
    dom.style.cursor = 'default';
    return dom;
  }

  updateDOM(): boolean {
    // Re-create the DOM from scratch so attribute/label edits always reflect.
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-entity-mention', 'true');
    element.setAttribute('data-entity-id', this.__canonicalId);
    element.setAttribute('data-entity-type', this.__subjectType);
    if (this.__slug) element.setAttribute('data-entity-slug', this.__slug);
    element.textContent = this.__entityLabel;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute('data-lexical-entity-mention') !== 'true') {
          return null;
        }
        return {
          conversion: (node: HTMLElement) => {
            const canonicalId = node.getAttribute('data-entity-id') ?? '';
            const subjectType = node.getAttribute('data-entity-type') ?? '';
            const slug = node.getAttribute('data-entity-slug') ?? '';
            const label = node.textContent ?? '';
            if (!canonicalId) return { node: null };
            return {
              node: $createEntityMentionNode({ canonicalId, subjectType, label, slug }),
            };
          },
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedEntityMentionNode {
    return {
      ...super.exportJSON(),
      canonicalId: this.__canonicalId,
      subjectType: this.__subjectType,
      label: this.__entityLabel,
      slug: this.__slug,
      imageUrl: this.__imageUrl,
      type: 'entity-mention',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedEntityMentionNode): EntityMentionNode {
    return $createEntityMentionNode({
      canonicalId: serializedNode.canonicalId,
      subjectType: serializedNode.subjectType,
      label: serializedNode.label,
      slug: serializedNode.slug,
      imageUrl: serializedNode.imageUrl,
    });
  }

  isTextEntity(): true {
    return true;
  }

  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }
}

export function $createEntityMentionNode(payload: EntityMentionPayload): EntityMentionNode {
  const node = new EntityMentionNode(payload);
  node.setMode('segmented');
  return node;
}

export function $isEntityMentionNode(
  node: LexicalNode | null | undefined
): node is EntityMentionNode {
  return node instanceof EntityMentionNode;
}
