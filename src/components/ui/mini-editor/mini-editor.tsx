'use client';

import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, type EditorState } from 'lexical';

import { cn } from '#/lib/utils';
import { SubmitPlugin } from './submit-plugin';
import { MaxLengthPlugin } from './max-length-plugin';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

interface MiniEditorHandle {
  clear: () => void;
  focus: () => void;
  getText: () => string;
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
  /** Slot for additional Lexical plugins (e.g. future @mentions) */
  plugins?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Allow multi-line input (default: single-line) */
  multiline?: boolean;
  /** Additional class on the contenteditable container */
  className?: string;
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
    getText() {
      return editor.getEditorState().read(() => $getRoot().getTextContent());
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
  disabled = false,
  multiline = false,
  className,
}: MiniEditorProps) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'MiniEditor',
      onError: (error: Error) => console.error('[MiniEditor]', error),
      editable: !disabled,
      nodes: [],
    }),
    // Only used for initial render — intentionally excluding disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleChange = React.useCallback(
    (editorState: EditorState) => {
      if (!onChange) return;
      editorState.read(() => {
        onChange($getRoot().getTextContent());
      });
    },
    [onChange],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('relative', disabled && 'opacity-50 pointer-events-none')}>
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                'w-full bg-transparent text-sm leading-6 text-inherit placeholder:text-muted-foreground focus:outline-none',
                !multiline && 'overflow-hidden whitespace-nowrap',
                multiline && 'min-h-[60px] resize-none field-sizing-content',
                className,
              )}
            />
          }
          placeholder={
            <div
              className={cn(
                'pointer-events-none absolute top-0 left-0 text-sm leading-6 text-muted-foreground select-none',
                className,
              )}
            >
              {placeholder}
            </div>
          }
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

        {/* Extension slot */}
        {plugins}
      </div>
    </LexicalComposer>
  );
}

export { MiniEditor, type MiniEditorProps, type MiniEditorHandle };
