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

export type SerializedMentionNode = Spread<
  {
    userId: string;
    mentionName: string;
  },
  SerializedTextNode
>;

/**
 * MentionNode represents an @mention in the editor.
 * Extends TextNode so it renders inline and supports selection/deletion.
 */
export class MentionNode extends TextNode {
  __userId: string;
  __mentionName: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__userId, node.__mentionName, node.__key);
  }

  constructor(userId: string, mentionName: string, key?: NodeKey) {
    super(`@${mentionName}`, key);
    this.__userId = userId;
    this.__mentionName = mentionName;
  }

  getUserId(): string {
    return this.__userId;
  }

  getMentionName(): string {
    return this.__mentionName;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'mention';
    dom.setAttribute('data-user-id', this.__userId);
    dom.style.color = 'var(--color-primary, #3b82f6)';
    dom.style.fontWeight = '500';
    dom.style.cursor = 'default';
    return dom;
  }

  updateDOM(): boolean {
    // Returning false tells Lexical to re-create the DOM from scratch
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-lexical-mention', 'true');
    element.setAttribute('data-user-id', this.__userId);
    element.textContent = `@${this.__mentionName}`;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      userId: this.__userId,
      mentionName: this.__mentionName,
      type: 'mention',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.userId, serializedNode.mentionName);
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

export function $createMentionNode(userId: string, mentionName: string): MentionNode {
  const node = new MentionNode(userId, mentionName);
  node.setMode('segmented');
  return node;
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}
