'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useRenderMentions } from '#/lib/render-mentions';
import { MentionFromNode, type SerializedMentionNode } from '#/components/ui/mini-editor/index';

/* ────────────────────────────────────────────────────────────
 * ThoughtBody — lossless thought body renderer
 *
 * Thoughts are composed in the MiniEditor (a real Lexical editor) and persist
 * two body representations:
 *   - `body`     — plain text (`getText()`), the search/preview text + legacy fallback.
 *   - `bodyJson` — the full serialized Lexical state (`getBodyJson()`), which
 *                  carries every inline MentionNode losslessly.
 *
 * When `bodyJson` is present and parses, we walk the serialized tree and render
 * each `mention` node through the SAME {@link MentionFromNode} reader the
 * long-form article editor uses — one mention path for the whole platform. The
 * walk is READ-ONLY: it never instantiates a Lexical editor, it just consumes
 * the plain paragraph/text/mention JSON (mirroring how MentionFromNode consumes
 * a single node).
 *
 * When `bodyJson` is absent or unparseable (legacy thoughts), we fall back to
 * rendering `body` through the legacy {@link useRenderMentions} `@word` regex.
 * ──────────────────────────────────────────────────────────── */

// Lexical text-format bitmask (Lexical's TEXT_TYPE_TO_FORMAT). Mirrored here so
// the read-only walk needs no editor instance to interpret trivial formatting.
const IS_BOLD = 1;
const IS_ITALIC = 1 << 1;
const IS_STRIKETHROUGH = 1 << 2;
const IS_UNDERLINE = 1 << 3;
const IS_CODE = 1 << 4;

/** A serialized Lexical node as it appears under `root.children` / `children`. */
interface SerializedNode {
  type?: string;
  text?: string;
  format?: number | string;
  children?: SerializedNode[];
  [key: string]: unknown;
}

interface SerializedRoot {
  root?: { children?: SerializedNode[] };
}

export interface ThoughtBodyProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Plain-text body — the search/preview text and the legacy render fallback. */
  body: string;
  /** Serialized Lexical state (`body_json`). When present + parseable, drives the structured render. */
  bodyJson?: string;
}

/**
 * Parse a serialized Lexical state string into its node tree. Robust by design:
 * any malformed / non-Lexical payload returns `null` so the caller falls back
 * to the legacy plain-text renderer rather than throwing.
 */
function parseBodyJson(bodyJson: string | undefined): SerializedNode[] | null {
  if (!bodyJson) return null;
  try {
    const parsed = JSON.parse(bodyJson) as SerializedRoot;
    const children = parsed?.root?.children;
    return Array.isArray(children) ? children : null;
  } catch {
    return null;
  }
}

/** Wrap a text run in the trivial inline format tags carried by its bitmask. */
function applyTextFormat(text: React.ReactNode, format: number): React.ReactNode {
  let node = text;
  if (format & IS_CODE) node = <code>{node}</code>;
  if (format & IS_BOLD) node = <strong>{node}</strong>;
  if (format & IS_ITALIC) node = <em>{node}</em>;
  if (format & IS_UNDERLINE) node = <u>{node}</u>;
  if (format & IS_STRIKETHROUGH) node = <s>{node}</s>;
  return node;
}

/** Render the inline children of a block (text runs, mentions, line breaks, nested inline elements). */
function renderInline(nodes: SerializedNode[], keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  nodes.forEach((node, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (node.type) {
      case 'mention': {
        out.push(<MentionFromNode key={key} node={node as unknown as SerializedMentionNode} />);
        break;
      }
      case 'linebreak': {
        out.push(<br key={key} />);
        break;
      }
      case 'text': {
        const text = node.text ?? '';
        const format = typeof node.format === 'number' ? node.format : 0;
        out.push(<React.Fragment key={key}>{applyTextFormat(text, format)}</React.Fragment>);
        break;
      }
      default: {
        // Unknown inline node: recurse into its children if it has any, else
        // fall back to its plain text so nothing is silently dropped.
        if (Array.isArray(node.children) && node.children.length > 0) {
          out.push(<React.Fragment key={key}>{renderInline(node.children, key)}</React.Fragment>);
        } else if (typeof node.text === 'string') {
          out.push(<React.Fragment key={key}>{node.text}</React.Fragment>);
        }
      }
    }
  });
  return out;
}

export function ThoughtBody({ body, bodyJson, className, ...props }: ThoughtBodyProps) {
  const renderMentions = useRenderMentions();
  const blocks = parseBodyJson(bodyJson);

  // Legacy / unparseable: render plain text through the `@word` regex. Keep the
  // same `whitespace-pre-line` treatment as the prior inline render so line
  // breaks in plain-text thoughts are preserved.
  if (!blocks) {
    return (
      <span data-slot="thought-body" className={cn('whitespace-pre-line', className)} {...props}>
        {renderMentions(body)}
      </span>
    );
  }

  // Structured: one block per top-level child (paragraphs and any other block).
  return (
    <div data-slot="thought-body" data-structured="true" className={className} {...props}>
      {blocks.map((block, i) => {
        const children = Array.isArray(block.children) ? block.children : [];
        // An empty paragraph is a blank line between blocks — keep the gap.
        return (
          <p key={`p-${i}`} className="whitespace-pre-line [&:not(:first-child)]:mt-[1em]">
            {children.length > 0 ? renderInline(children, `p-${i}`) : ' '}
          </p>
        );
      })}
    </div>
  );
}
