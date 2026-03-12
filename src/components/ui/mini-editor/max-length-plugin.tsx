'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { trimTextContentFromAnchor } from '@lexical/selection';

interface MaxLengthPluginProps {
  maxLength: number;
  onRemainingChange?: (remaining: number) => void;
}

function MaxLengthPlugin({ maxLength, onRemainingChange }: MaxLengthPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let lastReported: number | undefined;

    return editor.registerTextContentListener((text) => {
      // Report remaining characters
      const remaining = maxLength - text.length;
      if (remaining !== lastReported) {
        lastReported = remaining;
        onRemainingChange?.(remaining);
      }

      // Enforce limit
      if (text.length <= maxLength) return;

      editor.update(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        if (content.length <= maxLength) return;

        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        trimTextContentFromAnchor(editor, selection.anchor, content.length - maxLength);
      });
    });
  }, [editor, maxLength, onRemainingChange]);

  return null;
}

export { MaxLengthPlugin };
