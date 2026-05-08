import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseContentStripConfig } from '../config';

export function ContentStripBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseContentStripConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderContentStrip?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-content-strip-heading`;

  return (
    <section className="mx-auto max-w-[1144px] px-4 pb-10" aria-labelledby={headingId}>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-7">
        <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">Content strip</p>
        <h2
          id={headingId}
          className="font-display mt-3 text-2xl leading-tight font-bold tracking-[-0.04em] text-white sm:text-3xl"
        >
          {config.label || 'Latest pieces'}
        </h2>
        <p className="mt-3 max-w-[560px] text-sm leading-7 text-white/58">
          {config.source.kind} · {config.layoutType} · {config.count} item
          {config.count === 1 ? '' : 's'}
        </p>
        <p className="mt-5 text-sm leading-7 text-white/45">
          Provide a host adapter to render fetched content without moving app data hooks into the
          design system.
        </p>
      </div>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
