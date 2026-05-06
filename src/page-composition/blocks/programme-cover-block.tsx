import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseProgrammeCoverConfig } from '../config';

export function ProgrammeCoverBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseProgrammeCoverConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderProgrammeCover?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-programme-cover-heading`;

  return (
    <section
      className="mx-auto w-full max-w-[1144px] px-4 pt-12 pb-10"
      aria-labelledby={headingId}
    >
      <header className="border-b border-white/[0.08] pb-12">
        <div className="mb-6 flex items-center gap-3">
          <span aria-hidden="true" className="h-[2px] w-10 shrink-0 bg-red-100" />
          <p className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase">
            The BTL Programme
          </p>
        </div>
        <h1
          id={headingId}
          className="font-display max-w-[820px] text-[3rem] leading-[0.95] font-bold tracking-[-0.04em] text-white sm:text-[4.5rem]"
        >
          {config.title || 'Programme issue'}
        </h1>
        {config.subtitle ? (
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-white/65">
            {config.subtitle}
          </p>
        ) : null}
        {config.heroTopic ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] tracking-[0.12em] text-white/60 uppercase">
            {config.heroTopic}
          </p>
        ) : null}
      </header>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
