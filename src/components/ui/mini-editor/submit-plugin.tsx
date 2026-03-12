'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { KEY_ENTER_COMMAND, COMMAND_PRIORITY_HIGH, $getRoot } from 'lexical';

interface SubmitPluginProps {
  mode: 'enter' | 'mod-enter';
  onSubmit: (text: string) => void;
}

function SubmitPlugin({ mode, onSubmit }: SubmitPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!event) return false;

        const isModified = event.metaKey || event.ctrlKey;

        if (mode === 'enter' && !event.shiftKey && !isModified) {
          event.preventDefault();
          const text = editor.getEditorState().read(() => $getRoot().getTextContent());
          if (text.trim()) onSubmit(text.trim());
          return true;
        }

        if (mode === 'mod-enter' && isModified) {
          event.preventDefault();
          const text = editor.getEditorState().read(() => $getRoot().getTextContent());
          if (text.trim()) onSubmit(text.trim());
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, mode, onSubmit]);

  return null;
}

export { SubmitPlugin };
