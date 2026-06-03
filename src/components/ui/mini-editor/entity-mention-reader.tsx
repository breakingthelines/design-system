'use client';

import * as React from 'react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';
import { entityImage, type EntityImageManifest } from '#/lib/entity-image';
import { entityImageTypeForSubject, type SerializedEntityMentionNode } from './entity-mention-node';

/* ────────────────────────────────────────────────────────────
 * Reader renderer for EntityMentionNode
 *
 * Render-only. Resolves a football-entity mention (by its canonical
 * `btl_football_*` id) to a crest via the ds {@link entityImage} resolver and
 * renders an inline, linked chip for the platform article reader. No fetching;
 * the imagery manifest is injected and the canonical route is derived from the
 * SubjectRef snapshot (`canonicalUrl`, else slug).
 * ──────────────────────────────────────────────────────────── */

export interface EntityMentionReaderProps {
  /** BTL canonical identity id — a content-hashed `btl_football_*` id. */
  canonicalId: string;
  /** Lower-cased SubjectType (`team` | `player` | `coach` | `venue` | `competition`). */
  subjectType: string;
  /** Display label. */
  label: string;
  /** Canonical slug — used to build the route when `canonicalUrl` is absent. */
  slug?: string;
  /** Optional CORS-clean image URL snapshot (wins over the manifest). */
  imageUrl?: string;
  /** Optional fully-resolved canonical href. */
  canonicalUrl?: string;
  /** Imagery manifest for crest resolution. */
  manifest: EntityImageManifest;
  /** Extra classes on the rendered element. */
  className?: string;
}

/**
 * Build the canonical entity route. Prefers an explicit `canonicalUrl`; falls
 * back to the slug under the shared `/@`-style entity space. Returns `undefined`
 * when neither is available, in which case the mention renders unlinked.
 */
export function entityMentionHref(slug?: string, canonicalUrl?: string): string | undefined {
  if (canonicalUrl) return canonicalUrl;
  if (slug) return `/${slug.replace(/^\/+/, '')}`;
  return undefined;
}

export function EntityMentionReader({
  canonicalId,
  subjectType,
  label,
  slug,
  imageUrl,
  canonicalUrl,
  manifest,
  className,
}: EntityMentionReaderProps) {
  const Link = useLinkComponent();
  const crestUrl = entityImage(entityImageTypeForSubject(subjectType), canonicalId, manifest, {
    imageUrl,
  });
  const href = entityMentionHref(slug, canonicalUrl);

  const content = (
    <>
      {crestUrl ? (
        <img
          src={crestUrl}
          alt=""
          aria-hidden="true"
          className="inline-block size-[1.1em] rounded-full object-cover align-[-0.15em]"
          draggable={false}
        />
      ) : null}
      <span>{label}</span>
    </>
  );

  const baseClass = cn(
    'entity-mention inline-flex items-center gap-1 align-baseline font-medium whitespace-nowrap',
    'text-red-100 transition-colors hover:text-red-200',
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        data-entity-id={canonicalId}
        data-entity-type={subjectType}
        className={cn(baseClass, 'no-underline hover:underline')}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return (
    <span data-entity-id={canonicalId} data-entity-type={subjectType} className={baseClass}>
      {content}
    </span>
  );
}

/**
 * Convenience adapter: render an {@link EntityMentionReader} straight from a
 * serialized node ({@link SerializedEntityMentionNode}) as stored in
 * `body_json`. The article reader maps each `entity-mention` node through this.
 */
export function EntityMentionFromNode({
  node,
  manifest,
  className,
}: {
  node: SerializedEntityMentionNode;
  manifest: EntityImageManifest;
  className?: string;
}) {
  return (
    <EntityMentionReader
      canonicalId={node.canonicalId}
      subjectType={node.subjectType}
      label={node.label}
      slug={node.slug}
      imageUrl={node.imageUrl}
      manifest={manifest}
      className={className}
    />
  );
}
