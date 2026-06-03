'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { isHandleKind, type MentionKind, type SerializedMentionNode } from './mention-node';

/* ────────────────────────────────────────────────────────────
 * Reader renderer for MentionNode
 *
 * Render-only. Renders a saved polymorphic mention (user / squad / football
 * entity) the same way for every kind: an optional pre-resolved avatar/crest
 * (`imageUrl`, monogram fallback) plus the label, linked to `url` when present.
 * No fetching, no imagery manifest — the host pre-resolves imagery into
 * `imageUrl` and the route into `url` (or a `slug`). Handle kinds (`user`,
 * `squad`) render `@label` in the primary colour; football kinds render the
 * bare label in red.
 * ──────────────────────────────────────────────────────────── */

export interface MentionReaderProps {
  /** Stable subject identifier. */
  id: string;
  /** Subject kind — drives styling and the `@` handle prefix. */
  kind: MentionKind;
  /** Display label. */
  label: string;
  /** Optional pre-resolved avatar / crest image URL. */
  imageUrl?: string;
  /** Optional slug — used to build the route when `url` is absent. */
  slug?: string;
  /** Optional fully-resolved href. */
  url?: string;
  /** Extra classes on the rendered element. */
  className?: string;
}

/**
 * Build the mention route. Prefers an explicit `url`; falls back to the slug
 * under the shared `/@`-style handle space. Returns `undefined` when neither is
 * available, in which case the mention renders unlinked.
 */
export function mentionHref(slug?: string, url?: string): string | undefined {
  if (url) return url;
  if (slug) return `/${slug.replace(/^\/+/, '')}`;
  return undefined;
}

export function MentionReader({
  id,
  kind,
  label,
  imageUrl,
  slug,
  url,
  className,
}: MentionReaderProps) {
  const Link = useLinkComponent();
  const handle = isHandleKind(kind);
  const href = mentionHref(slug, url);
  const text = handle ? `@${label}` : label;

  const content = (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="inline-block size-[1.1em] rounded-full object-cover align-[-0.15em]"
          draggable={false}
        />
      ) : null}
      <span>{text}</span>
    </>
  );

  const baseClass = cn(
    'mention inline-flex items-center gap-1 align-baseline font-medium whitespace-nowrap',
    handle
      ? 'text-primary transition-colors hover:text-primary/80'
      : 'text-red-100 transition-colors hover:text-red-200',
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        data-mention-id={id}
        data-mention-kind={kind}
        className={cn(baseClass, 'no-underline hover:underline')}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return (
    <span data-mention-id={id} data-mention-kind={kind} className={baseClass}>
      {content}
    </span>
  );
}

/**
 * Convenience adapter: render a {@link MentionReader} straight from a serialized
 * node ({@link SerializedMentionNode}) as stored in `body_json`. The article
 * reader maps each `mention` node through this.
 */
export function MentionFromNode({
  node,
  className,
}: {
  node: SerializedMentionNode;
  className?: string;
}) {
  return (
    <MentionReader
      id={node.mentionId}
      kind={node.mentionKind}
      label={node.label}
      imageUrl={node.imageUrl}
      slug={node.slug}
      url={node.url}
      className={className}
    />
  );
}
