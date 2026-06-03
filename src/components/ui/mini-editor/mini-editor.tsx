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
  type EditorState,
} from 'lexical';

import type { EntityImageManifest } from '#/lib/entity-image';
import { cn } from '#/lib/utils';
import { SubmitPlugin } from './submit-plugin';
import { MaxLengthPlugin } from './max-length-plugin';
import { MentionNode, $isMentionNode } from './mention-node';
import { MentionPlugin, type MentionSuggestion } from './mention-plugin';
import { EntityMentionNode, $isEntityMentionNode } from './entity-mention-node';
import { EntityMentionPlugin, type EntityHit } from './entity-mention-plugin';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface MiniEditorHandle {
  clear: () => void;
  focus: () => void;
  blur: () => void;
  getText: () => string;
  insertText: (text: string) => void;
  getMentionedUserIds: () => string[];
  /** Canonical ids (`btl_football_*`) of every football-entity mention. */
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
  /** Called on every text change with plain text content */
  onChange?: (text: string) => void;
  /** Called when remaining character count changes (requires maxLength) */
  onRemainingChange?: (remaining: number) => void;
  /** Imperative ref: clear(), focus(), getText() */
  editorRef?: React.Ref<MiniEditorHandle>;
  /** Slot for additional Lexical plugins */
  plugins?: React.ReactNode;
  /** @mention search callback — when provided, enables user @mention support */
  onMentionSearch?: (query: string) => Promise<MentionSuggestion[]>;
  /**
   * Football-entity mention search callback. When provided (with `entityMentionManifest`),
   * enables entity @mentions keyed by BTL canonical id. Returns the SubjectRef-shaped
   * {@link EntityHit}s. Set `entityMentionTrigger` to a distinct char to co-exist with
   * the user @mention plugin (both default to `@`).
   */
  onEntityMentionSearch?: (query: string) => Promise<EntityHit[]>;
  /** Imagery manifest used to resolve entity-mention crests (required with `onEntityMentionSearch`). */
  entityMentionManifest?: EntityImageManifest;
  /** Trigger char for entity mentions. Default `'@'`. */
  entityMentionTrigger?: string;
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

  React.useImperativeHandle(ref, () => ({
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
    getMentionedUserIds() {
      return editor.getEditorState().read(() => {
        const ids: string[] = [];
        const root = $getRoot();
        const textContent = root.getAllTextNodes();
        for (const node of textContent) {
          if ($isMentionNode(node)) {
            ids.push(node.getUserId());
          }
        }
        return ids;
      });
    },
    getMentionedEntityIds() {
      return editor.getEditorState().read(() => {
        const ids: string[] = [];
        for (const node of $getRoot().getAllTextNodes()) {
          if ($isEntityMentionNode(node)) {
            ids.push(node.getCanonicalId());
          }
        }
        return ids;
      });
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
  }));

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
  onMentionSearch,
  onEntityMentionSearch,
  entityMentionManifest,
  entityMentionTrigger,
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
      nodes: [MentionNode, EntityMentionNode],
    }),
    // Only used for initial render — intentionally excluding disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleChange = React.useCallback(
    (editorState: EditorState) => {
      if (!onChange) return;
      editorState.read(() => {
        onChange($getRoot().getTextContent());
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

        {/* User @mention autocomplete */}
        {onMentionSearch && <MentionPlugin onSearch={onMentionSearch} />}

        {/* Football-entity @mention autocomplete */}
        {onEntityMentionSearch && entityMentionManifest && (
          <EntityMentionPlugin
            onSearch={onEntityMentionSearch}
            manifest={entityMentionManifest}
            trigger={entityMentionTrigger}
          />
        )}

        {/* Extension slot */}
        {plugins}
      </div>
    </LexicalComposer>
  );
}

export { MiniEditor, type MiniEditorProps, type MiniEditorHandle };
