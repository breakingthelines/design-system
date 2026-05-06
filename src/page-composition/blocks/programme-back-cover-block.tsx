import * as React from 'react';

import type { PageBlockRendererProps } from '../types';
import { parseProgrammeBackCoverConfig } from '../config';

export function ProgrammeBackCoverBlock({
  block,
  mode,
  composition,
  adapters,
}: PageBlockRendererProps): React.ReactNode {
  const config = parseProgrammeBackCoverConfig(block.config);
  if (!config) {
    return null;
  }

  const rendered = adapters.renderProgrammeBackCover?.({
    block,
    config,
    mode,
    composition,
  });

  if (rendered) {
    return rendered;
  }

  const headingId = `${blockKey(block)}-programme-back-cover-heading`;

  return (
    <section
      className="mx-auto w-full max-w-[1144px] px-4 pb-12"
      aria-labelledby={headingId}
    >
      <div className="rounded-[28px] border border-white/10 bg-white/[0.025] px-6 py-8">
        <h2
          id={headingId}
          className="font-display text-[11px] font-bold tracking-[0.32em] text-white/70 uppercase"
        >
          End of issue
        </h2>
        <p className="mt-4 max-w-[560px] text-sm leading-7 text-white/58">
          {config.shareLabel || 'Share this issue'}
          {config.showShareAction ? null : ' (share disabled)'}
          {config.showModeToggle ? ' · Mode toggle available' : ''}. Provide a host adapter to wire
          share, mode toggle, and settings actions.
        </p>
      </div>
    </section>
  );
}

function blockKey(block: { id: string; kind: number; sortOrder: number }): string {
  return block.id || `kind-${block.kind}-${block.sortOrder}`;
}
