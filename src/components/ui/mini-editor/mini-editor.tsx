'use client';

import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  DecoratorNode,
  type EditorState,
  type Klass,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';

import { cn } from '#/lib/utils';
import { SubmitPlugin } from './submit-plugin';
import { MaxLengthPlugin } from './max-length-plugin';
import { MentionNode, $isMentionNode, type MentionItem, type MentionKind } from './mention-node';
import { MentionPlugin } from './mention-plugin';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

/** Football entity kinds — the non-handle subjects keyed by canonical id. */
const ENTITY_KINDS: ReadonlySet<MentionKind> = new Set<MentionKind>([
  'club',
  'player',
  'manager',
  'competition',
  'country',
]);

interface MiniEditorHandle {
  clear: () => void;
  focus: () => void;
  blur: () => void;
  getText: () => string;
  /**
   * The full serialized Lexical editor state as a JSON string (`body_json`).
   * Includes every MentionNode losslessly, so an `@`-mention round-trips through
   * the shared {@link MentionFromNode} reader path instead of collapsing to
   * plain text. Pair with {@link getText} (the plain-text fallback + search/preview).
   */
  getBodyJson: () => string;
  insertText: (text: string) => void;
  /** Every inserted mention, in document order, across all kinds. */
  getMentions: () => MentionItem[];
  /** Ids of every `user` mention (kind-filtered derivation of {@link getMentions}). */
  getMentionedUserIds: () => string[];
  /** Canonical ids (`btl_football_*`) of every football-entity mention (club/player/manager/competition/country). */
  getMentionedEntityIds: () => string[];
}

interface MiniEditorProps {
  /** Placeholder text */
  placeholder?: string;
  /** Max character count (enforced via plugin) */
  maxLength?: number;
  /** Submit behaviour: 'enter' (panel inline), 'mod-enter' (standalone composer) */
  submitOn?: 'enter' | 'mod-enter';
  /** Called with plain text on submit */
  onSubmit?: (text: string) => void;
  /**
   * Called on every editor-state change with the plain text content, plus
   * whether the document is EFFECTIVELY empty — no text AND no non-text
   * child (a host-registered decorator/block node, e.g. a Lineup card). A
   * card-only document (a block, no typed text) has `text === ''` but
   * `isEmpty === false`; a host gating submit on content should key off
   * `isEmpty`, not `text.length`, so inserting a block alone is postable. See
   * {@link isRootEffectivelyEmpty}.
   */
  onChange?: (text: string, isEmpty: boolean) => void;
  /** Called when remaining character count changes (requires maxLength) */
  onRemainingChange?: (remaining: number) => void;
  /** Imperative ref: clear(), focus(), getText() */
  editorRef?: React.Ref<MiniEditorHandle>;
  /** Slot for additional Lexical plugins */
  plugins?: React.ReactNode;
  /**
   * Called once with the underlying {@link LexicalEditor} instance when the
   * composer mounts. Lets a host dispatch commands / insert nodes into the
   * editor from outside the Lexical context (e.g. an action-row toolbar button).
   */
  onEditorReady?: (editor: LexicalEditor) => void;
  /** Extra Lexical node classes to register beyond MentionNode — e.g. host-provided block/decorator nodes. */
  extraNodes?: Array<Klass<LexicalNode>>;
  /**
   * Polymorphic @mention search callback. When provided, enables the single `@`
   * mention typeahead. The host wires this to its federated search lane and
   * returns relevance-ranked {@link MentionItem}s spanning every kind (user,
   * squad, club, player, manager, competition, country).
   */
  onMentionSearch?: (query: string) => Promise<MentionItem[]>;
  /** Disabled state */
  disabled?: boolean;
  /** Allow multi-line input (default: single-line) */
  multiline?: boolean;
  /** Additional class on the contenteditable container */
  className?: string;
  /** Override class for the placeholder (defaults to text-muted-foreground) */
  placeholderClassName?: string;
}

/* ────────────────────────────────────────────────────────────
 * Internal bridge — exposes editor instance to parent via ref
 * ──────────────────────────────────────────────────────────── */

