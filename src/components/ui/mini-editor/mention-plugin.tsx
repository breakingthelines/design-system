'use client';

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';

import { $createMentionNode } from './mention-node';

/* ────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────── */

export interface MentionSuggestion {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface MentionPluginProps {
  onSearch: (query: string) => Promise<MentionSuggestion[]>;
}

/* ────────────────────────────────────────────────────────────
 * Hook: track @ trigger position and query
 * ──────────────────────────────────────────────────────────── */

function useMentionTrigger() {
  const [editor] = useLexicalComposerContext();
  const [trigger, setTrigger] = React.useState<{
    query: string;
    matchStart: number;
  } | null>(null);

  React.useEffect(() => {
    const removeListener = editor.registerTextContentListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setTrigger(null);
          return;
        }

        const anchor = selection.anchor;
        if (anchor.type !== 'text') {
          setTrigger(null);
          return;
        }

        const node = anchor.getNode();
        if (!$isTextNode(node)) {
          setTrigger(null);
          return;
        }

        const text = node.getTextContent().slice(0, anchor.offset);
        // Match @ followed by optional query chars (no spaces)
        const match = text.match(/@([\w.]*)$/);

        if (!match) {
          setTrigger(null);
          return;
        }

        setTrigger({
          query: match[1],
          matchStart: anchor.offset - match[0].length,
        });
      });
    });

    return removeListener;
  }, [editor]);

  return trigger;
}

/* ────────────────────────────────────────────────────────────
 * Autocomplete dropdown
 * ──────────────────────────────────────────────────────────── */

function MentionAutocomplete({
  suggestions,
  selectedIndex,
  onSelect,
}: {
  suggestions: MentionSuggestion[];
  selectedIndex: number;
  onSelect: (suggestion: MentionSuggestion) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] max-w-[300px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.userId}
          type="button"
          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none ${
            index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // prevent editor blur
            onSelect(suggestion);
          }}
        >
          {suggestion.avatarUrl ? (
            <img src={suggestion.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {suggestion.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col items-start overflow-hidden">
            <span className="truncate text-sm font-medium">{suggestion.displayName}</span>
            <span className="truncate text-xs text-muted-foreground">@{suggestion.username}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * MentionPlugin
 * ──────────────────────────────────────────────────────────── */

export function MentionPlugin({ onSearch }: MentionPluginProps) {
  const [editor] = useLexicalComposerContext();
  const trigger = useMentionTrigger();
  const [suggestions, setSuggestions] = React.useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const isOpen = trigger !== null && suggestions.length > 0;

  // Debounced search
  React.useEffect(() => {
    if (!trigger) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await onSearch(trigger.query);
        setSuggestions(results);
        setSelectedIndex(0);
      } catch {
        setSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [trigger?.query, onSearch]);

  // Insert mention node
  const insertMention = React.useCallback(
    (suggestion: MentionSuggestion) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !trigger) return;

        const anchor = selection.anchor;
        const node = anchor.getNode();
        if (!$isTextNode(node)) return;

        const text = node.getTextContent();
        const before = text.slice(0, trigger.matchStart);
        const after = text.slice(anchor.offset);

        // Replace the @query with the mention node
        const mentionNode = $createMentionNode(suggestion.userId, suggestion.username);
        const afterNode = $createTextNode(after || ' ');

        if (before) {
          node.setTextContent(before);
          node.insertAfter(mentionNode);
          mentionNode.insertAfter(afterNode);
        } else {
          node.replace(mentionNode);
          mentionNode.insertAfter(afterNode);
        }

        // Move cursor after the space
        afterNode.select(after ? 0 : 1);
      });

      setSuggestions([]);
    },
    [editor, trigger]
  );

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const unregisterDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        event?.preventDefault();
        setSelectedIndex((i) => (i + 1) % suggestions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        event?.preventDefault();
        setSelectedIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        event?.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        event?.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setSuggestions([]);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterDown();
      unregisterUp();
      unregisterEnter();
      unregisterTab();
      unregisterEscape();
    };
  }, [editor, isOpen, suggestions, selectedIndex, insertMention]);

  if (!isOpen) return null;

  return (
    <MentionAutocomplete
      suggestions={suggestions}
      selectedIndex={selectedIndex}
      onSelect={insertMention}
    />
  );
}
