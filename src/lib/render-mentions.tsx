'use client';

import * as React from 'react';

import { useLinkComponent } from '#/components/ui/link-context';

const MENTION_RE = /@([\w.]+)/g;

/**
 * Hook that returns a renderer for thought body text.
 * Parses @username patterns into clickable profile links.
 */
function useRenderMentions() {
  const Link = useLinkComponent();

  return React.useCallback(
    (text: string): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      // Reset lastIndex in case regex was reused
      MENTION_RE.lastIndex = 0;

      while ((match = MENTION_RE.exec(text)) !== null) {
        // Push text before the match
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index));
        }

        const username = match[1];
        parts.push(
          <Link
            key={`${username}-${match.index}`}
            href={`/@${username}`}
            className="text-red-100 transition-colors hover:text-red-200 hover:[text-shadow:_0_0_0.5px_currentColor]"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            @{username}
          </Link>,
        );

        lastIndex = match.index + match[0].length;
      }

      // Push remaining text
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
    },
    [Link],
  );
}

export { useRenderMentions };
