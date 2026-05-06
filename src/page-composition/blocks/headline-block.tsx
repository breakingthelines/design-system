import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseHeadlineConfig } from '../config';

export function HeadlineBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseHeadlineConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderHeadline?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-headline-heading`;

  return (
    <section
      className="mx-auto w-full max-w-[1144px] px-4 pt-10 pb-12"
      aria-labelledby={headingId}
    >
      <header className="border-b border-white/[0.08] pb-10">
        <div className="mb-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-[2px] w-10 shrink-0 bg-red-100"
            style={config.accentColor ? { backgroundColor: config.accentColor } : undefined}
          />
          <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
            {config.eyebrow || 'Programme'}
          </p>
        </div>
        <h1
          id={headingId}
          className="font-display max-w-[820px] text-[2.75rem] leading-[0.98] font-bold tracking-[-0.04em] text-white sm:text-[4rem]"
        >
          {config.text}
        </h1>
        {config.subtitle ? (
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-white/65">
            {config.subtitle}
          </p>
        ) : null}
      </header>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
