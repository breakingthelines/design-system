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

/* ────────────────────────────────────────────────────────────
 * Polymorphic mention contract
 *
 * A mention is a typed inline reference to a subject — either a BTL USER /
 * SQUAD (handle-keyed) or a FOOTBALL entity (canonical-id-keyed). The two used
 * to be separate node types (`MentionNode` for users, `EntityMentionNode` for
 * football); they are now collapsed into ONE polymorphic node discriminated by
 * `kind`. A single `@` trigger drives the lot; the host's search lane returns a
 * flat, relevance-ranked list of {@link MentionItem}s spanning every kind.
 *
 * The contract is IDENTICAL to the `@breakingthelines/editor` package's
 * `MentionItem`, so a hit drops straight into {@link $createMentionNode} and a
 * saved mention round-trips losslessly through Lexical `body_json`
 * (exportJSON/importJSON) and `body_html` (exportDOM/importDOM).
 * ──────────────────────────────────────────────────────────── */

/** Discriminator for the kind of subject a mention points at. */
export type MentionKind =
  | 'user'
  | 'squad'
  | 'player'
  | 'club'
  | 'manager'
  | 'competition'
  | 'country';

/**
 * A single mention suggestion / node payload. Equal to the
 * `@breakingthelines/editor` `MentionItem` shape. The host owns the lookup and
 * pre-resolves imagery into `imageUrl` (the node never resolves crests itself).
 */
export interface MentionItem {
  /** Stable subject identifier. Users/squads → handle-keyed id; football → canonical `btl_football_*` id. */
  id: string;
  /** Subject kind — drives inline styling and the dropdown badge. */
  kind: MentionKind;
  /** Display label rendered inline (e.g. "@zach" handle, or "Aston Villa"). */
  label: string;
  /** Optional pre-resolved avatar / crest image URL (CORS-clean). */
  imageUrl?: string;
  /** Optional slug (drives the subject's public route when `url` is absent). */
  slug?: string;
  /** Optional fully-resolved canonical href for the rendered link. */
  url?: string;
}

export type SerializedMentionNode = Spread<
  {
    mentionId: string;
    mentionKind: MentionKind;
    label: string;
    imageUrl?: string;
    slug?: string;
    url?: string;
  },
  SerializedTextNode
>;

/** Kinds that render in the handle style (`@label`, primary colour). */
const HANDLE_KINDS: ReadonlySet<MentionKind> = new Set<MentionKind>(['user', 'squad']);

/** Whether a kind renders as a `@`-prefixed handle (vs a bare entity label). */
export function isHandleKind(kind: MentionKind): boolean {
  return HANDLE_KINDS.has(kind);
}

/** The visible inline text for a mention: `@label` for handles, bare `label` otherwise. */
function displayText(kind: MentionKind, label: string): string {
  return isHandleKind(kind) ? `@${label}` : label;
}

/**
 * MentionNode represents an inline polymorphic @mention in the editor.
 *
 * Extends {@link TextNode} so it renders inline and supports selection/deletion.
 * Visible text depends on kind: `user`/`squad` render `@label` (handle style),
 * the football kinds render the bare `label`. Colours follow suit
 * (primary vs red). Round-trips losslessly through `body_json` and `body_html`.
 */
export class MentionNode extends TextNode {
  __mentionId: string;
  __mentionKind: MentionKind;
  __label: string;
  __imageUrl?: string;
  __slug?: string;
  __url?: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      {
        id: node.__mentionId,
        kind: node.__mentionKind,
        label: node.__label,
        imageUrl: node.__imageUrl,
        slug: node.__slug,
        url: node.__url,
      },
      node.__key
    );
  }

  constructor(item: MentionItem, key?: NodeKey) {
    super(displayText(item.kind, item.label), key);
    this.__mentionId = item.id;
    this.__mentionKind = item.kind;
    this.__label = item.label;
    this.__imageUrl = item.imageUrl;
    this.__slug = item.slug;
    this.__url = item.url;
  }

  getMentionId(): string {
    return this.__mentionId;
  }

  getMentionKind(): MentionKind {
    return this.__mentionKind;
  }

  getMentionLabel(): string {
    return this.__label;
  }

  getImageUrl(): string | undefined {
    return this.__imageUrl;
  }

  getSlug(): string | undefined {
    return this.__slug;
  }

  getMentionUrl(): string | undefined {
    return this.__url;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    const handle = isHandleKind(this.__mentionKind);
    dom.className = 'mention';
    dom.setAttribute('data-mention-id', this.__mentionId);
    dom.setAttribute('data-mention-kind', this.__mentionKind);
    if (this.__slug) dom.setAttribute('data-mention-slug', this.__slug);
    dom.style.color = handle ? 'var(--color-primary, #3b82f6)' : 'var(--color-red-100, #ef4444)';
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
    element.setAttribute('data-lexical-mention', 'true');
    element.setAttribute('data-mention-id', this.__mentionId);
    element.setAttribute('data-mention-kind', this.__mentionKind);
    if (this.__slug) element.setAttribute('data-mention-slug', this.__slug);
    element.textContent = displayText(this.__mentionKind, this.__label);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute('data-lexical-mention') !== 'true') {
          return null;
        }
        return {
          conversion: (node: HTMLElement) => {
            const id = node.getAttribute('data-mention-id') ?? '';
            const kind = (node.getAttribute('data-mention-kind') ?? '') as MentionKind;
            const slug = node.getAttribute('data-mention-slug') ?? undefined;
            const rawText = node.textContent ?? '';
            // Strip the leading `@` for handle kinds so the stored label is bare.
            const label = isHandleKind(kind) ? rawText.replace(/^@/, '') : rawText;
            if (!id || !kind) return { node: null };
            return {
              node: $createMentionNode({ id, kind, label, slug }),
            };
          },
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionId: this.__mentionId,
      mentionKind: this.__mentionKind,
      label: this.__label,
      imageUrl: this.__imageUrl,
      slug: this.__slug,
      url: this.__url,
      type: 'mention',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode({
      id: serializedNode.mentionId,
      kind: serializedNode.mentionKind,
      label: serializedNode.label,
      imageUrl: serializedNode.imageUrl,
      slug: serializedNode.slug,
      url: serializedNode.url,
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

export function $createMentionNode(item: MentionItem): MentionNode {
  const node = new MentionNode(item);
  node.setMode('segmented');
  return node;
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