const EditorRefPlugin = React.forwardRef<MiniEditorHandle>(function EditorRefPlugin(_, ref) {
  const [editor] = useLexicalComposerContext();

  React.useImperativeHandle(ref, () => {
    const getMentions = (): MentionItem[] =>
      editor.getEditorState().read(() => {
        const items: MentionItem[] = [];
        for (const node of $getRoot().getAllTextNodes()) {
          if ($isMentionNode(node)) {
            items.push({
              id: node.getMentionId(),
              kind: node.getMentionKind(),
              label: node.getMentionLabel(),
              imageUrl: node.getImageUrl(),
              slug: node.getSlug(),
              url: node.getMentionUrl(),
            });
          }
        }
        return items;
      });

    return {
      clear() {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
      },
      focus() {
        editor.focus();
      },
      blur() {
        editor.getRootElement()?.blur();
      },
      getText() {
        return editor.getEditorState().read(() => $getRoot().getTextContent());
      },
      getBodyJson() {
        return JSON.stringify(editor.getEditorState().toJSON());
      },
      getMentions,
      getMentionedUserIds() {
        return getMentions()
          .filter((m) => m.kind === 'user')
          .map((m) => m.id);
      },
      getMentionedEntityIds() {
        return getMentions()
          .filter((m) => ENTITY_KINDS.has(m.kind))
          .map((m) => m.id);
      },
      insertText(text: string) {
        editor.update(() => {
          const selection = $getSelection();
          if (selection) {
            selection.insertText(text);
          } else {
            const root = $getRoot();
            const lastChild = root.getLastChild();
            if (lastChild && $isElementNode(lastChild)) {
              lastChild.append($createTextNode(text));
            } else {
              const p = $createParagraphNode();
              p.append($createTextNode(text));
              root.append(p);
            }
          }
        });
        editor.focus();
      },
    };
  });

  return null;
});

/* ────────────────────────────────────────────────────────────
 * Disabled plugin — toggles editor editable state
 * ──────────────────────────────────────────────────────────── */

function DisabledPlugin({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return null;
}

/* ────────────────────────────────────────────────────────────
 * Editor-ready plugin — hands the editor instance to the host
 * ──────────────────────────────────────────────────────────── */

function EditorReadyPlugin({ onReady }: { onReady: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    onReady(editor);
  }, [editor, onReady]);

  return null;
}

/**
 * True when the root has neither typed text NOR a non-text child. Walks only
 * the TOP-LEVEL children (a decorator block never nests inside a paragraph in
 * this editor's shape, so one level is enough): any `DecoratorNode` (a
 * host-registered block — Lineup, Game Stats, any StatsBomb viz) means real,
 * postable content even with zero characters typed, so it short-circuits to
 * "not empty" before the text check. `extraNodes` callers (see
 * `MiniEditorProps`) register exactly this kind of node, so this stays
 * correct for every current and future block type without enumerating them.
 */
function isRootEffectivelyEmpty(): boolean {
  for (const child of $getRoot().getChildren()) {
    if (child instanceof DecoratorNode) return false;
    if (child.getTextContent().length > 0) return false;
  }
  return true;
}

/* ────────────────────────────────────────────────────────────
 * MiniEditor
 * ──────────────────────────────────────────────────────────── */

function MiniEditor({
  placeholder = 'Type something...',
  maxLength,
  submitOn,
  onSubmit,
  onChange,
  onRemainingChange,
  editorRef,
  plugins,
  extraNodes,
  onMentionSearch,
  onEditorReady,
  disabled = false,
  multiline = false,
  className,
  placeholderClassName,
}: MiniEditorProps) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'MiniEditor',
      onError: (error: Error) => console.error('[MiniEditor]', error),
      editable: !disabled,
      nodes: [MentionNode, ...(extraNodes ?? [])],
    }),
    // Only used for initial render — intentionally excluding disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleChange = React.useCallback(
    (editorState: EditorState) => {
      if (!onChange) return;
      editorState.read(() => {
        onChange($getRoot().getTextContent(), isRootEffectivelyEmpty());
      });
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('relative', disabled && 'opacity-50 pointer-events-none')}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                'w-full bg-transparent text-base leading-6 text-inherit placeholder:text-muted-foreground focus:outline-none sm:text-sm',
                !multiline && 'overflow-hidden whitespace-nowrap',
                multiline && 'min-h-[60px] resize-none field-sizing-content',
                className
              )}
            />
          }
          placeholder={
            <div
              className={cn(
                'pointer-events-none absolute top-0 left-0 text-base leading-6 select-none sm:text-sm',
                placeholderClassName ?? 'text-muted-foreground'
              )}
            >
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Change tracking */}
        {onChange && <OnChangePlugin onChange={handleChange} ignoreSelectionChange />}

        {/* Submit on Enter or Cmd+Enter */}
        {submitOn && onSubmit && <SubmitPlugin mode={submitOn} onSubmit={onSubmit} />}

        {/* Character limit enforcement */}
        {maxLength != null && (
          <MaxLengthPlugin maxLength={maxLength} onRemainingChange={onRemainingChange} />
        )}

        {/* Imperative handle */}
        {editorRef && <EditorRefPlugin ref={editorRef as React.Ref<MiniEditorHandle>} />}

        {/* Disabled state sync */}
        <DisabledPlugin disabled={disabled} />

        {/* Hand the editor instance to the host (e.g. for action-row commands) */}
        {onEditorReady && <EditorReadyPlugin onReady={onEditorReady} />}

        {/* Polymorphic @mention autocomplete (users, squads, football entities) */}
        {onMentionSearch && <MentionPlugin onSearch={onMentionSearch} />}

        {/* Extension slot */}
        {plugins}
      </div>
    </LexicalComposer>
  );
}

export { MiniEditor, type MiniEditorProps, type MiniEditorHandle };
